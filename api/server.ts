/**
 * Express server for local development
 * This file creates a standalone Express server for local development
 */

import { createServer } from 'http'
import { app } from './app'

const PORT = process.env.PORT || 3000

// Create HTTP server
const server = createServer(app)

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Supabase URL: ${process.env.SUPABASE_URL}`)
  console.log(`📍 API Base URL: http://localhost:${PORT}/api`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})