import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type DeleteTodoInput } from '../schema';
import { deleteTodo } from '../handlers/delete_todo';
import { eq } from 'drizzle-orm';

// Test input for deleting a todo
const testDeleteInput: DeleteTodoInput = {
  id: 1
};

describe('deleteTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing todo', async () => {
    // Create a todo first
    await db.insert(todosTable)
      .values({
        title: 'Test Todo',
        description: 'A todo for testing deletion',
        completed: false
      })
      .execute();

    // Get the created todo to confirm it exists
    const todosBeforeDelete = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, 1))
      .execute();

    expect(todosBeforeDelete).toHaveLength(1);
    expect(todosBeforeDelete[0].title).toEqual('Test Todo');

    // Delete the todo
    const result = await deleteTodo(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify the todo is actually deleted from database
    const todosAfterDelete = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, 1))
      .execute();

    expect(todosAfterDelete).toHaveLength(0);
  });

  it('should throw error when todo does not exist', async () => {
    // Try to delete a non-existent todo
    const nonExistentInput: DeleteTodoInput = {
      id: 999
    };

    // Expect the deletion to throw an error
    await expect(deleteTodo(nonExistentInput)).rejects.toThrow(/not found/i);

    // Verify no todos were affected
    const allTodos = await db.select()
      .from(todosTable)
      .execute();

    expect(allTodos).toHaveLength(0);
  });

  it('should only delete the specified todo', async () => {
    // Create multiple todos
    await db.insert(todosTable)
      .values([
        {
          title: 'Todo 1',
          description: 'First todo',
          completed: false
        },
        {
          title: 'Todo 2', 
          description: 'Second todo',
          completed: true
        },
        {
          title: 'Todo 3',
          description: 'Third todo',
          completed: false
        }
      ])
      .execute();

    // Verify all todos exist
    const todosBeforeDelete = await db.select()
      .from(todosTable)
      .execute();

    expect(todosBeforeDelete).toHaveLength(3);

    // Delete the middle todo (id: 2)
    const deleteInput: DeleteTodoInput = {
      id: 2
    };

    const result = await deleteTodo(deleteInput);
    expect(result.success).toBe(true);

    // Verify only the specified todo was deleted
    const todosAfterDelete = await db.select()
      .from(todosTable)
      .execute();

    expect(todosAfterDelete).toHaveLength(2);

    // Verify the remaining todos are the correct ones
    const remainingTodos = todosAfterDelete.map(todo => ({ id: todo.id, title: todo.title }));
    expect(remainingTodos).toContainEqual({ id: 1, title: 'Todo 1' });
    expect(remainingTodos).toContainEqual({ id: 3, title: 'Todo 3' });
    expect(remainingTodos).not.toContainEqual({ id: 2, title: 'Todo 2' });
  });

  it('should handle deletion of completed todos', async () => {
    // Create a completed todo
    await db.insert(todosTable)
      .values({
        title: 'Completed Todo',
        description: 'This todo is already completed',
        completed: true
      })
      .execute();

    // Delete the completed todo
    const result = await deleteTodo(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify the completed todo is deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, 1))
      .execute();

    expect(todos).toHaveLength(0);
  });

  it('should handle deletion of todos with null description', async () => {
    // Create a todo with null description
    await db.insert(todosTable)
      .values({
        title: 'Todo with null description',
        description: null,
        completed: false
      })
      .execute();

    // Delete the todo
    const result = await deleteTodo(testDeleteInput);

    expect(result.success).toBe(true);

    // Verify the todo is deleted
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, 1))
      .execute();

    expect(todos).toHaveLength(0);
  });
});