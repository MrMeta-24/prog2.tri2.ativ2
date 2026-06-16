import DatabaseManager from '../src/core/DatabaseManager'
import { describe, it, expect, test } from 'bun:test'

describe('DataManager', () => {
    it('deveria inserir/buscarUm/deletar um novo item', () => {
        const random = crypto.randomUUID()
        const insertedId = DatabaseManager.Item.insert({ title: random })
        const selectResult = DatabaseManager.Item.one(insertedId)
        const deleteResult = DatabaseManager.Item.delete(insertedId)
        expect(selectResult?.title).toBe(random)
        expect(selectResult).toEqual({ id: insertedId, title: random })
        expect(deleteResult).toBe(1)
    })

    test.todo('deve inserir/ataulizar e deletar um item', () => {})
    test.todo('deve inserir varios/buscar inseridos e exclui-los', () => {})
})