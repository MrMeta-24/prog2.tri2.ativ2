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

export class Item {
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

export class TodoList {
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
        
        Reflect.ownKeys(this).forEach(k => {
            // @ts-ignore
            delete this[k] 
        })

    }

    getAll(): Item[] {
        return this.items;
    }

    reload(): void {
        this.items = Item.loadAll();
    }
}

// // TESTES 

const lista = new TodoList();

// CREATE
console.log("\n=== CREATE ===");
const item1 = lista.add("Estudar Bun");
const item2 = lista.add("Aprender SQLite");

console.log("Criados:");
console.log(`[${item1.id}] ${item1.title}`);
console.log(`[${item2.id}] ${item2.title}`);

// GET ONE
console.log("\n=== GET ONE ===");
const carregado = Item.load(item1.id);
console.log(`[${carregado.id}] ${carregado.title}`);

// GET ALL
console.log("\n=== GET ALL ===");
Item.loadAll().forEach(item => {
    console.log(`[${item.id}] ${item.title}`);
});

// UPDATE
console.log("\n=== UPDATE ===");
item1.title = "Estudar Bun Avançado";

const atualizado = Item.load(item1.id);
console.log(`[${atualizado.id}] ${atualizado.title}`);

// DELETE
console.log("\n=== DELETE ===");
item1.remove();

console.log("Itens restantes:");
Item.loadAll().forEach(item => {
    console.log(`[${item.id}] ${item.title}`);
});

console.log("\n=== VALIDANDO DELETE ===");
try {
    Item.load(item1.id);
} catch (err) {
    console.log("Item removido com sucesso.");
    console.log(err);
}