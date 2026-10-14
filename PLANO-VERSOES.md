# Plano de evolução — Elétrica de Bolso

Princípios: experiência móvel primeiro, funcionamento offline, custo zero no núcleo e cálculos sempre apresentados como preliminares para validação profissional e normativa.

## v0.8.1 — planta móvel e dados conectados

- Navegação por toque mais confortável e propriedades abaixo da planta no celular.
- Pontos para quadro elétrico, TUE identificada e interruptores simples, paralelos e intermediários.
- Circuitos atualizados com potência, cômodos e comprimento dos trechos registrados na planta.
- Ajuda contextual para TUG, TUE, DR, DPS e N–PE.

## v0.9 — quantitativo preliminar de condutores e orçamento

1. Modelar cada circuito com número de fases, neutro, proteção e retornos.
2. Relacionar interruptores às luminárias e identificar viajantes de comandos paralelos/intermediários.
3. Somar os trechos percorridos por cada via, com margem configurável separada do valor medido.
4. Produzir lista por seção, função e cor sugerida, deixando explícito que cores, método de instalação e dimensionamento exigem validação conforme a NBR 5410 vigente.
5. Exportar resumo de materiais para orçamento, sem declarar aprovação normativa.

## v0.10 — croqui assistido sem IA

1. Fotografar ou importar um croqui como imagem de fundo.
2. Corrigir rotação, definir escala por uma medida conhecida e ajustar transparência.
3. Traçar paredes/cômodos por cima da imagem e converter o traçado em elementos editáveis.
4. Manter todo o processamento no aparelho e permitir remover a imagem após a vetorização.

Esta etapa entrega a maior parte do ganho de uso com baixo risco, sem custo de serviço e sem enviar plantas de clientes para terceiros.

## v0.11 — IA opcional para sugerir o traçado

- Detectar paredes, portas e textos e gerar somente uma sugestão editável.
- Exigir confirmação de escala e revisão de todos os elementos antes de criar circuitos ou quantitativos.
- Avaliar processamento local no navegador; usar serviço externo somente com consentimento, política de privacidade e custo claramente informado.
- Nunca dimensionar ou aprovar automaticamente uma instalação apenas a partir de uma fotografia.

## Sugestões de produto

- Salvar automaticamente cada edição e mostrar claramente o estado de sincronização.
- Usar botões grandes e ações progressivas no celular: cômodo → pontos → ligações → circuitos → materiais.
- Manter o ícone `?` junto de termos técnicos e abrir explicações curtas, com referência à necessidade de validação profissional.
- Antes do quantitativo de cabos, criar uma verificação de projeto que destaque pontos sem circuito, trechos sem comprimento e cargas sem potência.

