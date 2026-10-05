#!/usr/bin/env python3
"""Leaf OS MAVLink Bridge: local, read-only telemetry service for Pixhawk."""

import json
import os
import threading
import time
from collections import deque
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from pymavlink import mavutil

CONNECTION = os.environ.get("PIXHAWK_CONNECTION", "/dev/ttyACM0")
BAUD = int(os.environ.get("PIXHAWK_BAUD", "115200"))
HOST = os.environ.get("LEAF_MAVLINK_HOST", "127.0.0.1")
PORT = int(os.environ.get("LEAF_MAVLINK_PORT", "8090"))

state = {
    "connected": False,
    "connection": CONNECTION,
    "lastHeartbeat": None,
    "armed": False,
    "mode": None,
    "telemetry": {"depth": None, "heading": None, "voltage": None, "current": None, "link": None},
    "equipment": {"battery": {}, "motors": [], "esc": [], "pressure": {}, "depthCalibration": {}, "messages": []},
    "error": None,
}
lock = threading.Lock()
history = deque(maxlen=900)
last_sample_at = 0


def snapshot():
    with lock:
        payload = json.loads(json.dumps(state))
    if payload["lastHeartbeat"]:
        age = max(0, time.time() - payload["lastHeartbeat"])
        payload["heartbeatAgeSeconds"] = round(age, 2)
        payload["connected"] = payload["connected"] and age <= 5
        payload["telemetry"]["link"] = max(0, round(100 - age * 20))
    else:
        payload["heartbeatAgeSeconds"] = None
    calibration = payload["equipment"].get("depthCalibration", {})
    external_pressure = payload["equipment"].get("pressure", {}).get("external", {}).get("absolute")
    if calibration.get("surfacePressure") is not None and external_pressure is not None:
        depth = max(0, (external_pressure - calibration["surfacePressure"]) * 100 / (calibration["waterDensity"] * 9.80665))
        payload["telemetry"]["depth"] = round(depth, 2)
    return payload


def history_snapshot():
    with lock:
        return list(history)


def calibrate_depth(water_density):
    if not isinstance(water_density, (int, float)) or not 900 <= water_density <= 1100:
        raise ValueError("A densidade da água deve estar entre 900 e 1100 kg/m³.")
    with lock:
        external = state["equipment"]["pressure"].get("external", {}).get("absolute")
        if external is None:
            raise ValueError("O sensor de pressão externo ainda não forneceu dados.")
        state["equipment"]["depthCalibration"] = {
            "surfacePressure": external,
            "waterDensity": water_density,
            "calibratedAt": time.time(),
        }
    return snapshot()


def add_sample_if_due():
    global last_sample_at
    now = time.time()
    if now - last_sample_at < 1:
        return
    with lock:
        history.append({"timestamp": now, "telemetry": dict(state["telemetry"])})
    last_sample_at = now


def update_from_message(master, message):
    message_type = message.get_type()
    with lock:
        if message_type == "HEARTBEAT":
            state["connected"] = True
            state["error"] = None
            state["lastHeartbeat"] = time.time()
            state["armed"] = master.motors_armed()
            state["mode"] = master.flightmode
        elif message_type == "SYS_STATUS":
            if message.voltage_battery >= 0:
                state["telemetry"]["voltage"] = round(message.voltage_battery / 1000, 2)
            if message.current_battery >= 0:
                state["telemetry"]["current"] = round(message.current_battery / 100, 2)
            state["equipment"]["battery"] = {
                "voltage": state["telemetry"]["voltage"],
                "current": state["telemetry"]["current"],
                "remaining": getattr(message, "battery_remaining", None),
                "source": "SYS_STATUS",
            }
        elif message_type == "VFR_HUD":
            state["telemetry"]["heading"] = message.heading
        elif message_type == "BATTERY_STATUS":
            voltages = [value / 1000 for value in getattr(message, "voltages", []) if value not in (0, 65535)]
            state["equipment"]["battery"] = {
                "voltage": round(sum(voltages), 2) if voltages else state["telemetry"]["voltage"],
                "cells": [round(value, 3) for value in voltages],
                "current": round(message.current_battery / 100, 2) if getattr(message, "current_battery", -1) >= 0 else None,
                "remaining": getattr(message, "battery_remaining", None),
                "temperature": round(message.temperature / 100, 1) if getattr(message, "temperature", 0) not in (0, 32767) else None,
                "source": "BATTERY_STATUS",
            }
            state["telemetry"]["voltage"] = state["equipment"]["battery"]["voltage"]
            state["telemetry"]["current"] = state["equipment"]["battery"]["current"]
        elif message_type == "SERVO_OUTPUT_RAW":
            outputs = []
            for channel in range(1, 17):
                value = getattr(message, f"servo{channel}_raw", None)
                if value is not None:
                    outputs.append({"channel": channel, "pwm": value})
            state["equipment"]["motors"] = outputs
        elif message_type == "ESC_STATUS":
            temperatures = list(getattr(message, "temperature", []))
            rpms = list(getattr(message, "rpm", []))
            voltages = list(getattr(message, "voltage", []))
            currents = list(getattr(message, "current", []))
            escs = []
            for index in range(max(len(temperatures), len(rpms), len(voltages), len(currents))):
                escs.append({
                    "index": index + 1,
                    "rpm": rpms[index] if index < len(rpms) else None,
                    "temperature": round(temperatures[index] / 100, 1) if index < len(temperatures) and temperatures[index] else None,
                    "voltage": round(voltages[index] / 100, 2) if index < len(voltages) and voltages[index] else None,
                    "current": round(currents[index] / 100, 2) if index < len(currents) and currents[index] else None,
                })
            state["equipment"]["esc"] = escs
        elif message_type in ("SCALED_PRESSURE", "SCALED_PRESSURE2"):
            sensor = "internal" if message_type == "SCALED_PRESSURE" else "external"
            temperature = getattr(message, "temperature", None)
            state["equipment"]["pressure"][sensor] = {
                "absolute": round(getattr(message, "press_abs", 0) or 0, 2),
                "differential": round(getattr(message, "press_diff", 0) or 0, 2),
                "temperature": round(temperature / 100, 1) if temperature is not None else None,
            }
        elif message_type == "STATUSTEXT":
            text = getattr(message, "text", "")
            if isinstance(text, bytes):
                text = text.decode("utf-8", errors="replace")
            state["equipment"]["messages"].append({"timestamp": time.time(), "severity": getattr(message, "severity", None), "text": str(text).rstrip("\x00")})
            state["equipment"]["messages"] = state["equipment"]["messages"][-50:]


