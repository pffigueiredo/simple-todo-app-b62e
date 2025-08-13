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
    expect(result).toHaveLength(0);
  });

  it('should return all todos from database', async () => {
    // Create test todos directly in database
    const testTodos = [
      {
        title: 'First Todo',
        description: 'Description for first todo',
        completed: false
      },
      {
        title: 'Second Todo',
        description: 'Description for second todo',
        completed: true
      },
      {
        title: 'Third Todo',
        description: null, // Test null description
        completed: false
      }
    ];

    // Insert test todos
    await db.insert(todosTable)
      .values(testTodos)
      .execute();

    // Fetch todos using handler
    const result = await getTodos();

    // Verify results
    expect(result).toHaveLength(3);
    
    // Sort results by title for consistent testing
    const sortedResult = result.sort((a, b) => a.title.localeCompare(b.title));

    // Check first todo
    expect(sortedResult[0].title).toEqual('First Todo');
    expect(sortedResult[0].description).toEqual('Description for first todo');
    expect(sortedResult[0].completed).toEqual(false);
    expect(sortedResult[0].id).toBeDefined();
    expect(sortedResult[0].created_at).toBeInstanceOf(Date);
    expect(sortedResult[0].updated_at).toBeInstanceOf(Date);

    // Check second todo
    expect(sortedResult[1].title).toEqual('Second Todo');
    expect(sortedResult[1].description).toEqual('Description for second todo');
    expect(sortedResult[1].completed).toEqual(true);

    // Check third todo (null description)
    expect(sortedResult[2].title).toEqual('Third Todo');
    expect(sortedResult[2].description).toBeNull();
    expect(sortedResult[2].completed).toEqual(false);
  });

  it('should return todos with correct data types', async () => {
    // Create a test todo
    await db.insert(todosTable)
      .values({
        title: 'Type Test Todo',
        description: 'Testing data types',
        completed: true
      })
      .execute();

    const result = await getTodos();
    
    expect(result).toHaveLength(1);
    
    const todo = result[0];
    expect(typeof todo.id).toBe('number');
    expect(typeof todo.title).toBe('string');
    expect(typeof todo.description).toBe('string');
    expect(typeof todo.completed).toBe('boolean');
    expect(todo.created_at).toBeInstanceOf(Date);
    expect(todo.updated_at).toBeInstanceOf(Date);
  });

  it('should handle todos with mixed completion status', async () => {
    // Create mix of completed and incomplete todos
    const mixedTodos = [
      { title: 'Completed Todo 1', description: 'Done', completed: true },
      { title: 'Incomplete Todo 1', description: 'Not done', completed: false },
      { title: 'Completed Todo 2', description: 'Also done', completed: true },
      { title: 'Incomplete Todo 2', description: 'Still not done', completed: false }
    ];

    await db.insert(todosTable)
      .values(mixedTodos)
      .execute();

    const result = await getTodos();
    
    expect(result).toHaveLength(4);
    
    const completedTodos = result.filter(todo => todo.completed);
    const incompleteTodos = result.filter(todo => !todo.completed);
    
    expect(completedTodos).toHaveLength(2);
    expect(incompleteTodos).toHaveLength(2);
    
    // Verify all todos have required fields
    result.forEach(todo => {
      expect(todo.id).toBeDefined();
      expect(todo.title).toBeDefined();
      expect(typeof todo.completed).toBe('boolean');
      expect(todo.created_at).toBeInstanceOf(Date);
      expect(todo.updated_at).toBeInstanceOf(Date);
    });
  });
});