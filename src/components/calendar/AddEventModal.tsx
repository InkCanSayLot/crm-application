import React, { useState, useEffect } from 'react';
import { Event as CalendarEvent } from '@/lib/supabase';
import { calendarApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { X, Calendar, Clock, MapPin, FileText } from 'lucide-react';
import { toast } from 'sonner';
import DateTimePicker from '@/components/ui/DateTimePicker';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: (event: CalendarEvent) => void;
  editEvent?: CalendarEvent | null;
}

const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  onEventAdded,
  editEvent
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: new Date(),
    end_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
    location: '',
    type: 'meeting' as 'meeting' | 'appointment' | 'reminder' | 'other'
  });

  useEffect(() => {
    if (editEvent) {
      setFormData({
        title: editEvent.title,
        description: editEvent.description || '',
        start_time: new Date(editEvent.start_time),
        end_time: new Date(editEvent.end_time),
        location: editEvent.location || '',
        type: editEvent.type
      });
    } else {
      const now = new Date();
      setFormData({
        title: '',
        description: '',
        start_time: now,
        end_time: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour later
        location: '',
        type: 'meeting'
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
        end_time: formData.end_time.toISOString()
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
              className="input-primary w-full px-3 py-2"
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
              className="input-primary w-full px-3 py-2"
              placeholder="Event description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              className="input-primary w-full px-3 py-2"
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
              className="input-primary w-full px-3 py-2"
            >
              <option value="meeting">Meeting</option>
              <option value="appointment">Appointment</option>
              <option value="reminder">Reminder</option>
              <option value="other">Other</option>
            </select>
          </div>

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
            form="event-form"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? 'Saving...' : editEvent ? 'Update Event' : 'Add Event'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEventModal;