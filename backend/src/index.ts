import app from './app.js';
import { runMigrations } from './config/migrate.js';
import { runDataMigration } from './seed/dataMigration.js';

const PORT = parseInt(process.env['PORT'] ?? '7070', 10);

// Run migrations before starting the server
runMigrations();

// Load fixture data if the database is empty
runDataMigration();

app.listen(PORT, () => {
  console.log(`CRM backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
