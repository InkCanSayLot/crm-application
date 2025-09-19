import React, { useState, useEffect } from 'react';
import { Client, Interaction } from '@/lib/supabase';
import { crmApi } from '@/lib/api';
import { useSettings } from '@/contexts/SettingsContext';
import AddClientModal from './AddClientModal';
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
  Users
} from 'lucide-react';
import toast from 'react-hot-toast';

const stageColors = {
  prospect: 'bg-gray-100 text-gray-800',
  connected: 'bg-blue-100 text-blue-800',
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
  const { formatCurrency } = useSettings();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

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
    fetchClients();
  }, []);

  useEffect(() => {
    filterClients();
  }, [clients, searchTerm, selectedStage]);

  const fetchClients = async () => {
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

  const deleteClient = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      await crmApi.deleteClient(id);
      setClients(clients.filter(client => client.id !== id));
      toast.success('Client deleted successfully');
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
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
    totalValue: clientsArray.reduce((sum, c) => sum + (c.deal_value || 0), 0)
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card-container h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-primary mb-2">CRM</h1>
            <p className="text-secondary">Manage your client relationships and track deals</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </button>
        </div>

        {/* Stats Cards */}
        <div className="section-container">
          <div className="grid-responsive grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <div className="card-container">
            <div className="flex items-center">
              <div className="bg-pink-100 p-2 sm:p-3 rounded-lg">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-pink-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-secondary">Total Clients</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 sm:p-3 rounded-lg">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-secondary">Prospects</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{stats.prospects}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-2 sm:p-3 rounded-lg">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-secondary">Active Deals</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{stats.active}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-2 sm:p-3 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-secondary">Closed Deals</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{stats.closed}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 sm:p-6">
            <div className="flex items-center">
              <div className="bg-emerald-100 p-2 sm:p-3 rounded-lg">
                <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-secondary">Total Value</p>
                <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(stats.totalValue)}</p>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="section-container">
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-standard"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <select
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value)}
              className="input-standard min-w-[120px] sm:min-w-[140px]"
            >
              <option value="all">All Stages</option>
              {Object.entries(stageLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary px-3 sm:px-4 py-2 text-sm sm:text-base whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              Add Client
            </button>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="section-container">
        <div className="hidden lg:block card-container overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Client</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {client.company_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-primary">{client.company_name}</div>
                        <div className="text-sm text-secondary">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-primary">{client.contact_name || 'N/A'}</div>
                    <div className="text-sm text-secondary">{client.phone || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={client.stage}
                      onChange={(e) => updateClientStage(client.id, e.target.value)}
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border-0 ${stageColors[client.stage]}`}
                    >
                      {Object.entries(stageLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(client.deal_value || 0)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          className="btn-secondary"
                          title="Send Email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          className="btn-secondary"
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
                          className="btn-secondary"
                          title="LinkedIn"
                        >
                          <Linkedin className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => handleEditClient(client)}
                        className="btn-secondary p-1 text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteClient(client.id)}
                        className="btn-secondary p-1 text-red-600 hover:text-red-800"
                        title="Delete"
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
      <div className="lg:hidden section-container">
        <div className="grid-responsive grid-cols-1">
          {filteredClients.map((client) => (
            <div key={client.id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <span className="text-sm font-medium text-blue-600">
                      {client.company_name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-primary">{client.company_name}</h3>
                    <p className="text-sm text-secondary">{client.contact_name || 'N/A'}</p>
                  </div>
                </div>
                <span className={`badge-info text-xs`}>
                  {stageLabels[client.stage]}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-secondary">{client.email}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-secondary">{client.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-secondary">{formatCurrency(client.deal_value || 0)}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="flex items-center space-x-2">
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="btn-secondary p-1"
                      title="Send Email"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                  {client.phone && (
                    <a
                      href={`tel:${client.phone}`}
                      className="btn-secondary p-1"
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
                      className="btn-secondary p-1"
                      title="LinkedIn"
                    >
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditClient(client)}
                    className="btn-secondary p-1"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteClient(client.id)}
                    className="p-1 text-gray-400 hover:text-red-600 touch-manipulation"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clients Cards - Mobile */}
      <div className="md:hidden space-y-3">
        {filteredClients.map((client) => (
          <div key={client.id} className="card card-body">
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <h3 className="text-base font-semibold text-primary mb-1">{client.company_name}</h3>
                <p className="text-sm text-secondary">{client.email}</p>
              </div>
              <div className="flex items-center space-x-2 ml-3">
                <button
                  onClick={() => handleEditClient(client)}
                  className="btn-secondary p-2"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteClient(client.id)}
                  className="p-2 text-gray-400 hover:text-red-600 touch-manipulation"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <p className="text-xs font-medium text-muted mb-1">Contact</p>
                <p className="text-sm text-primary">{client.contact_name || 'N/A'}</p>
                <p className="text-xs text-muted">{client.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-1">Deal Value</p>
                <p className="text-sm font-semibold text-primary">{formatCurrency(client.deal_value || 0)}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <p className="text-xs font-medium text-muted mb-1">Stage</p>
                <select
                  value={client.stage}
                  onChange={(e) => updateClientStage(client.id, e.target.value)}
                  className={`text-xs font-semibold px-2 py-1 rounded-full border-0 w-full touch-manipulation ${stageColors[client.stage]}`}
                >
                  {Object.entries(stageLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-3 ml-3">
                {client.email && (
                  <a
                    href={`mailto:${client.email}`}
                    className="btn-secondary p-2"
                    title="Send Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="btn-secondary p-2"
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
                    className="btn-secondary p-2"
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
                  className="btn-primary"
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
    </div>
  );
}