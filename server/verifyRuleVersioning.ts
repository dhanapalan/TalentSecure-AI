import { createRule, updateRule, listVersions, getRuleById } from "./src/services/assessmentRule.service.js";
import { pool } from "./src/config/database.js";

async function verifyVersioning() {
    try {
        console.log("🚀 Starting Rule Versioning Verification (AR-03)...");

        // 1. Create a draft rule
        const rule = await createRule({
            name: "Versioning Test Rule",
            description: "Initial draft",
            status: "draft"
        });
        if (!rule) throw new Error("Rule creation failed");
        console.log(`✅ Draft rule created: ${rule.id} (Version: ${rule.version})`);

        // 2. Update draft rule (should NOT version)
        await updateRule(rule.id, { description: "Updated draft" });
        const updatedDraft = await getRuleById(rule.id);
        const draftVersions = await listVersions(rule.id);
        console.log(`✅ Draft updated. Version should still be 1 (default): ${updatedDraft?.version}. Actual versions in DB: ${draftVersions.length}`);

        if (updatedDraft?.version !== 1 || draftVersions.length !== 0) {
            console.error("❌ Draft update unexpectedly triggered versioning or version changed!");
        }

        // 3. Activate rule
        await updateRule(rule.id, { status: "active" });
        console.log("✅ Rule activated.");

        // 4. Update active rule (SHOULD version)
        console.log("Updating active rule configuration...");
        await updateRule(rule.id, { duration_minutes: 90 });

        const updatedActive = await getRuleById(rule.id);
        const activeVersions = await listVersions(rule.id);

        console.log(`✅ Active rule updated.`);
        console.log(`📊 New Template Version: ${updatedActive?.version}`);
        console.log(`📊 Versions Table Count: ${activeVersions.length}`);
        if (activeVersions.length > 0) {
            console.log(`📊 Last Version Number stored in snapshots: ${activeVersions[0].version_number}`);
        }

        if (updatedActive?.version === 2 && activeVersions.length === 1 && activeVersions[0].version_number === 1) {
            console.log("🎊 SUCCESS: Automatic versioning (AR-03) verified with refined logic!");
        } else {
            console.error("❌ Versioning failed to trigger correctly or version numbers mismatch.");
        }

        // Cleanup (optional, but good)
        // await pool.query('DELETE FROM assessment_rule_versions WHERE rule_id = $1', [rule.id]);
        // await pool.query('DELETE FROM assessment_rule_templates WHERE id = $1', [rule.id]);

    } catch (error) {
        console.error("💥 Verification failed:", error);
    } finally {
        await pool.end();
    }
}

verifyVersioning();
