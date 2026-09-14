# Leaf OS

Base inicial do **Leaf OS** (embarcado no Raspberry Pi) e do **Leaf Ground Control** (interface de superfície).

## Executar localmente

Requer Node.js 20 ou superior.

```powershell
npm start
```

Abra `http://localhost:8080` no navegador.

## Estado atual

- Interface responsiva de pilotagem para desktop e tablet.
- API local de status, armar/desarmar, modo de voo e configuração de vídeo.
- Descoberta automática de dispositivos V4L2 (`/dev/video*`) no Raspberry Pi/Linux e cadastro persistente de câmeras RTSP.
- Configuração de fontes USB, CSI, capturadora e RTSP como base do Leaf OS Video.
- A telemetria ainda é simulada e não envia comandos à Pixhawk. Para vídeo, esta versão já inicia um pipeline real para webcams USB/V4L2 quando instalada no Raspberry com GStreamer e MediaMTX.

## Vídeo no Raspberry Pi

O Leaf OS usa o MediaMTX como roteador de mídia e o GStreamer para publicar uma webcam USB/V4L2 no caminho RTSP `rov`. O MediaMTX disponibiliza esse caminho em WebRTC na porta `8889`, acessível em `http://<ip-do-raspberry>:8889/rov`.

1. Instale o MediaMTX e execute-o com [deploy/mediamtx.yml](deploy/mediamtx.yml).
2. No Raspberry Pi OS, execute `bash scripts/install-raspberry.sh` dentro da pasta do projeto.
3. Escolha a câmera USB no painel Leaf Ground Control e use **Iniciar vídeo**.

O codificador padrão é `v4l2h264enc`; quando o seu Raspberry expuser outro codificador GStreamer, defina a variável `LEAF_H264_ENCODER` no serviço. Fontes CSI e RTSP já podem ser cadastradas no painel, mas entrarão no pipeline de transmissão na próxima etapa.

## Próximos módulos

1. Serviço MAVLink com acesso serial à Pixhawk.
2. Pipeline GStreamer/WebRTC de baixa latência.
4. Autenticação, persistência de configurações e imagem instalável do Raspberry Pi.
