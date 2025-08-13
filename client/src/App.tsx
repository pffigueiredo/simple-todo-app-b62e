import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { Todo, CreateTodoInput } from '../../server/src/schema';

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingTodos, setIsLoadingTodos] = useState(true);

  // Form state
  const [formData, setFormData] = useState<CreateTodoInput>({
    title: '',
    description: null
  });

  // Load todos
  const loadTodos = useCallback(async () => {
    try {
      setIsLoadingTodos(true);
      const result = await trpc.getTodos.query();
      setTodos(result);
    } catch (error) {
      console.error('Failed to load todos:', error);
    } finally {
      setIsLoadingTodos(false);
    }
  }, []);

  useEffect(() => {
    loadTodos();
  }, [loadTodos]);

  // Create todo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsLoading(true);
    try {
      const newTodo = await trpc.createTodo.mutate(formData);
      setTodos((prev: Todo[]) => [...prev, newTodo]);
      // Reset form
      setFormData({
        title: '',
        description: null
      });
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle todo completion
  const toggleTodo = async (todo: Todo) => {
    try {
      const updatedTodo = await trpc.updateTodo.mutate({
        id: todo.id,
        completed: !todo.completed
      });
      setTodos((prev: Todo[]) =>
        prev.map((t: Todo) => t.id === todo.id ? updatedTodo : t)
      );
    } catch (error) {
      console.error('Failed to update todo:', error);
    }
  };

  // Delete todo
  const deleteTodo = async (todoId: number) => {
    try {
      await trpc.deleteTodo.mutate({ id: todoId });
      setTodos((prev: Todo[]) => prev.filter((t: Todo) => t.id !== todoId));
    } catch (error) {
      console.error('Failed to delete todo:', error);
    }
  };

  const completedCount = todos.filter((todo: Todo) => todo.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">✅ Todo App</h1>
          <p className="text-gray-600">Stay organized and get things done!</p>
          {totalCount > 0 && (
            <div className="mt-4 flex justify-center items-center gap-2">
              <Badge variant="secondary" className="text-sm">
                {completedCount} of {totalCount} completed
              </Badge>
            </div>
          )}
        </div>

        {/* Add Todo Form */}
        <Card className="mb-8 shadow-lg form-card">
          <CardHeader>
            <CardTitle className="text-xl">Add New Todo</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="What needs to be done?"
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData((prev: CreateTodoInput) => ({ 
                      ...prev, 
                      title: e.target.value 
                    }))
                  }
                  className="text-lg"
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Add a description (optional)..."
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData((prev: CreateTodoInput) => ({
                      ...prev,
                      description: e.target.value || null
                    }))
                  }
                  rows={3}
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLoading || !formData.title.trim()}
                className="w-full"
                size="lg"
              >
                {isLoading ? '✨ Adding...' : '➕ Add Todo'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Todos List */}
        <div className="space-y-4">
          {isLoadingTodos ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-gray-500">Loading todos...</div>
              </CardContent>
            </Card>
          ) : todos.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No todos yet!
                </h3>
                <p className="text-gray-500">
                  Add your first todo above to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Your Todos
              </h2>
              {todos.map((todo: Todo) => (
                <Card 
                  key={todo.id} 
                  className={`todo-card-hover ${
                    todo.completed 
                      ? 'completed-todo' 
                      : 'pending-todo'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={todo.completed}
                        onCheckedChange={() => toggleTodo(todo)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 
                          className={`text-lg font-medium mb-2 ${
                            todo.completed 
                              ? 'line-through text-gray-500' 
                              : 'text-gray-900'
                          }`}
                        >
                          {todo.title}
                        </h3>
                        {todo.description && (
                          <p 
                            className={`text-sm mb-3 ${
                              todo.completed 
                                ? 'text-gray-400' 
                                : 'text-gray-600'
                            }`}
                          >
                            {todo.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span>Created: {todo.created_at.toLocaleDateString()}</span>
                            {todo.completed && (
                              <Badge variant="outline" className="text-xs">
                                ✅ Completed
                              </Badge>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteTodo(todo.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            🗑️ Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        {totalCount > 0 && (
          <div className="mt-8 text-center">
            <Separator className="mb-4" />
            <p className="text-sm text-gray-500">
              Keep up the great work! 🎉
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;