# Política de bateria

Antes de liberar armamento no Pre-Dive, o operador deve configurar a **tensão mínima para armar** nas configurações do Leaf Ground Control. O valor é específico do conjunto de baterias e fica salvo somente no navegador atual.

O Pre-Dive exige:

1. um limite mínimo configurado;
2. leitura de tensão proveniente da Pixhawk;
3. tensão igual ou maior que o limite.

Não há um valor padrão propositalmente: a tensão segura depende do número de células, química da bateria, queda esperada no tether e política operacional do ROV. Configure o limite apenas depois de validar esses dados para o seu veículo.
