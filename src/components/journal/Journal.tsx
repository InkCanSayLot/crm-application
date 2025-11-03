import React, { useState, useEffect } from 'react';
import { JournalEntry } from '@/lib/supabase';
import { journalApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AddJournalModal from './AddJournalModal';
import ConfirmationModal from '@/components/ui/ConfirmationModal';
import {
  Plus,
  Search,
  Calendar,
  Edit,
  Trash2,
  BookOpen,
  TrendingUp,
  Target,
  Heart,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users
} from 'lucide-react';
import { toast } from "sonner";

const MOOD_EMOJIS = {
  excellent: '🚀',
  good: '😊',
  motivated: '💪',
  neutral: '😐',
  challenged: '🤔',
  frustrated: '😤',
  stressed: '😰'
};

const MOOD_COLORS = {
  excellent: 'bg-pink-100 text-pink-800',
  good: 'bg-pink-100 text-pink-700',
  motivated: 'bg-pink-100 text-pink-800',
  neutral: 'bg-gray-100 text-gray-800',
  challenged: 'bg-pink-100 text-pink-600',
  frustrated: 'bg-red-100 text-red-800',
  stressed: 'bg-red-100 text-red-800'
};

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'personal', label: 'Personal', icon: Heart, color: 'text-pink-600' },
  { value: 'work', label: 'Work', icon: Target, color: 'text-pink-600' },
  { value: 'client_meeting', label: 'Client Meeting', icon: Calendar, color: 'text-pink-700' },
  { value: 'sales_activity', label: 'Sales Activity', icon: TrendingUp, color: 'text-pink-500' },
  { value: 'team_collaboration', label: 'Team Collaboration', icon: Users, color: 'text-pink-600' },
  { value: 'goals', label: 'Goals', icon: Target, color: 'text-pink-600' },
  { value: 'ideas', label: 'Ideas', icon: Lightbulb, color: 'text-pink-500' },
  { value: 'reflection', label: 'Reflection', icon: BookOpen, color: 'text-pink-700' }
];

