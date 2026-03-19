import { query, queryOne } from "../config/database.js";

// ── Types ────────────────────────────────────────────────────────────────────

export interface RuleRow {
    id: string;
    name: string;
    description: string | null;
    target_role: string | null;
    duration_minutes: number;
    total_questions: number;
    total_marks: number;
    negative_marking_enabled: boolean;
    negative_marking_value: number | null;
    sectional_cutoff: any;
    overall_cutoff: number | null;
    skill_distribution: any;
    difficulty_distribution: any;
    proctoring_mode: string;
    proctoring_config: any;
    pool_generation_config: any;
    targeting_config: any;
    status: string;
    version: number;
    created_by: string | null;
    created_at: Date;
    updated_at: Date;
}

export interface CreateRuleInput {
    name: string;
    description?: string;
    target_role?: string;
    duration_minutes?: number;
    total_questions?: number;
    total_marks?: number;
    negative_marking_enabled?: boolean;
    negative_marking_value?: number;
    sectional_cutoff?: any;
    overall_cutoff?: number;
    skill_distribution?: any;
    difficulty_distribution?: any;
    proctoring_mode?: string;
    proctoring_config?: any;
    pool_generation_config?: any;
    targeting_config?: any;
    status?: string;
    created_by?: string;
}

// ── List Rules ───────────────────────────────────────────────────────────────

export async function listRules(filters?: { status?: string; skill?: string }) {
    let sql = `SELECT * FROM assessment_rule_templates`;
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters?.status && filters.status !== "all") {
        conditions.push(`status = $${params.length + 1}`);
        params.push(filters.status);
    }

    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(" AND ");
    }

    sql += ` ORDER BY updated_at DESC`;
    return query<RuleRow>(sql, params);
}

// ── Get Rule by ID ───────────────────────────────────────────────────────────

export async function getRuleById(id: string) {
    return queryOne<RuleRow>(
        `SELECT * FROM assessment_rule_templates WHERE id = $1`,
        [id],
    );
}

// ── Create Rule ──────────────────────────────────────────────────────────────

export async function createRule(input: CreateRuleInput) {
    return queryOne<RuleRow>(
        `INSERT INTO assessment_rule_templates
       (name, description, target_role, duration_minutes, total_questions, total_marks,
        negative_marking_enabled, negative_marking_value, sectional_cutoff, overall_cutoff,
        skill_distribution, difficulty_distribution, proctoring_mode, proctoring_config,
        pool_generation_config, targeting_config, status, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     RETURNING *`,
        [
            input.name,
            input.description || null,
            input.target_role || null,
            input.duration_minutes || 60,
            input.total_questions || 30,
            input.total_marks || 100,
            input.negative_marking_enabled || false,
            input.negative_marking_value || null,
            input.sectional_cutoff ? JSON.stringify(input.sectional_cutoff) : null,
            input.overall_cutoff || null,
            JSON.stringify(input.skill_distribution || {}),
            JSON.stringify(input.difficulty_distribution || {}),
            input.proctoring_mode || "moderate",
            input.proctoring_config ? JSON.stringify(input.proctoring_config) : null,
            input.pool_generation_config ? JSON.stringify(input.pool_generation_config) : null,
            input.targeting_config ? JSON.stringify(input.targeting_config) : null,
            input.status || "draft",
            input.created_by || null,
        ],
    );
}

// ── Update Rule ──────────────────────────────────────────────────────────────

