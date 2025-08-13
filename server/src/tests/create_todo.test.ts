import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { todosTable } from '../db/schema';
import { type CreateTodoInput } from '../schema';
import { createTodo } from '../handlers/create_todo';
import { eq } from 'drizzle-orm';

// Test inputs
const basicTodoInput: CreateTodoInput = {
  title: 'Test Todo',
  description: 'A todo for testing'
};

const todoWithNullDescription: CreateTodoInput = {
  title: 'Todo without description',
  description: null
};

const minimalTodoInput: CreateTodoInput = {
  title: 'Minimal Todo',
  description: null
};

describe('createTodo', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a todo with description', async () => {
    const result = await createTodo(basicTodoInput);

    // Basic field validation
    expect(result.title).toEqual('Test Todo');
    expect(result.description).toEqual('A todo for testing');
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.id).toBeGreaterThan(0);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a todo with null description', async () => {
    const result = await createTodo(todoWithNullDescription);

    expect(result.title).toEqual('Todo without description');
    expect(result.description).toBeNull();
    expect(result.completed).toEqual(false);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save todo to database', async () => {
    const result = await createTodo(basicTodoInput);

    // Query using proper drizzle syntax
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos).toHaveLength(1);
    const savedTodo = todos[0];
    
    expect(savedTodo.title).toEqual('Test Todo');
    expect(savedTodo.description).toEqual('A todo for testing');
    expect(savedTodo.completed).toEqual(false);
    expect(savedTodo.created_at).toBeInstanceOf(Date);
    expect(savedTodo.updated_at).toBeInstanceOf(Date);
    expect(savedTodo.id).toEqual(result.id);
  });

  it('should set completed to false by default', async () => {
    const result = await createTodo(minimalTodoInput);

    expect(result.completed).toEqual(false);
    
    // Verify in database
    const todos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(todos[0].completed).toEqual(false);
  });

  it('should set timestamps automatically', async () => {
    const beforeCreation = new Date();
    const result = await createTodo(basicTodoInput);
    const afterCreation = new Date();

    // Check that timestamps are within reasonable range
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle multiple todos creation', async () => {
    const todo1 = await createTodo({ title: 'First Todo', description: 'First description' });
    const todo2 = await createTodo({ title: 'Second Todo', description: null });

    // Should have different IDs
    expect(todo1.id).not.toEqual(todo2.id);
    
    // Both should exist in database
    const allTodos = await db.select().from(todosTable).execute();
    expect(allTodos).toHaveLength(2);
    
    const titles = allTodos.map(todo => todo.title);
    expect(titles).toContain('First Todo');
    expect(titles).toContain('Second Todo');
  });

  it('should preserve title content correctly', async () => {
    const specialTitleInput: CreateTodoInput = {
      title: 'Special chars: !@#$%^&*() and unicode: 🚀 📝 ✅',
      description: 'Testing special characters and emojis'
    };

    const result = await createTodo(specialTitleInput);

    expect(result.title).toEqual('Special chars: !@#$%^&*() and unicode: 🚀 📝 ✅');
    expect(result.description).toEqual('Testing special characters and emojis');
    
    // Verify persistence
    const savedTodos = await db.select()
      .from(todosTable)
      .where(eq(todosTable.id, result.id))
      .execute();

    expect(savedTodos[0].title).toEqual('Special chars: !@#$%^&*() and unicode: 🚀 📝 ✅');
  });
});