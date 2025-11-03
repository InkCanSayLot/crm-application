import React, { useState, useEffect } from 'react';
import { CalendarEvent, Client } from '@/lib/supabase';
import { calendarApi, crmApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, Calendar, Clock, MapPin, Tag, Trash2, FileText, Users } from 'lucide-react';
import { toast } from 'sonner';
import DateTimePicker from '@/components/ui/DateTimePicker';
import ConfirmationModal from '@/components/ui/ConfirmationModal';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: (event: CalendarEvent) => void;
  onEventDeleted?: (eventId: string) => void;
  editEvent?: CalendarEvent | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onEventAdded,
  onEventDeleted,
  editEvent
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: new Date(),
    end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    location: '',
    type: 'meeting' as 'meeting' | 'appointment' | 'reminder' | 'other',
    client_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        try {
          const clientsData = await crmApi.getClients();
          setClients(clientsData);
        } catch (error) {
          console.error('Error fetching clients:', error);
        }
      };
      fetchClients();
    }
  }, [isOpen]);

  useEffect(() => {
    if (editEvent) {
      setFormData({
        title: editEvent.title,
        description: editEvent.description || '',
        start_time: new Date(editEvent.start_time),
        end_time: new Date(editEvent.end_time),
        location: editEvent.location || '',
        type: editEvent.type,
        client_id: editEvent.client_id || ''
      });
    } else {
      const now = new Date();
      setFormData({
        title: '',
        description: '',
        start_time: now,
        end_time: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour later
        location: '',
        type: 'meeting',
        client_id: ''
      });
    }
  }, [editEvent, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      const eventData = {
        ...formData,
        start_time: formData.start_time.toISOString(),
        end_time: formData.end_time.toISOString(),
        client_id: formData.client_id || null
      };

      let savedEvent;
      if (editEvent) {
        savedEvent = await calendarApi.updateEvent(editEvent.id, eventData);
        toast.success('Event updated successfully!');
      } else {
        savedEvent = await calendarApi.createEvent(eventData);
        toast.success('Event created successfully!');
      }

      onEventAdded(savedEvent);
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateTimeChange = (field: 'start_time' | 'end_time', date: Date) => {
    setFormData(prev => ({ ...prev, [field]: date }));
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!editEvent || !onEventDeleted) return;

    setDeleteLoading(true);
    try {
      await calendarApi.deleteEvent(editEvent.id);
      onEventDeleted(editEvent.id);
      toast.success('Event deleted successfully!');
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="text-xl font-semibold">
            {editEvent ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="modal-body">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="h-4 w-4 inline mr-1" />
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="input-primary w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[48px]"
              placeholder="Event title"
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
              placeholder="Event description"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time *
              </label>
              <DateTimePicker
                value={formData.start_time}
                onChange={(date) => handleDateTimeChange('start_time', date)}
                placeholder="Select start time"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="h-4 w-4 inline mr-1" />
                End Time *
              </label>
              <DateTimePicker
                value={formData.end_time}
                onChange={(date) => handleDateTimeChange('end_time', date)}
                placeholder="Select end time"
                minDate={formData.start_time}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="h-4 w-4 inline mr-1" />
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input-primary w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[48px]"
              placeholder="Event location"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input-primary w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base min-h-[48px]"
            >
              <option value="meeting">Meeting</option>
              <option value="appointment">Appointment</option>
              <option value="reminder">Reminder</option>
              <option value="other">Other</option>
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
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.company_name}
                </option>
              ))}
            </select>
          </div>

          </form>
        </div>

        <div className="modal-footer">
          <div className="flex justify-between w-full">
            <div>
              {editEvent && onEventDeleted && (
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
                form="event-form"
                disabled={loading}
                className="btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : editEvent ? 'Update Event' : 'Add Event'}
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
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
};

export default AddEventModal;