export async function updateRule(id: string, input: Partial<CreateRuleInput>) {
    const current = await getRuleById(id);
    if (!current) throw new Error("Assessment rule not found");

    // AR-03: If modifying an 'active' rule, create a snapshot of the current state first
    if (current.status === 'active') {
        const configFields: (keyof CreateRuleInput)[] = [
            "name", "description", "target_role", "duration_minutes", "total_questions",
            "total_marks", "negative_marking_enabled", "negative_marking_value",
            "sectional_cutoff", "overall_cutoff", "skill_distribution", "difficulty_distribution",
            "proctoring_mode", "proctoring_config", "pool_generation_config", "targeting_config"
        ];

        const hasConfigChange = configFields.some(f => input[f] !== undefined);

        // Only version if configuration changes (not just status change to archived)
        if (hasConfigChange) {
            await createVersion(id, "Automatic version created before modification of active rule", current.created_by || undefined);
        }
    }

    // Build dynamic SET clause
    const fields: string[] = [];
    const params: any[] = [];
    let idx = 1;

    const simpleFields: (keyof CreateRuleInput)[] = [
        "name", "description", "target_role", "duration_minutes", "total_questions",
        "total_marks", "negative_marking_enabled", "negative_marking_value",
        "overall_cutoff", "proctoring_mode", "status",
    ];

    for (const f of simpleFields) {
        if (input[f] !== undefined) {
            fields.push(`${f} = $${idx++}`);
            params.push(input[f]);
        }
    }

    const jsonFields: (keyof CreateRuleInput)[] = [
        "sectional_cutoff", "skill_distribution", "difficulty_distribution",
        "proctoring_config", "pool_generation_config", "targeting_config",
    ];

    for (const f of jsonFields) {
        if (input[f] !== undefined) {
            fields.push(`${f} = $${idx++}`);
            params.push(JSON.stringify(input[f]));
        }
    }

    if (fields.length === 0) return getRuleById(id);

    fields.push(`updated_at = NOW()`);
    params.push(id);

    return queryOne<RuleRow>(
        `UPDATE assessment_rule_templates SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`,
        params,
    );
}

// ── Clone Rule ───────────────────────────────────────────────────────────────

export async function cloneRule(id: string, createdBy?: string) {
    const original = await getRuleById(id);
    if (!original) return null;

    return createRule({
        name: `${original.name} (Copy)`,
        description: original.description || undefined,
        target_role: original.target_role || undefined,
        duration_minutes: original.duration_minutes,
        total_questions: original.total_questions,
        total_marks: original.total_marks,
        negative_marking_enabled: original.negative_marking_enabled,
        negative_marking_value: original.negative_marking_value || undefined,
        sectional_cutoff: original.sectional_cutoff,
        overall_cutoff: original.overall_cutoff || undefined,
        skill_distribution: original.skill_distribution,
        difficulty_distribution: original.difficulty_distribution,
        proctoring_mode: original.proctoring_mode,
        proctoring_config: original.proctoring_config,
        pool_generation_config: original.pool_generation_config,
        targeting_config: original.targeting_config,
        status: "draft",
        created_by: createdBy,
    });
}

// ── Archive Rule ─────────────────────────────────────────────────────────────

export async function archiveRule(id: string) {
    return queryOne<RuleRow>(
        `UPDATE assessment_rule_templates SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING *`,
        [id],
    );
}

// ── Versioning ───────────────────────────────────────────────────────────────

export async function createVersion(ruleId: string, changeNotes?: string, createdBy?: string) {
    const rule = await getRuleById(ruleId);
    if (!rule) return null;

    // Use current rule version for the snapshot
    const snapshotVersion = rule.version || 1;
    const nextVersion = snapshotVersion + 1;

    // Create snapshot
    const snapshot = { ...rule };

    const version = await queryOne(
        `INSERT INTO assessment_rule_versions (rule_id, version_number, snapshot, change_notes, created_by)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
        [ruleId, snapshotVersion, JSON.stringify(snapshot), changeNotes || null, createdBy || null],
    );

    // Update the rule's version counter for the template
    await query(`UPDATE assessment_rule_templates SET version = $1, updated_at = NOW() WHERE id = $2`, [nextVersion, ruleId]);

    return version;
}

export async function listVersions(ruleId: string) {
    return query(
        `SELECT * FROM assessment_rule_versions WHERE rule_id = $1 ORDER BY version_number DESC`,
        [ruleId],
    );
}
