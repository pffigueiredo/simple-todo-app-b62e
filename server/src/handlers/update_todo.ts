import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type Todo } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTodo = async (input: UpdateTodoInput): Promise<Todo> => {
  try {
    // Build update object with only the fields that were provided
    const updateData: Partial<typeof todosTable.$inferInsert> = {
      updated_at: new Date() // Always update the timestamp
    };

    // Only include fields that are defined in the input
    if (input.title !== undefined) {
      updateData.title = input.title;
    }
    
    if (input.description !== undefined) {
      updateData.description = input.description;
    }
    
    if (input.completed !== undefined) {
      updateData.completed = input.completed;
    }

    // Update the todo item
    const result = await db.update(todosTable)
      .set(updateData)
      .where(eq(todosTable.id, input.id))
      .returning()
      .execute();

    // Check if the todo was found and updated
    if (result.length === 0) {
      throw new Error(`Todo with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Todo update failed:', error);
    throw error;
  }
};