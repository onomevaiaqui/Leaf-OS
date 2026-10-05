# Teste de bancada — Leaf OS 0.1

> Nunca faça o primeiro teste com o ROV na água. Remova as hélices ou desconecte a alimentação dos propulsores. A versão 0.1 não envia comandos de controle à Pixhawk, mas o teste deve seguir a mesma disciplina de segurança de uma operação real.

## 1. Verificação no computador

Na pasta do projeto, execute `npm start` e abra `http://localhost:8080`. A tela deve abrir mesmo sem hardware. É esperado que o cabeçalho informe **Pixhawk desconectada** e que o diagnóstico indique componentes do Raspberry indisponíveis.

## 2. Preparar o Raspberry Pi

Use Raspberry Pi OS Lite 64-bit e conecte o Raspberry à mesma rede do computador. Clone o repositório e execute:

```bash
cd Leaf-OS
bash scripts/install-raspberry.sh
```

Reinicie. Encontre o endereço IP com `hostname -I` e abra `http://IP_DO_RASPBERRY:8080` no computador.

## 3. MediaMTX para teste

Baixe a versão Linux ARM64 do MediaMTX, extraia-a em `/opt/mediamtx` e copie `deploy/mediamtx.yml` para essa pasta. Para o primeiro teste, execute em primeiro plano:

```bash
sudo /opt/mediamtx/mediamtx /opt/mediamtx/mediamtx.yml
```

Deixe esse terminal aberto. Em outra sessão, confirme que as portas respondem com `ss -ltn | grep -E '8554|8889'`.

## 4. Câmera USB

Conecte uma webcam UVC ou capturadora USB ao Raspberry. Execute:

```bash
v4l2-ctl --list-devices
```

Você deve ver ao menos um dispositivo `/dev/videoN`. No Leaf Ground Control, abra as configurações, confirme o diagnóstico, selecione a câmera e clique em **Iniciar vídeo**. O painel deve abrir o leitor WebRTC dentro da área de vídeo.

Se falhar, confira `journalctl -u leaf-os -f` e `gst-inspect-1.0 v4l2h264enc`. A câmera pode funcionar em outros formatos; o Leaf OS é responsável por convertê-los antes de enviar ao navegador.

## 5. Pixhawk

Com propulsores seguros/desenergizados, conecte a Pixhawk por USB ao Raspberry. Confira o dispositivo:

```bash
ls /dev/ttyACM0 /dev/ttyUSB0 2>/dev/null
```

Se o dispositivo não for `/dev/ttyACM0`, edite `PIXHAWK_CONNECTION` em `/etc/systemd/system/leaf-mavlink.service`. Depois execute:

```bash
sudo systemctl daemon-reload
sudo systemctl restart leaf-mavlink
journalctl -u leaf-mavlink -f
```

O cabeçalho deve mudar para **Pixhawk conectada**. Tensão, corrente e rumo deixam de ser valores demonstrativos quando a ponte recebe as mensagens da Pixhawk. A profundidade continua demonstrativa nesta versão.

## Critérios de aprovação

- A página abre pelo IP do Raspberry.
- O diagnóstico confirma GStreamer e as duas portas do MediaMTX.
- A webcam aparece como fonte e mostra imagem com atraso aceitável.
- A Pixhawk é indicada como conectada e fornece telemetria.
- Nenhum comando de propulsão ou armamento é enviado durante o teste.
