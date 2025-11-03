import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Client, Interaction } from '@/lib/supabase';
import { crmApi } from '@/lib/api';

import { useAuth } from '@/contexts/AuthContext';
import AddClientModal from './AddClientModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Phone, 
  Mail, 
  Linkedin, 
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

const stageColors = {
  prospect: 'bg-gray-100 text-gray-800',
  connected: 'bg-primary-100 text-primary-800',
  replied: 'bg-yellow-100 text-yellow-800',
  meeting: 'bg-purple-100 text-purple-800',
  proposal: 'bg-orange-100 text-orange-800',
  closed: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800'
};

const stageLabels = {
  prospect: 'Prospect',
  connected: 'Connected',
  replied: 'Replied',
  meeting: 'Meeting',
  proposal: 'Proposal',
  closed: 'Closed',
  lost: 'Lost'
};

export default function CRM() {
  // Default currency formatting
  const formatCurrency = (amount: number | undefined | null) => `$${(amount || 0).toLocaleString()}`;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleClientAdded = (client: Client) => {
    if (editingClient) {
      setClients(clients.map(c => c.id === client.id ? client : c));
      setEditingClient(null);
    } else {
      setClients([client, ...clients]);
    }
  };

  const handleEditClient = (client: Client) => {
    setEditingClient(client);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingClient(null);
  };

  useEffect(() => {
    // Only fetch clients when user is authenticated
    if (user?.id) {
      fetchClients();
    }
  }, [user?.id]);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, selectedStage]);

  const fetchClients = async () => {
    // Ensure user is authenticated before making API calls
    if (!user?.id) {
      console.log('CRM.tsx - User not authenticated, skipping API calls');
      return;
    }
    
    try {
      const data = await crmApi.getClients();
      // Ensure data is always an array
      const clientsArray = Array.isArray(data) ? data : [];
      setClients(clientsArray);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to fetch clients');
      // Set empty array on error to prevent filter issues
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  const filterClients = () => {
    // Ensure clients is always an array before filtering
    const clientsArray = Array.isArray(clients) ? clients : [];
    let filtered = clientsArray;

    if (searchTerm) {
      filtered = filtered.filter(client => 
        client.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.contact_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedStage !== 'all') {
      filtered = filtered.filter(client => client.stage === selectedStage);
    }

    setFilteredClients(filtered);
  };

  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    setDeleteLoading(true);
    try {
      await crmApi.deleteClient(clientToDelete);
      setClients(clients.filter(client => client.id !== clientToDelete));
      toast.success('Client deleted successfully');
      setShowDeleteModal(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setClientToDelete(null);
  };

  const updateClientStage = async (id: string, newStage: string) => {
    try {
      const updatedClient = await crmApi.updateClient(id, { stage: newStage });
      setClients(clients.map(client => 
        client.id === id ? { ...client, stage: newStage as any } : client
      ));
      toast.success('Client stage updated');
    } catch (error) {
      console.error('Error updating client stage:', error);
      toast.error('Failed to update client stage');
    }
  };

  // Ensure clients is always an array for stats calculation
  const clientsArray = Array.isArray(clients) ? clients : [];
  const stats = {
    total: clientsArray.length,
    prospects: clientsArray.filter(c => c.stage === 'prospect').length,
    active: clientsArray.filter(c => ['connected', 'replied', 'meeting', 'proposal'].includes(c.stage)).length,
    closed: clientsArray.filter(c => c.stage === 'closed').length,
    totalValue: Array.isArray(clientsArray) ? clientsArray.reduce((sum, c) => sum + (c.deal_value || 0), 0) : 0
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-loose mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-standard sm:mb-loose gap-compact sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-primary mb-2">CRM</h1>
            <p className="text-secondary">Manage your client relationships and track deals</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-compact"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>

        {/* Stats Cards */}
        <div className="section-container">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 md:gap-6">
            <div className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-pink-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Clients</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            <div className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Prospects</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.prospects}</p>
                </div>
              </div>
            </div>
            <div className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-primary-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Prospects</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.prospects}</p>
                </div>
              </div>
            </div>
            <div className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Active Deals</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.active}</p>
                </div>
              </div>
            </div>
            <div className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Closed Deals</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{stats.closed}</p>
                </div>
              </div>
            </div>
            <div className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="bg-emerald-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">Total Value</p>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="section-container">
        <div className="flex flex-col sm:flex-row gap-standard items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-standard flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field w-full pl-10"
              />
            </div>
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="input-field min-w-[150px]"
            >
              <option value="all">All Stages</option>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center gap-compact"
          >
            <Plus className="w-4 h-4" />
            Add Client
          </button>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block section-container">
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-loose py-standard text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Last Contact
                  </th>
                  <th className="relative px-loose py-standard">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-loose py-standard whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {client.profile_image_url ? (
                            <img
                              src={client.profile_image_url}
                              alt={client.company_name}
                              className="h-10 w-10 rounded-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center ${
                              client.profile_image_url ? 'hidden' : ''
                            }`}
                          >
                            <span className="text-sm font-semibold text-white">
                              {client.company_name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-semibold text-gray-900">{client.company_name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-loose py-standard whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.contact_name || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{client.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={client.stage}
                        onChange={(e) => updateClientStage(client.id, e.target.value)}
                        className="input-field text-sm min-w-[120px]"
                      >
                        {Object.entries(stageLabels).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-loose py-standard whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(client.deal_value || 0)}
                      </div>
                    </td>
                    <td className="px-loose py-standard whitespace-nowrap text-sm text-gray-500">
                      {client.last_contact || 'N/A'}
                    </td>
                    <td className="px-loose py-standard whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-compact">
                        {client.email && (
                          <a
                          href={`mailto:${client.email}`}
                          className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="text-gray-600 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                          title="Call"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {client.linkedin_url && (
                        <a
                          href={client.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                        )}
                        <button
                          onClick={() => navigate(`/crm/client/${client.id}`)}
                          className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditClient(client)}
                          className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(client.id)}
                          className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete client"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden section-container">
        <div className="space-standard">
          {filteredClients.map((client) => (
            <div key={client.id} className="card card-body hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center flex-1">
                  <div className="flex-shrink-0 h-12 w-12 mr-3">
                    {client.profile_image_url ? (
                      <img
                        src={client.profile_image_url}
                        alt={client.company_name}
                        className="h-12 w-12 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div 
                      className={`h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center ${
                        client.profile_image_url ? 'hidden' : ''
                      }`}
                    >
                      <span className="text-sm font-semibold text-white">
                        {client.company_name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900">{client.company_name}</h3>
                    <p className="text-sm text-gray-600">{client.contact_name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-compact ml-3">
                  <button
                    onClick={() => navigate(`/crm/client/${client.id}`)}
                    className="text-gray-600 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="View Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEditClient(client)}
                    className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(client.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-standard mb-standard">
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Contact Info</p>
                  <div className="space-y-1">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700 truncate">{client.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-700">{client.phone || 'N/A'}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Deal Value</p>
                  <div className="flex items-center text-sm">
                    <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <span className="text-gray-900 font-semibold">{formatCurrency(client.deal_value || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <div className="flex-1 mr-4">
                  <p className="text-xs font-medium text-gray-500 mb-2">Stage</p>
                  <select
                    value={client.stage}
                    onChange={(e) => updateClientStage(client.id, e.target.value)}
                    className="input-field text-sm w-full"
                  >
                    {Object.entries(stageLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-compact">
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                      title="Send Email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="text-gray-600 hover:text-green-600 p-2 rounded-lg hover:bg-green-50 transition-colors"
                      title="Call"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {client.linkedin_url && (
                    <a
                      href={client.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
        
      {filteredClients.length === 0 && (
        <div className="section-container">
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-primary">No clients found</h3>
            <p className="mt-1 text-sm text-secondary">
              {searchTerm || selectedStage !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by adding your first client.'}
            </p>
            {(!searchTerm && selectedStage === 'all') && (
              <div className="mt-6">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Client
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Client Modal */}
      <AddClientModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onClientAdded={handleClientAdded}
        editingClient={editingClient}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Client"
        message="Are you sure you want to delete this client? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}