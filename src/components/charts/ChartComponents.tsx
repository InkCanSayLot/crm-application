import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Doughnut, Pie } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Common chart options
const commonOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
    },
  },
};

// Revenue vs Expenses Bar Chart
interface RevenueExpenseChartProps {
  data: {
    labels: string[];
    revenue: number[];
    expenses: number[];
  };
  height?: number;
}

export function RevenueExpenseChart({ data, height = 300 }: RevenueExpenseChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Revenue',
        data: data.revenue,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: data.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + (value || 0).toLocaleString();
          }
        }
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Monthly Trend Line Chart
interface MonthlyTrendChartProps {
  data: {
    labels: string[];
    values: number[];
    label: string;
  };
  color?: string;
  height?: number;
}

export function MonthlyTrendChart({ 
  data, 
  color = 'rgba(59, 130, 246, 1)', 
  height = 300 
}: MonthlyTrendChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: data.label,
        data: data.values,
        borderColor: color,
        backgroundColor: color.replace('1)', '0.1)'),
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + (value || 0).toLocaleString();
          }
        }
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

// Budget Progress Chart
interface BudgetProgressChartProps {
  data: {
    labels: string[];
    budgeted: number[];
    spent: number[];
  };
  height?: number;
}

export function BudgetProgressChart({ data, height = 300 }: BudgetProgressChartProps) {
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Budgeted',
        data: data.budgeted,
        backgroundColor: 'rgba(156, 163, 175, 0.8)',
        borderColor: 'rgba(156, 163, 175, 1)',
        borderWidth: 1,
      },
      {
        label: 'Spent',
        data: data.spent,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + (value || 0).toLocaleString();
          }
        }
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Expense Category Pie Chart
interface ExpenseCategoryChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  height?: number;
}

export function ExpenseCategoryChart({ data, height = 300 }: ExpenseCategoryChartProps) {
  const colors = [
    'rgba(239, 68, 68, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(245, 158, 11, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(14, 165, 233, 0.8)',
    'rgba(34, 197, 94, 0.8)',
  ];

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        data: data.values,
        backgroundColor: colors.slice(0, data.labels.length),
        borderColor: colors.slice(0, data.labels.length).map(color => color.replace('0.8', '1')),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.label || '';
            const value = context.parsed;
            const total = Array.isArray(context.dataset.data) ? context.dataset.data.reduce((a: number, b: number) => a + b, 0) : 0;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: $${(value || 0).toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <div style={{ height }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

// Client Profitability Chart
interface ClientProfitabilityChartProps {
  data: {
    labels: string[];
    revenue: number[];
    expenses: number[];
  };
  height?: number;
}

export function ClientProfitabilityChart({ data, height = 300 }: ClientProfitabilityChartProps) {
  // Validate data and provide defaults
  if (!data || !data.revenue || !data.expenses || !data.labels) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-gray-500">
        No client profitability data available
      </div>
    );
  }

  const profit = data.revenue.map((rev, index) => rev - data.expenses[index]);
  
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Revenue',
        data: data.revenue,
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      },
      {
        label: 'Expenses',
        data: data.expenses,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgba(239, 68, 68, 1)',
        borderWidth: 1,
      },
      {
        label: 'Profit',
        data: profit,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return '$' + (value || 0).toLocaleString();
          }
        }
      },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

// Cash Flow Chart
interface CashFlowChartProps {
  data: {
    labels: string[];
    inflow: number[];
    outflow: number[];
  };
  height?: number;
}

export function CashFlowChart({ data, height = 300 }: CashFlowChartProps) {
  // Validate data and provide defaults
  if (!data || !data.inflow || !data.outflow || !data.labels) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-gray-500">
        No cash flow data available
      </div>
    );
  }

  const netFlow = data.inflow.map((inflow, index) => inflow - data.outflow[index]);
  
  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Cash Inflow',
        data: data.inflow,
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Cash Outflow',
        data: data.outflow,
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        fill: false,
        tension: 0.4,
      },
      {
        label: 'Net Cash Flow',
        data: netFlow,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    ...commonOptions,
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return '$' + (value || 0).toLocaleString();
          }
        }
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}

// Simple Progress Bar Chart
interface ProgressBarProps {
  label: string;
  current: number;
  target: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ 
  label, 
  current, 
  target, 
  color = 'bg-blue-500',
  height = 20 
}: ProgressBarProps) {
  const percentage = Math.min((current / target) * 100, 100);
  const isOverBudget = current > target;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-600">
          ${(current || 0).toLocaleString()} / ${(target || 0).toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full" style={{ height }}>
        <div
          className={`${isOverBudget ? 'bg-red-500' : color} rounded-full transition-all duration-300`}
          style={{ 
            width: `${Math.min(percentage, 100)}%`, 
            height: '100%' 
          }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className={`text-xs ${isOverBudget ? 'text-red-600' : 'text-gray-500'}`}>
          {percentage.toFixed(1)}% {isOverBudget ? 'over budget' : 'of budget'}
        </span>
        {isOverBudget && (
          <span className="text-xs text-red-600 font-medium">
            ${((current || 0) - (target || 0)).toLocaleString()} over
          </span>
        )}
      </div>
    </div>
  );
}