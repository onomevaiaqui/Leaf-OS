# Arquitetura de registro de dados

## Política do produto

O Leaf OS separa os registros em duas camadas:

1. **Log técnico contínuo**: iniciado com o Leaf OS no Raspberry. Registra inicialização, conectividade, vídeo, falhas e telemetria disponível.
2. **Log de missão**: delimitado por eventos de armar/desarmar recebidos da Pixhawk. Deve conter também uma janela curta de dados anteriores ao armamento.

O Leaf Ground Control mantém um CSV de superfície como cópia conveniente da sessão, mas não será a fonte oficial dos dados. O log oficial ficará no Raspberry para sobreviver à desconexão, queda do navegador ou perda da estação de superfície.

## Estado atual

A versão atual implementa o CSV de superfície automático a partir do estado armado. A implementação embarcada, persistente e com buffer pré-armamento será ativada com a chegada do Raspberry Pi.
