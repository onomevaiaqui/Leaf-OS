# Diagnóstico do sistema

Abra as configurações do Leaf Ground Control e consulte **Prontidão do ROV** antes da operação. O diagnóstico não altera nenhuma configuração nem envia comandos à Pixhawk.

| Item | Verde significa | Se estiver indisponível |
| --- | --- | --- |
| Pixhawk / MAVLink | Heartbeats válidos estão chegando | Confira a porta serial, baud rate e `leaf-mavlink.service` |
| Câmera USB | Há ao menos uma fonte `/dev/videoN` | Confira cabo, alimentação e `v4l2-ctl --list-devices` |
| GStreamer | O capturador/codificador está instalado | Reexecute o instalador ou instale pacotes GStreamer |
| MediaMTX RTSP | Porta 8554 acessível localmente | Inicie o MediaMTX com a configuração Leaf OS |
| MediaMTX WebRTC | Porta 8889 acessível localmente | Confira MediaMTX, firewall e configuração |

O estado verde de todos os itens não substitui a inspeção física do ROV, do tether e dos mecanismos de segurança.
