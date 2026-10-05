# MAVLink e Pixhawk

## Estado atual

O serviço `leaf-mavlink.service` é uma ponte **somente de leitura** entre a Pixhawk e a API local do Leaf OS. Ele lê `HEARTBEAT`, `SYS_STATUS` e `VFR_HUD` usando a biblioteca open source Pymavlink.

Em Windows, a ponte também requer `pyserial`; ela já está incluída em `requirements.txt`.

Campos já encaminhados ao Leaf Ground Control:

- Conexão, modo de voo e estado armado, a partir de `HEARTBEAT`.
- Tensão e corrente, a partir de `SYS_STATUS`.
- Rumo, a partir de `VFR_HUD`.
- Qualidade do link, calculada pela idade do último `HEARTBEAT` recebido.

A ponte também mantém até 15 minutos de amostras de telemetria na memória, coletadas uma vez por segundo. O Leaf Ground Control usa essas amostras para mostrar o histórico de tensão. Esse histórico é temporário e reinicia junto com o serviço.

Profundidade não é inferida nesta versão: ela será integrada usando a mensagem e a referência corretas configuradas no ArduSub. Isso evita apresentar altitude como se fosse profundidade.

O indicador de link começa em 100% após um heartbeat e cai progressivamente se novos heartbeats não chegam. Após cinco segundos sem heartbeat, a ponte considera a Pixhawk desconectada.

## Conexão serial

O serviço usa por padrão `/dev/ttyACM0` a 115200 baud. Esse caminho varia conforme a ligação:

| Tipo de ligação | Exemplo de endereço |
| --- | --- |
| USB da Pixhawk | `/dev/ttyACM0` ou `/dev/ttyUSB0` |
| UART GPIO | `/dev/serial0` |
| MAVLink por rede | `udpin:0.0.0.0:14550` |

Para alterar, edite `/etc/systemd/system/leaf-mavlink.service`, atualize `PIXHAWK_CONNECTION` e `PIXHAWK_BAUD`, e execute:

```bash
sudo systemctl daemon-reload
sudo systemctl restart leaf-mavlink
```

Confira os registros com `journalctl -u leaf-mavlink -f`.

## Segurança

Esta ponte não expõe endpoints de comando. Os botões de armar e de modo na versão 0.1 ainda usam o estado demonstrativo do Leaf Ground Control. O módulo de comando só será incluído depois de testes com SITL, Pixhawk em bancada e uma regra explícita de bloqueio de propulsores.
