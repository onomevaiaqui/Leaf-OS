# Joystick e mapeamento de controles

## Estado atual

O Leaf Ground Control detecta controles USB e Bluetooth diretamente no navegador através da Gamepad API. A barra inferior informa o nome do controle, os quatro primeiros eixos e a quantidade de botões pressionados. Nesta fase, essa leitura é apenas visual: nenhum movimento é enviado à Pixhawk.

## Teste no computador

1. Conecte o joystick ao computador por USB ou Bluetooth.
2. Abra o Leaf Ground Control e pressione qualquer botão do controle.
3. A barra inferior deve mudar para **CONTROLE: CONECTADO**.
4. Mova os manches e confira os valores dos eixos; valores próximos de `0.00` indicam centro.

## Próxima fase

O mapeamento final será configurável e testado em simulador antes de ser liberado para o ROV. A configuração prevista é:

| Função | Controle padrão proposto |
| --- | --- |
| Avançar/recuar | Manche esquerdo vertical |
| Deslocamento lateral | Manche esquerdo horizontal |
| Subir/descer | Manche direito vertical |
| Guinada | Manche direito horizontal |
| Armar/desarmar | Botão com confirmação na tela |
| Luzes/câmera | Botões configuráveis |

Nenhum mapeamento será ativado no veículo sem validação em bancada, propulsores seguros e confirmação explícita do operador.
