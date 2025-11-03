import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Calendar,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Filter,
  ArrowLeft
} from 'lucide-react';
import { financialApi, crmApi } from '@/lib/api';
import { BudgetProgressChart, ProgressBar } from '@/components/charts/ChartComponents';
import { Client } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface Budget {
  id: string;
  client_id: string;
  category: string;
  allocated_amount: number;
  spent_amount: number;
  remaining_amount: number;
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'overbudget';
  created_at: string;
}

interface BudgetFormData {
  client_id: string;
  category: string;
  allocated_amount: number;
  start_date: string;
  end_date: string;
}

export default function BudgetManagement() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState<BudgetFormData>({
    client_id: '',
    category: '',
    allocated_amount: 0,
    start_date: '',
    end_date: ''
  });

  const formatCurrency = (amount: number | undefined | null) => `$${(amount || 0).toLocaleString()}`;

  const budgetCategories = [
    'Marketing',
    'Development',
    'Design',
    'Consulting',
    'Operations',
    'Research',
    'Training',
    'Other'
  ];

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterBudgets();
  }, [budgets, searchTerm, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [budgetsData, clientsData] = await Promise.all([
        financialApi.getBudgets(),
        crmApi.getClients()
      ]);
      setBudgets(budgetsData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load budget data');
    } finally {
      setLoading(false);
    }
  };

  const filterBudgets = () => {
    let filtered = budgets;

    if (searchTerm) {
      filtered = filtered.filter(budget =>
        budget.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getClientName(budget.client_id).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    setFilteredBudgets(filtered);
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.company_name : 'Unknown Client';
  };

  const getBudgetProgress = (budget: Budget) => {
    return (budget.spent_amount / budget.allocated_amount) * 100;
  };

  const getProgressColor = (progress: number) => {
    if (progress > 90) return 'bg-red-500';
    if (progress > 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'completed':
        return 'text-blue-600 bg-blue-100';
      case 'overbudget':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.client_id || !formData.category || !formData.allocated_amount) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingBudget) {
        await financialApi.updateBudget(editingBudget.id, formData);
        toast.success('Budget updated successfully');
      } else {
        await financialApi.createBudget(formData);
        toast.success('Budget created successfully');
      }
      
      setShowAddModal(false);
      setEditingBudget(null);
      setFormData({
        client_id: '',
        category: '',
        allocated_amount: 0,
        start_date: '',
        end_date: ''
      });
      loadData();
    } catch (error) {
      console.error('Error saving budget:', error);
      toast.error('Failed to save budget');
    }
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      client_id: budget.client_id,
      category: budget.category,
      allocated_amount: budget.allocated_amount,
      start_date: budget.start_date.split('T')[0],
      end_date: budget.end_date.split('T')[0]
    });
    setShowAddModal(true);
  };

  const handleDelete = async (budgetId: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return;

    try {
      await financialApi.deleteBudget(budgetId);
      toast.success('Budget deleted successfully');
      loadData();
    } catch (error) {
      console.error('Error deleting budget:', error);
      toast.error('Failed to delete budget');
    }
  };

  const closeModal = () => {
    setShowAddModal(false);
    setEditingBudget(null);
    setFormData({
      client_id: '',
      category: '',
      allocated_amount: 0,
      start_date: '',
      end_date: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/financial')}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Financial Dashboard
      </button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Management</h1>
          <p className="text-gray-600">Create and track project budgets</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Budget
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search budgets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
            />
          </div>
        </div>
        <div className="sm:w-48">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="overbudget">Over Budget</option>
          </select>
        </div>
      </div>

      {/* Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBudgets.map((budget) => {
          const progress = getBudgetProgress(budget);
          return (
            <div key={budget.id} className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{budget.category}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(budget.status)}`}>
                    {budget.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{getClientName(budget.client_id)}</p>
              </div>
              
              <div className="card-body">
                <div className="space-y-4">
                  {/* Budget Progress */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Progress</span>
                      <span className="text-sm text-gray-600">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          progress > 100 ? 'bg-red-500' : progress > 80 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Budget Details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Allocated</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(budget.allocated_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Spent</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {formatCurrency(budget.spent_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Remaining</p>
                      <p className={`text-sm font-semibold ${
                        budget.remaining_amount >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(budget.remaining_amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">End Date</p>
                      <p className="text-sm text-gray-900">
                        {new Date(budget.end_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Warning for over budget */}
                  {progress > 100 && (
                    <div className="flex items-center p-2 bg-red-50 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-xs text-red-700">Budget exceeded</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card-footer">
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-primary-50 transition-colors"
                    title="Edit Budget"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete Budget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredBudgets.length === 0 && (
        <div className="text-center py-12">
          <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No budgets found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Get started by creating your first budget.'}
          </p>
          {(!searchTerm && statusFilter === 'all') && (
            <div className="mt-6">
              <button
                onClick={() => setShowAddModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Budget
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {editingBudget ? 'Edit Budget' : 'Create New Budget'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    value={formData.client_id}
                    onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.company_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                    required
                  >
                    <option value="">Select a category</option>
                    {budgetCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allocated Amount *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.allocated_amount}
                    onChange={(e) => setFormData({ ...formData, allocated_amount: parseFloat(e.target.value) || 0 })}
                    className="input-field"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingBudget ? 'Update Budget' : 'Create Budget'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}