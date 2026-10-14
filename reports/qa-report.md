# Relatório de testes — v0.9

Resultado: todos os testes executados passaram.

## Automatizados

- Validação estática de seções, autenticação, modelo de dados, Firestore, cache e manifesto.
- Verificação de sintaxe de `app.js` e `sw.js`.
- Fluxo em Chromium: login, cliente, imóvel, projeto, cômodo com 4 × 3 m e rotação de 90°, zoom, confirmação da planta, TUG, TUE, interruptor paralelo, quadro, trecho de 8 m, circuito e manutenção.
- Persistência após recarregar e preservação dos pontos ao alternar entre as etapas arquitetônica e elétrica.
- Migração da v0.7 para a v0.9 com cópia local de recuperação.
- Responsividade sem rolagem horizontal em desktop, tablet e celular de 390 × 844.

## Resultado funcional

A planta da casa pode ser montada sem interferência dos pontos elétricos. Depois da confirmação, a etapa elétrica é liberada e continua alimentando o dimensionamento preliminar.

