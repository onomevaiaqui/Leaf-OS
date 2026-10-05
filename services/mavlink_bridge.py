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
    "error": None,
}
lock = threading.Lock()
history = deque(maxlen=900)
last_sample_at = 0


def snapshot():
    with lock:
        return json.loads(json.dumps(state))


def history_snapshot():
    with lock:
        return list(history)


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
        elif message_type == "VFR_HUD":
            state["telemetry"]["heading"] = message.heading


def mavlink_loop():
    while True:
        master = None
        try:
            master = mavutil.mavlink_connection(CONNECTION, baud=BAUD, source_system=245)
            last_heartbeat = 0
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

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    threading.Thread(target=mavlink_loop, daemon=True).start()
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
