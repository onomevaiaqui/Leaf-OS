# Instalação no Raspberry Pi

> Estado: guia para a versão 0.1. Faça os testes com o ROV fora da água e com propulsores desabilitados.

## Pré-requisitos

- Raspberry Pi 4 com Raspberry Pi OS Lite 64-bit (Bookworm).
- Acesso à internet durante a instalação.
- Cartão microSD confiável e fonte de alimentação adequada.
- Câmera USB/UVC ou capturadora USB para o primeiro teste de vídeo.

## Instalar o Leaf OS

1. Clone o repositório no Raspberry: `git clone https://github.com/onomevaiaqui/Leaf-OS.git`.
2. Entre na pasta: `cd Leaf-OS`.
3. Execute: `bash scripts/install-raspberry.sh`.
4. Reinicie o Raspberry: `sudo reboot`.
5. No computador de superfície, abra `http://IP_DO_RASPBERRY:8080`.

O instalador copia o Leaf OS para `/opt/leaf-os` e ativa o serviço `leaf-os.service`. Consulte o estado com `sudo systemctl status leaf-os` e os registros com `journalctl -u leaf-os -f`.

## Instalar o MediaMTX

O MediaMTX é um serviço separado que entrega o vídeo no navegador. Instale a versão para ARM64 conforme a documentação oficial e execute-o usando a configuração `deploy/mediamtx.yml` deste repositório. Ele deve estar ativo antes de usar o botão **Iniciar vídeo**.

Portas usadas na rede local:

| Porta | Serviço |
| --- | --- |
| 8080/TCP | Leaf Ground Control e API Leaf OS |
| 8554/TCP | Entrada RTSP local do GStreamer |
| 8889/TCP | Visualização e sinalização WebRTC |
| 8189/UDP | Mídia WebRTC |

## Verificar a câmera USB

Conecte a câmera e execute `v4l2-ctl --list-devices`. Um dispositivo como `/dev/video0` deve aparecer. Reinicie o painel, abra configurações e selecione essa fonte. Se ela não aparecer, consulte [Vídeo e câmeras](video.md).
