import app from './app.js';
import { runMigrations } from './config/migrate.js';

const PORT = parseInt(process.env['PORT'] ?? '7070', 10);

// Run migrations before starting the server
runMigrations();

app.listen(PORT, () => {
  console.log(`CRM backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
