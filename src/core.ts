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
    id: number
    title: string
}

class Item {
    private static cache: Map<number, Item> = new Map()
    private _title!: string
    private _id!: number

    private constructor() {}

    static create(title: string) {
        const instace = new Item()
        instace._title = title
        const resp = itemInsert.run(title)
        instace._id = resp.lastInsertRowid as number
        return instace
    }

    static load(id: number) {
        if (Item.cache.has(id))
            return Item.cache.get(id)
        const resp = itemSelectOne.get(id) as ModelTitle
        if (!resp)
            throw `Impossível carregar o Item de id ${id} do banco de dados`
        const instace = new Item()
        instace._title = resp.title
        instace._id = resp.id
        Item.cache.set(id, instace)
        return instace
    }
    
    //resolver o problema do loadall,com um todolist
    static loadAll() {

    }
    // fazer uma lista para remove,com um todolist
    remove() {
        itemRemove.run(this._id) // removbe do banco de dados
    }

    set title(newTitle: string) {
        const resp = itemUpdateTitle.run(newTitle, this._id)
        // console.log(resp)
        this._title = newTitle
    }


    get title() {
        return this._title
    }
}


// const x = Item.create("sdfkhgsadfjhgfsaj")
const y = Item.load(1)
const z = Item.load(1)


console.log(y === z)

// const x = Item.load(1)

// console.log(x === y)

