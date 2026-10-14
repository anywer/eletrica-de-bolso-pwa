# Revisão defensiva — v0.9

- Os dados locais continuam separados por usuário autenticado.
- A sincronização usa o caminho `users/{uid}/app/state` e as regras exigem UID correspondente e e-mail verificado.
- Conteúdo digitado exibido em HTML dinâmico passa pela função de escape existente.
- A migração cria uma cópia local antes de alterar o formato antigo.
- Nenhum segredo administrativo, chave privada ou nova dependência foi incluído.

Limite da revisão: foram usados testes locais e leitura de configuração; nenhum teste ativo foi executado contra contas ou dados reais de produção.

