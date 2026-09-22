import { useEffect, useState } from 'react';
import { CheckCircle2, ClipboardList, Loader2, Plus, Trash2, X } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const statuses = ['Pending', 'In Progress', 'Completed'];
const emptyForm = { title: '', description: '', status: 'Pending' };

function App() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const response = await fetch('/api/tasks');
      if (!response.ok) throw new Error('Unable to load tasks.');
      setTasks(await response.json());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function addTask(event) {
    event.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (!response.ok) throw new Error('Unable to create task.');
      const task = await response.json();
      setTasks((currentTasks) => [task, ...currentTasks]);
      setForm(emptyForm);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(id, values) {
    setError('');
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      if (!response.ok) throw new Error('Unable to update task.');
      const updatedTask = await response.json();
      setTasks((currentTasks) => currentTasks.map((task) => task._id === id ? updatedTask : task));
      setEditingId(null);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function deleteTask(id) {
    setError('');
    try {
      const response = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Unable to delete task.');
      setTasks((currentTasks) => currentTasks.filter((task) => task._id !== id));
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  function startEditing(task) {
    setEditingId(task._id);
    setEditingForm({ title: task.title, description: task.description || '', status: task.status });
  }

  const completedCount = tasks.filter((task) => task.status === 'Completed').length;

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><ClipboardList size={20} /></span><span>Project &amp; Task Management Portal</span></div>
        <span className="live-indicator"><span /> Workspace live</span>
      </header>

      <section className="hero">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h1>Move the work<br /><em>forward.</em></h1>
          <p className="hero-copy">Keep priorities visible, momentum steady, and every deliverable moving toward done.</p>
        </div>
        <div className="summary"><strong>{completedCount}<small> / {tasks.length}</small></strong><span>tasks completed</span><div className="progress"><i style={{ width: tasks.length ? `${completedCount / tasks.length * 100}%` : '0%' }} /></div></div>
      </section>

      <section className="workspace">
        <form className="task-form" onSubmit={addTask}>
          <div className="section-heading"><div><p className="eyebrow">NEW ITEM</p><h2>Add a task</h2></div><Plus size={22} /></div>
          <label>Title<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="What needs to get done?" required /></label>
          <label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Add some context..." rows="4" /></label>
          <label>Status<select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
          <button className="primary-button" disabled={saving}>{saving ? <Loader2 className="spin" size={17} /> : <Plus size={17} />} {saving ? 'Adding...' : 'Add Task'}</button>
        </form>

        <section className="task-area">
          <div className="list-heading"><div><p className="eyebrow">ALL WORK</p><h2>Task list <span>{tasks.length}</span></h2></div><div className="legend"><span className="dot pending" /> Pending <span className="dot progress-dot" /> In progress <span className="dot complete" /> Done</div></div>
          {error && <div className="error-message">{error}</div>}
          {loading ? <div className="empty-state"><Loader2 className="spin" size={25} /><p>Loading your workspace...</p></div> : tasks.length === 0 ? <div className="empty-state"><CheckCircle2 size={30} /><p>Your task list is clear.</p><small>Add your first task to get started.</small></div> : <div className="task-list">{tasks.map((task) => <article className={`task-card ${task.status === 'Completed' ? 'is-complete' : ''}`} key={task._id}>
            {editingId === task._id ? <div className="edit-fields"><input value={editingForm.title} onChange={(event) => setEditingForm({ ...editingForm, title: event.target.value })} /><textarea value={editingForm.description} onChange={(event) => setEditingForm({ ...editingForm, description: event.target.value })} rows="2" /><div className="edit-actions"><select value={editingForm.status} onChange={(event) => setEditingForm({ ...editingForm, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button type="button" className="save-button" onClick={() => updateTask(task._id, editingForm)}>Save</button><button type="button" className="icon-button" aria-label="Cancel editing" onClick={() => setEditingId(null)}><X size={18} /></button></div></div> : <><div className="task-content"><div className="task-title-row"><span className={`status-dot ${task.status.toLowerCase().replace(' ', '-')}`} /><h3>{task.title}</h3></div>{task.description && <p>{task.description}</p>}<time>{new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</time></div><div className="task-actions"><select className={`status-select ${task.status.toLowerCase().replace(' ', '-')}`} aria-label={`Change status for ${task.title}`} value={task.status} onChange={(event) => updateTask(task._id, { title: task.title, description: task.description, status: event.target.value })}>{statuses.map((status) => <option key={status}>{status}</option>)}</select><button className="edit-button" type="button" onClick={() => startEditing(task)}>Edit</button><button className="icon-button danger" type="button" aria-label={`Delete ${task.title}`} onClick={() => deleteTask(task._id)}><Trash2 size={17} /></button></div></>}
          </article>)}</div>}
        </section>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
