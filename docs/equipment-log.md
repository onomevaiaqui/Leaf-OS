# Log do equipamento

O botão **Log do equipamento**, dentro da engrenagem de configuração, reúne os dados de monitoramento do ROV em um único painel.

## Dados exibidos

- tensão, corrente, carga informada e histórico de bateria;
- qualidade do link MAVLink;
- saídas PWM de motores/propulsores, quando a Pixhawk publicar `SERVO_OUTPUT_RAW`;
- RPM, temperatura e corrente dos ESCs, quando os ESCs publicarem `ESC_STATUS`;
- pressão e temperatura brutas dos sensores da Pixhawk;
- mensagens e avisos enviados pela Pixhawk via `STATUSTEXT`.

## Alertas

O painel mostra alertas para Pixhawk desconectada e bateria abaixo do limite mínimo configurado. Também pode alertar quando a temperatura de um ESC exceder o limite definido em **Configuração → Veículo e bateria**. O limite de temperatura é opcional porque depende da especificação do ESC e da instalação no ROV.

A ausência de um grupo de dados significa que o autopiloto ou o periférico ainda não está publicando aquela mensagem MAVLink. Isso é esperado em testes sem ESCs, bateria ou propulsores conectados.

Ao receber o primeiro heartbeat, o Leaf OS solicita em baixa frequência as mensagens de bateria, saídas PWM e ESC para a Pixhawk. Esse pedido só configura a taxa de telemetria; ele não arma, não muda modo e não envia movimento para os motores.

Os valores de pressão são apresentados em hPa e ainda não equivalem a profundidade. A conversão para metros exige definir a pressão de referência na superfície e a densidade da água usada na operação.

Use o botão **Zerar profundidade na superfície** apenas quando o ROV estiver na superfície e o sensor externo estiver fornecendo dados. O procedimento completo está em [Calibração de profundidade](depth-calibration.md).
