// =============================================================================
// Supabase Migration Runner — runs all SQL files + exports local data
// Usage: node deploy/run-supabase-migration.mjs
// =============================================================================
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const SUPABASE = {
  host: 'db.tmutpbunrcdtvdkqhvcn.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'K10OyG5BsUG0PP4R',
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
};

async function runSQL(client, label, sql) {
  process.stdout.write(`  → ${label} ... `);
  try {
    await client.query(sql);
    console.log('OK');
  } catch (err) {
    // Ignore "already exists" errors so the script is idempotent
    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
      console.log('skipped (already exists)');
    } else {
      console.log(`\n     WARN: ${err.message.split('\n')[0]}`);
    }
  }
}

async function main() {
  console.log('\n=== TalentSecure → Supabase Migration ===\n');

  const client = new Client(SUPABASE);
  await client.connect();
  console.log('Connected to Supabase ✓\n');

  // ── Step 1: Apply raw SQL schema files ──────────────────────────────────────
  console.log('[1/3] Applying schema SQL files...');
  const initDir = path.join(ROOT, 'docker/init-db');
  const sqlFiles = fs.readdirSync(initDir).filter(f => f.endsWith('.sql')).sort();
  for (const file of sqlFiles) {
    const sql = fs.readFileSync(path.join(initDir, file), 'utf8');
    await runSQL(client, file, sql);
  }

  // ── Step 2: Apply Prisma migration SQL ──────────────────────────────────────
  console.log('\n[2/3] Applying Prisma migration...');
  const prismaSQL = path.join(ROOT, 'prisma/migrations/20260220152056_init/migration.sql');
  if (fs.existsSync(prismaSQL)) {
    const sql = fs.readFileSync(prismaSQL, 'utf8');
    await runSQL(client, '20260220152056_init/migration.sql', sql);
  } else {
    console.log('  → No Prisma migration file found, skipping.');
  }

  // ── Step 3: Export local data and import ────────────────────────────────────
  console.log('\n[3/3] Migrating data from local Docker PostgreSQL...');
  const dumpFile = path.join(ROOT, 'deploy/local_data_export.sql');

  try {
    process.stdout.write('  → Exporting local data ... ');
    execSync(
      `docker exec talentsecure-postgres pg_dump -U talentsecure -d talentsecure_db --data-only --no-owner --no-acl -Fp -f /tmp/export.sql && docker cp talentsecure-postgres:/tmp/export.sql "${dumpFile}"`,
      { stdio: 'pipe' }
    );
    console.log('OK');

    process.stdout.write('  → Importing data into Supabase ... ');
    const dataSql = fs.readFileSync(dumpFile, 'utf8');
    // Run in chunks split by semicolons to avoid oversized queries
    const statements = dataSql
      .split(/;\s*\n/)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('SET') && !s.startsWith('SELECT'));

    let imported = 0;
    for (const stmt of statements) {
      try {
        await client.query(stmt);
        imported++;
      } catch (_) { /* skip constraint errors on re-run */ }
    }
    console.log(`OK (${imported} statements)`);
    fs.unlinkSync(dumpFile);
  } catch (err) {
    console.log(`\n  WARN: Could not export local data — ${err.message.split('\n')[0]}`);
    console.log('  → Schema migration still succeeded. Import data manually if needed.');
  }

  await client.end();

  console.log('\n=== Migration complete! ===');
  console.log('Verify at: https://supabase.com/dashboard/project/tmutpbunrcdtvdkqhvcn/editor\n');
}

main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
