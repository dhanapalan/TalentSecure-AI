import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, connectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        await connectDatabase();

        // Read the SQL file
        const sqlPath = path.resolve(__dirname, '../../../docker/init-db/08-student-summary.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        logger.info('Running migration script...');

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(sql);
            await client.query('COMMIT');
            logger.info('Migration applied successfully.');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        logger.error('Migration failed:', error);
    } finally {
        // Exit process
        process.exit(0);
    }
}

runMigration();
