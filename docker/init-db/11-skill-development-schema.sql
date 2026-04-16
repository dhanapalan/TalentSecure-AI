-- =============================================================================
-- GradLogic — Skill Development Layer Schema
-- =============================================================================
-- Must run AFTER 01-schema.sql (colleges, users, student_details tables exist).
-- Safe to re-run: all statements use IF NOT EXISTS / DO blocks.
-- =============================================================================

-- =============================================================================
-- 1. Skill Categories
-- =============================================================================
CREATE TABLE IF NOT EXISTS skill_categories (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon        VARCHAR(50),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 2. Skills Taxonomy
-- =============================================================================
CREATE TABLE IF NOT EXISTS skills (
    id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(150) NOT NULL,
    category_id UUID        REFERENCES skill_categories(id) ON DELETE SET NULL,
    description TEXT,
    level       VARCHAR(20) CHECK (level IN ('beginner','intermediate','advanced','expert')),
    is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skills_category ON skills(category_id);
CREATE INDEX IF NOT EXISTS idx_skills_active ON skills(is_active);

-- =============================================================================
-- 3. Skill Prerequisites (self-referencing many-to-many)
-- =============================================================================
CREATE TABLE IF NOT EXISTS skill_prerequisites (
    skill_id              UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    prerequisite_skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    PRIMARY KEY (skill_id, prerequisite_skill_id),
    CHECK (skill_id <> prerequisite_skill_id)
);

-- =============================================================================
-- 4. Learning Modules
-- =============================================================================
CREATE TABLE IF NOT EXISTS learning_modules (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    title            VARCHAR(255) NOT NULL,
    description      TEXT,
    module_type      VARCHAR(30)  NOT NULL
                        CHECK (module_type IN ('video','coding_exercise','quiz','reading','soft_skill','live_session')),
    skill_id         UUID        REFERENCES skills(id) ON DELETE SET NULL,
    content_url      TEXT,
    content_body     TEXT,          -- for reading modules — markdown/HTML content
    duration_minutes INT,
    difficulty       VARCHAR(20)  CHECK (difficulty IN ('beginner','intermediate','advanced')),
    passing_score    NUMERIC(5,2) DEFAULT 60.00,
    is_published     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_modules_skill ON learning_modules(skill_id);
CREATE INDEX IF NOT EXISTS idx_modules_type ON learning_modules(module_type);
CREATE INDEX IF NOT EXISTS idx_modules_published ON learning_modules(is_published);

-- =============================================================================
-- 5. Skill Development Programs / Learning Paths
-- =============================================================================
CREATE TABLE IF NOT EXISTS skill_programs (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name             VARCHAR(255) NOT NULL,
    description      TEXT,
    program_type     VARCHAR(30)  NOT NULL
                        CHECK (program_type IN ('learning_path','bootcamp','workshop','certification')),
    target_skill_ids UUID[]      DEFAULT '{}',   -- skill IDs this program develops
    eligibility_rules JSONB      DEFAULT '{}',   -- { min_score, required_skill_ids, min_cgpa }
    duration_days    INT,
    banner_url       TEXT,
    is_active        BOOLEAN     NOT NULL DEFAULT TRUE,
    college_id       UUID        REFERENCES colleges(id) ON DELETE CASCADE,  -- NULL = global
    created_by       UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_programs_active ON skill_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_programs_college ON skill_programs(college_id);
CREATE INDEX IF NOT EXISTS idx_programs_type ON skill_programs(program_type);

-- =============================================================================
-- 6. Program Modules (ordered list of modules within a program)
-- =============================================================================
CREATE TABLE IF NOT EXISTS program_modules (
    id             UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id     UUID    NOT NULL REFERENCES skill_programs(id) ON DELETE CASCADE,
    module_id      UUID    NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    sequence_order INT     NOT NULL DEFAULT 1,
    is_mandatory   BOOLEAN NOT NULL DEFAULT TRUE,
    UNIQUE (program_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_program_modules_program ON program_modules(program_id);

-- =============================================================================
-- 7. Extend assessment_drives table — add drive_type and skill dev columns
-- =============================================================================
DO $$ BEGIN
    ALTER TABLE assessment_drives ADD COLUMN drive_type VARCHAR(20)
        CHECK (drive_type IN ('hiring','skill_development')) DEFAULT 'hiring';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE assessment_drives ADD COLUMN program_id UUID REFERENCES skill_programs(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
    ALTER TABLE assessment_drives ADD COLUMN target_skill_ids UUID[] DEFAULT '{}';
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

-- =============================================================================
-- 8. Student Program Enrollments
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_program_enrollments (
    id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id       UUID        NOT NULL REFERENCES student_details(id) ON DELETE CASCADE,
    program_id       UUID        NOT NULL REFERENCES skill_programs(id) ON DELETE CASCADE,
    drive_id         UUID        REFERENCES assessment_drives(id) ON DELETE SET NULL,
    status           VARCHAR(20) NOT NULL
                        CHECK (status IN ('enrolled','in_progress','completed','dropped'))
                        DEFAULT 'enrolled',
    enrolled_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at     TIMESTAMPTZ,
    completion_score NUMERIC(5,2),
    UNIQUE (student_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_program_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program ON student_program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON student_program_enrollments(status);

-- =============================================================================
-- 9. Student Module Progress
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_module_progress (
    id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id          UUID        NOT NULL REFERENCES student_details(id) ON DELETE CASCADE,
    module_id           UUID        NOT NULL REFERENCES learning_modules(id) ON DELETE CASCADE,
    enrollment_id       UUID        NOT NULL REFERENCES student_program_enrollments(id) ON DELETE CASCADE,
    status              VARCHAR(20) NOT NULL
                            CHECK (status IN ('not_started','in_progress','completed'))
                            DEFAULT 'not_started',
    score               NUMERIC(5,2),
    time_spent_minutes  INT         NOT NULL DEFAULT 0,
    started_at          TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    UNIQUE (student_id, module_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_module_progress_student ON student_module_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_enrollment ON student_module_progress(enrollment_id);

-- =============================================================================
-- 10. Student Skill Scores (certified/computed)
-- =============================================================================
CREATE TABLE IF NOT EXISTS student_skills (
    id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id        UUID        NOT NULL REFERENCES student_details(id) ON DELETE CASCADE,
    skill_id          UUID        NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
    score             NUMERIC(5,2) NOT NULL DEFAULT 0,
    proficiency_level VARCHAR(20)  CHECK (proficiency_level IN ('beginner','intermediate','advanced','expert')),
    source            VARCHAR(20)  CHECK (source IN ('assessment','program_completion','manual')),
    verified_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (student_id, skill_id)
);

CREATE INDEX IF NOT EXISTS idx_student_skills_student ON student_skills(student_id);
CREATE INDEX IF NOT EXISTS idx_student_skills_skill ON student_skills(skill_id);

-- =============================================================================
-- 11. Skill Development MOU Partners
-- =============================================================================
CREATE TABLE IF NOT EXISTS skill_dev_partners (
    id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    partner_type    VARCHAR(30)  CHECK (partner_type IN ('edtech','industry','government','ngo')),
    college_id      UUID        REFERENCES colleges(id) ON DELETE SET NULL,  -- NULL = central partner
    mou_url         TEXT,
    mou_status      VARCHAR(30)  NOT NULL DEFAULT 'Active',
    agreement_start TIMESTAMPTZ,
    agreement_end   TIMESTAMPTZ,
    contact_email   TEXT,
    contact_name    TEXT,
    contact_phone   TEXT,
    website         TEXT,
    is_active       BOOLEAN     NOT NULL DEFAULT TRUE,
    created_by      UUID        REFERENCES users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_active ON skill_dev_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_partners_college ON skill_dev_partners(college_id);

-- =============================================================================
-- 12. Seed default skill categories
-- =============================================================================
INSERT INTO skill_categories (name, description, icon) VALUES
    ('Programming',         'Software development and coding skills',       'code'),
    ('Data Science',        'Data analysis, ML, and statistical skills',    'bar-chart'),
    ('Communication',       'Written and verbal communication skills',      'message-square'),
    ('Problem Solving',     'Analytical thinking and logical reasoning',    'cpu'),
    ('Domain Knowledge',    'Industry-specific technical knowledge',        'book-open'),
    ('Soft Skills',         'Interpersonal and professional skills',        'users'),
    ('Cloud & DevOps',      'Cloud platforms, CI/CD, and infrastructure',   'cloud'),
    ('Design & UX',         'UI/UX design and product thinking',            'layout')
ON CONFLICT (name) DO NOTHING;
