# Manual do operador — Leaf Ground Control

## Antes de cada operação

1. Inspecione tether, conectores, vedação, bateria e propulsores.
2. Ligue o ROV e aguarde o Raspberry Pi iniciar.
3. Conecte o computador/tablet à rede do ROV.
4. Abra o endereço do Leaf OS no navegador.
5. Confirme a conexão, a tensão da bateria e o vídeo antes de armar.

## Tela principal

- **Vídeo**: área central de visão do ROV. Quando o pipeline e o MediaMTX estão ativos, o Leaf Ground Control abre automaticamente o leitor WebRTC embutido nessa área.
- **Profundidade / rumo**: indicadores de navegação. Ainda simulados até a integração MAVLink.
- **Bateria / corrente / link**: diagnóstico essencial. Ainda simulados até a integração MAVLink.
- **Configurações**: escolha câmera, resolução, FPS e bitrate, ou cadastre uma URL RTSP.
- **Iniciar vídeo**: inicia a captura USB selecionada no Raspberry. Use novamente para parar.

## Segurança

Os controles **Armar veículo** e **Manter profundidade** desta versão são demonstrativos. Eles não podem ser usados para operar um ROV até que o módulo MAVLink seja instalado, validado e documentado. Sempre mantenha uma forma física de desenergizar o ROV durante testes.

## Configurar uma câmera IP

1. Abra as configurações pelo ícone de engrenagem.
2. Em **Adicionar câmera IP**, informe um nome opcional e a URL `rtsp://...`.
3. Clique em **Adicionar URL RTSP**.
4. Selecione a nova câmera e salve.

O cadastro fica salvo no Raspberry. O suporte para transmitir diretamente uma câmera IP será adicionado em uma próxima versão; por ora, o início de vídeo direto atende fontes USB/V4L2.
