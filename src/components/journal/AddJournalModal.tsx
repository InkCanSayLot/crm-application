import React, { useState, useEffect } from 'react';
import { JournalEntry } from '@/lib/supabase';
import { journalApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import {
  X,
  Save,
  Calendar,
  BookOpen,
  Heart,
  Target,
  TrendingUp,
  Lightbulb
} from 'lucide-react';
import { toast } from "sonner";

interface AddJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEntryAdded: (entry: JournalEntry) => void;
  editingEntry?: JournalEntry | null;
}

const CATEGORIES = [
  { value: 'personal', label: 'Personal', icon: Heart, color: 'text-pink-600' },
  { value: 'work', label: 'Work', icon: Target, color: 'text-pink-600' },
  { value: 'client_meeting', label: 'Client Meeting', icon: Calendar, color: 'text-pink-700' },
  { value: 'sales_activity', label: 'Sales Activity', icon: TrendingUp, color: 'text-pink-500' },
  { value: 'team_collaboration', label: 'Team Collaboration', icon: Target, color: 'text-pink-600' },
  { value: 'goals', label: 'Goals', icon: TrendingUp, color: 'text-pink-600' },
  { value: 'ideas', label: 'Ideas', icon: Lightbulb, color: 'text-pink-500' },
  { value: 'reflection', label: 'Reflection', icon: BookOpen, color: 'text-pink-700' }
];

const MOODS = [
  { value: 'excellent', label: 'Excellent', emoji: '🚀', color: 'bg-pink-100 text-pink-800 border-pink-200', description: 'Highly productive, deals closing' },
  { value: 'good', label: 'Good', emoji: '😊', color: 'bg-pink-100 text-pink-700 border-pink-200', description: 'Positive interactions, progress made' },
  { value: 'motivated', label: 'Motivated', emoji: '💪', color: 'bg-pink-100 text-pink-800 border-pink-200', description: 'Energized for challenges' },
  { value: 'neutral', label: 'Neutral', emoji: '😐', color: 'bg-gray-100 text-gray-800 border-gray-200', description: 'Steady, consistent work' },
  { value: 'challenged', label: 'Challenged', emoji: '🤔', color: 'bg-pink-100 text-pink-600 border-pink-200', description: 'Facing obstacles, need strategy' },
  { value: 'frustrated', label: 'Frustrated', emoji: '😤', color: 'bg-orange-100 text-orange-800 border-orange-200', description: 'Blocked by issues, seeking solutions' },
  { value: 'stressed', label: 'Stressed', emoji: '😰', color: 'bg-red-100 text-red-800 border-red-200', description: 'High pressure, need support' }
];

export default function AddJournalModal({ isOpen, onClose, onEntryAdded, editingEntry }: AddJournalModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'personal',
    mood: 'neutral',
    entry_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    if (editingEntry) {
      setFormData({
        title: editingEntry.title,
        content: editingEntry.content,
        category: editingEntry.category,
        mood: editingEntry.mood,
        entry_date: editingEntry.entry_date
      });
    } else {
      setFormData({
        title: '',
        content: '',
        category: 'personal',
        mood: 'neutral',
        entry_date: new Date().toISOString().split('T')[0]
      });
    }
  }, [editingEntry, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);

      const entryData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        category: formData.category,
        mood: formData.mood,
        entry_date: formData.entry_date,
        user_id: user.id
      };

      if (editingEntry) {
        // Update existing entry
        const data = await journalApi.updateEntry(editingEntry.id, entryData);
        onEntryAdded(data);
        toast.success('Journal entry updated successfully');
      } else {
        // Create new entry
        const data = await journalApi.createEntry(entryData);
        onEntryAdded(data);
        toast.success('Journal entry created successfully');
      }

      onClose();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save journal entry');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getPlaceholderText = (category: string) => {
    const placeholders = {
      personal: 'Write about your personal thoughts, experiences, or reflections...',
      work: 'Document your work progress, challenges, or achievements...',
      client_meeting: 'Record meeting notes, client feedback, next steps, and outcomes...',
      sales_activity: 'Track sales calls, follow-ups, deal progress, and pipeline updates...',
      team_collaboration: 'Note team discussions, project updates, and collaborative insights...',
      goals: 'Reflect on your goals, progress made, and action plans...',
      ideas: 'Capture creative ideas, solutions, or innovative thoughts...',
      reflection: 'Reflect on lessons learned, insights gained, or personal growth...'
    };
    return placeholders[category as keyof typeof placeholders] || 'Write about your day, thoughts, ideas, or anything on your mind...';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="modal-header">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
            {editingEntry ? 'Edit Journal Entry' : 'New Journal Entry'}
          </h2>
          <button
            onClick={onClose}
            className="btn-secondary p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body space-y-4 sm:space-y-6">
          {/* Title */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="input-primary w-full px-compact py-compact text-sm sm:text-base"
              placeholder="Enter a title for your entry..."
              required
            />
          </div>

          {/* Date and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="date"
                  value={formData.entry_date}
                  onChange={(e) => handleInputChange('entry_date', e.target.value)}
                  className="input-primary w-full pl-10 pr-compact py-compact text-sm sm:text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="input-primary w-full px-compact py-compact text-sm sm:text-base"
              >
                {CATEGORIES.map(category => {
                  const Icon = category.icon;
                  return (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Mood Selection */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">
              How are you feeling about your work today?
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {MOODS.map(mood => (
                <button
                  key={mood.value}
                  type="button"
                  onClick={() => handleInputChange('mood', mood.value)}
                  className={`p-3 sm:p-4 rounded-lg border-2 transition-all text-left ${
                    formData.mood === mood.value
                      ? `${mood.color} border-current`
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <span className="text-lg sm:text-2xl mr-2 sm:mr-3 flex-shrink-0">{mood.emoji}</span>
                    <span className="font-medium text-sm sm:text-base truncate">{mood.label}</span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500 line-clamp-2">{mood.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              rows={6}
              className="input-primary w-full px-compact py-compact resize-none text-sm sm:text-base"
              placeholder={getPlaceholderText(formData.category)}
              required
            />
            <div className="mt-1 text-xs sm:text-sm text-gray-500">
              {formData.content.length} characters
            </div>
          </div>

          {/* Action Buttons */}
          <div className="modal-footer flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary px-6 py-3 text-base order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-3 disabled:opacity-50 text-base order-1 sm:order-2 flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{editingEntry ? 'Update Entry' : 'Add Entry'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}