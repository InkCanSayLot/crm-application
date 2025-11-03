/**
 * Vercel deploy entry handler, for serverless deployment
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['https://emptycrm.vercel.app', 'http://localhost:5173'];
  const origin = req.headers.origin;
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://emptycrm.vercel.app');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Simple routing for API endpoints only
  const url = req.url || '';
  
  // Only handle API routes
  if (!url.startsWith('/api/')) {
    res.status(404).json({ error: 'Not Found' });
    return;
  }

  try {
    // Health endpoint
    if (url === '/api/health') {
      res.status(200).json({
        success: true,
        message: 'API is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'production',
        supabase_configured: !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY)
      });
      return;
    }

    // CRM Users endpoint - return mock data for now until Supabase is configured
    if (url === '/api/crm/users' && req.method === 'GET') {
      // Check if Supabase is configured
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
        // Return mock data structure that matches expected format
        res.status(200).json({
          success: true,
          data: [
            {
              id: '1',
              full_name: 'John Doe',
              email: 'john@example.com',
              phone: '+1-555-0123',
              company: 'Acme Corp',
              role: 'Manager',
              created_at: new Date().toISOString()
            },
            {
              id: '2', 
              full_name: 'Jane Smith',
              email: 'jane@example.com',
              phone: '+1-555-0124',
              company: 'Tech Solutions',
              role: 'Developer',
              created_at: new Date().toISOString()
            },
            {
              id: '3',
              full_name: 'Mike Johnson',
              email: 'mike@example.com',
              phone: '+1-555-0125',
              company: 'Design Studio',
              role: 'Designer',
              created_at: new Date().toISOString()
            }
          ]
        });
        return;
      }

      // If Supabase is configured, try to use it
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
        );

        const { data: users, error } = await supabase
          .from('users')
          .select('id, email, name, full_name, phone, location, company, role, bio, created_at, updated_at')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Database error fetching users:', error);
          res.status(400).json({
            success: false,
            error: error.message
          });
          return;
        }

        res.status(200).json({
          success: true,
          data: users || []
        });
        return;
      } catch (dbError) {
        console.error('Supabase connection error:', dbError);
        res.status(500).json({
          success: false,
          error: 'Database connection failed'
        });
        return;
      }
    }

    // Financial budgets endpoint - return mock data for now
    if (url === '/api/financial/budgets' && req.method === 'GET') {
      // Mock budgets data for financial
      const mockBudgets = [
        {
          id: '1',
          name: 'Q4 Marketing Budget',
          amount: 50000,
          spent: 32000,
          status: 'active',
          client_id: '1',
          created_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Development Budget',
          amount: 75000,
          spent: 45000,
          status: 'active',
          client_id: '2',
          created_at: new Date().toISOString()
        },
        {
          id: '3',
          name: 'Design Budget',
          amount: 30000,
          spent: 18000,
          status: 'active',
          client_id: '3',
          created_at: new Date().toISOString()
        }
      ];
      
      res.status(200).json({
        success: true,
        data: mockBudgets
      });
      return;
    }

    // For other API routes, return a placeholder response for now
    res.status(200).json({
      success: true,
      message: 'CRM API is running - more endpoints coming soon',
      url: url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}