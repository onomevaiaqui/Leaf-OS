# Checklist de pré-voo

O Leaf Ground Control reúne sinais automáticos e confirmações manuais antes de uma operação.

## Verificações automáticas

- comunicação MAVLink recebida da Pixhawk;
- tensão de bateria disponível;
- joystick conectado.

## Confirmações do operador

- tether, conectores e vedação inspecionados;
- área segura e procedimento de emergência confirmados.

O estado **Pré-voo confirmado** é informativo nesta versão. Ele ainda não libera armar, nem envia comandos ao veículo. Essa separação é intencional: a lógica de comando só será conectada depois de testes de bancada e simulador.
