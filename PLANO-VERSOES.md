# Plano de evolução — Elétrica de Bolso

Princípios: celular primeiro, funcionamento offline, custo zero no núcleo e resultados elétricos sempre preliminares para validação profissional e normativa.

## Fluxo definitivo

1. **Montar a planta arquitetônica**: dimensões, posição e rotação dos cômodos, sem pontos elétricos.
2. **Validar a planta completa**: conferir medidas, encaixes e escala.
3. **Selecionar um cômodo**: o celular mostra somente o ambiente escolhido.
4. **Projetar a elétrica do cômodo**: inserir pontos, alturas, módulos, tensão, corrente e cargas.
5. **Ligar circuitos e trechos**: relacionar pontos ao quadro e registrar comprimentos.
6. **Dimensionar e quantificar**: gerar memória preliminar e lista de materiais para revisão.

## v0.9 — construtor simplificado da planta

- Modo **Planta da casa**, sem ferramentas elétricas.
- Cômodos com largura e comprimento reais em metros, posição e rotação.
- Grade, encaixe opcional, zoom, deslocamento e botão para enquadrar toda a casa.
- Lista de cômodos por categoria: sala, cozinha, quarto, banheiro, circulação, área externa e personalizado.
- Portas e aberturas simples somente quando necessárias para compreender a distribuição.
- Confirmação da planta antes de liberar a etapa elétrica.

## v0.9.1 — geometria conectada e elétrica por cômodo

- Área e largura/profundidade vinculadas, com escala visual proporcional.
- Encaixe magnético entre arestas e conexões que movem cômodos unidos em conjunto.
- Liberação explícita das arestas conectadas.
- Zoom da planta por botões e gesto de pinça.
- Etapa elétrica separada, mostrando um cômodo por vez.
- Reconhecimento de paredes compartilhadas e exibição do mesmo ponto nos ambientes relacionados.

## v0.9.2 — propriedades completas dos pontos

- Categorias: tomadas, iluminação, comandos, cargas específicas e quadro.
- Altura do ponto: baixa, média, alta, teto ou medida personalizada em centímetros.
- Composição do ponto: tomada simples, dupla, tripla ou combinação de módulos.
- Tomadas de 10 A ou 20 A e tensão de 127 V, 220 V ou valor confirmado em campo.
- Interruptores simples, paralelos e intermediários, inclusive combinação interruptor + tomada.
- TUE nomeada e ligada ao equipamento, potência e tensão correspondentes.
- Ícones diferentes quando pontos ocuparem a mesma posição 2D, evitando sobreposição invisível.

## v0.10 — motor arquitetônico em escala

- Integração seletiva do motor MIT `countzero/ai_room_planner`.
- Paredes e vértices em centímetros, independentes da câmera.
- Detecção automática de ambientes fechados e cálculo de área.
- Encaixe de vértices, grade de 10 cm e movimentação conjunta de encontros.
- Zoom, pinça e navegação sem alterar posições ou dimensões.
- Conversão automática dos cômodos das versões anteriores.

## v0.11 — importação assistida de planta

1. Importar PDF ou imagem como referência de fundo.
2. Para PDF vetorial, aproveitar linhas e textos quando tecnicamente possível.
3. Para PDF digitalizado ou fotografia, permitir rotação, recorte e contraste.
4. Calibrar a escala usando uma medida conhecida do desenho.
5. Traçar ou confirmar os cômodos sobre a referência e converter em elementos editáveis.

Essa abordagem funciona offline e não precisa de IA para entregar valor. A imagem de referência poderá ser removida depois da conversão.

## v0.12 — circuitos e quantitativo preliminar

- Relacionar cada ponto ao circuito e ao quadro.
- Modelar fases, neutro, proteção, retornos e viajantes separadamente.
- Somar os comprimentos percorridos por cada condutor, seção e função.
- Sugerir cores por função, deixando explícita a necessidade de validar a NBR 5410 vigente e o padrão adotado.
- Produzir lista de materiais e resumo para orçamento com margem configurável separada da medida real.
- Destacar pontos sem circuito, trechos sem comprimento e cargas sem potência.

## v0.13 — IA opcional para sugerir a planta

- Detectar paredes, ambientes, cotas, portas e textos em croquis ou documentos digitalizados.
- Gerar somente uma sugestão editável; nunca substituir a confirmação do usuário.
- Exigir calibração de escala e revisão de cada ambiente antes da etapa elétrica.
- Priorizar processamento local. Serviço externo somente com consentimento, política de privacidade e custo informado.
- Nunca dimensionar ou aprovar automaticamente uma instalação a partir de uma fotografia.

## Ajuda prática

- Manter um ícone `?` junto de siglas, medidas e escolhas técnicas.
- Explicar o que é, quando se usa e qual informação precisa ser confirmada em campo.
- Usar a sequência: planta → cômodo → pontos → circuitos → condutores → materiais.
