# prog2.tri2.ativ1

# TodoList com Bun + SQLite

Um sistema simples de lista de tarefas (Todo List) implementado em TypeScript usando **Bun** como runtime e **SQLite** como banco de dados, com cache em memória para evitar consultas desnecessárias.

---
---

## Como Funciona — Passo a Passo

### 1. Conexão com o Banco de Dados

```ts
import { Database } from "bun:sqlite";

const db = new Database("database.sqlite");
```

O Bun possui um driver SQLite nativo (`bun:sqlite`), sem precisar instalar nenhuma dependência externa. Se o arquivo `database.sqlite` não existir, ele é criado automaticamente.

---

### 2. Criação da Tabela

```ts
db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  );
`);
```

Cria a tabela `items` caso ela ainda não exista. Cada item tem:
- `id` — chave primária gerada automaticamente pelo banco
- `title` — texto obrigatório com o nome da tarefa

---

### 3. Queries Preparadas

```ts
const itemInsert      = db.query("INSERT INTO items(title) VALUES(?)");
const itemSelectAll   = db.query("SELECT * FROM items");
const itemSelectOne   = db.query("SELECT * FROM items WHERE id = ? LIMIT 1");
const itemUpdateTitle = db.query("UPDATE items SET title = ? WHERE id = ?");
const itemRemove      = db.query("DELETE FROM items WHERE id = ?");
```

As queries são preparadas uma única vez no início do programa. Isso é mais eficiente do que montar strings SQL a cada operação, pois o banco já compila e valida a query antecipadamente. Os `?` são parâmetros que serão substituídos na hora da execução, protegendo contra SQL Injection.

---

### 4. Tipo auxiliar

```ts
type ModelTitle = {
  id: number;
  title: string;
};
```

Define a forma dos dados que vêm do banco de dados, usada para fazer o cast dos resultados das queries e garantir tipagem correta no TypeScript.

---

### 5. Classe `Item`

Representa uma tarefa individual. É o coração do sistema — toda leitura e escrita no banco passa por ela.

#### Cache em memória

```ts
private static cache: Map<number, Item> = new Map();
```

Um `Map` estático que guarda as instâncias já carregadas, indexadas pelo `id`. Quando um item é solicitado, o código verifica o cache primeiro antes de ir ao banco — evitando consultas repetidas.

#### Construtor privado

```ts
private constructor() {}
```

Impede que instâncias sejam criadas com `new Item()` de fora da classe. Toda criação passa pelos métodos estáticos abaixo, garantindo que o cache seja sempre mantido atualizado.

---

#### `Item.create(title)` — Inserir

```ts
static create(title: string): Item {
  const instance = new Item();
  instance._title = title;
  const resp = itemInsert.run(title);        // executa o INSERT no banco
  instance._id = resp.lastInsertRowid as number; // pega o ID gerado

  Item.cache.set(instance._id, instance);    // salva no cache
  return instance;
}
```

Cria um novo item no banco, captura o ID gerado automaticamente pelo SQLite (`lastInsertRowid`) e registra a instância no cache.

---

#### `Item.load(id)` — Buscar por ID

```ts
static load(id: number): Item {
  if (Item.cache.has(id)) {
    return Item.cache.get(id)!; // retorna do cache se já existir
  }
  const resp = itemSelectOne.get(id) as ModelTitle;
  if (!resp) {
    throw `Impossível carregar o Item de id ${id} do banco de dados`;
  }
  const instance = new Item();
  instance._title = resp.title;
  instance._id = resp.id;
  Item.cache.set(id, instance); // salva no cache para próximas consultas
  return instance;
}
```

Verifica o cache antes de ir ao banco. Se o item não existir nem no banco, lança um erro informativo. Caso encontre, popula o cache para evitar futuras consultas.

---

#### `Item.loadAll()` — Buscar todos

```ts
static loadAll(): Item[] {
  const rows = itemSelectAll.all() as ModelTitle[];

  return rows.map(row => {
    if (Item.cache.has(row.id)) {
      return Item.cache.get(row.id)!; // reutiliza instância do cache
    }
    const instance = new Item();
    instance._title = row.title;
    instance._id = row.id;
    Item.cache.set(row.id, instance);
    return instance;
  });
}
```

Carrega todos os registros do banco. Para cada linha, reutiliza a instância do cache se já existir, ou cria uma nova e a adiciona ao cache.

---

#### `item.remove()` — Remover

```ts
remove() {
  itemRemove.run(this._id);       // deleta do banco
  Item.cache.delete(this._id);   // remove do cache
}
```

Remove o item tanto do banco de dados quanto do cache em memória, garantindo consistência entre os dois.

---

#### `get/set title` — Ler e atualizar o título

```ts
set title(newTitle: string) {
  itemUpdateTitle.run(newTitle, this._id); // atualiza no banco
  this._title = newTitle;                  // atualiza na instância
}

