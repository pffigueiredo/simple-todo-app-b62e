import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type UpdateTodoInput, type CreateTodoInput } from '../schema';
import { updateTodo } from '../handlers/update_todo';
import { eq } from 'drizzle-orm';

// Helper function to create a test todo
const createTestTodo = async (input: CreateTodoInput) => {
  const result = await db.insert(todosTable)
    .values({
      title: input.title,
      description: input.description,
      completed: false
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update todo title', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title'
    };

    const result = await updateTodo(updateInput);

    // Verify the result
    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Original description'); // Should remain unchanged
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.created_at).toEqual(testTodo.created_at); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true); // Should be updated
  });

  it('should update todo description', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: 'Updated description'
    };

    const result = await updateTodo(updateInput);

    // Verify the result
    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Title'); // Should remain unchanged
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(false); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update todo completed status', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo({
      title: 'Test Title',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Verify the result
    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Title'); // Should remain unchanged
    expect(result.description).toEqual('Test description'); // Should remain unchanged
    expect(result.completed).toEqual(true);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should update multiple fields at once', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title',
      description: 'Updated description',
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Verify all fields were updated
    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Updated Title');
    expect(result.description).toEqual('Updated description');
    expect(result.completed).toEqual(true);
    expect(result.created_at).toEqual(testTodo.created_at); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });

  it('should set description to null when explicitly provided', async () => {
    // Create a test todo with description
    const testTodo = await createTestTodo({
      title: 'Test Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      description: null
    };

    const result = await updateTodo(updateInput);

    // Verify description was set to null
    expect(result.description).toBeNull();
    expect(result.title).toEqual('Test Title'); // Should remain unchanged
  });

  it('should persist changes in database', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id,
      title: 'Updated Title',
      completed: true
    };

    const result = await updateTodo(updateInput);

    // Query the database directly to verify persistence
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    expect(todos[0].title).toEqual('Updated Title');
    expect(todos[0].description).toEqual('Original description');
    expect(todos[0].completed).toEqual(true);
    expect(todos[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when todo does not exist', async () => {
    const updateInput: UpdateTodoInput = {
      id: 999, // Non-existent ID
      title: 'Updated Title'
    };

    await expect(updateTodo(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only timestamp when no other fields provided', async () => {
    // Create a test todo first
    const testTodo = await createTestTodo({
      title: 'Test Title',
      description: 'Test description'
    });

    const updateInput: UpdateTodoInput = {
      id: testTodo.id
      // No other fields provided
    };

    const result = await updateTodo(updateInput);

    // Verify only timestamp was updated
    expect(result.id).toEqual(testTodo.id);
    expect(result.title).toEqual('Test Title');
    expect(result.description).toEqual('Test description');
    expect(result.completed).toEqual(false);
    expect(result.created_at).toEqual(testTodo.created_at);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > testTodo.updated_at).toBe(true);
  });
});