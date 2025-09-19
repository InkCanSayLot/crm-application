import React, { useState, useEffect } from 'react';
import { JournalEntry } from '@/lib/supabase';
import { journalApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import AddJournalModal from './AddJournalModal';
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
import { toast } from "react-hot-toast";

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

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      await journalApi.deleteEntry(id);
      setEntries(entries.filter(entry => entry.id !== id));
      setSelectedEntry(null);
      toast.success('Journal entry deleted successfully');
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      toast.error('Failed to delete journal entry');
    }
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
    ? filteredEntries.reduce((sum, entry) => sum + (moodValues[entry.mood as keyof typeof moodValues] || 4), 0) / filteredEntries.length
    : 4;
  const avgMood = avgMoodValue.toFixed(1);

  // Calculate mood distribution for insights
  const moodDistribution = filteredEntries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
              <div key={i} className="card-container h-32"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Journal</h1>
            <p className="text-gray-600">Capture your thoughts, ideas, and reflections</p>
          </div>
          <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2"
        >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card-container">
            <div className="flex items-center">
              <div className="bg-pink-100 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="card-container">
            <div className="flex items-center">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Week</p>
                <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
              </div>
            </div>
          </div>
          <div className="card-container">
            <div className="flex items-center">
              <div className="bg-pink-100 p-3 rounded-lg">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Mood</p>
                <div className="flex items-center space-x-2">
                   <p className="text-2xl font-bold text-gray-900">{stats.avgMood}/7</p>
                   <span className="text-lg">{moodInsight.icon}</span>
                 </div>
                <p className={`text-xs font-medium ${moodInsight.color}`}>{moodInsight.text}</p>
              </div>
            </div>
          </div>
          <div className="card-container">
            <div className="flex items-center">
              <div className="bg-pink-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-pink-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Streak</p>
                <p className="text-2xl font-bold text-gray-900">{stats.streak} days</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters and Entries List */}
        <div className="lg:col-span-3">
          {/* Month Navigation */}
          <div className="card-container mb-6">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateMonth('prev')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="px-3 py-2 text-sm bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors"
                  >
                    This Month
                  </button>
                  <button
                    onClick={() => navigateMonth('next')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search entries..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-primary w-full pl-10 pr-4 py-2"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 text-gray-400 mr-2" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="input-primary px-3 py-2 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
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
                    className="input-primary px-3 py-2"
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
            <div className="card-container mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Mood Insights & Trends</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.entries(moodDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 4)
                  .map(([mood, count]) => (
                  <div key={mood} className="text-center p-3 rounded-lg bg-gray-50">
                    <div className="text-2xl mb-1">{MOOD_EMOJIS[mood as keyof typeof MOOD_EMOJIS]}</div>
                    <div className="text-sm font-medium text-gray-900 capitalize">{mood}</div>
                    <div className="text-xs text-gray-500">{count} entries</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-lg mr-2">{moodInsight.icon}</span>
                  <span className={`font-medium ${moodInsight.color}`}>{moodInsight.text}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Based on your recent entries, this reflects your overall work satisfaction and productivity levels.
                </p>
              </div>
            </div>
          )}

          {/* Entries List */}
          <div className="space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="card-container text-center">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || selectedCategory !== 'all' || selectedMood !== 'all'
                    ? 'Try adjusting your search or filters.'
                    : 'Start journaling by creating your first entry.'}
                </p>
                {!searchTerm && selectedCategory === 'all' && selectedMood === 'all' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary inline-flex items-center px-4 py-2 text-sm font-medium"
                  >
                    <Plus className="-ml-1 mr-2 h-5 w-5" />
                    New Entry
                  </button>
                )}
              </div>
            ) : (
              filteredEntries.map(entry => {
                const CategoryIcon = getCategoryIcon(entry.category);
                return (
                  <div
                    key={entry.id}
                    className="card-container hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setSelectedEntry(entry)}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg bg-gray-100`}>
                            <CategoryIcon className={`w-4 h-4 ${getCategoryColor(entry.category)}`} />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{entry.title}</h3>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <span>{new Date(entry.entry_date).toLocaleDateString()}</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${MOOD_COLORS[entry.mood as keyof typeof MOOD_COLORS]}`}>
                                {MOOD_EMOJIS[entry.mood as keyof typeof MOOD_EMOJIS]} {entry.mood}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEntry(entry);
                            }}
                            className="btn-secondary"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEntry(entry.id);
                            }}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-3">{entry.content}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Entry Detail Sidebar */}
        <div className="lg:col-span-1">
          {selectedEntry ? (
            <div className="card-container sticky top-6">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Entry Details</h3>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="btn-secondary"
                  >
                    ×
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">{selectedEntry.title}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
                      <Calendar className="w-4 h-4" />
                      <span>{new Date(selectedEntry.entry_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2 mb-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${MOOD_COLORS[selectedEntry.mood as keyof typeof MOOD_COLORS]}`}>
                        {MOOD_EMOJIS[selectedEntry.mood as keyof typeof MOOD_EMOJIS]} {selectedEntry.mood}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Content</h5>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{selectedEntry.content}</p>
                  </div>
                  
                  <div className="flex space-x-2 pt-4 border-t">
                    <button
                      onClick={() => handleEditEntry(selectedEntry)}
                      className="flex-1 btn-primary px-3 py-2 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(selectedEntry.id)}
                      className="flex-1 btn-secondary text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card-container text-center">
              <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-3" />
              <p className="text-sm text-gray-500">Select an entry to view details</p>
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
    </div>
  );
}