-- Migration: Add max_applicants to assessment_drives
-- Description: Adds a column to limit the number of students who can be part of a drive.

ALTER TABLE assessment_drives ADD COLUMN max_applicants INT DEFAULT 500;
