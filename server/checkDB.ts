import { pool } from "./src/config/database.js";

async function check() {
    try {
        const rules = await pool.query("SELECT id, name, status FROM assessment_rule_templates");
        console.log("Rules:", JSON.stringify(rules.rows, null, 2));

        const students = await pool.query("SELECT id, name, role FROM users WHERE role = 'student' LIMIT 5");
        console.log("Students:", JSON.stringify(students.rows, null, 2));
    } catch (error) {
        console.error("DB Check failed:", error);
    } finally {
        await pool.end();
    }
}

check();
