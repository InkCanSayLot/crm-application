import React, { useState, useEffect } from 'react';
import { Task } from '@/lib/supabase';
import { calendarApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, CheckSquare, Calendar, Flag, FileText } from 'lucide-react';
import { toast } from 'sonner';
import DateTimePicker from '@/components/ui/DateTimePicker';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: (task: Task) => void;
  editTask?: Task | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskAdded,
  editTask
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: null as Date | null,
    priority: 'medium' as 'low' | 'medium' | 'high',
    completed: false
  });

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        due_date: editTask.due_date ? new Date(editTask.due_date) : null,
        priority: editTask.priority,
        completed: editTask.completed
      });
    } else {
      setFormData({
        title: '',
        description: '',
        due_date: null,
        priority: 'medium',
        completed: false
      });
    }
  }, [editTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const taskData = {
        ...formData,
        due_date: formData.due_date ? formData.due_date.toISOString() : null
      };

      let savedTask;
      if (editTask) {
        savedTask = await calendarApi.updateTask(editTask.id, taskData);
        toast.success('Task updated successfully!');
      } else {
        savedTask = await calendarApi.createTask(taskData);
        toast.success('Task created successfully!');
      }

      onTaskAdded(savedTask);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleDateChange = (date: Date | null) => {
    setFormData(prev => ({ ...prev, due_date: date }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="modal-header">
          <h2 className="text-xl font-semibold">
            {editTask ? 'Edit Task' : 'Add New Task'}
          </h2>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="modal-body">
          <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <CheckSquare className="h-4 w-4 inline mr-1" />
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input-primary w-full px-3 py-2"
              placeholder="Task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="h-4 w-4 inline mr-1" />
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-primary w-full px-3 py-2"
              placeholder="Task description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Due Date
            </label>
            <DateTimePicker
              value={formData.due_date}
              onChange={handleDateChange}
              placeholder="Select due date and time"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Flag className="h-4 w-4 inline mr-1" />
              Priority
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="input-primary w-full px-3 py-2"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          {editTask && (
            <div className="flex items-center">
              <input
                type="checkbox"
                name="completed"
                checked={formData.completed}
                onChange={handleChange}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Mark as completed
              </label>
            </div>
          )}

          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="task-form"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : editTask ? 'Update Task' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddTaskModal;