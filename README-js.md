# scrips.js — Documentação do código

Este documento explica, parte por parte, o que o `scrips.js` faz. É o único arquivo com lógica da aplicação — tudo em JavaScript puro (Vanilla JS), sem frameworks nem bibliotecas externas.

## Visão geral

O script controla um app de controle de gastos: permite adicionar entradas/despesas, editar, excluir, calcular o resumo (total de entradas, despesas e saldo) e alternar entre modo claro/escuro. Os dados vivem só em memória, no array `items` — não há `localStorage` nem backend, então tudo se perde ao recarregar a página.

## 1. Seleção de elementos (linhas 1–21)

```js
const btnAddIncomes = document.querySelector('.btn-add-incomes');
...
let items = [];
let currentType = null; // 'income' ou 'expense'
```

No início, o script guarda em constantes as referências aos elementos do HTML que serão manipulados depois (botões, campos do formulário, cards de resumo etc.). Fazer isso uma vez só, no topo, evita repetir `document.querySelector` toda hora e deixa o código mais rápido e legível.

Duas variáveis de estado global controlam a aplicação:

| Variável | Para que serve |
|---|---|
| `items` | Array com todos os lançamentos (entradas e despesas) cadastrados. |
| `currentType` | Guarda se o formulário aberto no momento é para `'income'` (entrada) ou `'expense'` (despesa). |

## 2. Abrir o formulário (linhas 23–39)

Dois `addEventListener('click', ...)` — um no botão "Adicionar Entradas" e outro em "Adicionar Despesas" — fazem o mesmo tipo de coisa:

1. Mostram a seção do formulário (`formSection.classList.add('visible')`).
2. Exibem o grupo de categoria certo (entradas ou despesas) e escondem o outro.
3. Escondem o campo de "outra categoria".
4. Guardam em `currentType` qual tipo de lançamento está sendo criado.

Isso é o que faz o mesmo formulário servir tanto para entradas quanto para despesas, sem duplicar HTML.

## 3. Campo "Outra categoria" (linhas 41–57)

```js
incomeCategory.addEventListener('change', function() {
    if (this.value === 'outro') { ... }
});
```

Os dois `<select>` de categoria (entrada e despesa) têm uma opção `"outro"`. Quando o usuário escolhe essa opção, um listener de `change` mostra um campo de texto extra (`otherCategoryGroup`) para digitar a categoria personalizada. Se escolher qualquer outra opção, o campo some.

## 4. Fechar o formulário (linhas 59–63)

O botão "X" (`btnCloseForm`) simplesmente esconde o formulário (`classList.remove('visible')`) e zera `currentType`, sem salvar nada.

## 5. `addItem()` — Adicionar um novo lançamento (linhas 65–117)

Função executada ao clicar em "SALVAR". Passo a passo:

1. **Lê os campos**: nome (`itemName`) e valor (`amount`), removendo espaços em branco (`.trim()`).
2. **Valida**: se nome ou valor estiverem vazios, mostra um `alert()` e interrompe a função com `return`.
3. **Resolve a categoria**: pega o valor do `<select>` correspondente ao `currentType`. Se for `"outro"`, usa o texto digitado no campo extra (ou um valor padrão como `'Outros'`/`'Outro'` se o campo ficar vazio).
4. **Monta o objeto do item**:
   ```js
   const item = {
       id: Date.now(),       // identificador único, baseado no timestamp atual
       name: itemName,
       category: category,
       amount: parseFloat(amount), // converte texto para número decimal
       type: currentType     // 'income' ou 'expense'
   };
   ```
5. **Adiciona ao array**: `items.push(item)`.
6. **Limpa o formulário**: reseta os campos de texto, volta os `<select>` para a opção padrão e esconde o campo "outra categoria".
7. **Fecha o formulário** e zera `currentType`.
8. **Atualiza a tela**: chama `renderItems()` (redesenha a lista) e `updateSummary()` (recalcula os totais).

`Date.now()` é usado como `id` porque retorna um número de milissegundos sempre crescente — suficiente para garantir que dois itens não tenham o mesmo id nesse contexto simples.

## 6. `renderItems()` — Desenhar a lista de itens (linhas 119–160)

Essa função é chamada sempre que a lista precisa ser atualizada na tela (depois de adicionar, editar ou excluir um item). Ela funciona de forma "destrutiva": apaga tudo e redesenha do zero a partir do array `items`.

