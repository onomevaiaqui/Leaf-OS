# Desenvolvimento

## Estrutura

```text
server.js        API HTTP e arquivos estáticos
lib/video.js     descoberta e cadastro de fontes de vídeo
lib/stream.js    ciclo de vida do pipeline GStreamer
public/          Leaf Ground Control
deploy/          arquivos de serviço e MediaMTX
scripts/         instalação no Raspberry
docs/            documentação viva
```

## Executar no computador

Instale Node.js 20 ou superior, entre na pasta do projeto e execute `npm start`. Abra `http://localhost:8080`.

O computador de desenvolvimento não possui necessariamente GStreamer, V4L2 ou MediaMTX. Por isso, valide localmente a interface e as APIs; valide captura real apenas no Raspberry Pi.

## Padrões

- Não incluir senhas de câmeras RTSP ou dados pessoais nos commits.
- Não enviar comandos físicos à Pixhawk sem validação explícita e testes fora d'água.
- Atualizar o manual de operador e a documentação técnica com cada recurso novo.
- Manter a API local e sem dependência de nuvem.
