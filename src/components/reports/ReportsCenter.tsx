import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  DollarSign,
  Users,
  Building,
  Clock,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Trash2,
  X
} from 'lucide-react';
import { financialApi, crmApi, reportsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'financial' | 'client' | 'performance';
  fields: string[];
}

interface ExportJob {
  id: string;
  reportName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  downloadUrl?: string;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Delete', 
  cancelText = 'Cancel' 
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReportsCenter() {
  const [selectedReport, setSelectedReport] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [exportFormat, setExportFormat] = useState<'csv' | 'pdf'>('csv');
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    clientId: '',
    category: '',
    status: ''
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<ExportJob | null>(null);

  const handleDeleteClick = (job: ExportJob) => {
    setJobToDelete(job);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;

    try {
      await reportsApi.deleteExportJob(jobToDelete.id);
      setExportJobs(prev => prev.filter(job => job.id !== jobToDelete.id));
      toast.success('Export job deleted successfully');
    } catch (error) {
      console.error('Error deleting export job:', error);
      toast.error('Failed to delete export job');
    } finally {
      setShowDeleteModal(false);
      setJobToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setJobToDelete(null);
  };

  const reportTemplates: ReportTemplate[] = [
    {
      id: 'financial-summary',
      name: 'Financial Summary Report',
      description: 'Complete overview of revenue, expenses, and profit margins',
      icon: <DollarSign className="w-5 h-5" />,
      category: 'financial',
      fields: ['Total Revenue', 'Total Expenses', 'Net Profit', 'Profit Margin', 'Monthly Breakdown']
    },
    {
      id: 'client-profitability',
      name: 'Client Profitability Analysis',
      description: 'Detailed analysis of revenue and costs per client',
      icon: <TrendingUp className="w-5 h-5" />,
      category: 'financial',
      fields: ['Client Revenue', 'Client Expenses', 'Profit per Client', 'ROI Analysis']
    },
    {
      id: 'budget-performance',
      name: 'Budget Performance Report',
      description: 'Budget vs actual spending analysis with variance reporting',
      icon: <FileText className="w-5 h-5" />,
      category: 'financial',
      fields: ['Budget Allocations', 'Actual Spending', 'Variance Analysis', 'Budget Utilization']
    },
    {
      id: 'payment-tracking',
      name: 'Payment Tracking Report',
      description: 'Comprehensive payment history and outstanding invoices',
      icon: <CheckCircle className="w-5 h-5" />,
      category: 'financial',
      fields: ['Payment History', 'Outstanding Invoices', 'Payment Methods', 'Collection Status']
    },
    {
      id: 'client-overview',
      name: 'Client Overview Report',
      description: 'Complete client portfolio with engagement metrics',
      icon: <Users className="w-5 h-5" />,
      category: 'client',
      fields: ['Client Details', 'Engagement History', 'Deal Pipeline', 'Communication Log']
    },
    {
      id: 'vendor-analysis',
      name: 'Vendor Analysis Report',
      description: 'Vendor performance and expense analysis',
      icon: <Building className="w-5 h-5" />,
      category: 'performance',
      fields: ['Vendor Spending', 'Performance Metrics', 'Contract Analysis', 'Cost Optimization']
    },
    {
      id: 'monthly-dashboard',
      name: 'Monthly Dashboard Report',
      description: 'Executive summary with key performance indicators',
      icon: <Calendar className="w-5 h-5" />,
      category: 'performance',
      fields: ['KPI Summary', 'Growth Metrics', 'Financial Health', 'Client Acquisition']
    },
    {
      id: 'expense-breakdown',
      name: 'Expense Breakdown Report',
      description: 'Detailed categorization and analysis of all expenses',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      category: 'financial',
      fields: ['Expense Categories', 'Vendor Breakdown', 'Monthly Trends', 'Cost Centers']
    }
  ];

  useEffect(() => {
    loadExportHistory();
  }, []);

  const loadExportHistory = async () => {
    try {
      const response = await reportsApi.getExportHistory({ limit: 20 });
      const jobs: ExportJob[] = response.map((job: any) => ({
        id: job.id,
        reportName: job.report_name,
        status: job.status,
        createdAt: job.created_at,
        downloadUrl: job.status === 'completed' ? job.id : undefined
      }));
      setExportJobs(jobs);
    } catch (error) {
      console.error('Error loading export history:', error);
      toast.error('Failed to load export history');
      setExportJobs([]);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      toast.error('Please select a report template');
      return;
    }

    const template = reportTemplates.find(t => t.id === selectedReport);
    if (!template) return;

    setLoading(true);
    
    try {
      const params = {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        format: exportFormat
      };

      let response;
      switch (selectedReport) {
        case 'financial-summary':
          response = await reportsApi.generateFinancialSummary(params);
          break;
        case 'client-profitability':
          response = await reportsApi.generateClientProfitability(params);
          break;
        case 'budget-performance':
          response = await reportsApi.generateBudgetPerformance(params);
          break;
        default:
          throw new Error('Unknown report type');
      }

      toast.success('Report generated successfully');
      
      // Reload export history to show the new job
      await loadExportHistory();

    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (job: ExportJob) => {
    if (job.status !== 'completed' || !job.downloadUrl) return;
    
    try {
      if (exportFormat === 'csv') {
        reportsApi.exportCSV(job.id);
      } else if (exportFormat === 'pdf') {
        reportsApi.exportPDF(job.id);
      }
      toast.success(`Downloading ${job.reportName}`);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
  };

  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: ExportJob['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'processing':
        return 'Processing...';
      case 'failed':
        return 'Failed';
      default:
        return 'Pending';
    }
  };

  const categorizedTemplates = {
    financial: reportTemplates.filter(t => t.category === 'financial'),
    client: reportTemplates.filter(t => t.category === 'client'),
    performance: reportTemplates.filter(t => t.category === 'performance')
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Export Center</h1>
          <p className="text-gray-600">Generate comprehensive reports and export your data</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Generation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Report Templates */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Report Templates</h2>
              <p className="text-sm text-gray-600">Choose a report template to generate</p>
            </div>
            <div className="card-body">
              {Object.entries(categorizedTemplates).map(([category, templates]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 capitalize">
                    {category} Reports
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedReport === template.id
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => setSelectedReport(template.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 p-2 rounded-lg ${
                            selectedReport === template.id
                              ? 'bg-primary-100 text-primary-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {template.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900">
                              {template.name}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {template.description}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {template.fields.slice(0, 3).map((field, index) => (
                                <span
                                  key={index}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                >
                                  {field}
                                </span>
                              ))}
                              {template.fields.length > 3 && (
                                <span className="text-xs text-gray-500">
                                  +{template.fields.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Report Configuration */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Report Configuration</h2>
              <p className="text-sm text-gray-600">Configure your report parameters</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Export Format
                  </label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'csv' | 'pdf')}
                    className="input-field"
                  >
                    <option value="csv">CSV (Excel Compatible)</option>
                    <option value="pdf">PDF Document</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client Filter (Optional)
                  </label>
                  <select
                    value={filters.clientId}
                    onChange={(e) => setFilters(prev => ({ ...prev, clientId: e.target.value }))}
                    className="input-field"
                  >
                    <option value="">All Clients</option>
                    <option value="client1">Acme Corporation</option>
                    <option value="client2">Tech Solutions Inc</option>
                    <option value="client3">Global Enterprises</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleGenerateReport}
                  disabled={loading || !selectedReport}
                  className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Export History */}
        <div className="space-y-6">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Export History</h2>
              <p className="text-sm text-gray-600">Recent report generations</p>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {exportJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(job.status)}
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {job.reportName}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {getStatusText(job.status)}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs text-gray-500">
                          {job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {job.status === 'completed' && job.downloadUrl && (
                        <button
                          onClick={() => handleDownload(job)}
                          className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Download Report"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteClick(job)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Export Job"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {exportJobs.length === 0 && (
                  <div className="text-center py-6">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No reports yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Generate your first report to see it here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <FileSpreadsheet className="w-5 h-5 text-green-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Export All Data</p>
                      <p className="text-xs text-gray-500">Complete data export</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-red-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Monthly Summary</p>
                      <p className="text-xs text-gray-500">Executive report</p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-gray-400" />
                </button>

                <button className="w-full flex items-center justify-between p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-blue-600 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Schedule Report</p>
                      <p className="text-xs text-gray-500">Automated generation</p>
                    </div>
                  </div>
                  <Filter className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Export Job"
        message={`Are you sure you want to delete "${jobToDelete?.reportName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}