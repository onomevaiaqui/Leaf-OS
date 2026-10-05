# Registro de telemetria

O Leaf Ground Control pode registrar uma sessão de teste em um arquivo CSV, sem enviar comandos ao ROV.

## Como usar

1. Confirme que a Pixhawk está conectada no cabeçalho.
2. Clique em **Gravar telemetria**.
3. Faça o teste de bancada desejado e acompanhe os valores.
4. Clique em **Parar e exportar**.
5. O navegador baixa um arquivo `leaf-os-telemetria-<data>.csv`.

## Campos exportados

- data/hora local do navegador;
- conexão da Pixhawk;
- estado armado e modo;
- profundidade, rumo, tensão, corrente e link.

O CSV é criado no computador de superfície. O registro atual depende da página permanecer aberta; armazenamento persistente e gravação embarcada serão adicionados depois.
