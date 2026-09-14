# Documentação Leaf OS

Este diretório é o manual vivo do Leaf OS. Toda nova função precisa atualizar o documento correspondente antes de ser considerada concluída.

| Documento | Para quem | Conteúdo |
| --- | --- | --- |
| [Visão geral](overview.md) | Todos | Componentes e arquitetura do sistema |
| [Instalação no Raspberry Pi](installation-raspberry-pi.md) | Integrador | Preparação do cartão, rede e serviços |
| [Manual do operador](operator-manual.md) | Piloto do ROV | Uso do Leaf Ground Control |
| [Vídeo e câmeras](video.md) | Integrador | Tipos de câmeras, configuração e diagnóstico |
| [Desenvolvimento](development.md) | Desenvolvedor | Estrutura do código e padrões de contribuição |

## Situação da versão 0.1

O Leaf OS já tem a interface de superfície, descoberta de fontes USB no Linux, cadastro RTSP e o pipeline configurável GStreamer + MediaMTX. Telemetria e comandos da Pixhawk ainda são simulados; nunca opere um ROV real usando os botões da versão 0.1.
