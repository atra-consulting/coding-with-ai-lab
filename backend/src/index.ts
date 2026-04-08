import app from './app.js';
import { runMigrations } from './config/migrate.js';
import { runSeeder } from './seed/seeder.js';

const PORT = parseInt(process.env['PORT'] ?? '7070', 10);

// Run migrations before starting the server
runMigrations();

// Seed with demo data if the database is empty
runSeeder();

app.listen(PORT, () => {
  console.log(`CRM backend running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
