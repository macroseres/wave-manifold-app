# Controle de versões

O Git conserva o código e os comentários salvos em commits. O
[CHANGELOG.md](CHANGELOG.md) descreve as mudanças para quem usa o app.
As tags identificam exatamente o commit de cada versão entregue.

## Situação inicial

Em 29/09/2026, o histórico local contém 20 commits e nenhuma tag.
A identificação `0.1.0-dev` inicia o controle explícito durante o desenvolvimento.
A primeira versão numerada será `0.1.0`, depois da validação e do registro abaixo.
Não atribuímos números de lançamento aos commits antigos, pois não há evidência
de que tenham sido publicados como versões.

## Numeração

- `0.1.0` → `0.1.1`: correções sem mudança incompatível no comportamento esperado.
- `0.1.0` → `0.2.0`: novas funcionalidades ou mudanças incompatíveis durante a fase inicial.
- `1.0.0`: primeira versão considerada estável pelo responsável pelo projeto.
- Após `1.0.0`, mudanças incompatíveis aumentam o primeiro número; funcionalidades
  compatíveis aumentam o segundo; correções aumentam o terceiro.

## Durante o desenvolvimento

1. Faça commits pequenos com mensagens que expliquem a mudança.
2. Acrescente uma descrição na seção de desenvolvimento do changelog.
3. Preserve as seções das versões anteriores; comentários no código devem explicar
   o algoritmo, enquanto o histórico de versões fica no changelog e no Git.

## Registrar uma versão

Execute a partir da raiz do projeto. Exemplo para a primeira versão:

1. Execute `npm test`, `npm run lint` e `npm run build`. Resolva falhas antes de lançar.
2. Execute `npm version 0.1.0 --no-git-tag-version`. Isso sincroniza a versão do
   `package.json` e do `package-lock.json` sem criar um commit automaticamente.
3. No changelog, transforme a seção de desenvolvimento em `## 0.1.0 — AAAA-MM-DD`,
   usando a data real da entrega, e crie uma nova seção `## Em desenvolvimento` acima.
4. Confira `git diff` e `git status`, registre os arquivos da entrega com `git add`
   e faça `git commit -m "Release 0.1.0"`.
5. Marque o commit com `git tag -a v0.1.0 -m "Wave Manifold App 0.1.0"`.
6. Se a entrega deve ir ao remoto configurado, publique a branch com `git push`
   e a tag com `git push origin v0.1.0`.

Nas próximas entregas, substitua `0.1.0` pelo número escolhido. Crie a tag
somente no commit que contém todos os arquivos da entrega. Preserve tags publicadas.

## Consultar ou recuperar conteúdo antigo

```powershell
git log --oneline
git tag --list
git show eaef0c3
git log -p -- caminho/do/arquivo
git show '17a4e5c^:docs/book/Volume_I/README.md'
```

O último comando consulta um arquivo antes da remoção. Para restaurar um arquivo
que já foi salvo no Git, primeiro confira o conteúdo e as alterações locais;
depois use `git restore --source=<commit> -- caminho/do/arquivo`. Esse comando
substitui o arquivo de trabalho, portanto preserve alterações locais necessárias.

Comentários apagados antes de terem sido registrados em um commit não podem ser
recuperados pelo histórico normal do Git. Backups e o histórico local do editor
podem conter cópias adicionais.
