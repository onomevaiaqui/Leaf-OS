# Registro de telemetria

O Leaf Ground Control pode registrar uma sessão de teste em um arquivo CSV, sem enviar comandos ao ROV.

## Como usar

1. Confirme que a Pixhawk está conectada no cabeçalho.
2. Clique em **Gravar telemetria**.
3. Faça o teste de bancada desejado e acompanhe os valores.
4. Clique em **Parar e exportar**.
5. O navegador baixa um arquivo `leaf-os-telemetria-<data>.csv`.

## Registro automático de missão

Quando uma Pixhawk conectada informa que o veículo foi armado, o Leaf Ground Control inicia automaticamente um registro de missão. Ao desarmar, o CSV é exportado. Esse mecanismo registra apenas a sessão visível no computador de superfície e é uma preparação para o registro embarcado do Leaf OS.

Se não houver Pixhawk conectada, use o botão **Gravar telemetria** para iniciar e encerrar um registro manual.

## Campos exportados

- data/hora local do navegador;
- conexão da Pixhawk;
- estado armado e modo;
- profundidade, rumo, tensão, corrente e link.

O CSV é criado no computador de superfície. O registro atual depende da página permanecer aberta; armazenamento persistente, buffer pré-armamento e gravação embarcada serão adicionados depois.
