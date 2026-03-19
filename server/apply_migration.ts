import { pool } from "./src/config/database.js";

async function applyMigration() {
    try {
        console.log("Applying migration: Add max_applicants to assessment_drives...");
        await pool.query("ALTER TABLE assessment_drives ADD COLUMN IF NOT EXISTS max_applicants INT DEFAULT 500;");
        console.log("Migration applied successfully.");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

applyMigration();
