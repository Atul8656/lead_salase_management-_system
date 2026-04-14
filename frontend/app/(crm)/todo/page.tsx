"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { todosApi } from "@/lib/api";
import type { Todo } from "@/lib/types";

export default function TodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodo, setNewTodo] = useState("");
  const [err, setErr] = useState("");
  
  // Pending delete IDs stored in localStorage
  const [pendingDeletes, setPendingDeletes] = useState<number[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("todo_pending_deletes");
    if (saved) {
      try {
        setPendingDeletes(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse pending deletes", e);
      }
    }
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await todosApi.list();
      
      const saved = localStorage.getItem("todo_pending_deletes");
      if (saved) {
        const ids: number[] = JSON.parse(saved);
        if (ids.length > 0) {
          await Promise.all(ids.map(id => todosApi.patch(id, { is_deleted: true })));
          localStorage.removeItem("todo_pending_deletes");
          setPendingDeletes([]);
          // Re-fetch since we updated backend
          const freshData = await todosApi.list();
          setTodos(freshData);
        } else {
          setTodos(data);
        }
      } else {
        setTodos(data);
      }
      
      setErr("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load todos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      const added = await todosApi.create({ title: newTodo.trim() });
      setTodos([added, ...todos]);
      setNewTodo("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to add todo");
    }
  };

  const togglePendingDelete = (id: number) => {
    setPendingDeletes((prev) => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter((i) => i !== id);
      } else {
        next = [...prev, id];
      }
      localStorage.setItem("todo_pending_deletes", JSON.stringify(next));
      return next;
    });
  };

  const pendingTodos = useMemo(() => 
    todos.filter(t => !pendingDeletes.includes(t.id)), 
  [todos, pendingDeletes]);

  const deletedUIItems = useMemo(() => 
    todos.filter(t => pendingDeletes.includes(t.id)), 
  [todos, pendingDeletes]);

  return (
    <div className="mx-auto max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900">Todo List</h1>
          <p className="text-sm font-medium text-neutral-500 mt-1">
            Double click to mark for deletion. Refresh to clear.
          </p>
        </div>
      </div>

      <form onSubmit={handleAddTodo} className="relative">
        <input
          type="text"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="What needs to be done?"
          className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-4 text-sm font-bold shadow-sm transition-all focus:border-neutral-900 focus:outline-none focus:ring-4 focus:ring-neutral-100"
        />
        <button
          type="submit"
          className="absolute right-2 top-2 rounded-xl bg-neutral-900 px-6 py-2 text-xs font-black text-white transition hover:opacity-90 active:scale-95"
        >
          Add Item
        </button>
      </form>

      {err && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
          {err}
        </div>
      )}

      {loading && todos.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-900"></div>
        </div>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2">
          {/* Pending Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <span className="h-2 w-2 rounded-full bg-amber-400"></span>
              <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Todo Items</h2>
              <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-bold text-neutral-500">
                {pendingTodos.length}
              </span>
            </div>
            <div className="space-y-3">
              {pendingTodos.map((todo, idx) => (
                <TodoCard 
                  key={todo.id} 
                  todo={todo}
                  index={idx + 1}
                  onDoubleClick={() => togglePendingDelete(todo.id)}
                  isPendingDelete={false}
                />
              ))}
              {pendingTodos.length === 0 && (
                <p className="py-8 text-center text-xs font-bold text-neutral-300">No pending items</p>
              )}
            </div>
          </section>

          {/* Pending Delete Section */}
          <section className="space-y-4">
            {deletedUIItems.length > 0 ? (
              <>
                <div className="flex items-center gap-2 px-1">
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse"></span>
                  <h2 className="text-xs font-black uppercase tracking-widest text-neutral-400">Marked for Deletion (Clear on Refresh)</h2>
                </div>
                <div className="space-y-3">
                  {deletedUIItems.map((todo, idx) => (
                    <TodoCard 
                      key={todo.id} 
                      todo={todo}
                      index={idx + 1}
                      onDoubleClick={() => togglePendingDelete(todo.id)}
                      isPendingDelete={true}
                    />
                  ))}
                </div>
              </>
            ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-neutral-100 p-8">
                  <p className="text-center text-xs font-bold text-neutral-300 italic">Double click/tap to delete</p>
                </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function TodoCard({ 
  todo,
  index,
  onDoubleClick, 
  isPendingDelete 
}: { 
  todo: Todo;
  index: number;
  onDoubleClick: () => void;
  isPendingDelete: boolean;
}) {
  const lastTap = useRef(0);
  const handleTouchStart = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleClick();
    }
    lastTap.current = now;
  };

  return (
    <div
      onDoubleClick={onDoubleClick}
      onTouchStart={handleTouchStart}
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer select-none px-5 py-4 shadow-sm hover:shadow-md active:scale-[0.98] ${
        isPendingDelete 
          ? "border-red-200 bg-red-50/30 text-center" 
          : "border-neutral-100 bg-white hover:border-neutral-300"
      }`}
    >
      <div className={`flex flex-col gap-2 ${isPendingDelete ? "items-center" : "items-start"}`}>
        <div className="flex w-full items-center justify-between gap-3">
          <span 
            className={`text-sm font-bold transition-all duration-300 ${
              isPendingDelete 
                ? "line-through text-neutral-400 italic" 
                : "text-neutral-900"
            }`}
          >
            {index}. {todo.title}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black uppercase tracking-tighter text-neutral-300">
            {new Date(todo.created_at).toLocaleDateString()}
          </span>
          {isPendingDelete && (
            <span className="text-[10px] font-black uppercase tracking-tighter text-red-400 animate-pulse">
              Removed on refresh
            </span>
          )}
        </div>
      </div>
      
      {/* Decorative hover elements */}
      <div className="absolute right-0 top-0 h-1 w-0 bg-neutral-900 transition-all duration-300 group-hover:w-full"></div>
    </div>
  );
}
