import { useEffect, useState } from 'react'
import './App.css'

const API = 'http://127.0.0.1:8000'

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body.detail || 'Something went wrong.')
  return body
}

const errorText = (e) =>
  e instanceof TypeError
    ? "Can't reach the API. Start FastAPI on port 8000 and refresh."
    : e.message

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'To do' },
  { key: 'done', label: 'Done' },
]

export default function App() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [filter, setFilter] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState({ title: '', description: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  // The backend uses 1-based list positions as ids, so we refetch after every change.
  const load = async () => {
    try {
      const { data } = await request('/todos')
      setTodos(data.map((t, i) => ({ ...t, id: i + 1 })))
      setError('')
    } catch (e) {
      setError(errorText(e))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const run = async (fn) => {
    try {
      await fn()
      await load()
    } catch (e) {
      setError(errorText(e))
      load()
    }
  }

  const addTodo = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    run(async () => {
      await request('/todos', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          completed: false,
        }),
      })
      setTitle('')
      setDescription('')
    })
  }

  const toggle = (t) =>
    run(() =>
      request(`/todos/${t.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: t.title,
          description: t.description,
          completed: !t.completed,
        }),
      })
    )

  const startEdit = (t) => {
    setEditingId(t.id)
    setDraft({ title: t.title, description: t.description })
  }

  const saveEdit = (t) => {
    if (!draft.title.trim()) return
    run(async () => {
      await request(`/todos/${t.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: draft.title.trim(),
          description: draft.description.trim(),
          completed: t.completed,
        }),
      })
      setEditingId(null)
    })
  }

  const remove = (t) =>
    run(async () => {
      await request(`/todos/${t.id}`, { method: 'DELETE' })
      setEditingId(null)
    })

  const left = todos.filter((t) => !t.completed).length
  const visible = todos.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? t.completed : !t.completed
  )

  return (
    <main className="shell">
      <header className="hero">
        <h1>
          <span className="count">{left}</span>
          {left === 1 ? 'thing left' : 'things left'}
        </h1>
        <p>{todos.length - left} of {todos.length} done</p>
      </header>

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <form className="composer" onSubmit={addTodo}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs doing?"
          aria-label="Title"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add a short note (optional)"
          aria-label="Description"
        />
        <button className="primary" type="submit" disabled={!title.trim()}>
          Add todo
        </button>
      </form>

      <div className="filters" role="tablist" aria-label="Filter todos">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            className={filter === f.key ? 'on' : ''}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ul className="list">
        {visible.map((t) => (
          <li key={t.id} className={t.completed ? 'item done' : 'item'}>
            <button
              className="check"
              onClick={() => toggle(t)}
              aria-label={t.completed ? 'Mark as to do' : 'Mark as done'}
              aria-pressed={t.completed}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 12.5l4 4 8-9" />
              </svg>
            </button>

            {editingId === t.id ? (
              <div className="edit">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  aria-label="Edit title"
                  autoFocus
                />
                <input
                  value={draft.description}
                  onChange={(e) =>
                    setDraft({ ...draft, description: e.target.value })
                  }
                  aria-label="Edit description"
                />
                <div className="row">
                  <button className="primary small" onClick={() => saveEdit(t)}>
                    Save changes
                  </button>
                  <button className="ghost" onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="text">
                  <h3>{t.title}</h3>
                  {t.description && <p>{t.description}</p>}
                </div>
                <div className="actions">
                  <button className="ghost" onClick={() => startEdit(t)}>
                    Edit
                  </button>
                  <button className="ghost danger" onClick={() => remove(t)}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {!loading && !error && visible.length === 0 && (
        <p className="empty">
          {todos.length === 0
            ? 'Nothing here yet. Add your first todo above.'
            : 'No todos in this view.'}
        </p>
      )}
    </main>
  )
}
