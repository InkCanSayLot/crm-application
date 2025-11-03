import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome back!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (userEmail: string, userPassword: string) => {
    setLoading(true);
    try {
      const { error } = await signIn(userEmail, userPassword);
      if (error) {
        toast.error(error);
      } else {
        toast.success('Welcome back!');
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="card-container w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Sign in to Empty Operations CRM</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-primary w-full px-4 py-3 transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-primary w-full px-4 py-3 transition-colors pr-12"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8">
          <p className="text-sm text-gray-600 mb-4 text-center">Select User:</p>
          <div className="space-y-2">
            <button
              onClick={() => quickLogin('william@emptyad.com', 'demo')}
              disabled={loading}
              className="btn-secondary w-full text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium text-primary-800">William Walsh (CEO)</span>
              <br />
              <span className="text-primary-600">william@emptyad.com</span>
            </button>
            <button
              onClick={() => quickLogin('beck@emptyad.com', 'demo')}
              disabled={loading}
              className="btn-secondary w-full text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium text-primary-800">Beck Majdell (CGO)</span>
              <br />
              <span className="text-primary-600">beck@emptyad.com</span>
            </button>
            <button
              onClick={() => quickLogin('roman@emptyad.com', 'demo')}
              disabled={loading}
              className="btn-secondary w-full text-left text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="font-medium text-primary-800">M.A. Roman (CTO)</span>
              <br />
              <span className="text-primary-600">roman@emptyad.com</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}