import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface SettingsContextType {
  settings: UserSettings;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  loading: boolean;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
}

interface UserSettings {
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

const defaultSettings: UserSettings = {
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  currency: 'USD',
  dateFormat: 'MM/dd/yyyy',
  timeFormat: '12h'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [loading, setLoading] = useState(false);

  // Load user settings from Supabase
  useEffect(() => {
    if (user) {
      loadUserSettings();
    }
  }, [user]);

  const loadUserSettings = async () => {
    if (!user?.id) return;
    
    try {
      // Check if this is a demo user (stored in localStorage)
      const storedDemoUser = localStorage.getItem('demo_user');
      if (storedDemoUser) {
        // For demo users, use default settings
        setSettings(defaultSettings);
        return;
      }
      
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error);
        // Use default settings if there's an error
        setSettings(defaultSettings);
        return;
      }

      if (data) {
        setSettings({
          timezone: data.timezone || defaultSettings.timezone,
          currency: data.currency || defaultSettings.currency,
          dateFormat: data.date_format || defaultSettings.dateFormat,
          timeFormat: data.time_format || defaultSettings.timeFormat
        });
      } else {
        // No settings found, use defaults
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings if there's an error
      setSettings(defaultSettings);
    }
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) return;

    setLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      
      // Check if this is a demo user
      const storedDemoUser = localStorage.getItem('demo_user');
      if (storedDemoUser) {
        // For demo users, just update local state
        setSettings(updatedSettings);
        toast.success('Settings updated successfully (demo mode)');
        return;
      }
      
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          timezone: updatedSettings.timezone,
          currency: updatedSettings.currency,
          date_format: updatedSettings.dateFormat,
          time_format: updatedSettings.timeFormat,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error updating settings:', error);
        toast.error('Failed to update settings');
        return;
      }

      setSettings(updatedSettings);
      toast.success('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    const currencyMap: { [key: string]: { code: string; symbol: string } } = {
      USD: { code: 'USD', symbol: '$' },
      EUR: { code: 'EUR', symbol: '€' },
      GBP: { code: 'GBP', symbol: '£' },
      JPY: { code: 'JPY', symbol: '¥' },
      CAD: { code: 'CAD', symbol: 'C$' },
      AUD: { code: 'AUD', symbol: 'A$' }
    };

    const currency = currencyMap[settings.currency] || currencyMap.USD;
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.code
      }).format(amount);
    } catch {
      return `${currency.symbol}${amount.toLocaleString()}`;
    }
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(dateObj);
    } catch {
      return dateObj.toLocaleDateString();
    }
  };

  const formatTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: settings.timeFormat === '12h'
      }).format(dateObj);
    } catch {
      return dateObj.toLocaleTimeString();
    }
  };

  const formatDateTime = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: settings.timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: settings.timeFormat === '12h'
      }).format(dateObj);
    } catch {
      return `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString()}`;
    }
  };

  const value: SettingsContextType = {
    settings,
    timezone: settings.timezone,
    currency: settings.currency,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    loading,
    updateSettings,
    formatCurrency,
    formatDate,
    formatTime,
    formatDateTime
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};