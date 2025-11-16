/**
 * Vercel serverless function entry point
 * This file exports the Express app for Vercel deployment
 */

import { app } from './app'

// Export the app for Vercel
export default app