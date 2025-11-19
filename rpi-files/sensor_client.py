#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ClassSense

- Reads
    * brightness (LTR559)
    * temperature (BME280)
    * eCO2 (SGP30)
    * noise level (Enviro+ microphone, rough dB)
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

# Optional audio capture for noise level
try:
    import numpy as np
    import sounddevice as sd
except Exception:
    sd = None
    np = None

import requests

APP_NAME = "ClassSense"
VERSION = "1.2.0"

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

# Config
def load_config(path="config.ini"):
    cfg = ConfigParser()
    if not cfg.read(path):
        raise FileNotFoundError(f"Config file not found: {path}")
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


# Tuning factor for compensation. Decrease this number to adjust the
# temperature down, and increase to adjust up.
CPU_TEMP_FACTOR = 1.2
_cpu_temps = []


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


def read_sgp30_eco2_pimoroni(sensor):
    """
    Read eCO2 (ppm) from SGP30.

    get_air_quality() returns an object with
    .equivalent_co2 and .total_voc.
    """
    try:
        result = sensor.get_air_quality()

        if hasattr(result, "equivalent_co2"):
            return float(result.equivalent_co2)

        if hasattr(result, "CO2eq"):
            return float(result.CO2eq)

        if isinstance(result, (tuple, list)) and len(result) >= 1:
            return float(result[0])

    except Exception as e:
        log.debug(f"SGP30 read failed: {e}")

    return float("nan")


# LCD
class LCD:
    """
    Simple LCD wrapper that shows sensor values:
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
            self.font = ImageFont.truetype(
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18
            )
        except Exception:
            self.font = ImageFont.load_default()

    def draw_screen(self, lux, eco2_ppm, temp_c, noise_db):
        img = Image.new("RGB", (self.WIDTH, self.HEIGHT), (0, 0, 0))
        draw = ImageDraw.Draw(img)

        y = 4
        line_gap = 18

        lux_str = "nan" if math.isnan(lux) else f"{lux:5.1f}"
        eco2_str = "nan" if math.isnan(eco2_ppm) else f"{eco2_ppm:5.0f}"
        temp_str = "nan" if math.isnan(temp_c) else f"{temp_c:5.1f}"
        if noise_db is None:
            noise_str = "  n/a"
        else:
            noise_str = f"{noise_db:5.1f}"

        draw.text((4, y), f"bri {lux_str} lux", font=self.font, fill=(200, 200, 200))
        y += line_gap
        draw.text((4, y), f"CO2 {eco2_str} ppm", font=self.font, fill=(200, 200, 200))
        y += line_gap
        draw.text((4, y), f"tem  {temp_str} °C", font=self.font, fill=(200, 200, 200))
        y += line_gap
        draw.text((4, y), f"no  {noise_str} db", font=self.font, fill=(200, 200, 200))

        self.disp.display(img)


def measure_noise(duration=0.4, samplerate=16000):
    """
    Rough sound level estimate (pseudo dB). Not calibrated.
    """
    if sd is None or np is None:
        return None
    try:
        audio = sd.rec(
            int(duration * samplerate),
            samplerate=samplerate,
            channels=1,
            dtype="float32",
            blocking=True,
        )
        sd.wait()
        x = audio.flatten()
        x = x - np.mean(x)
        rms = np.sqrt(np.mean(np.square(x)) + 1e-12)
        dbfs = 20.0 * math.log10(rms + 1e-12)  # ref=1.0
        pseudo_db = dbfs + 90.0  # heuristic offset
        return max(0.0, float(pseudo_db))
    except Exception as e:
        log.debug(f"Noise measurement failed: {e}")
        return None


# HTTP POST
def post_json(url, api_key, payload, timeout=5):
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    # TODO: check
    # if extra_headers:
    #     headers.update(extra_headers)
    r = requests.post(url, data=json.dumps(payload), headers=headers, timeout=timeout)
    r.raise_for_status()
    return r

# TODO: check - keep this helper commented until class code creation is required.
# def create_class(api_base, api_key, metadata=None, timeout=5):
#     metadata = metadata or {}
#     api_base = api_base.rstrip("/") 
#     url = f"{api_base}/api/classes"
#     headers = {"Content-Type": "application/json"}
#     if api_key:
#         headers["Authorization"] = f"Bearer {api_key}"
#     r = requests.post(url, data=json.dumps(metadata), headers=headers, timeout=timeout)
#     r.raise_for_status()
#     data = r.json()
#     if not isinstance(data, dict) or "pin" not in data:
#         raise RuntimeError("create_class: unexpected response")
#     return str(data["pin"])


# Main loop
def main():
    cfg = load_config()

    device_id = cfg.get("device", "id", fallback=socket.gethostname())
    post_url = cfg.get("server", "url", fallback="")
    # TODO: check
    # api_base = cfg.get("server", "api_base", fallback="").rstrip("/")
    # class_pin = cfg.get("server", "class_pin", fallback="").strip()
    # auto_create_class = cfg.getboolean("server", "auto_create_class", fallback=False)
    api_key = cfg.get("server", "api_key", fallback="")
    period_s = cfg.getint("sampling", "period_seconds", fallback=10)
    post_every_n = cfg.getint("sampling", "post_every_n_samples", fallback=1)

    # TODO: check - Newer API layout (api_base + class_pin)
    # if api_base and not post_url:
    #     post_url = f"{api_base}/ingest"
    # if api_base and auto_create_class and not class_pin:
    #     try:
    #         metadata = {"device_id": device_id}
    #         class_pin = create_class(api_base, api_key, metadata=metadata)
    #         log.info(f"Created class {class_pin} via /api/classes.")
    #     except Exception as e:
    #         log.error(f"Auto class creation failed: {e}")
    # ingest_headers = {}
    # if class_pin:
    #     ingest_headers["X-Class-Pin"] = class_pin
    #     if api_base:
    #         post_url = f"{api_base}/api/classes/{class_pin}/ingest"

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
            eco2_ppm = read_sgp30_eco2_pimoroni(sgp)
        else:
            eco2_ppm = float("nan")

        # Noise
        noise_db = measure_noise()

        # LCD update
        try:
            if lcd:
                lcd.draw_screen(lux, eco2_ppm, temp_c, noise_db)
        except Exception as e:
            log.debug(f"LCD draw failed: {e}")

        # Prepare JSON
        now = datetime.now(timezone.utc).isoformat()
        payload = {
            "device_id": device_id,
            "timestamp": now,
            "sensors": {
                "brightness_lux": lux,
                "eco2_ppm": eco2_ppm,
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
                post_json(post_url, api_key, payload)
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
