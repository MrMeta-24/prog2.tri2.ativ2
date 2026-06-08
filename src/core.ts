import { Database } from "bun:sqlite";

const db = new Database("database.sqlite");

db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  );
`);

const itemInsert = db.query("INSERT INTO items(title) VALUES(?)");
const itemSelectAll = db.query("SELECT * FROM items");
const itemSelectOne = db.query("SELECT * FROM items WHERE id = ? LIMIT 1");
const itemUpdateTitle = db.query("UPDATE items SET title = ? WHERE id = ?");
const itemRemove = db.query("DELETE FROM items WHERE id = ?");

type ModelTitle = {
    id: number;
    title: string;
};

class Item {
    private static cache: Map<number, Item> = new Map();
    private _title!: string;
    private _id!: number;

    private constructor() {}

    static create(title: string): Item {
        const instance = new Item();
        instance._title = title;
        const resp = itemInsert.run(title);
        instance._id = resp.lastInsertRowid as number; 
         
        Item.cache.set(instance._id, instance);
        return instance;
    }

    static load(id: number): Item {
        if (Item.cache.has(id)) {
            return Item.cache.get(id)!;
        }
        const resp = itemSelectOne.get(id) as ModelTitle;
        if (!resp) {
            throw `Impossível carregar o Item de id ${id} do banco de dados`;
        }
        const instance = new Item();
        instance._title = resp.title;
        instance._id = resp.id;
        Item.cache.set(id, instance);
        return instance;
    }
    
    static loadAll(): Item[] {
        const rows = itemSelectAll.all() as ModelTitle[];
        
        return rows.map(row => {
            if (Item.cache.has(row.id)) {
                return Item.cache.get(row.id)!;
            }
            
            const instance = new Item();
            instance._title = row.title;
            instance._id = row.id;
            Item.cache.set(row.id, instance);
            return instance;
        });
    }

    remove() {
        itemRemove.run(this._id); 
        Item.cache.delete(this._id);
    }

    get id() {
        return this._id;
    }

    set title(newTitle: string) {
        itemUpdateTitle.run(newTitle, this._id);
        this._title = newTitle;
    }

    get title() {
        return this._title;
    }
}

class TodoList {
    private items: Item[] = [];

    constructor() {
        this.items = Item.loadAll();
    }

    add(title: string): Item {
        const newItem = Item.create(title);
        this.items.push(newItem);
        return newItem;
    }

    removeItem(item: Item): void {
        item.remove();
        this.items = this.items.filter(i => i.id !== item.id);
    }

    getAll(): Item[] {
        return this.items;
    }

    reload(): void {
        this.items = Item.loadAll();
    }
}

// TESTES 

const minhaLista = new TodoList();

// CREATE
console.log("--- Criando tarefas ---");
const tarefa1 = minhaLista.add("Estudar Bun.js");
const tarefa2 = minhaLista.add("Aprender SQLite");

console.log("Itens na lista atualmente:");
minhaLista.getAll().forEach(i => console.log(`- [ID: ${i.id}] ${i.title}`));

// GET
console.log("\n--- Validando o Cache ---");
const todosOsItens = Item.loadAll();
const itemDoBanco = todosOsItens.find(i => i.id === tarefa1.id);

console.log("O item vindo do loadAll é idêntico à instância criada na memória?");
console.log(itemDoBanco === tarefa1);

// UPDATE
console.log("\n--- Atualizando tarefa ---");
tarefa2.title = "Aprender SQLite Avançado";
console.log(`Nova descrição da tarefa 2: ${tarefa2.title}`);

// REMOVE
console.log(`\n--- Removendo a tarefa: "${tarefa1.title}" ---`);
minhaLista.removeItem(tarefa1);

console.log("Lista final após a remoção:");
minhaLista.getAll().forEach(i => console.log(`- [ID: ${i.id}] ${i.title}`));