export default function Journal() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, [user, currentDate]);

  useEffect(() => {
    filterEntries();
  }, [entries, searchTerm, selectedCategory, selectedMood]);

  const fetchEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const data = await journalApi.getEntries();
      // Ensure data is always an array
      const entriesArray = Array.isArray(data) ? data : [];
      setEntries(entriesArray);
    } catch (error) {
      console.error('Error fetching journal entries:', error);
      toast.error('Failed to fetch journal entries');
      // Set empty array on error to prevent filter issues
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEntries = () => {
    // Ensure entries is always an array before filtering
    const entriesArray = Array.isArray(entries) ? entries : [];
    let filtered = entriesArray;

    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(entry => entry.category === selectedCategory);
    }

    if (selectedMood !== 'all') {
      filtered = filtered.filter(entry => entry.mood === selectedMood);
    }

    setFilteredEntries(filtered);
  };

  const handleDeleteClick = (id: string) => {
    setEntryToDelete(id);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    setDeleteLoading(true);
    try {
      await journalApi.deleteEntry(entryToDelete);
      setEntries(entries.filter(entry => entry.id !== entryToDelete));
      setSelectedEntry(null);
      toast.success('Journal entry deleted successfully');
      setShowDeleteModal(false);
      setEntryToDelete(null);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast.error('Failed to delete journal entry');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setEntryToDelete(null);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const handleEntryAdded = (entry: JournalEntry) => {
    if (editingEntry) {
      setEntries(entries.map(e => e.id === entry.id ? entry : e));
      setEditingEntry(null);
    } else {
      setEntries([entry, ...entries]);
    }
  };

  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowAddModal(true);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingEntry(null);
  };

  const getCategoryIcon = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.icon : BookOpen;
  };

  const getCategoryColor = (category: string) => {
    const cat = CATEGORIES.find(c => c.value === category);
    return cat ? cat.color : 'text-gray-600';
  };

  // Calculate average mood (convert mood to numeric value for calculation)
  const moodValues = { stressed: 1, frustrated: 2, challenged: 3, neutral: 4, good: 5, motivated: 6, excellent: 7 };
  const avgMoodValue = filteredEntries.length > 0 
    ? Array.isArray(filteredEntries) ? filteredEntries.reduce((sum, entry) => sum + (moodValues[entry.mood as keyof typeof moodValues] || 4), 0) / filteredEntries.length : 4
    : 4;
  const avgMood = avgMoodValue.toFixed(1);

  // Calculate mood distribution for insights
  const moodDistribution = Array.isArray(filteredEntries) ? filteredEntries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) : {};

  // Get mood insights
  const getMoodInsight = () => {
    if (avgMoodValue >= 6) return { text: 'Excellent performance period', color: 'text-pink-600', icon: '🚀' };
    if (avgMoodValue >= 5) return { text: 'Positive and productive', color: 'text-pink-600', icon: '😊' };
    if (avgMoodValue >= 4.5) return { text: 'Motivated and engaged', color: 'text-pink-700', icon: '💪' };
    if (avgMoodValue >= 3.5) return { text: 'Steady progress', color: 'text-gray-600', icon: '😐' };
    if (avgMoodValue >= 2.5) return { text: 'Facing challenges', color: 'text-pink-500', icon: '🤔' };
    if (avgMoodValue >= 2) return { text: 'Need support & strategy', color: 'text-orange-600', icon: '😤' };
    return { text: 'High stress period', color: 'text-red-600', icon: '😰' };
  };

  const moodInsight = getMoodInsight();

  // Ensure entries is always an array for stats calculation
  const entriesArray = Array.isArray(entries) ? entries : [];
  const stats = {
    total: entriesArray.length,
    thisWeek: entriesArray.filter(e => {
      const entryDate = new Date(e.entry_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    }).length,
    avgMood: avgMood,
    streak: calculateStreak(entriesArray)
  };

  function calculateStreak(entries: JournalEntry[]): number {
    if (entries.length === 0) return 0;
    
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.entry_date).getTime() - new Date(a.entry_date).getTime()
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const entry of sortedEntries) {
      const entryDate = new Date(entry.entry_date);
      entryDate.setHours(0, 0, 0, 0);
      
      if (entryDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (entryDate.getTime() === currentDate.getTime() + 86400000) {
        // Entry is from yesterday, continue streak
        streak++;
        currentDate = entryDate;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Journal</h1>
            <p className="text-sm sm:text-base text-gray-600">Capture your thoughts, ideas, and reflections</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center gap-2 w-full sm:w-auto justify-center px-4 py-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            <span>New Entry</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Total Entries</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mr-2 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">This Week</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mr-2 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Avg Mood</p>
                <div className="flex items-center space-x-1 sm:space-x-2">
                   <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.avgMood}/7</p>
                   <span className="text-sm sm:text-lg">{moodInsight.icon}</span>
                 </div>
                <p className={`text-xs font-medium ${moodInsight.color} truncate`}>{moodInsight.text}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 mr-2 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs sm:text-sm text-gray-600 truncate">Streak</p>
                <p className="text-lg sm:text-xl font-semibold text-gray-900">{stats.streak} days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 sm:gap-6">
        {/* Filters and Entries List */}
        <div className="xl:col-span-3">
          {/* Month Navigation */}
          <div className="card mb-4 sm:mb-6">
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 gap-3">
                <h2 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex space-x-2 sm:space-x-3">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-2 sm:px-3 py-2 text-xs sm:text-sm bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors whitespace-nowrap"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input input-bordered w-full pl-10 pr-4 py-2 text-sm sm:text-base"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <div className="flex items-center flex-1">
                    <Filter className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="select select-bordered px-3 py-2 w-full text-sm sm:text-base"
                    >
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <select
                    value={selectedMood}
                    onChange={(e) => setSelectedMood(e.target.value)}
                    className="select select-bordered px-3 py-2 w-full sm:w-auto text-sm sm:text-base min-w-0 sm:min-w-[140px]"
                  >
                    <option value="all">All Moods</option>
                    <option value="excellent">🚀 Excellent</option>
                    <option value="good">😊 Good</option>
                    <option value="motivated">💪 Motivated</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="challenged">🤔 Challenged</option>
                    <option value="frustrated">😤 Frustrated</option>
                    <option value="stressed">😰 Stressed</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Mood Insights */}
          {filteredEntries.length > 0 && (
            <div className="card card-body mb-4 sm:mb-6 p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Mood Insights & Trends</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {Object.entries(moodDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 4)
                  .map(([mood, count]) => (
                  <div key={mood} className="text-center p-2 sm:p-3 rounded-lg bg-gray-50">
                    <div className="text-lg sm:text-xl lg:text-2xl mb-1">{MOOD_EMOJIS[mood as keyof typeof MOOD_EMOJIS]}</div>
                    <div className="text-xs sm:text-sm font-medium text-gray-900 capitalize truncate">{mood}</div>
                    <div className="text-xs text-gray-500">{count} entries</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 sm:mt-4 p-3 bg-primary-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-base sm:text-lg mr-2 flex-shrink-0">{moodInsight.icon}</span>
                  <span className={`font-medium text-sm sm:text-base ${moodInsight.color}`}>{moodInsight.text}</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Based on your recent entries, this reflects your overall work satisfaction and productivity levels.
                </p>
              </div>
            </div>
          )}

          {/* Entries List */}
          <div className="space-y-3 sm:space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No entries found</h3>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-4">
                  {searchTerm || selectedCategory !== 'all' || selectedMood !== 'all'
                    ? 'Try adjusting your filters or search terms.'
                    : 'Start documenting your thoughts and experiences.'}
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn-primary px-4 sm:px-6 py-2 inline-flex items-center space-x-2 text-sm sm:text-base"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Your First Entry</span>
                </button>
              </div>
            ) : (
              filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`card card-body p-3 sm:p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedEntry?.id === entry.id ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <span className="text-base sm:text-lg flex-shrink-0">{MOOD_EMOJIS[entry.mood as keyof typeof MOOD_EMOJIS]}</span>
                      <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{entry.title}</h3>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm text-gray-500 flex-shrink-0">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      <span className="sm:hidden">{new Date(entry.entry_date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 mb-2">
                    {entry.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 truncate max-w-[120px] sm:max-w-none">
                      {entry.category ? entry.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Uncategorized'}
                    </span>
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEntry(entry);
                          setShowAddModal(true);
                        }}
                        className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(entry.id);
                        }}
                        className="text-gray-400 hover:text-red-600 transition-colors p-1"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Entry Detail Sidebar */}
        <div className="xl:col-span-1">
          {selectedEntry ? (
            <div className="card sticky top-6">
              <div className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900">Entry Details</h3>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="btn btn-secondary p-1.5 sm:p-2 text-base sm:text-lg"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">{selectedEntry.title}</h4>
                    <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mb-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{new Date(selectedEntry.entry_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${MOOD_COLORS[selectedEntry.mood as keyof typeof MOOD_COLORS]}`}>
                        {MOOD_EMOJIS[selectedEntry.mood as keyof typeof MOOD_EMOJIS]} {selectedEntry.mood}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2 text-sm sm:text-base">Content</h5>
                    <p className="text-xs sm:text-sm text-gray-600 whitespace-pre-wrap">{selectedEntry.content}</p>
                  </div>
                  
                  <div className="flex space-x-2 pt-3 sm:pt-4 border-t">
                    <button
                      onClick={() => handleEditEntry(selectedEntry)}
                      className="flex-1 btn btn-primary px-3 py-2 text-xs sm:text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteClick(selectedEntry.id)}
                      className="flex-1 btn btn-secondary px-3 py-2 text-xs sm:text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card card-body text-center p-4 sm:p-6">
              <BookOpen className="mx-auto h-6 w-6 sm:h-8 sm:w-8 text-gray-400 mb-2 sm:mb-3" />
              <p className="text-xs sm:text-sm text-gray-500">Select an entry to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Journal Modal */}
      <AddJournalModal
        isOpen={showAddModal}
        onClose={handleCloseModal}
        onEntryAdded={handleEntryAdded}
        editingEntry={editingEntry}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Journal Entry"
        message="Are you sure you want to delete this journal entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}