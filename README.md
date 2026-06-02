# prog2.tri2.ativ1


# Estrutura do código

## Importação do SQLite

```ts
import { Database } from "bun:sqlite";
```

Aqui estamos importando o módulo SQLite nativo do Bun.

---

## Criando conexão com o banco

```ts
const db = new Database("database.sqlite");
```

Cria (ou abre) um banco SQLite chamado:

```bash
database.sqlite
```

---

## Teste de conexão

```ts
const query = db.query("select 'Hello world' as message;");
query.get();
```

Executa uma query simples apenas para testar se o banco está funcionando.

---

# Criando a tabela

```ts
db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  );
`);
```

Essa query cria a tabela `items` caso ela ainda não exista.

---

# Queries preparadas

## Inserir item

```ts
const itemInsert = db.query("INSERT INTO items(title) VALUES(?)");
```

---

## Buscar todos os itens

```ts
const itemSelectAll = db.query("SELECT * FROM items");
```

---

## Atualizar item

```ts
const itemUpdate = db.query("UPDATE items SET title = ? WHERE id = ?");
```

---

## Remover item

```ts
const itemRemove = db.query("DELETE FROM items WHERE id = ?");
```

---

# Classe Item

```ts
export class Item{
    constructor(public title : string){}
}
```

Representa um item da lista.

## Exemplo

```ts
new Item("Estudar Bun.js")
```

---

# Classe TodoList

```ts
export class TodoList {
```

Responsável por gerenciar os itens.

---

# Adicionar itens

```ts
addItems(item: Item) {
    this.items.push(item)
    itemInsert.run(item.title)
}
```

## O que acontece?

1. Adiciona o item no array local
2. Salva o item no banco SQLite

## Exemplo

```ts
minhaLista.addItems(new Item("Comprar café"));
```

---

# Listar itens

```ts
getItems(){
    return itemSelectAll.all()
}
```

Retorna todos os itens cadastrados no banco.

## Exemplo

```ts
console.log(minhaLista.getItems());
```

---

# Atualizar item

```ts
updateItems(index: number, newItem: string){
    if (index >= 0 && index < this.items.length) {
        this.items[index].title = newItem;
    }
    itemUpdate.run(newItem, index)
}
```

Atualiza o título de um item.

## Exemplo

```ts
minhaLista.updateItems(1, "Estudar Bun.js e SQLite");
```

---

# Remover item

```ts
deleteItems(index: number) {
    const removedItem = this.items[index];
    if (removedItem){
        this.items.splice(index,1);
    }
    itemRemove.run(index)
}
```

Remove um item da lista e do banco.

## Exemplo

```ts
minhaLista.deleteItems(2);
```

---

# Instância da lista

```ts
export const minhaLista = new TodoList();
```

Cria uma instância pronta para uso.

---

# ▶Como executar o projeto

## 1. Instalar o Bun

Caso ainda não tenha:

```bash
curl -fsSL https://bun.sh/install | bash
```

---

## 2. Criar o projeto

```bash
bun init
```

---

## 3. Salvar o código

Exemplo:

```bash
src/index.ts
```

---

## 4. Executar

```bash
bun run src/index.ts
```

---

# Exemplo completo de uso

```ts
import { minhaLista, Item } from "./index";

// Adicionar
minhaLista.addItems(new Item("Estudar Bun.js"));
minhaLista.addItems(new Item("Comprar café"));

// Listar
console.log("Itens criados:");
console.log(minhaLista.getItems());

// Atualizar
minhaLista.updateItems(1, "Estudar Bun.js e SQLite");

console.log("Após atualização:");
console.log(minhaLista.getItems());

// Deletar
minhaLista.deleteItems(2);

console.log("Após deleção:");
console.log(minhaLista.getItems());
```

---

# Resultado esperado

```bash
Itens criados:
[
  { id: 1, title: 'Estudar Bun.js' },
  { id: 2, title: 'Comprar café' }
]

Após atualização:
[
  { id: 1, title: 'Estudar Bun.js e SQLite' },
  { id: 2, title: 'Comprar café' }
]

Após deleção:
[
  { id: 1, title: 'Estudar Bun.js e SQLite' }
]
```

---