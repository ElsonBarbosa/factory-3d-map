# Referência funcional

Análise da versão local de `virtual-factory-3d`, commit `ab6917a8ac9dae83561b630ad3f1f0ecda7e3aca`, entrada `index.html`, em 12/11/2026. O arquivo original foi apenas lido. SHA-256: `9A3EF17313BD56011D57E73B55581622EF97B8F24093F6A5841FBDDEAA5A9BB4`.

## Capacidades efetivamente encontradas

| Domínio | Implementação verificada na referência e mantida |
|---|---|
| Navegação | Câmera orbital, roda, pan por Shift/botão direito, Ctrl no editor, WASD relativo ao azimute, oito direções normalizadas, aceleração/desaceleração e limites do processo. Bloqueio durante digitação/modal/arrasto; limpeza ao perder foco. |
| Processo | Novo layout, nome, tamanho, translação de todos os filhos, quatro alças, etapas progressivas e retorno às ferramentas. |
| Áreas | Cadastro, nome, cor, seleção, arrasto, quatro cantos, edição numérica, exclusão e manutenção das posições mundiais dos equipamentos ao redimensionar. |
| Equipamentos | Catálogo, miniaturas renderizadas, drag-and-drop nativo, fantasma 3D, identificação obrigatória e única, propriedades, mover, giro de 90°, alça de rotação com prévia suave e retorno à última orientação válida. |
| Estações | Inspeção, inserção, reparo, montagem e teste manual; operador; três jigs na bancada de teste; disposição paralela/lateral; lado e direção de fluxo independentes. Testador automático com ciclo visual de fixture. |
| Geometria | Grid de uma unidade; processo mínimo 14×14, área mínima 8×8, terreno limitado a ±400; contenção, colisão entre áreas, corpo/operador/corredor das bancadas e espaçamento lateral automático de três unidades. Guias de fileira/coluna e preview de fluxo preservam o snap existente, sem magnetismo adicional. |
| Esteiras | Portas de entrada/saída, sentido inicial, uma entrada e saída por máquina, rejeição de duplicação/autoconexão/ciclo, caminhos ortogonais com curvas suaves e retorno em U, corredores manuais, construção animada, placas/setas, seleção e exclusão. Recalcula ao mover, girar ou renomear. |
| Persistência | Schema de layout versões 1–3; IDs, nomes, áreas, posições, rotações, disposição manual, conexões e exclusões na demo; validação na restauração, descarte de ligações inválidas e aviso de falha de armazenamento. |
| Monitoramento | Estados operando/setup/parado/manutenção; OEE, FPY, produção horária, disponibilidade, qualidade, capacidade, paradas, alarmes, ordens, operadores, manutenção, energia e informações por área. Todos demonstrativos. |

## Limites da referência

- Não há integração com máquinas reais, backend, autenticação ou dados ao vivo. Não foram inventadas essas capacidades.
- O catálogo original não oferece máquina de corte. Factory 3D Map acrescenta `CUT`, usando as mesmas regras de equipamento automático.
- A referência trabalha com um layout ativo por origem do navegador. O novo produto mantém esse comportamento e acrescenta cópias nomeadas independentes.
- O seletor “Tipo” do formulário de área original não tinha evento ou persistência associados; não era uma classificação funcional implementada. Ele foi removido da nova apresentação para evitar um controle sem efeito.
- Medidas são unidades relativas de planejamento, sem representar especificações certificadas de fabricantes.
- Os testes originais contêm expectativas da interface inferior e do tema escuro inicial. Essas verificações foram adaptadas à nova arquitetura; as regras geométricas continuam exercitadas.

## Separação

Nenhum logotipo, CSS ou gerador de modelos do produto original é usado em execução. A lógica de geometria, navegação, validação, ligações e serialização foi extraída para uma cópia independente. `models.js`, `map.css`, `shell.js`, `projects.js` e a composição HTML são novos. A apresentação de construção e monitoramento fica em arquivos próprios. Não existe importação, link simbólico ou dependência de arquivos do diretório original.

Os layouts usam exclusivamente `factory3dmap.layout.v1` e `factory3dmap.projects.v1`; a preferência visual usa `factory3dmap.theme.v1`. A chave `virtualFactoryEditorV1` não é lida nem migrada. O Git do novo projeto aponta somente para `ElsonBarbosa/factory-3d-map`.
