
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { getTodos } from '../handlers/get_todos';

describe('getTodos', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no todos exist', async () => {
    const result = await getTodos();
    
    expect(result).toEqual([]);
  });

  it('should return all todos from database', async () => {
    // Create test todos
    await db.insert(todosTable)
      .values([
        {
          title: 'First Todo',
          description: 'First description',
          completed: false
        },
        {
          title: 'Second Todo',
          description: null,
          completed: true
        },
        {
          title: 'Third Todo',
          description: 'Third description',
          completed: false
        }
      ])
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify first todo
    expect(result[0].title).toEqual('First Todo');
    expect(result[0].description).toEqual('First description');
    expect(result[0].completed).toBe(false);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Verify second todo with null description
    expect(result[1].title).toEqual('Second Todo');
    expect(result[1].description).toBeNull();
    expect(result[1].completed).toBe(true);
    expect(result[1].id).toBeDefined();

    // Verify third todo
    expect(result[2].title).toEqual('Third Todo');
    expect(result[2].description).toEqual('Third description');
    expect(result[2].completed).toBe(false);
    expect(result[2].id).toBeDefined();
  });

  it('should return todos ordered by id', async () => {
    // Create todos in specific order
    const insertedTodos = await db.insert(todosTable)
      .values([
        { title: 'Todo A', description: 'A description', completed: false },
        { title: 'Todo B', description: 'B description', completed: true },
        { title: 'Todo C', description: 'C description', completed: false }
      ])
      .returning()
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(3);
    
    // Verify they are returned in insertion order (by id)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
    expect(result[0].title).toEqual('Todo A');
    expect(result[1].title).toEqual('Todo B');
    expect(result[2].title).toEqual('Todo C');
  });

  it('should handle todos with all field variations', async () => {
    // Create todo with minimal fields
    await db.insert(todosTable)
      .values({
        title: 'Minimal Todo',
        description: null,
        completed: false
      })
      .execute();

    const result = await getTodos();

    expect(result).toHaveLength(1);
    expect(result[0].title).toEqual('Minimal Todo');
    expect(result[0].description).toBeNull();
    expect(result[0].completed).toBe(false);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
  });
});
