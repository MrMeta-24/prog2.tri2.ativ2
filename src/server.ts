import { Item, TodoList } from "./core.ts.old";

const lista = new TodoList

Bun.serve({
  port: 3000,

  routes:{

    //rota para o html
    "/": Bun.file('./public/index.html'),

    //rota get para listar items
    "/api/items":{
      GET: () =>{
        const body = lista.getItems();
        return Response.json(items);
      },
    },

    //rota post add item
    "/api/items":{
      POST: async(req) =>{
        const body = await req.json();

        if(!body.title) {
          return new Response("Colocar titulo é obrigatorio",{status: 400});
        }

        lista.addItems(new Item(body.title));

        return Response.json({ messege: "item adicionado"});
      },
    },

    //rota put atualizar item
    "/api/items/:id":{
      PUT: async (req,params) =>{
        const id = Number(params.id);
        const body = await req.json();

        lista.updateItems(id, body.title);

        return Response.json({ messege:"Item atualizado"});
      },
    },

    //rota delete remover item
    "/api/items/:id":{
      DELETE: (_rec, params) =>{
        const id = Number(params.id);

        lista.deleteItems(id)

        return Response.json({ messege:"Item Removido"});
      },
    },

  },
  
  fetch() {
    return new Response("Página não encontrada", { status: 404, })
  }
});

console.log("Servidor rodando em http://localhost:3000");