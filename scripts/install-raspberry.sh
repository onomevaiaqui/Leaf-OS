#!/usr/bin/env bash
set -euo pipefail

# Execute no Raspberry Pi OS Bookworm, a partir da pasta do Leaf OS.
sudo apt update
sudo apt install -y nodejs npm python3-venv gstreamer1.0-tools gstreamer1.0-plugins-base gstreamer1.0-plugins-good gstreamer1.0-plugins-bad v4l-utils
sudo mkdir -p /opt/leaf-os
sudo cp -a . /opt/leaf-os/
sudo cp deploy/leaf-os.service /etc/systemd/system/leaf-os.service
python3 -m venv /opt/leaf-os/.venv
/opt/leaf-os/.venv/bin/pip install -r /opt/leaf-os/requirements.txt
sudo cp deploy/leaf-mavlink.service /etc/systemd/system/leaf-mavlink.service
sudo systemctl daemon-reload
sudo systemctl enable --now leaf-os.service leaf-mavlink.service
echo 'Leaf OS instalado. Instale e inicie o MediaMTX usando deploy/mediamtx.yml antes de iniciar o vídeo.'
