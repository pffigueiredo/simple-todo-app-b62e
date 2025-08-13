import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTodo = async (input: DeleteTodoInput): Promise<{ success: boolean }> => {
  try {
    // Delete the todo by ID
    const result = await db.delete(todosTable)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Check if any rows were actually deleted
    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return { success: true };
  } catch (error) {
    console.error('Todo deletion failed:', error);
    throw error;
  }
};