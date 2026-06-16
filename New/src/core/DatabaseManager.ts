import { Database } from 'bun:sqlite'

const db = new Database('database.sqlite', { strict: true })

db.run(`
  CREATE TABLE IF NOT EXISTS items (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL
  )
`)

export type ItemProps = { title: string }
export type ItemPropsWithId = ItemProps & { id: number }

class Item {
  public static all = () => db
    .query('SELECT * FROM items')
    .all() as ItemPropsWithId[]

  public static one = (id: number) => db
    .query('SELECT * FROM items WHERE id = $id LIMIT 1')
    .get({ id }) as ItemPropsWithId | null

  public static insert = (props: ItemProps) => db
    .query('INSERT INTO items (title) VALUES ($title)')
    .run({ title: props.title })
    .lastInsertRowid as number

  public static update = (id: number, props: ItemProps) => db
    .query('UPDATE items SET title = $title WHERE id = $id LIMIT 1')
    .run({ id, title: props.title })
    .changes

  public static delete = (id: number) => db
    .query('DELETE FROM items WHERE id = $id LIMIT 1')
    .run({ id }).changes
}

export default { Item }