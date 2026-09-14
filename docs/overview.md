# Visão geral

O Leaf OS é o software embarcado do ROV. Ele roda no Raspberry Pi e oferece rede, vídeo, configuração e, nas próximas versões, comunicação MAVLink com a Pixhawk. O Leaf Ground Control é a página de pilotagem acessada no computador ou tablet.

```text
Pixhawk ── MAVLink ── Leaf OS Core ── rede do tether ── Leaf Ground Control
                         │
Câmera USB / CSI / IP ─ Leaf OS Video ── WebRTC ────── navegador
```

## Princípios

- Manter ArduSub e MAVLink como protocolo padrão do veículo.
- Aceitar fontes USB/V4L2, CSI e IP/RTSP sem restringir a marca da câmera.
- Usar WebRTC para exibição de vídeo de baixa latência no navegador.
- Separar serviços: uma falha de vídeo não deve impedir o veículo de aplicar seus comportamentos de segurança.
- Operar localmente, sem depender de serviços em nuvem.

## Componentes atuais

| Componente | Responsabilidade | Estado |
| --- | --- | --- |
| Leaf OS Core | API HTTP, configuração e painel local | Em desenvolvimento |
| Leaf OS Video | Descoberta de câmeras e controle de pipeline | Funcional para USB/V4L2 no Raspberry |
| MediaMTX | Roteamento RTSP e entrega WebRTC | Instalação externa necessária |
| Leaf Ground Control | Tela de operação no navegador | Protótipo funcional |
| Leaf OS MAVLink | Comunicação segura com Pixhawk | Planejado |
