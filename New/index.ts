import Item from "./src/core/Item";


const originalRef = new Item({ title: 'Hello, world!' }).store()

const list = Item.allFromDb().map(item => item.toJSON())
const item = Item.fromDb(1)

console.log(list)
console.log(item === originalRef)
console.log(item === list[0])