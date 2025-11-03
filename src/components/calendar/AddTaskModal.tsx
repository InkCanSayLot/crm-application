import React, { useState, useEffect } from 'react';
import { Task, Client } from '@/lib/supabase';
import { calendarApi, crmApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, CheckSquare, Calendar, Flag, FileText, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import DateTimePicker from '@/components/ui/DateTimePicker';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskAdded: (task: Task) => void;
  onTaskDeleted?: (taskId: string) => void;
  editTask?: Task | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onTaskAdded,
  onTaskDeleted,
  editTask
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: null as Date | null,
    priority: 'medium' as 'low' | 'medium' | 'high',
    completed: false,
    client_id: ''
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const clientsData = await crmApi.getClients();
        setClients(clientsData);
      } catch (error) {
        console.error('Error fetching clients:', error);
      }
    };

    if (isOpen) {
      fetchClients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title,
        description: editTask.description || '',
        due_date: editTask.due_date ? new Date(editTask.due_date) : null,
        priority: editTask.priority,
        completed: editTask.completed,
        client_id: editTask.client_id || ''
      });
    } else {
      setFormData({
        title: '',
        description: '',
        due_date: null,
        priority: 'medium',
        completed: false,
        client_id: ''
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
        due_date: formData.due_date ? formData.due_date.toISOString() : null,
        client_id: formData.client_id || null
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!editTask || !onTaskDeleted) return;

    setDeleteLoading(true);
    try {
      await calendarApi.deleteTask(editTask.id);
      onTaskDeleted(editTask.id);
      toast.success('Task deleted successfully!');
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  console.log('AddTaskModal render - isOpen:', isOpen, 'editTask:', editTask?.title || 'none');
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.8)' }}>
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
              className="input-primary w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[48px]"
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
              className="input-primary w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[80px]"
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
              className="input-primary w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[48px]"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Users className="h-4 w-4 inline mr-1" />
              Client
            </label>
            <select
              name="client_id"
              value={formData.client_id}
              onChange={handleChange}
              className="input-primary w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[48px]"
            >
              <option value="">No client selected</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
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
              <label className="text-sm font-medium text-primary">
                Mark as completed
              </label>
            </div>
          )}



          </form>
        </div>

        <div className="modal-footer">
          <div className="flex justify-between w-full">
            <div>
              {editTask && onTaskDeleted && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  disabled={loading}
                  className="btn-danger flex items-center space-x-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
            <div className="flex space-x-3">
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
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AddTaskModal;