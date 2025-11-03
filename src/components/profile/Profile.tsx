import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

import { crmApi } from '@/lib/api';
import {
  User,

  Mail,
  Phone,
  MapPin,
  Building,
  Save,

  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  company: string;
  role: string;
  bio: string;
  avatar?: string;
}



interface SecuritySettings {
  sessionTimeout: string;
  passwordLastChanged: string;
}

export default function Profile() {
  const { user, updateUser } = useAuth();


  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  const [profile, setProfile] = useState<UserProfile>({
    name: '',
    email: '',
    phone: '',
    location: '',
    company: '',
    role: '',
    bio: '',
  });

  const fetchUserProfile = async () => {
    if (user?.id) {
      try {
        // Use API instead of direct Supabase call to handle both demo and real users
        const response = await crmApi.getUsers();
        
        // Handle both old format (direct array) and new format ({success: true, data: []})
        const userData = Array.isArray(response) ? response : ((response as any)?.data || []);
        
        if (!Array.isArray(userData)) {
          console.error('Users data is not an array:', userData);
          throw new Error('Invalid users data format');
        }
        
        const currentUser = userData.find((u: any) => u.id === user.id);
        
        if (currentUser) {
          setProfile({
            name: currentUser.full_name || currentUser.name || '',
            email: currentUser.email || user.email || '',
            phone: currentUser.phone || '',
            location: currentUser.location || '',
            company: currentUser.company || '',
            role: currentUser.role || '',
            bio: currentUser.bio || '',
            avatar: currentUser.avatar_url || ''
          });
        } else {
          // Set default values from auth user if not found in database
          setProfile(prev => ({
            ...prev,
            name: user.user_metadata?.name || '',
            email: user.email || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
        // Set default values from auth user on error
        setProfile(prev => ({
          ...prev,
          name: user.user_metadata?.name || '',
          email: user.email || ''
        }));
      }
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);



  const [security, setSecurity] = useState<SecuritySettings>({
    sessionTimeout: '24h',
    passwordLastChanged: '2024-01-15'
  });

  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });





  const handleProfileSave = async () => {
    console.log('Profile.tsx - handleProfileSave called');
    console.log('Profile.tsx - user object:', user);
    console.log('Profile.tsx - user.id:', user?.id, 'Type:', typeof user?.id);
    
    if (!user?.id) {
      console.log('Profile.tsx - No user ID, returning early');
      return;
    }
    
    setLoading(true);
    try {
      // Always use API path for both demo and real users since demo users exist in database
      console.log('Profile.tsx - Using API path');
      console.log('Profile.tsx - Updating user with ID:', user.id, 'Type:', typeof user.id);
      await crmApi.updateUser(user.id, {
        full_name: profile.name,
        name: profile.name, // Keep both for compatibility
        email: profile.email,
        phone: profile.phone,
        location: profile.location,
        company: profile.company,
        role: profile.role,
        bio: profile.bio
      });

      // Update the auth context with new user data
      updateUser({
        email: profile.email,
        user_metadata: {
          ...user.user_metadata,
          name: profile.name,
          role: profile.role
        }
      });
      
      // Refetch the profile data to show updated values
      await fetchUserProfile();
      
      // Notify other components (like Layout) that the profile was updated
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (passwords.new.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwords.new
      });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setPasswords({ current: '', new: '', confirm: '' });
      setShowPasswordChange(false);
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'security', name: 'Security', icon: Shield }
  ];

  return (
    <div className="page-container py-3 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="card-container mb-4 sm:mb-6 lg:mb-8">
          <div className="px-3 sm:px-4 lg:px-loose py-4 sm:py-6 lg:py-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 lg:space-x-loose text-center sm:text-left">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-lg sm:text-xl lg:text-2xl font-bold">
                      {profile.name.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>


              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">{profile.name || 'User'}</h1>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 truncate">{profile.role}</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{profile.company}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card-container">
          <div className="border-b border-light">
            <nav className="-mb-px flex space-x-2 sm:space-x-4 lg:space-x-8 px-3 sm:px-4 lg:px-loose overflow-x-auto scrollbar-hide">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-2.5 sm:py-3 lg:py-standard px-0.5 sm:px-1 border-b-2 font-medium text-xs sm:text-sm flex items-center space-x-1 sm:space-x-2 lg:space-x-compact transition-colors whitespace-nowrap min-w-0 flex-shrink-0 ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-medium'
                    }`}
                  >
                    <tab.icon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="hidden xs:inline sm:inline truncate">{tab.name}</span>
                    <span className="xs:hidden sm:hidden">{tab.name.charAt(0)}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-3 sm:p-4 lg:p-loose">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-3 sm:space-y-4 lg:space-loose">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-loose">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                        className="input-primary w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                        className="input-primary w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        className="input-primary w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                        placeholder="Enter your phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      <input
                        type="text"
                        value={profile.location}
                        onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                        className="input-primary w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Company
                    </label>
                    <div className="relative">
                      <Building className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                        className="input-primary w-full pl-8 sm:pl-9 lg:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                        placeholder="Enter your company"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Role
                    </label>
                    <select
                      value={profile.role}
                      onChange={(e) => setProfile(prev => ({ ...prev, role: e.target.value }))}
                      className="input-primary w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base"
                    >
                      <option value="">Select a role</option>
                      <option value="CEO">CEO</option>
                      <option value="CGO">CGO</option>
                      <option value="CTO">CTO</option>
                    </select>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    className="input-primary w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-3 text-xs sm:text-sm lg:text-base resize-none"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="sm:col-span-2 flex justify-center sm:justify-end">
                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="btn-primary px-4 sm:px-6 lg:px-loose py-2 sm:py-2.5 lg:py-compact flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm lg:text-base w-full sm:w-auto"
                  >
                    <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </div>
              </div>
            )}



            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-3 sm:space-y-4 lg:space-y-loose">
                <h3 className="text-sm sm:text-base lg:text-lg font-medium text-gray-900">Security Settings</h3>
                
                <div className="bg-gray-50 p-4 sm:p-loose rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
                    <button
                      onClick={() => setShowPasswordChange(!showPasswordChange)}
                      className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium px-2 py-1"
                    >
                      {showPasswordChange ? 'Cancel' : 'Change'}
                    </button>
                  </div>
                  
                  {showPasswordChange && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          value={passwords.current}
                          onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                          className="input-primary w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                          placeholder="Enter current password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          value={passwords.new}
                          onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                          className="input-primary w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                          placeholder="Enter new password"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          value={passwords.confirm}
                          onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                          className="input-primary w-full px-2.5 sm:px-3 lg:px-4 py-2 sm:py-2.5 lg:py-compact text-xs sm:text-sm lg:text-base"
                          placeholder="Confirm new password"
                        />
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-center sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                        <button
                          onClick={() => setShowPasswordChange(false)}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 order-2 sm:order-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handlePasswordChange}
                          disabled={loading}
                          className="btn-primary px-4 py-2 text-sm font-medium order-1 sm:order-2"
                        >
                          {loading ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                     </div>
                   )}
                 </div>
                 

              </div>
            )}


        </div>
      </div>
    </div>
  );
}