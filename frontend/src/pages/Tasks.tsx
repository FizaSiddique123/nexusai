import React, { useState, useEffect } from 'react';
import {
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Search,
  Calendar,
  X
} from 'lucide-react';
import { api } from '../services/api.js';
import { TaskItem, TaskPriority } from '../../../shared/src/types.js';

export const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    priority: 'medium' as TaskPriority,
    estimated_duration: 45
  });

  useEffect(() => {
    loadTasks();
  }, [statusFilter, priorityFilter, search]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const res = await api.getTasks({
        status: statusFilter,
        priority: priorityFilter,
        search
      });
      setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      priority: 'medium',
      estimated_duration: 45
    });
    setShowModal(true);
  };

  const handleOpenEdit = (task: TaskItem) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      priority: task.priority,
      estimated_duration: task.estimated_duration
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData);
      } else {
        await api.createTask(formData);
      }
      setShowModal(false);
      loadTasks();
    } catch (err: any) {
      alert(`Task save error: ${err.message}`);
    }
  };

  const handleToggleComplete = async (task: TaskItem) => {
    try {
      if (task.status === 'completed') {
        await api.updateTask(task.id, { status: 'pending' });
      } else {
        await api.completeTask(task.id);
      }
      loadTasks();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await api.deleteTask(id);
        loadTasks();
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="page-wrapper" style={{ maxWidth: '1080px' }}>
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Tasks
          </h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
            Manage study goals, target completion dates, and estimated durations.
          </p>
        </div>

        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          <span>New task</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div
        className="nexus-card"
        style={{
          marginBottom: '20px',
          padding: '14px 18px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(['all', 'pending', 'completed'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '5px 12px', fontSize: '0.785rem', textTransform: 'capitalize' }}
            >
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select
            className="input-field"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: 'auto', padding: '5px 10px', fontSize: '0.785rem' }}
          >
            <option value="all">All priorities</option>
            <option value="high">High priority</option>
            <option value="medium">Medium priority</option>
            <option value="low">Low priority</option>
          </select>

          <div style={{ position: 'relative', width: '200px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="input-field"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks..."
              style={{ paddingLeft: '30px', padding: '5px 10px 5px 30px', fontSize: '0.785rem' }}
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="nexus-card" style={{ padding: '18px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Loading tasks...
          </div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            No tasks found. Click "New task" or ask Nexus AI to generate tasks from your notes.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tasks.map((task) => (
              <div
                key={task.id}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-input)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'background-color 0.15s ease'
                }}
              >
                {/* Checkbox button */}
                <button
                  onClick={() => handleToggleComplete(task)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: task.status === 'completed' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '2px'
                  }}
                  title={task.status === 'completed' ? 'Mark pending' : 'Mark completed'}
                >
                  {task.status === 'completed' ? (
                    <CheckCircle2 size={18} />
                  ) : (
                    <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--border-card)' }} />
                  )}
                </button>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)',
                      textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {task.title}
                  </div>
                  {task.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.description}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '4px', fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      <span>Due {task.deadline}</span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} />
                      <span>{task.estimated_duration}m</span>
                    </span>
                  </div>
                </div>

                {/* Priority Badge */}
                <span className={`badge badge-${task.priority}`}>{task.priority}</span>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => handleOpenEdit(task)}
                    className="btn-subtle"
                    style={{ padding: '5px 8px' }}
                    title="Edit task"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(task.id, task.title)}
                    className="btn-danger"
                    style={{ padding: '5px 8px', borderRadius: 'var(--radius-sm)' }}
                    title="Delete task"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                {editingTask ? 'Edit task' : 'Create task'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Task title *
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Master TCP 3-Way Handshake & Flow Control"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Description
                </label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Key concepts to review..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Priority
                  </label>
                  <select
                    className="input-field"
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formData.estimated_duration}
                    onChange={e => setFormData({ ...formData, estimated_duration: Number(e.target.value) })}
                    min={15}
                    step={15}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)', display: 'block', marginBottom: '5px' }}>
                  Deadline
                </label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Save changes' : 'Create task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
