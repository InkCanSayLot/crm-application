import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Shield, Calendar, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import Avatar from '../ui/Avatar';


interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  location?: string;
  role: string;
  avatar_url?: string;
  created_at: string;
  last_active?: string;
  status: 'online' | 'active' | 'inactive';
}

export default function Team() {
  // Default date formatting
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');


  // Fetch team members from Supabase
  const fetchTeamMembers = async () => {
    try {
      console.log('Fetching team members from Supabase...');
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: true });

      console.log('Supabase query result:', { users, error });

      if (error) {
        console.error('Error fetching team members:', error);
        toast.error('Failed to load team members');
        return;
      }

      // Transform users data to match TeamMember interface
      const transformedUsers: TeamMember[] = users?.map(user => {
        const now = new Date();
        const lastSeen = new Date(user.last_seen || user.updated_at || user.created_at);
        const hoursDiff = (now.getTime() - lastSeen.getTime()) / (1000 * 60 * 60);
        
        // Use is_online field for accurate online status, fallback to last_seen within 1 hour
        const isOnline = user.is_online || hoursDiff < 1;
        const isActive = user.is_online || hoursDiff < 24;
        
        return {
          id: user.id,
          full_name: user.full_name || user.name || user.email.split('@')[0], // Fallback to email prefix if name is null
          email: user.email,
          phone: user.phone || '',
          location: user.location || '',
          role: user.role || 'Member',
          avatar_url: user.avatar_url, // Use only the stored avatar URL, no fallback generation
          created_at: user.created_at,
          last_active: user.last_seen || user.updated_at,
          status: isOnline ? 'online' : (isActive ? 'active' : 'inactive')
        };
      }) || [];

      console.log('Transformed users:', transformedUsers);
      setTeamMembers(transformedUsers);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || member.role.toLowerCase().includes(filterRole.toLowerCase());
    return matchesSearch && matchesFilter;
  });



  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-skeleton">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
              <Users className="mr-2 sm:mr-3 h-6 w-6 sm:h-8 sm:w-8 text-pink-600" />
              Team Management
            </h1>
            <p className="text-muted mt-1 text-sm sm:text-base">
              Manage your Empty operations team members
            </p>
          </div>

        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 w-full text-sm sm:text-base touch-target"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-primary pl-9 sm:pl-10 pr-8 py-2.5 sm:py-2 w-full sm:w-auto appearance-none text-sm sm:text-base touch-target"
            >
              <option value="all">All Roles</option>
              <option value="CEO">CEO</option>
              <option value="CGO">CGO</option>
              <option value="CTO">CTO</option>
            </select>
          </div>
        </div>
      </div>

      {/* Team Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="card-container p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-pink-100 rounded-lg flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-pink-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted">Total Members</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{teamMembers.length}</p>
            </div>
          </div>
        </div>
        <div className="card-container p-4 sm:p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg flex-shrink-0">
              <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted">Active Members</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.status === 'active').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card-container p-4 sm:p-6 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary-600" />
            </div>
            <div className="ml-3 sm:ml-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-muted">Online Now</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                {teamMembers.filter(m => m.status === 'online').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Members List */}
      <div className="card-container">
        <div className="card-header">
          <h2 className="text-base sm:text-lg font-semibold text-primary">Team Members</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {filteredMembers.map((member) => (
            <div key={member.id} className="p-4 sm:p-6 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-target">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                  <Avatar 
                    name={member.full_name}
                    avatarUrl={member.avatar_url}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{member.full_name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full self-start ${
                        member.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 font-medium mt-1">{member.role}</p>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 mt-2 space-y-1 sm:space-y-0 text-xs sm:text-sm text-gray-500">
                      <div className="flex items-center">
                        <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span>{member.phone}</span>
                        </div>
                      )}
                      {member.location && (
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                          <span>{member.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right flex-shrink-0">
                  <p className="text-xs sm:text-sm text-gray-500">Joined {formatDate(member.created_at)}</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Last active: {formatLastActive(member.last_active)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredMembers.length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No team members found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterRole !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'No team members have been added yet.'}
          </p>
        </div>
      )}


    </div>
  );
}