# Elétrica de Bolso PWA — versão 0.8

Aplicativo offline-first, com autenticação e sincronização no Firebase, para organizar clientes, imóveis/obras, projetos elétricos, plantas simplificadas, dimensionamentos preliminares e histórico de manutenção.

## Como usar

1. Sirva esta pasta por HTTP local. Exemplos: extensão Live Server, hospedagem estática gratuita, ou `python -m http.server 8080`.
2. Abra `http://localhost:8080` no navegador. Abrir `index.html` diretamente permite usar boa parte do app, mas a instalação e o cache offline dependem de HTTP/HTTPS.
3. Crie uma conta, confirme o e-mail e entre.
4. Cadastre um cliente, um imóvel e um projeto na seção **Clientes**.
5. Use **Planta** para criar cômodos, posicionar pontos e ligar dois pontos com um trecho de comprimento informado.
6. Use **Dimensionamento** para registrar premissas e circuitos. Os valores são memória preliminar, não aprovação normativa.
7. Em **Backup**, exporte periodicamente o arquivo JSON e guarde-o em local seguro.

## Dados e migração

- Dados ficam no aparelho para uso offline e são sincronizados no documento `users/{uid}/app/state` do Firestore.
- Cada usuário autenticado possui uma chave local própria; a base da v0.7 é vinculada à primeira conta confirmada que entrar no aparelho.
- A v0.7 tenta importar automaticamente dados das chaves legadas `eletricaDeBolso`, `eletrica-de-bolso`, `eletricaBolsoData` e `edbData`.
- Antes de uma migração, importação substitutiva ou limpeza, o app guarda uma cópia local de recuperação.
- Registros são ligados por identificadores de cliente, imóvel e projeto para impedir mistura na interface.

## Firebase

- Ative **Authentication > E-mail/senha** e adicione `anywer.github.io` aos domínios autorizados.
- Crie o Firestore em modo Produção e publique `firestore.rules`.
- As regras exigem usuário autenticado, UID correspondente e e-mail confirmado.
- O plano Spark oferece franquia gratuita; acompanhe o consumo no console do Firebase.

## Limites técnicos e de segurança

O aplicativo não declara conformidade ou aprovação normativa. Todo dimensionamento deve ser revisado por profissional habilitado, com levantamento em campo e validação da NBR 5410 vigente, padrão da distribuidora, esquema de aterramento, seccionamento, DR, DPS, sobrecorrente, curto-circuito, queda de tensão, influências externas e capacidade de condução. A ligação entre neutro e proteção não deve ser feita por regra geral: depende do esquema adotado e do ponto definido pelo projeto/concessionária; depois do DR, uma ligação indevida pode gerar risco e funcionamento incorreto.

## Estrutura

- `index.html`: interface.
- `styles.css`: layout responsivo.
- `app.js`: dados, editor e fluxos.
- `firebase-sync.js`: autenticação, separação por usuário e sincronização.
- `firestore.rules`, `firebase.json`: regras de segurança e configuração do Firestore.
- `manifest.webmanifest`, `icon.svg`, `sw.js`: instalação e funcionamento offline.
- `tests/site-check.cjs`: verificações automatizadas básicas.

