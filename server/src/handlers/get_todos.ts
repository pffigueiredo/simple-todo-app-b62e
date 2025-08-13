import { db } from '../db';
import { todosTable } from '../db/schema';
import { type Todo } from '../schema';

export const getTodos = async (): Promise<Todo[]> => {
  try {
    // Fetch all todos from the database
    const todos = await db.select()
      .from(todosTable)
      .execute();

    // Return todos (no numeric conversions needed for this schema)
    return todos;
  } catch (error) {
    console.error('Failed to fetch todos:', error);
    throw error;
  }
};