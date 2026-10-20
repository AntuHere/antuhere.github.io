import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { uid } from "./data";
import type { StageTodo } from "./workflow";

export default function StageTodos({
  todos,
  onChange,
}: {
  todos: StageTodo[];
  onChange: (todos: StageTodo[]) => void;
}) {
  const [title, setTitle] = useState("");
  const done = todos.filter((todo) => todo.done).length;
  return (
    <section
      className="rw-inner-card rw-work-steps"
      aria-label="Stage to-do list"
    >
      <div className="rw-between">
        <h4>To-do / work steps</h4>
        <span className="rw-autosave">
          {done}/{todos.length} completed
        </span>
      </div>
      <p className="rw-hint">
        Add your own tasks for this stage. Edit any title or check it off when
        finished.
      </p>
      <form
        className="rw-add-step"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onChange([...todos, { id: uid(), title: title.trim(), done: false }]);
          setTitle("");
        }}
      >
        <label>
          <span className="rw-input-label">New to-do or work step</span>
          <input
            aria-label="New to-do or work step"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to happen in this stage?"
          />
        </label>
        <button
          className="rw-button primary"
          type="submit"
          disabled={!title.trim()}
        >
          <Plus size={15} />
          Add to-do
        </button>
      </form>
      <div className="rw-todo-list">
        {todos.map((todo) => (
          <div
            className={`rw-work-step ${todo.done ? "is-done" : ""}`}
            key={todo.id}
          >
            <input
              type="checkbox"
              aria-label={`Complete ${todo.title || "untitled work step"}`}
              checked={todo.done}
              onChange={(e) =>
                onChange(
                  todos.map((item) =>
                    item.id === todo.id
                      ? { ...item, done: e.target.checked }
                      : item,
                  ),
                )
              }
            />
            <input
              type="text"
              aria-label="Work step title"
              value={todo.title}
              placeholder="Work step title"
              onChange={(e) =>
                onChange(
                  todos.map((item) =>
                    item.id === todo.id
                      ? { ...item, title: e.target.value }
                      : item,
                  ),
                )
              }
            />
            <button
              className="icon-btn"
              aria-label="Delete work step"
              onClick={() =>
                onChange(todos.filter((item) => item.id !== todo.id))
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>
      {!todos.length && (
        <p className="rw-hint">
          No work steps yet. Start with the next thing you want to do.
        </p>
      )}
    </section>
  );
}
