# Checklist Pre-Dive

O **Pre-Dive** aparece ao clicar em **Armar** no Leaf Ground Control. Ele reúne sinais automáticos e confirmações manuais antes de liberar a etapa de armamento.

## Verificações automáticas

- comunicação MAVLink recebida da Pixhawk;
- tensão de bateria disponível;
- joystick conectado.

## Confirmações do operador

- tether, conectores e vedação inspecionados;
- área segura e procedimento de emergência confirmados.

Após todos os itens serem confirmados, o botão **Liberar armamento** fecha o checklist e libera a próxima ação de armar na interface. O comando físico para a Pixhawk continua bloqueado nesta versão, até a validação final da camada de comando MAVLink.
