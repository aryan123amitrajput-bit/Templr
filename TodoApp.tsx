import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import './todo.css';

type Todo = { id: string; title: string; time?: string; done: boolean };
type View = 'all' | 'today' | 'done';

const starterTodos: Todo[] = [
  { id: '1', title: 'Plan the week ahead', time: '09:00 AM', done: true },
  { id: '2', title: 'Finish the project proposal', time: '10:30 AM', done: false },
  { id: '3', title: 'Pick up groceries', time: '01:00 PM', done: false },
  { id: '4', title: 'Go for an evening walk', time: '06:00 PM', done: false },
];

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true as const };
  if (name === 'plus') return <svg {...common}><path d="M12 5v14M5 12h14" /></svg>;
  if (name === 'sun') return <svg {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg>;
  if (name === 'calendar') return <svg {...common}><rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>;
  if (name === 'check') return <svg {...common}><path d="m5 12 4 4L19 6"/></svg>;
  if (name === 'trash') return <svg {...common}><path d="M3 6h18m-2 0-.9 14H5.9L5 6m4 0V4h6v2m-5 4v6m4-6v6"/></svg>;
  if (name === 'close') return <svg {...common}><path d="m18 6-12 12M6 6l12 12"/></svg>;
  if (name === 'qr') return <svg {...common}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zm5 0h2m-7 5v2m4-3h3v3h-3"/></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9"/></svg>;
}

const todayLabel = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

export default function TodoApp() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try { const stored = localStorage.getItem('daylight-todos'); return stored ? JSON.parse(stored) : starterTodos; }
    catch { return starterTodos; }
  });
  const [view, setView] = useState<View>('all');
  const [draft, setDraft] = useState('');
  const [timeDraft, setTimeDraft] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  useEffect(() => { localStorage.setItem('daylight-todos', JSON.stringify(todos)); }, [todos]);

  const doneCount = todos.filter((todo) => todo.done).length;
  const visibleTodos = useMemo(() => todos.filter((todo) => view === 'done' ? todo.done : view === 'today' ? !todo.done : true), [todos, view]);
  const remaining = todos.length - doneCount;
  const progress = todos.length ? Math.round(doneCount / todos.length * 100) : 0;

  function addTodo(event: FormEvent) {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setTodos((current) => [{ id: crypto.randomUUID(), title, time: timeDraft || undefined, done: false }, ...current]);
    setDraft(''); setTimeDraft(''); setIsAdding(false);
  }

  function toggleTodo(id: string) { setTodos((current) => current.map((todo) => todo.id === id ? { ...todo, done: !todo.done } : todo)); }
  function deleteTodo(id: string) { setTodos((current) => current.filter((todo) => todo.id !== id)); }

  return <main className="app-shell">
    <div className="app-card">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="Daylight home"><span className="brand-mark"><Icon name="sun" size={18}/></span><span>daylight</span></a>
      </header>

      <section className="welcome" id="home">
        <div className="date-label"><Icon name="calendar" size={15}/>{todayLabel}</div>
        <h1>A little progress<br/><span>goes a long way.</span></h1>
        <p>Keep your day simple. One thing at a time.</p>
      </section>

      <section className="progress-card" aria-label={`${doneCount} of ${todos.length} tasks complete`}>
        <div className="progress-copy"><div><span className="progress-eyebrow">YOUR DAILY PROGRESS</span><strong>{doneCount}<span> / {todos.length} done</span></strong></div><span className="progress-percent">{progress}%</span></div>
        <div className="progress-track"><span style={{ width: `${progress}%` }}/></div>
      </section>

      <section className="tasks-section">
        <div className="section-heading"><div><h2>My tasks</h2><span>{remaining === 0 ? 'You’re all caught up' : `${remaining} ${remaining === 1 ? 'thing' : 'things'} left for today`}</span></div><button className="add-button" onClick={() => setIsAdding(true)}><Icon name="plus" size={18}/><span>New task</span></button></div>
        <div className="filter-row" role="tablist" aria-label="Filter tasks">
          {([['all', 'All tasks'], ['today', 'To do'], ['done', 'Completed']] as [View, string][]).map(([key, label]) => <button key={key} role="tab" aria-selected={view === key} className={`filter-tab ${view === key ? 'selected' : ''}`} onClick={() => setView(key)}>{label}{key === 'today' && <span className="tab-count">{remaining}</span>}</button>)}
        </div>
        <div className="task-list">
          {visibleTodos.map((todo) => <article className={`task-row ${todo.done ? 'is-done' : ''}`} key={todo.id}>
            <button className="task-check" onClick={() => toggleTodo(todo.id)} aria-label={todo.done ? `Mark ${todo.title} incomplete` : `Complete ${todo.title}`}>{todo.done && <Icon name="check" size={15}/>}</button>
            <div className="task-copy"><span className="task-title">{todo.title}</span>{todo.time && <span className="task-time">{todo.time}</span>}</div>
            <button className="delete-button" onClick={() => deleteTodo(todo.id)} aria-label={`Delete ${todo.title}`}><Icon name="trash" size={17}/></button>
          </article>)}
          {visibleTodos.length === 0 && <div className="empty-state"><span className="empty-icon"><Icon name={view === 'done' ? 'check' : 'sun'} size={21}/></span><strong>{view === 'done' ? 'Nothing completed just yet' : 'A clear little slate'}</strong><span>{view === 'done' ? 'Finished tasks will show up here.' : 'Add a task and make today yours.'}</span>{view !== 'done' && <button onClick={() => setIsAdding(true)}>Add your first task <Icon name="plus" size={15}/></button>}</div>}
        </div>
      </section>
      <footer className="app-footer"><span className="footer-spark">✳</span> Make room for what matters.</footer>
    </div>

    {isAdding && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsAdding(false); }}><form className="task-modal" onSubmit={addTodo}><div className="modal-heading"><div><span className="modal-kicker">A FRESH START</span><h2>Add a task</h2></div><button type="button" className="close-button" onClick={() => setIsAdding(false)} aria-label="Close"><Icon name="close"/></button></div><label className="field-label" htmlFor="task-title">What would you like to do?</label><input id="task-title" autoFocus maxLength={100} placeholder="e.g. Call mum" value={draft} onChange={(event) => setDraft(event.target.value)}/><label className="field-label time-label" htmlFor="task-time">Add a time <span>optional</span></label><input id="task-time" type="time" value={timeDraft} onChange={(event) => setTimeDraft(event.target.value)}/><button className="save-task" type="submit" disabled={!draft.trim()}><Icon name="plus" size={17}/> Add to my day</button></form></div>}

  </main>;
}
