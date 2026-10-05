# Joystick e mapeamento de controles

## Estado atual

O Leaf Ground Control detecta controles USB e Bluetooth diretamente no navegador através da Gamepad API. A barra inferior informa o nome do controle, os quatro primeiros eixos e a quantidade de botões pressionados.

Os quatro comandos mapeados também são enviados ao serviço local do Leaf OS como **dry-run** e ficam visíveis em **Configuração → Log do equipamento → Último comando simulado**. Eles são gravados no arquivo técnico da sessão para validar mapeamentos e resposta do joystick.

Nenhum comando desta etapa é convertido em MAVLink, enviado à Pixhawk, usado para armar ou capaz de movimentar propulsores.

## Teste no computador

1. Conecte o joystick ao computador por USB ou Bluetooth.
2. Abra o Leaf Ground Control e pressione qualquer botão do controle.
3. A barra inferior deve mudar para **CONTROLE: CONECTADO**.
4. Mova os manches e confira os valores dos eixos; valores próximos de `0.00` indicam centro.
5. Abra **Configuração → Log do equipamento** e confirme os quatro valores em **Último comando simulado**.

## Configurar eixos

Clique em **Configurar eixos** no quadro de simulação. Cada função pode ser associada a um eixo diferente e a preferência fica salva no navegador deste computador. A simulação mostra intensidade e direção em tempo real e registra esses valores como dry-run, mas não envia nenhuma mensagem MAVLink de movimento.

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
