import React, { useState, useEffect } from 'react';
import { Client } from '@/lib/supabase';
import { crmApi } from '@/lib/api';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (client: Client) => void;
  editingClient?: Client | null;
}

const stageOptions = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'connected', label: 'Connected' },
  { value: 'replied', label: 'Replied' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' }
];

export default function AddClientModal({ isOpen, onClose, onClientAdded, editingClient }: AddClientModalProps) {
  const [formData, setFormData] = useState({
    company_name: editingClient?.company_name || '',
    contact_name: editingClient?.contact_name || '',
    email: editingClient?.email || '',
    phone: editingClient?.phone || '',
    linkedin_url: editingClient?.linkedin_url || '',
    stage: editingClient?.stage || 'prospect',
    deal_value: editingClient?.deal_value || 0,
    assigned_to: editingClient?.assigned_to || '',
    notes: editingClient?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        console.log('Fetching users...');
        const data = await crmApi.getUsers();
        console.log('Users data received:', data);
        
        // Ensure data is always an array
        if (Array.isArray(data)) {
          setUsers(data);
          console.log('Users set successfully:', data.length, 'users');
        } else {
          console.error('Users data is not an array:', data);
          setUsers([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setUsers([]); // Ensure users remains an array on error
      }
    };
    
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingClient) {
        // Update existing client
        const data = await crmApi.updateClient(editingClient.id, formData);
        onClientAdded(data);
        toast.success('Client updated successfully');
      } else {
        // Add new client
        const data = await crmApi.createClient(formData);
        onClientAdded(data);
        toast.success('Client added successfully');
      }

      onClose();
      setFormData({
        company_name: '',
        contact_name: '',
        email: '',
        phone: '',
        linkedin_url: '',
        stage: 'prospect',
        deal_value: 0,
        assigned_to: '',
        notes: '',
      });
    } catch (error) {
      console.error('Error saving client:', error);
      toast.error(editingClient ? 'Failed to update client' : 'Failed to add client');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'deal_value' ? parseFloat(value) || 0 : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            {editingClient ? 'Edit Client' : 'Add New Client'}
          </h2>
          <button
            onClick={onClose}
            className="btn-secondary p-2"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="modal-body">
          <form id="client-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:gap-6 mobile-grid-1 sm:grid-cols-2">
            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                id="company_name"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                required
                className="input-primary w-full px-4 py-3 touch-manipulation"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label htmlFor="contact_name" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Name
              </label>
              <input
                type="text"
                id="contact_name"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                className="input-primary w-full px-4 py-3 touch-manipulation"
                placeholder="Enter contact name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                  required
                className="input-primary w-full px-4 py-3 touch-manipulation"
                placeholder="Enter email address"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                  className="input-primary w-full px-4 py-3 touch-manipulation"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label htmlFor="linkedin_url" className="block text-sm font-medium text-gray-700 mb-2">
                LinkedIn URL
              </label>
              <input
                type="url"
                id="linkedin_url"
                name="linkedin_url"
                value={formData.linkedin_url}
                onChange={handleChange}
                className="input-primary w-full px-4 py-3 touch-manipulation"
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                Stage
              </label>
              <select
                id="stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                className="input-primary w-full px-3 py-2"
              >
                {stageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="deal_value" className="block text-sm font-medium text-gray-700 mb-2">
                Deal Value
              </label>
              <input
                type="number"
                id="deal_value"
                name="deal_value"
                value={formData.deal_value}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="input-primary w-full px-4 py-3 touch-manipulation"
                placeholder="Enter deal value"
              />
            </div>

            <div>
              <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700 mb-2">
                Assigned To
              </label>
              <select
                id="assigned_to"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                  className="input-primary w-full px-4 py-3 touch-manipulation"
              >
                <option value="">Select a team member</option>
                {users && Array.isArray(users) ? users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.full_name || user.name} ({user.email})
                  </option>
                )) : (
                  <option disabled>Loading users...</option>
                )}
              </select>
            </div>

            <div className="col-span-1 sm:col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                  className="input-primary w-full px-4 py-3 touch-manipulation resize-none"
                placeholder="Enter any additional notes"
              />
            </div>
          </div>

          </form>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary w-full sm:w-auto touch-manipulation"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="client-form"
            disabled={loading}
            className="btn-primary disabled:opacity-50 w-full sm:w-auto touch-manipulation"
          >
            {loading ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
          </button>
        </div>
      </div>
    </div>
  );
}