1. Remove todos os elementos `.item` que já estão no HTML (`staticItems.forEach(item => item.remove())`).
2. Para cada item em `items`, cria uma `<div class="item">` com:
   - o nome do lançamento;
   - uma "tag" com a categoria (cor diferente para entrada/despesa via `tag-income`/`tag-expense`);
   - o valor formatado em reais, trocando o ponto decimal por vírgula (`toFixed(2).replace('.', ',')`);
   - dois botões de ação: editar e excluir.
3. Liga os eventos de clique dos botões **depois** de criar o HTML com `innerHTML`, porque atributos como `onclick="..."` dentro de uma template string não teriam acesso direto às variáveis do escopo (`item`, `items`, etc.):
   - **Excluir**: filtra o item fora do array `items` (por `id`) e chama `renderItems()` + `updateSummary()` de novo.
   - **Editar**: chama `editItem(item)`, passando o objeto completo do item clicado.

## 7. `editItem(item)` — Editar um lançamento existente (linhas 162–221)

Não existe um "modo de edição" separado — a função reaproveita o mesmo formulário de criação:

1. Mostra o formulário e preenche `itemName` e `amount` com os valores atuais do item.
2. Ativa o grupo de categoria certo (entrada ou despesa) e define `currentType`.
3. **Verifica se a categoria do item já existe nas opções do `<select>`** (percorre `option.value` com um `for...of`):
   - Se existir, seleciona essa opção normalmente.
   - Se não existir (ou seja, era uma categoria personalizada digitada em "outro"), seleciona a opção `"outro"` e preenche o campo de texto extra com o valor salvo.
4. **Remove o item original do array** (`items = items.filter(...)`) — a ideia é: "editar" = apagar o item antigo e deixar o usuário salvá-lo de novo (via `addItem()`, ao clicar em SALVAR) com os dados já pré-preenchidos no formulário.
5. Redesenha a lista e atualiza o resumo.

> **Observação:** como o item é removido do array antes mesmo de o usuário confirmar a edição, se o usuário fechar o formulário no meio da edição (botão X) sem clicar em SALVAR, o item é perdido. Esse é o comportamento atual do código — não foi alterado durante o redesign visual.

## 8. `updateSummary()` — Recalcular os totais (linhas 223–238)

Usa `filter` + `reduce` para somar os valores:

```js
const totalIncomes = items
    .filter(item => item.type === 'income')
    .reduce((sum, item) => sum + item.amount, 0);
```

- `totalIncomes`: soma de todos os itens do tipo `'income'`.
- `totalExpenses`: soma de todos os itens do tipo `'expense'`.
- `balance`: `totalIncomes - totalExpenses`.

Os três valores são então escritos no texto dos cards (`cardIncomes`, `cardExpenses`, `cardBalance`), sempre formatados como `R$ 0,00`.

## 9. Modo noturno (linhas 240–252)

```js
nightModeToggle.addEventListener('click', function() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');

    if (currentTheme === 'dark') {
        html.removeAttribute('data-theme');
        nightModeIcon.textContent = 'brightness_4';
    } else {
        html.setAttribute('data-theme', 'dark');
        nightModeIcon.textContent = 'light_mode';
    }
});
```

Ao clicar no botão de modo noturno:

- Se o tema atual é `'dark'`, remove o atributo `data-theme` do `<html>` (volta ao claro) e troca o ícone para `brightness_4` (lua/sol de "ativar noturno").
- Caso contrário, define `data-theme="dark"` no `<html>` e troca o ícone para `light_mode` (sol de "ativar claro").

Todo o restante da mudança visual (cores de fundo, texto, bordas) é feito via CSS, usando o seletor `[data-theme="dark"]` em `variables.css` — o JS só liga/desliga esse atributo e troca o texto do ícone.

## Resumo do fluxo de dados

```
Clique em "Adicionar Entradas/Despesas"
        │
        ▼
  Formulário aparece (currentType definido)
        │
        ▼
  Usuário preenche e clica em SALVAR → addItem()
        │
        ├─► items.push(novoItem)
        │
        ▼
  renderItems()  ──► redesenha a lista na tela
  updateSummary() ──► recalcula ENTRADAS / SALDO / DESPESAS
```

Editar e excluir seguem o mesmo padrão: qualquer alteração no array `items` é sempre seguida de `renderItems()` + `updateSummary()`, para manter a interface sincronizada com os dados.
