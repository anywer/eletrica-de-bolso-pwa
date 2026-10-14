# Elétrica de Bolso

Organiza a planta arquitetônica e o projeto elétrico preliminar de um imóvel, mantendo separados o desenho dos ambientes, os pontos elétricos e os condutores necessários.

## Language

**Planta arquitetônica**:
Representação dos cômodos, dimensões, posições, rotações e aberturas do imóvel, ainda sem elementos elétricos.
_Avoid_: Planta elétrica, croqui elétrico

**Planta elétrica**:
Planta arquitetônica validada que recebeu pontos, comandos, circuitos e trajetos elétricos.
_Avoid_: Planta da casa

**Cômodo**:
Ambiente individual da planta que pode ser selecionado e editado isoladamente no celular.
_Avoid_: Área, bloco

**Ponto elétrico**:
Posição no cômodo que contém uma ou mais funções elétricas, uma altura e seus dados nominais.
_Avoid_: Tomada, quando o ponto também puder combinar interruptor e tomada

**Módulo**:
Função física instalada em uma caixa, como uma tomada ou um interruptor. Um ponto pode conter um ou mais módulos.
_Avoid_: Via

**Composição do ponto**:
Conjunto de módulos no mesmo ponto, como tomada dupla ou interruptor com tomada.
_Avoid_: Número de vias

**Altura do ponto**:
Posição vertical do ponto em relação ao piso acabado, registrada por categoria e, quando conhecida, por medida.
_Avoid_: Nível

**Trecho**:
Percurso medido entre elementos da instalação pelo qual passam um ou mais condutores.
_Avoid_: Fio, cabo

**Condutor do trecho**:
Via elétrica com função definida, como fase, neutro, proteção, retorno ou viajante.
_Avoid_: Módulo, tomada

**Tensão nominal**:
Tensão informada para o ponto ou circuito, normalmente 127 V ou 220 V, sujeita à confirmação da instalação.
_Avoid_: 110 V como valor técnico nominal

**Corrente nominal da tomada**:
Capacidade nominal do módulo de tomada, como 10 A ou 20 A; não substitui o dimensionamento do circuito.
_Avoid_: Potência da tomada

**Referência de planta**:
PDF, imagem ou fotografia usada como fundo para montar a planta arquitetônica editável.
_Avoid_: Planta importada, enquanto ainda não tiver sido convertida e validada
