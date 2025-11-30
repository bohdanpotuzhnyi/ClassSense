#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClassSense

- Reads
    * brightness (LTR559)
    * temperature (BME280)
    * eCO2 (SGP30)
    * VOC (SGP30)
    * noise level (Enviro+ microphone)
- Sends JSON to a web server at a fixed interval.
"""

import os
import sys
import time
import json
import math
import signal
import socket
import logging
from datetime import datetime, timezone
from configparser import ConfigParser

# Path to the config file
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.ini")

# Sensor libaries
try:
    from ltr559 import LTR559
except Exception:
    LTR559 = None

try:
    from bme280 import BME280
except Exception:
    BME280 = None

try:
    from sgp30 import SGP30
except Exception:
    SGP30 = None

# LCD
try:
    from ST7735 import ST7735
    from PIL import Image, ImageDraw, ImageFont
except Exception:
    ST7735 = None
    Image = None
    ImageDraw = None
    ImageFont = None

# Optional audio capture / noise helper
try:
    import numpy as np
except Exception:
    np = None

try:
    from enviroplus.noise import Noise
except Exception:
    Noise = None

import requests

APP_NAME = "ClassSense"
VERSION = "1.4.0"

# Logging
log = logging.getLogger(APP_NAME)
log.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)
handler.setFormatter(logging.Formatter("[%(asctime)s] %(levelname)s - %(message)s"))
log.addHandler(handler)

shutdown_flag = False


def _handle_sig(signum, frame):
    global shutdown_flag
    shutdown_flag = True


signal.signal(signal.SIGINT, _handle_sig)
signal.signal(signal.SIGTERM, _handle_sig)

# Tuning factor for compensation. Decrease this number to adjust the
# temperature down, and increase to adjust up.
# For hotter CPUs (Pi 4 / Pi 5) this value should be higher than on a Pi Zero.
CPU_TEMP_FACTOR = 1.25
_cpu_temps = []

# Single offset for calibration to more realistic noise levels.
# Lower this if values are still too high, raise if they are too low.
MIC_DB_OFFSET = 55.0


# Config
def load_config(path=CONFIG_PATH):
    cfg = ConfigParser()
    if not cfg.read(path):
        raise FileNotFoundError(f"Config file not found: {path}")

    # Optional override of CPU temp factor from config
    global CPU_TEMP_FACTOR
    try:
        CPU_TEMP_FACTOR = cfg.getfloat("sampling", "temp_cpu_factor", fallback=CPU_TEMP_FACTOR)
    except Exception:
        pass

    global MIC_DB_OFFSET
    try:
        MIC_DB_OFFSET = cfg.getfloat("sampling", "mic_db_offset", fallback=MIC_DB_OFFSET)
    except Exception:
        pass

    return cfg


# Sensors
def init_ltr559():
    if LTR559 is None:
        raise RuntimeError("ltr559 library not available")
    return LTR559()


def init_bme280():
    if BME280 is None:
        raise RuntimeError("bme280 library not available")
    return BME280()


def get_cpu_temperature():
    """
    Read the CPU temperature in degrees Celsius for compensation.
    """
    with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
        temp = f.read()
        temp = int(temp) / 1000.0
    return temp


def get_compensated_temperature(bme):
    """
    Use the CPU temperature to compensate BME280 readings.
    """
    global _cpu_temps
    try:
        # Initialise history on first call
        if not _cpu_temps:
            cpu_temp = get_cpu_temperature()
            _cpu_temps = [cpu_temp] * 5

        cpu_temp = get_cpu_temperature()
        _cpu_temps = _cpu_temps[1:] + [cpu_temp]
        avg_cpu_temp = sum(_cpu_temps) / float(len(_cpu_temps))

        raw_temp = bme.get_temperature()
        comp_temp = raw_temp - ((avg_cpu_temp - raw_temp) / CPU_TEMP_FACTOR)
        return float(comp_temp)
    except Exception as e:
        log.debug(f"Compensated temperature failed: {e}")
        return float("nan")


def init_sgp30_pimoroni():
    """
        sgp30 = SGP30()
        sgp30.start_measurement(crude_progress_bar)
        while True:
            result = sgp30.get_air_quality()
    """
    if SGP30 is None:
        raise RuntimeError("sgp30 library not available")

    sgp30 = SGP30()

    def progress():
        # crude_progress_bar: one dot per progress step
        sys.stdout.write(".")
        sys.stdout.flush()

    log.info("SGP30: sensor warming up, starting measurement...")
    try:
        sgp30.start_measurement(progress)
        sys.stdout.write("\n")
    except TypeError:
        # In case the installed version doesn't take a callback
        sgp30.start_measurement()
    log.info("SGP30: measurement started.")
    return sgp30


def read_sgp30_pimoroni(sensor):
    """
    Read eCO2 (ppm) and VOC (ppb) from SGP30.

    get_air_quality() returns an object with
    .equivalent_co2 and .total_voc.
    """
    eco2 = float("nan")
    voc = float("nan")
    try:
        result = sensor.get_air_quality()

        # eCO2
        if hasattr(result, "equivalent_co2"):
            eco2 = float(result.equivalent_co2)
        elif hasattr(result, "CO2eq"):
            eco2 = float(result.CO2eq)
        elif isinstance(result, (tuple, list)) and len(result) >= 1:
            eco2 = float(result[0])

        # VOC (ppb)
        if hasattr(result, "total_voc"):
            voc = float(result.total_voc)
        elif isinstance(result, (tuple, list)) and len(result) >= 2:
            voc = float(result[1])

    except Exception as e:
        log.debug(f"SGP30 read failed: {e}")

    return eco2, voc


# LCD
class LCD:
    """
    Simple LCD wrapper that shows sensor values.
    """

    def __init__(self, rotation=90, backlight=12):
        if ST7735 is None or Image is None:
            raise RuntimeError("LCD / PIL libraries not available")
        self.disp = ST7735(
            port=0,
            cs=1,
            rst=27,
            dc=9,
            backlight=backlight,
            rotation=rotation,
            spi_speed_hz=4000000,
        )
        self.disp.begin()
        self.WIDTH = self.disp.width
        self.HEIGHT = self.disp.height
        try:
            # slightly smaller font so we can fit 5 lines
            self.font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14
            )
        except Exception:
            self.font = ImageFont.load_default()

    def draw_screen(self, lux, eco2_ppm, voc_ppb, temp_c, noise_db):
        img = Image.new("RGB", (self.WIDTH, self.HEIGHT), (0, 0, 0))
        draw = ImageDraw.Draw(img)

        y = 2
        line_gap = 14

        lux_str = "nan" if math.isnan(lux) else f"{lux:5.1f}"
        eco2_str = "nan" if math.isnan(eco2_ppm) else f"{eco2_ppm:5.0f}"
        voc_str = "nan" if math.isnan(voc_ppb) else f"{voc_ppb:5.0f}"
        temp_str = "nan" if math.isnan(temp_c) else f"{temp_c:5.1f}"
        if noise_db is None:
            noise_str = "  n/a"
        else:
            noise_str = f"{noise_db:5.1f}"

        # bri, CO2, VOC, tmp, dB – short labels + compact units
        draw.text((2, y), f"bri {lux_str} lx", font=self.font, fill=(200, 200, 200))
        y += line_gap
        draw.text((2, y), f"CO2 {eco2_str} ppm", font=self.font, fill=(200, 200, 200))
        y += line_gap
        draw.text((2, y), f"VOC {voc_str} ppb", font=self.font, fill=(200, 200, 200))
        y += line_gap
        draw.text((2, y), f"tmp {temp_str} °C", font=self.font, fill=(200, 200, 200))
        y += line_gap
        draw.text((2, y), f"dB  {noise_str}", font=self.font, fill=(200, 200, 200))

        self.disp.display(img)


# Noise measurement
def init_noise():
    """
    Initialise Noise helper from enviroplus.noise.
    """
    if Noise is None:
        log.warning("enviroplus.noise not available; noise will be n/a.")
        return None
    try:
        # Defaults: sample_rate=16000, duration=0.5
        return Noise()
    except Exception as e:
        log.warning(f"Noise init failed: {e}")
        return None


def measure_noise(noise_obj):
    """
    Rough sound level estimate (pseudo dB). Not calibrated.

    Uses enviroplus.noise.Noise.get_noise_profile() to obtain
    low/mid/high band amplitudes and converts the combined
    amplitude into a dB-like value.
    """
    if noise_obj is None:
        return None
    try:
        # get_noise_profile() returns (low, mid, high, total)
        amp_low, amp_mid, amp_high, amp_total = noise_obj.get_noise_profile()
        amp = max(amp_total, 1e-12)
        db = 20.0 * math.log10(amp) + MIC_DB_OFFSET
        return float(db)
    except Exception as e:
        log.debug(f"Noise measurement failed: {e}")
        return None


# HTTP POST
def post_json(url, api_key, payload, timeout=5, extra_headers=None):
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    if extra_headers:
        headers.update(extra_headers)
    r = requests.post(url, data=json.dumps(payload), headers=headers, timeout=timeout)
    r.raise_for_status()
    return r


# TODO: check - keep this helper commented until class code creation is required.
def create_class(api_base, api_key, metadata=None, timeout=5):
    metadata = metadata or {}
    api_base = api_base.rstrip("/")
    url = f"{api_base}/api/classes"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    r = requests.post(url, data=json.dumps(metadata), headers=headers, timeout=timeout)
    r.raise_for_status()
    data = r.json()
    if not isinstance(data, dict) or "pin" not in data:
        raise RuntimeError("create_class: unexpected response")
    return str(data["pin"])

def save_class_pin_to_config(path, class_pin):
    """
    Write the class PIN back into the [server] section of config.ini.
    """
    try:
        cfg = ConfigParser()
        if not cfg.read(path):
            log.warning(f"save_class_pin_to_config: could not read {path}")
            return
        if not cfg.has_section("server"):
            cfg.add_section("server")
        cfg.set("server", "class_pin", str(class_pin))
        with open(path, "w") as f:
            cfg.write(f)
        log.info(f"Saved class_pin {class_pin} to {path}")
    except Exception as e:
        log.warning(f"Could not save class_pin to config: {e}")

# Main loop
def main():
    cfg = load_config()

    device_id = cfg.get("device", "id", fallback=socket.gethostname())
    post_url = cfg.get("server", "url", fallback="")
    class_pin = cfg.get("server", "class_pin", fallback="").strip()
    api_key = cfg.get("server", "api_key", fallback="")
    # TODO: check
    api_base = cfg.get("server", "api_base", fallback="").rstrip("/")
    class_pin = cfg.get("server", "class_pin", fallback="").strip()
    auto_create_class = cfg.getboolean("server", "auto_create_class", fallback=False)
    api_key = cfg.get("server", "api_key", fallback="")
    period_s = cfg.getint("sampling", "period_seconds", fallback=10)
    post_every_n = cfg.getint("sampling", "post_every_n_samples", fallback=1)

    # TODO: check - Newer API layout (api_base + class_pin)
    if api_base and not post_url:
        post_url = f"{api_base}/ingest"

    # clear old PIN in memory and in the config file
    if api_base and auto_create_class:
        class_pin = ""
        save_class_pin_to_config(CONFIG_PATH, "")

        try:
            metadata = {"device_id": device_id}
            class_pin = create_class(api_base, api_key, metadata=metadata)
            log.info(f"Created class {class_pin} via /api/classes.")
            # Write the new PIN back into config.ini
            save_class_pin_to_config(CONFIG_PATH, class_pin)
        except Exception as e:
            log.error(f"Auto class creation failed: {e}")

    ingest_headers = {}
    if class_pin:
        ingest_headers["X-Class-Pin"] = class_pin
        if api_base:
            post_url = f"{api_base}/api/classes/{class_pin}/ingest"

    # Init sensors
    try:
        ltr = init_ltr559()
        log.info("LTR559 ready.")
    except Exception as e:
        log.error(f"LTR559 init failed: {e}")
        ltr = None

    try:
        bme = init_bme280()
        log.info("BME280 ready.")
    except Exception as e:
        log.error(f"BME280 init failed: {e}")
        bme = None

    try:
        sgp = init_sgp30_pimoroni()
        log.info("SGP30 (Pimoroni) ready.")
    except Exception as e:
        log.error(f"SGP30 init failed: {e}")
        sgp = None

    try:
        lcd = LCD()
        log.info("LCD ready.")
    except Exception as e:
        log.error(f"LCD init failed: {e}")
        lcd = None

    try:
        noise = init_noise()
    except Exception as e:
        log.error(f"Noise init failed: {e}")
        noise = None

    global shutdown_flag
    sample_idx = 0

    while not shutdown_flag:
        sample_idx += 1

        # LTR559
        if ltr:
            try:
                lux = float(ltr.get_lux())
            except Exception as e:
                log.debug(f"LTR559 read failed: {e}")
                lux = float("nan")
        else:
            lux = float("nan")

        # BME280
        if bme:
            try:
                temp_c = get_compensated_temperature(bme)
            except Exception as e:
                log.debug(f"BME280 read failed: {e}")
                temp_c = float("nan")
        else:
            temp_c = float("nan")

        # SGP30
        if sgp:
            eco2_ppm, voc_ppb = read_sgp30_pimoroni(sgp)
        else:
            eco2_ppm, voc_ppb = float("nan"), float("nan")

        # Noise
        noise_db = measure_noise(noise)

        # LCD update
        try:
            if lcd:
                lcd.draw_screen(lux, eco2_ppm, voc_ppb, temp_c, noise_db)
        except Exception as e:
            log.debug(f"LCD draw failed: {e}")

        # Prepare JSON
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "device_id": device_id,
            "timestamp": now,
            "class_pin": class_pin,
            "sensors": {
                "brightness_lux": lux,
                "eco2_ppm": eco2_ppm,
                "voc_ppb": voc_ppb,
                "temperature_c": temp_c,
                "noise_db": None if noise_db is None else float(noise_db),
            },
            "meta": {
                "app": APP_NAME,
                "version": VERSION,
            },
        }

        # POST
        try:
            if post_url and (sample_idx % post_every_n == 0):
                post_json(post_url, api_key, payload, extra_headers=ingest_headers)
                log.info(f"Posted sample {sample_idx} to server.")
        except Exception as e:
            log.warning(f"POST failed: {e}")

        # Sleep in small steps so we can react to signals
        for _ in range(int(period_s * 10)):
            if shutdown_flag:
                break
            time.sleep(0.1)


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        log.exception("Fatal error: %s", e)
        sys.exit(1)