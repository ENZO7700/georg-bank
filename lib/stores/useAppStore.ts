import { create } from 'zustand'
import { syncMiddleware, dispatchOfflineAction } from '../sync/middleware'

interface AppState {
  todos: { id: string; title: string; completed: boolean }[]
  addTodo: (title: string) => void
  toggleTodo: (id: string) => void
}

export const useAppStore = create<AppState>()(
  syncMiddleware((set: (fn: (state: AppState) => Partial<AppState>) => void) => ({
    todos: [],
    
    addTodo: (title: string) => {
      const newTodo = { id: crypto.randomUUID(), title, completed: false }
      
      dispatchOfflineAction(
        'ADD_TODO',
        newTodo,
        () => set((state: AppState) => ({ todos: [...state.todos, newTodo] }))
      )
    },

    toggleTodo: (id: string) => {
      dispatchOfflineAction(
        'TOGGLE_TODO',
        { id },
        () => set((state: AppState) => ({
          todos: state.todos.map((t: { id: string; title: string; completed: boolean }) => 
            t.id === id ? { ...t, completed: !t.completed } : t
          )
        }))
      )
    }
  }))
)