get title() {
  return this._title;
}
```

O `setter` de `title` sincroniza a mudança tanto na instância em memória quanto no banco de dados. O `getter` retorna o valor já em memória, sem precisar ir ao banco.

---

### 6. Classe `TodoList`

Gerencia a coleção de itens e serve como interface de alto nível para o usuário do código.

```ts
export class TodoList {
  private items: Item[] = [];

  constructor() {
    this.items = Item.loadAll(); // carrega todos os itens ao iniciar
  }
  ...
}
```

Ao ser instanciada, já carrega todos os itens existentes no banco.

---

#### `add(title)` — Adicionar tarefa

```ts
add(title: string): Item {
  const newItem = Item.create(title); // cria no banco
  this.items.push(newItem);           // adiciona à lista local
  return newItem;
}
```

Cria o item no banco via `Item.create` e o adiciona ao array interno.

---

#### `removeItem(item)` — Remover tarefa

```ts
removeItem(item: Item): void {
  item.remove(); // remove do banco e do cache

  // deleta todas as propriedades do objeto TodoList
  Reflect.ownKeys(this).forEach(k => {
    // @ts-ignore
    delete this[k];
  });
}
```

Remove o item do banco e depois usa `Reflect.ownKeys` para apagar todas as propriedades da instância `TodoList`, efetivamente "invalidando" o objeto. Isso força o código que usar essa lista a chamar `reload()` antes de continuar.

---

#### `getAll()` e `reload()`

```ts
getAll(): Item[] {
  return this.items;
}

reload(): void {
  this.items = Item.loadAll(); // sincroniza com o banco
}
```

`getAll()` retorna os itens em memória. `reload()` vai ao banco buscar o estado mais recente — útil após operações externas que possam ter alterado os dados.

---

### 7. Testes no final do arquivo

O código inclui uma sequência de testes que demonstra o CRUD completo:

```
CREATE      → Adiciona "Estudar Bun" e "Aprender SQLite"
GET ONE     → Carrega um item pelo ID (vem do cache, sem nova query)
GET ALL     → Lista todos os itens do banco
UPDATE      → Atualiza o título de "Estudar Bun" para "Estudar Bun Avançado"
DELETE      → Remove o item1 do banco e do cache
VALIDAÇÃO   → Tenta carregar o item removido e confirma que lança erro
```

---

##  Como Executar

### Pré-requisitos

Instale o **Bun** (caso ainda não tenha):

```bash
curl -fsSL https://bun.sh/install | bash
```

Verifique a instalação:

```bash
bun --version
```

### Rodando o projeto

```bash
cd src
bun run core.ts
```

O arquivo `database.sqlite` será criado automaticamente na primeira execução.

### Saída esperada

```
=== CREATE ===
Criados:
[1] Estudar Bun
[2] Aprender SQLite

=== GET ONE ===
[1] Estudar Bun

=== GET ALL ===
[1] Estudar Bun
[2] Aprender SQLite

=== UPDATE ===
[1] Estudar Bun Avançado

=== DELETE ===
Itens restantes:
[2] Aprender SQLite

=== VALIDANDO DELETE ===
Item removido com sucesso.
Impossível carregar o Item de id 1 do banco de dados
```
---

