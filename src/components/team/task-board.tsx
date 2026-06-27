'use client';

import React, { useState } from 'react';
import { TaskStatus, Priority } from '@prisma/client';

interface TeamMember {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface TaskRecord {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
  assignedTo: TeamMember | null;
  createdBy: { id: string; name: string };
}

interface TaskBoardProps {
  initialTasks: TaskRecord[];
  teamMembers: TeamMember[];
  onUpdateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  onCreateTask: (data: { title: string; priority: Priority; assignedToId?: string }) => Promise<TaskRecord>;
}

/**
 * Premium Kanban Task Board for team management and operations.
 */
export function TaskBoard({
  initialTasks,
  teamMembers,
  onUpdateStatus,
  onCreateTask,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskRecord[]>(initialTasks);
  
  // Inline task creation form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('MEDIUM');
  const [newAssigneeId, setNewAssigneeId] = useState('');

  const columns: { label: string; status: TaskStatus }[] = [
    { label: '📥 Todo', status: 'TODO' },
    { label: '⚡ In Progress', status: 'IN_PROGRESS' },
    { label: '🔍 In Review', status: 'REVIEW' },
    { label: '✅ Completed', status: 'DONE' },
  ];

  const handleStatusChange = async (taskId: string, nextStatus: TaskStatus) => {
    try {
      await onUpdateStatus(taskId, nextStatus);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t))
      );
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const createdTask = await onCreateTask({
        title: newTitle.trim(),
        priority: newPriority,
        assignedToId: newAssigneeId || undefined,
      });
      setTasks((prev) => [...prev, createdTask]);
      setNewTitle('');
      setNewPriority('MEDIUM');
      setNewAssigneeId('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create task:', err);
    }
  };

  const getPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return 'bg-danger/15 text-danger border-danger/20';
      case 'HIGH':
        return 'bg-warning/15 text-warning border-warning/20';
      case 'MEDIUM':
        return 'bg-primary/15 text-primary border-primary/20';
      default:
        return 'bg-slate-500/15 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="w-full space-y-6 select-none">
      {/* Header and Add Task Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Operations Board</h2>
          <p className="text-xs text-text-secondary">Coordinate tasks, assign owners, and track progress</p>
        </div>
        <button
          onClick={() => setShowAddForm((prev) => !prev)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-small text-xs font-semibold shadow-card transition-colors cursor-pointer"
        >
          {showAddForm ? 'Close Editor' : '+ Create Task'}
        </button>
      </div>

      {/* Inline Create Form */}
      {showAddForm && (
        <form
          onSubmit={handleCreateTask}
          className="p-4 bg-surface border border-border rounded-medium flex flex-wrap gap-4 items-end shadow-card"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] uppercase font-bold text-text-secondary mb-1.5">
              Task Subject
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule onboarding Q&A call"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-3 py-1.5 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary placeholder:text-text-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-text-secondary mb-1.5">
              Priority
            </label>
            <select
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value as Priority)}
              className="px-3 py-1.5 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-text-secondary mb-1.5">
              Assignee
            </label>
            <select
              value={newAssigneeId}
              onChange={(e) => setNewAssigneeId(e.target.value)}
              className="px-3 py-1.5 border border-border rounded-small bg-background text-text-primary text-xs focus:outline-none focus:border-primary"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-secondary hover:bg-secondary/90 text-white rounded-small text-xs font-semibold shadow-card cursor-pointer"
          >
            Add Task
          </button>
        </form>
      )}

      {/* Kanban Board Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div
              key={col.status}
              className="bg-surface/50 border border-border rounded-medium p-4 flex flex-col min-h-[400px]"
            >
              {/* Column Title */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-text-primary">{col.label}</span>
                <span className="text-[10px] px-2 py-0.5 bg-border text-text-secondary rounded-full font-bold">
                  {columnTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="flex-1 space-y-3 overflow-y-auto">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-4 bg-surface border border-border rounded-medium shadow-card space-y-3 hover:border-text-secondary transition-all"
                  >
                    <div>
                      <span
                        className={`text-[9px] px-2 py-0.5 border rounded-full font-bold uppercase tracking-wider ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </span>
                      <h4 className="text-xs font-bold text-text-primary mt-2 leading-relaxed">
                        {task.title}
                      </h4>
                      {task.description && (
                        <p className="text-[10px] text-text-secondary mt-1 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>

                    {/* Task Footer / Assignee / Actions */}
                    <div className="flex justify-between items-center border-t border-border pt-3 mt-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[9px]">
                          {task.assignedTo
                            ? task.assignedTo.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                            : '?'}
                        </div>
                        <span className="text-[10px] text-text-secondary">
                          {task.assignedTo?.name || 'Unassigned'}
                        </span>
                      </div>

                      {/* Dropdown status switcher */}
                      <select
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value as TaskStatus)
                        }
                        className="text-[9px] font-semibold bg-background border border-border rounded-small px-1.5 py-0.5 text-text-primary focus:outline-none cursor-pointer"
                      >
                        <option value="TODO">Todo</option>
                        <option value="IN_PROGRESS">Progress</option>
                        <option value="REVIEW">Review</option>
                        <option value="DONE">Done</option>
                      </select>
                    </div>
                  </div>
                ))}

                {columnTasks.length === 0 && (
                  <div className="h-24 border border-dashed border-border rounded-medium flex items-center justify-center text-[10px] text-text-secondary italic">
                    Column empty
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default TaskBoard;
