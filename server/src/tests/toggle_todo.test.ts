
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type ToggleTodoInput } from '../schema';
import { toggleTodo } from '../handlers/toggle_todo';
import { eq } from 'drizzle-orm';

describe('toggleTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should toggle todo from incomplete to complete', async () => {
    // Create a test todo that is incomplete
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing',
        completed: false
      })
      .returning()
      .execute();

    const testInput: ToggleTodoInput = {
      id: createResult[0].id
    };

    const result = await toggleTodo(testInput);

    // Verify the todo was toggled to complete
    expect(result.id).toEqual(createResult[0].id);
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toBe(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createResult[0].updated_at).toBe(true);
  });

  it('should toggle todo from complete to incomplete', async () => {
    // Create a test todo that is complete
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'Already done',
        completed: true
      })
      .returning()
      .execute();

    const testInput: ToggleTodoInput = {
      id: createResult[0].id
    };

    const result = await toggleTodo(testInput);

    // Verify the todo was toggled to incomplete
    expect(result.id).toEqual(createResult[0].id);
    expect(result.title).toEqual('Completed Todo');
    expect(result.description).toEqual('Already done');
    expect(result.completed).toBe(false);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > createResult[0].updated_at).toBe(true);
  });

  it('should save toggled state to database', async () => {
    // Create a test todo
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Database Test Todo',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const testInput: ToggleTodoInput = {
      id: createResult[0].id
    };

    await toggleTodo(testInput);

    // Verify the change was persisted in the database
    const updatedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, createResult[0].id))
      .execute();

    expect(updatedTodos).toHaveLength(1);
    expect(updatedTodos[0].completed).toBe(true);
    expect(updatedTodos[0].updated_at > createResult[0].updated_at).toBe(true);
  });

  it('should throw error for non-existent todo', async () => {
    const testInput: ToggleTodoInput = {
      id: 99999 // Non-existent ID
    };

    await expect(toggleTodo(testInput)).rejects.toThrow(/not found/i);
  });

  it('should handle todo with null description', async () => {
    // Create a test todo with null description
    const createResult = await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: false
      })
      .returning()
      .execute();

    const testInput: ToggleTodoInput = {
      id: createResult[0].id
    };

    const result = await toggleTodo(testInput);

    expect(result.id).toEqual(createResult[0].id);
    expect(result.title).toEqual('Todo with null description');
    expect(result.description).toBeNull();
    expect(result.completed).toBe(true);
  });
});
