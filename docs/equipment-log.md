# Log do equipamento

O botão **Log do equipamento**, dentro da engrenagem de configuração, reúne os dados de monitoramento do ROV em um único painel.

## Dados exibidos

- tensão, corrente, carga informada e histórico de bateria;
- qualidade do link MAVLink;
- saídas PWM de motores/propulsores, quando a Pixhawk publicar `SERVO_OUTPUT_RAW`;
- RPM, temperatura e corrente dos ESCs, quando os ESCs publicarem `ESC_STATUS`;
- mensagens e avisos enviados pela Pixhawk via `STATUSTEXT`.

A ausência de um grupo de dados significa que o autopiloto ou o periférico ainda não está publicando aquela mensagem MAVLink. Isso é esperado em testes sem ESCs, bateria ou propulsores conectados.

Ao receber o primeiro heartbeat, o Leaf OS solicita em baixa frequência as mensagens de bateria, saídas PWM e ESC para a Pixhawk. Esse pedido só configura a taxa de telemetria; ele não arma, não muda modo e não envia movimento para os motores.
