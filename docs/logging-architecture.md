# Arquitetura de registro de dados

## Política do produto

O Leaf OS separa os registros em duas camadas:

1. **Log técnico contínuo**: iniciado com o Leaf OS no Raspberry. Registra inicialização, conectividade, vídeo, falhas e telemetria disponível.
2. **Log de missão**: delimitado por eventos de armar/desarmar recebidos da Pixhawk. Deve conter também uma janela curta de dados anteriores ao armamento.

O Leaf Ground Control oferece um painel de monitoramento para os dados recebidos, mas não será a fonte oficial dos registros. O log oficial ficará no Raspberry para sobreviver à desconexão, queda do navegador ou perda da estação de superfície.

## Estado atual

A ponte MAVLink atual cria um arquivo JSONL em `data/logs` assim que o serviço inicia. Ela grava amostras de telemetria uma vez por segundo, mensagens `STATUSTEXT` e marcos de armar/desarmar. O arquivo permanece no computador ou, quando o serviço for instalado, no Raspberry Pi.

A implementação embarcada com buffer pré-armamento será ativada com a chegada do Raspberry Pi.
