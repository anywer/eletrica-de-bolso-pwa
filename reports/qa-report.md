# Relatório de testes — v0.9.1.1

Resultado: todos os testes executados passaram.

- Área de 6 m² com largura de 3 m calculou profundidade de 2 m.
- Cômodo de 4 × 3 m manteve proporção visual de 4:3 e área de 12 m².
- Corredor de 0,5 × 3 m manteve a proporção visual de 1:6, sem tamanho mínimo deformando a planta.
- Arestas foram encaixadas ao arrastar pelo rótulo, conectadas, liberadas e coincididas pelo controle manual.
- Um cômodo fixado não se moveu durante tentativa de arraste e voltou a mover após ser liberado.
- A pinça simulada ampliou o cômodo e o botão Enquadrar restaurou a visualização.
- A etapa elétrica exibiu somente o cômodo selecionado.
- Um ponto colocado na parede comum apareceu também no cômodo vizinho.
- Dados da v0.7 foram migrados para o esquema 9 com cópia de recuperação.
- Cadastro, circuitos, manutenção, persistência, autenticação e cache offline passaram na regressão.
- Não houve overflow horizontal em desktop, tablet, celular vertical ou celular em paisagem.

