# Calibração de profundidade

O Leaf OS calcula profundidade apenas a partir do sensor de pressão externo após uma referência de superfície ser definida.

## Procedimento

1. Deixe o ROV na superfície, com o sensor externo em contato com a água.
2. Abra **Configuração → Log do equipamento**.
3. Confirme que o **Sensor externo** está fornecendo pressão.
4. Verifique a densidade da água em **Configuração → Veículo e bateria**: use um valor apropriado para água doce ou salgada.
5. Clique em **Zerar profundidade na superfície**.

Depois disso, o painel principal passa a mostrar profundidade relativa à superfície de calibração.

## Limites atuais

A referência é mantida pela ponte MAVLink e será perdida se o serviço for reiniciado. Ela deverá ser recalibrada antes de cada mergulho. O cálculo não substitui sensores certificados nem procedimentos de segurança operacional.
