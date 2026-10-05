# Manual do operador — Leaf Ground Control

## Antes de cada operação

1. Inspecione tether, conectores, vedação, bateria e propulsores.
2. Ligue o ROV e aguarde o Raspberry Pi iniciar.
3. Conecte o computador/tablet à rede do ROV.
4. Abra o endereço do Leaf OS no navegador.
5. Confirme a conexão, a tensão da bateria e o vídeo antes de armar.

O cabeçalho exibe **Pixhawk conectada** somente quando a ponte MAVLink recebe heartbeats reais. **Pixhawk desconectada** significa que a página Leaf OS está disponível, mas não há comunicação válida com o controlador de voo.

Abra as configurações e verifique a seção **Prontidão do ROV**. Ela indica se os componentes de vídeo e MAVLink necessários estão disponíveis; veja detalhes em [Diagnóstico](diagnostics.md).

## Tela principal

- **Vídeo**: área central de visão do ROV. Quando o pipeline e o MediaMTX estão ativos, o Leaf Ground Control abre automaticamente o leitor WebRTC embutido nessa área.
- **Profundidade / rumo**: rumo passa a vir da Pixhawk quando a ponte MAVLink estiver conectada. Profundidade ainda é simulada.
- **Bateria / corrente / link**: tensão e corrente passam a vir da Pixhawk quando a ponte MAVLink estiver conectada. O link reflete a idade dos heartbeats MAVLink e indica desconexão após cinco segundos sem atualização.
- **Histórico MAVLink**: o gráfico abaixo do vídeo mostra a tensão recebida da Pixhawk nos últimos minutos. Ele reinicia quando a ponte MAVLink é reiniciada.
- **Configurações**: escolha câmera, resolução, FPS e bitrate, ou cadastre uma URL RTSP.
- **Iniciar vídeo**: inicia a captura USB selecionada no Raspberry. Use novamente para parar.
- **Controle**: a barra inferior indica se o joystick está conectado e mostra seus eixos. Nesta versão, ele ainda não movimenta o ROV.
- **Resposta do joystick**: o quadro de simulação mostra os quatro movimentos configurados. Use **Configurar eixos** para adaptar o layout ao seu controle.
- **Gravar telemetria**: inicia o registro local da sessão; ao parar, o navegador baixa um CSV com os dados coletados.
- **Armar / Pre-Dive**: ao clicar em armar, o checklist Pre-Dive combina estado da Pixhawk, bateria, joystick e confirmações manuais. Após a liberação, o comando físico ainda permanece bloqueado nesta versão.

## Segurança

Os controles **Armar veículo** e **Manter profundidade** desta versão são demonstrativos. Eles não podem ser usados para operar um ROV até que o módulo MAVLink seja instalado, validado e documentado. Sempre mantenha uma forma física de desenergizar o ROV durante testes.

## Configurar uma câmera IP

1. Abra as configurações pelo ícone de engrenagem.
2. Em **Adicionar câmera IP**, informe um nome opcional e a URL `rtsp://...`.
3. Clique em **Adicionar URL RTSP**.
4. Selecione a nova câmera e salve.

O cadastro fica salvo no Raspberry. O suporte para transmitir diretamente uma câmera IP será adicionado em uma próxima versão; por ora, o início de vídeo direto atende fontes USB/V4L2.
