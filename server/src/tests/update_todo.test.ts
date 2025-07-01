
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test todo
  const createTestTodo = async (): Promise<number> => {
    const result = await db.insert(todosTable)
      .values({
        title: 'Original Todo',
        description: 'Original description',
        completed: false
      })
      .returning()
      .execute();
    
    return result[0].id;
  };

  it('should update todo title', async () => {
    const todoId = await createTestTodo();
    
    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated Title'
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(false);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update todo description', async () => {
    const todoId = await createTestTodo();
    
    const input: UpdateTodoInput = {
      id: todoId,
      description: 'Updated description'
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Original Todo');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false);
  });

  it('should update todo completion status', async () => {
    const todoId = await createTestTodo();
    
    const input: UpdateTodoInput = {
      id: todoId,
      completed: true
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Original Todo');
    expect(result.description).toEqual('Original description');
    expect(result.completed).toEqual(true);
  });

  it('should update multiple fields at once', async () => {
    const todoId = await createTestTodo();
    
    const input: UpdateTodoInput = {
      id: todoId,
      title: 'New Title',
      description: 'New description',
      completed: true
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('New Title');
    expect(result.description).toEqual('New description');
    expect(result.completed).toEqual(true);
  });

  it('should set description to null', async () => {
    const todoId = await createTestTodo();
    
    const input: UpdateTodoInput = {
      id: todoId,
      description: null
    };

    const result = await updateTodo(input);

    expect(result.id).toEqual(todoId);
    expect(result.title).toEqual('Original Todo');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
  });

  it('should save updated todo to database', async () => {
    const todoId = await createTestTodo();
    
    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Database Test Title',
      completed: true
    };

    await updateTodo(input);

    // Verify the update was persisted to database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Database Test Title');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should update the updated_at timestamp', async () => {
    const todoId = await createTestTodo();
    
    // Get original timestamp
    const originalTodo = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, todoId))
      .execute();
    
    const originalUpdatedAt = originalTodo[0].updated_at;

    // Wait a bit to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const input: UpdateTodoInput = {
      id: todoId,
      title: 'Updated for timestamp test'
    };

    const result = await updateTodo(input);

    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
  });

  it('should throw error for non-existent todo', async () => {
    const input: UpdateTodoInput = {
      id: 99999,
      title: 'Non-existent todo'
    };

    expect(updateTodo(input)).rejects.toThrow(/todo with id 99999 not found/i);
  });
});
