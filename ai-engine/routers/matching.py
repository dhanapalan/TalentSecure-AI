"""
Role-Student Matching Router
Computes similarity scores between role requirements and student profiles.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import numpy as np

router = APIRouter()


class SkillRequirement(BaseModel):
    skill: str
    minProficiency: int = 1
    weight: float = 1.0
    mandatory: bool = False


class RoleData(BaseModel):
    technicalSkills: list[dict]
    behavioralCompetencies: Optional[list[dict]] = []
    minCGPA: float = 0.0
    eligibleDegrees: list[str] = []
    eligibleMajors: list[str] = []


class StudentCandidate(BaseModel):
    id: str
    skills: list[str]
    cgpa: float
    degree: str
    major: str


class MatchRequest(BaseModel):
    role: RoleData
    students: list[StudentCandidate]
    threshold: float = 0.70


@router.post("/role")
def match_role(req: MatchRequest):
    """
    Score each student against a role's requirements.
    Factors:
      - Skill overlap (weighted Jaccard)
      - CGPA normalized score
      - Degree/major eligibility
    """
    role = req.role
    matches = []

    # Extract required skills
    required_skills = set()
    skill_weights: dict[str, float] = {}
    mandatory_skills: set[str] = set()

    for sk in role.technicalSkills:
        skill_name = sk.get("skill", "").lower()
        required_skills.add(skill_name)
        skill_weights[skill_name] = sk.get("weight", 1.0)
        if sk.get("mandatory", False):
            mandatory_skills.add(skill_name)

    eligible_degrees = {d.lower() for d in role.eligibleDegrees}
    eligible_majors = {m.lower() for m in role.eligibleMajors}

    for student in req.students:
        # CGPA check
        if student.cgpa < role.minCGPA:
            continue

        # Degree eligibility
        degree_match = 1.0
        if eligible_degrees and student.degree.lower() not in eligible_degrees:
            degree_match = 0.3  # Partial penalty, not full disqualification

        major_match = 1.0
        if eligible_majors and student.major.lower() not in eligible_majors:
            major_match = 0.5

        # Skill overlap score (weighted)
        student_skills = {s.lower() for s in student.skills}
        total_weight = sum(skill_weights.values()) or 1.0
        matched_weight = sum(
            skill_weights.get(s, 0) for s in student_skills if s in required_skills
        )
        skill_score = matched_weight / total_weight

        # Mandatory skill check
        has_mandatory = all(s in student_skills for s in mandatory_skills)
        if not has_mandatory and mandatory_skills:
            skill_score *= 0.3  # Heavy penalty

        # CGPA score (normalized to 0–1 range, assuming 10-point scale)
        cgpa_score = min(student.cgpa / 10.0, 1.0)

        # Composite score
        score = (
            skill_score * 0.45
            + cgpa_score * 0.25
            + degree_match * 0.15
            + major_match * 0.15
        )

        if score >= req.threshold:
            matches.append(
                {
                    "studentId": student.id,
                    "score": round(score, 4),
                    "breakdown": {
                        "skillScore": round(skill_score, 3),
                        "cgpaScore": round(cgpa_score, 3),
                        "degreeMatch": round(degree_match, 3),
                        "majorMatch": round(major_match, 3),
                    },
                }
            )

    # Sort by score descending
    matches.sort(key=lambda m: m["score"], reverse=True)

    return {
        "matches": matches,
        "totalCandidates": len(req.students),
        "qualifiedCandidates": len(matches),
    }
