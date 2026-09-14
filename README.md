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
- Configuração de fontes USB, CSI, capturadora e RTSP como base do Leaf OS Video.
- Dados de telemetria e vídeo ainda são simulados: não envia comandos à Pixhawk e não captura câmera nesta versão.

## Próximos módulos

1. Serviço MAVLink com acesso serial à Pixhawk.
2. Descoberta de câmeras usando V4L2 e fontes RTSP.
3. Pipeline GStreamer/WebRTC de baixa latência.
4. Autenticação, persistência de configurações e imagem instalável do Raspberry Pi.