def request_equipment_streams(master, heartbeat):
    """Solicita telemetria de monitoramento; não envia nenhum comando de movimento."""
    command = getattr(mavutil.mavlink, "MAV_CMD_SET_MESSAGE_INTERVAL", None)
    if command is None:
        return
    streams = [
        ("MAVLINK_MSG_ID_SYS_STATUS", 1_000_000),
        ("MAVLINK_MSG_ID_BATTERY_STATUS", 1_000_000),
        ("MAVLINK_MSG_ID_SERVO_OUTPUT_RAW", 500_000),
        ("MAVLINK_MSG_ID_ESC_STATUS", 1_000_000),
        ("MAVLINK_MSG_ID_SCALED_PRESSURE", 500_000),
        ("MAVLINK_MSG_ID_SCALED_PRESSURE2", 500_000),
    ]
    for message_name, interval_us in streams:
        message_id = getattr(mavutil.mavlink, message_name, None)
        if message_id is None:
            continue
        master.mav.command_long_send(
            heartbeat.get_srcSystem(), heartbeat.get_srcComponent(),
            command, 0,
            message_id, interval_us, 0, 0, 0, 0, 0,
        )


def mavlink_loop():
    while True:
        master = None
        try:
            master = mavutil.mavlink_connection(CONNECTION, baud=BAUD, source_system=245)
            last_heartbeat = 0
            equipment_streams_requested = False
            while True:
                now = time.monotonic()
                if now - last_heartbeat >= 1:
                    master.mav.heartbeat_send(
                        mavutil.mavlink.MAV_TYPE_ONBOARD_CONTROLLER,
                        mavutil.mavlink.MAV_AUTOPILOT_INVALID,
                        0, 0, mavutil.mavlink.MAV_STATE_ACTIVE,
                    )
                    last_heartbeat = now
                message = master.recv_match(blocking=True, timeout=1)
                if message:
                    update_from_message(master, message)
                    if message.get_type() == "HEARTBEAT" and not equipment_streams_requested:
                        request_equipment_streams(master, message)
                        equipment_streams_requested = True
                add_sample_if_due()
                with lock:
                    if state["lastHeartbeat"] and time.time() - state["lastHeartbeat"] > 5:
                        state["connected"] = False
        except Exception as error:
            with lock:
                state["connected"] = False
                state["error"] = str(error)
            time.sleep(2)
        finally:
            if master:
                master.close()


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/history":
            payload = json.dumps({"samples": history_snapshot()}).encode("utf-8")
        elif self.path == "/status":
            payload = json.dumps(snapshot()).encode("utf-8")
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_POST(self):
        if self.path != "/calibrate/depth":
            self.send_error(404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = json.loads(self.rfile.read(length) or b"{}")
            payload = json.dumps(calibrate_depth(body.get("waterDensity"))).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
        except (ValueError, json.JSONDecodeError) as error:
            payload = json.dumps({"error": str(error)}).encode("utf-8")
            self.send_response(400)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    threading.Thread(target=mavlink_loop, daemon=True).start()
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
