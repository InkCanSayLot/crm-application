/**
 * local server entry file, for local development
 * Server restart triggered
 */
import app from './app.ts';

/**
 * start server with port
 */
const port = process.env.PORT || 3004;

const server = app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;