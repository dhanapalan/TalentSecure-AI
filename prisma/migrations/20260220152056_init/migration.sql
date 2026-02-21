-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'RECRUITER', 'CAMPUS_COORDINATOR', 'STUDENT');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('MCQ', 'CODING', 'BEHAVIORAL', 'MIXED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'TERMINATED', 'UNDER_REVIEW');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MCQ', 'CODING', 'SUBJECTIVE');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- CreateEnum
CREATE TYPE "ViolationType" AS ENUM ('FACE_NOT_DETECTED', 'MULTIPLE_FACES', 'FACE_MISMATCH', 'TAB_SWITCH', 'BROWSER_MINIMIZED', 'COPY_PASTE_ATTEMPT', 'RIGHT_CLICK', 'SCREEN_SHARE_DETECTED', 'EXTERNAL_DISPLAY', 'DEVTOOLS_OPEN', 'NETWORK_ANOMALY');

-- CreateEnum
CREATE TYPE "ViolationSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'TERMINATED');

-- CreateEnum
CREATE TYPE "RoleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
    "avatar_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "university" TEXT NOT NULL,
    "campus_id" TEXT,
    "degree" TEXT NOT NULL,
    "major" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "cgpa" DOUBLE PRECISION NOT NULL,
    "skills" TEXT[],
    "resume_url" TEXT,
    "photo_url" TEXT,
    "segment_id" TEXT,
    "match_score" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campuses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "tier" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "technical_skills" JSONB NOT NULL,
    "behavioral_competencies" JSONB NOT NULL,
    "min_cgpa" DOUBLE PRECISION NOT NULL,
    "eligible_degrees" TEXT[],
    "eligible_majors" TEXT[],
    "max_positions" INTEGER NOT NULL,
    "status" "RoleStatus" NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "duration_minutes" INTEGER NOT NULL,
    "total_marks" INTEGER NOT NULL,
    "passing_percentage" DOUBLE PRECISION NOT NULL,
    "proctoring_enabled" BOOLEAN NOT NULL DEFAULT true,
    "browser_lockdown" BOOLEAN NOT NULL DEFAULT true,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "options" TEXT[],
    "correct_answer" TEXT,
    "marks" INTEGER NOT NULL,
    "difficulty" TEXT NOT NULL,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_sessions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "score" INTEGER,
    "percentage" DOUBLE PRECISION,
    "passed" BOOLEAN,
    "answers" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_sessions" (
    "id" TEXT NOT NULL,
    "assessment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "reference_photo_url" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),
    "integrity_score" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proctoring_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proctoring_violations" (
    "id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "snapshot_url" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proctoring_violations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "segments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "criteria" JSONB NOT NULL,
    "student_count" INTEGER NOT NULL DEFAULT 0,
    "avg_match_score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE INDEX "student_profiles_university_idx" ON "student_profiles"("university");

-- CreateIndex
CREATE INDEX "student_profiles_segment_id_idx" ON "student_profiles"("segment_id");

-- CreateIndex
CREATE INDEX "student_profiles_cgpa_idx" ON "student_profiles"("cgpa");

-- CreateIndex
CREATE UNIQUE INDEX "campuses_name_key" ON "campuses"("name");

-- CreateIndex
CREATE INDEX "assessments_role_id_idx" ON "assessments"("role_id");

-- CreateIndex
CREATE INDEX "assessments_status_idx" ON "assessments"("status");

-- CreateIndex
CREATE INDEX "questions_assessment_id_idx" ON "questions"("assessment_id");

-- CreateIndex
CREATE INDEX "assessment_sessions_status_idx" ON "assessment_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_sessions_assessment_id_student_id_key" ON "assessment_sessions"("assessment_id", "student_id");

-- CreateIndex
CREATE INDEX "proctoring_sessions_assessment_id_idx" ON "proctoring_sessions"("assessment_id");

-- CreateIndex
CREATE INDEX "proctoring_sessions_student_id_idx" ON "proctoring_sessions"("student_id");

-- CreateIndex
CREATE INDEX "proctoring_violations_session_id_idx" ON "proctoring_violations"("session_id");

-- CreateIndex
CREATE UNIQUE INDEX "segments_name_key" ON "segments"("name");

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "segments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_campus_id_fkey" FOREIGN KEY ("campus_id") REFERENCES "campuses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "assessments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_sessions" ADD CONSTRAINT "assessment_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_sessions" ADD CONSTRAINT "proctoring_sessions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proctoring_violations" ADD CONSTRAINT "proctoring_violations_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "proctoring_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
