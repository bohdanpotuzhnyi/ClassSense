# Enviro+ + Pimoroni SGP30 → Web Client

Reads:

- **Brightness** from `LTR559`
- **Temperature** from `BME280`
- **eCO₂** (ppm) from **Pimoroni** `SGP30`
- **Noise level** (rough dB) from the Enviro+ microphone

LCD shows **only four lines** with short labels:

```text
lux  123.4
ppm   612
°C    22.5
db    34.8
```

It also POSTs the values as JSON to your web server.

---

## 1. Prepare the virtual environment

On Raspberry Pi OS (Bookworm / Debian 12), Python is externally managed, so we use a venv.

```bash
sudo apt update
sudo apt install -y python3-venv python3-pip \
    python3-pil python3-numpy python3-smbus python3-spidev libatlas-base-dev \
    fonts-dejavu-core libportaudio2
```

Copy these files to the Pi, e.g.:

```bash
mkdir -p ~/enviro_client
cd ~/enviro_client
# copy sensor_client.py, config.ini, requirements.txt, enviro_web_client.service, data_schema.json, README.md
```

Create and activate the virtual environment:

```bash
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

> Make sure your **Pimoroni `sgp30` library** is available so that this works:
> `from sgp30 import SGP30` inside the venv.

Enable I2C and SPI via `sudo raspi-config` if not already done.

---

## 2. Configure

Edit `config.ini`:

```ini
[device]
id = raspi-lab-01

[server]
url = https://YOUR_SERVER/ingest
api_key = YOUR_TOKEN

[sampling]
period_seconds = 10
post_every_n_samples = 1
```

JSON payload sent to your server (example):

```json
{
  "device_id": "raspi-lab-01",
  "timestamp": "2025-11-12T08:01:45.123456+00:00",
  "sensors": {
    "brightness_lux": 153.7,
    "eco2_ppm": 612,
    "temperature_c": 22.6,
    "noise_db": 34.5
  },
  "meta": {
    "app": "enviro_client",
    "version": "1.2.0"
  }
}
```

(See `data_schema.json` for a concrete example.)

---

## 3. Run manually

```bash
cd ~/enviro_client
source venv/bin/activate
python3 sensor_client.py
```

You should see:

- LCD with `lux`, `ppm`, `°C`, `db`
- log messages on the console
- HTTP POST requests to your configured server URL

Noise is a **rough relative measure**, not calibrated dB(A).

---

## 4. Run as a systemd service

```bash
sudo cp enviro_web_client.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now enviro_web_client
```

Check logs:

```bash
journalctl -u enviro_web_client -f
```

The service uses the venv Python:

```ini
ExecStart=/home/pi/enviro_client/venv/bin/python /home/pi/enviro_client/sensor_client.py
```

Adjust the paths if you place the project elsewhere.

---

## 5. SGP30 specifics

This client assumes the **Pimoroni** SGP30 usage you showed:

```python
from sgp30 import SGP30
sgp30 = SGP30()
sgp30.start_measurement(progress_callback)
result = sgp30.get_air_quality()
```

Internally it:

- calls `SGP30()`
- runs `start_measurement()` (with a crude dot progress)
- reads `sgp30.get_air_quality()` and uses:
  - `result.equivalent_co2` (preferred), or
  - `result.CO2eq`, or
  - the first element if it happens to be a tuple `(eco2, tvoc)`

TVOC is **ignored completely** in this client (not displayed, not sent).
