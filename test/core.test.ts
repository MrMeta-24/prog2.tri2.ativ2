import { expect, test } from "bun:test";
import { Database } from "bun:sqlite";
import { Item } from "../src/core";

const db = new Database("database.sqlite");
const itemSelectOne = db.query("SELECT * FROM items WHERE title = ? LIMIT 1");

test('teste de inserção', async () => {
    const radom = `teste ${Math.random()}`
    const item = await Item.create(radom)
    const valorDoBaco = itemSelectOne.get(radom)
    expect(valorDoBaco).not.toBeNull()
})

test('asdkufshjadkljfhasdljkhfgasdjkl', () => {
    expect([]).toBeArray()
})