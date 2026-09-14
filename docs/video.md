# Vídeo e câmeras

## Fluxo de vídeo

```text
Webcam USB / capturadora ─ V4L2 ─ GStreamer ─ RTSP local ─ MediaMTX ─ WebRTC ─ navegador
```

Essa separação permite receber uma câmera que entregue MJPEG ou vídeo bruto e normalizá-la para H.264 antes da transmissão. O navegador recebe WebRTC, sem precisar conhecer o formato original da câmera.

## Fontes aceitas

| Fonte | Situação | Observação |
| --- | --- | --- |
| Webcam USB/UVC | Suportada no primeiro pipeline | Deve aparecer como `/dev/videoN` |
| Capturadora USB analógica | Suportada se exposta como V4L2 | Use a mesma seleção de webcam |
| Câmera CSI | Detectada | Pipeline dedicado será adicionado |
| Câmera IP/RTSP | Cadastro persistente | Pipeline dedicado será adicionado |

## Problemas comuns

**A câmera não aparece** — verifique `v4l2-ctl --list-devices`, desconecte/reconecte a câmera e recarregue o painel.

**O botão Iniciar vídeo falha** — confirme que GStreamer e MediaMTX estão instalados, e use `journalctl -u leaf-os -f` para ver a mensagem de erro.

**Imagem lenta ou travando** — comece em 1280×720, 30 FPS e 3500 kbps. Reduza FPS ou resolução antes de diminuir muito o bitrate.

**Erro de codificador** — o padrão é `v4l2h264enc`. Confirme os elementos disponíveis com `gst-inspect-1.0 | grep 264enc`; depois configure `LEAF_H264_ENCODER` no serviço Leaf OS com o codificador adequado.
