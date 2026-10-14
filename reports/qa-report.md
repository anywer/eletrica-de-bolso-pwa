# Relatório de testes — v0.10.0

Resultado: todos os testes executados passaram.

- Um ambiente de 4 × 3 m produziu quatro paredes, área de 12 m² e proporção visual 4:3.
- Zoom, enquadramento e gesto de pinça não alteraram nenhum valor da geometria persistida.
- Vértices compartilhados foram atualizados atomicamente e o polígono permaneceu fechado.
- A planta confirmou corretamente para a etapa elétrica e permitiu adicionar ponto TUG.
- Planta, ponto elétrico e geometria foram preservados após recarregar o aplicativo.
- Projeto da v0.9 foi migrado para o esquema 10, convertido em paredes e manteve nome e dimensões.
- Cadastro de cliente, imóvel e projeto passou no fluxo de navegador.
- Não houve erro no console nem rolagem horizontal no viewport móvel de 390 × 844.
- Os quatro arquivos do motor e a licença MIT estão no cache offline.

Comandos executados: verificação de sintaxe, `tests/site-check.cjs`, `tests/planner-engine-check.cjs` e `tests/browser-check.cjs`.
