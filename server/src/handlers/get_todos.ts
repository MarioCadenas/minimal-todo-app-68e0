
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    const results = await db.select()
      .from(todosTable)
      .execute();

    // Convert the database results to match our schema
    return results.map(todo => ({
      ...todo,
      created_at: new Date(todo.created_at),
      updated_at: new Date(todo.updated_at)
    }));
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};
