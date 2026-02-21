"""
Student Segmentation Router
AI-powered clustering of students into talent segments.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, MultiLabelBinarizer

router = APIRouter()


class StudentData(BaseModel):
    id: str
    cgpa: float
    skills: list[str]
    major: str
    degree: str
    graduationYear: Optional[int] = None


class ClusterRequest(BaseModel):
    students: list[StudentData]
    minClusterSize: int = 10
    algorithm: str = "kmeans"
    features: list[str] = ["cgpa", "skills"]


class ClusterResult(BaseModel):
    name: str
    description: str
    studentIds: list[str]
    avgScore: float
    criteria: dict


@router.post("/cluster")
def run_clustering(req: ClusterRequest):
    """
    Cluster students into segments using KMeans or similar algorithms.
    Features include CGPA, encoded skills, and academic attributes.
    """
    students = req.students

    if len(students) < req.minClusterSize:
        return {"error": f"Need at least {req.minClusterSize} students"}

    # Build feature matrix
    cgpa_values = np.array([s.cgpa for s in students]).reshape(-1, 1)

    # Encode skills using MultiLabelBinarizer
    mlb = MultiLabelBinarizer()
    skills_encoded = mlb.fit_transform([s.skills for s in students])

    # Combine features
    features = np.hstack([cgpa_values, skills_encoded])

    # Normalize
    scaler = StandardScaler()
    features_scaled = scaler.fit_transform(features)

    # Determine optimal K (simple heuristic: sqrt(n/2), capped at 8)
    n_clusters = min(max(2, int(np.sqrt(len(students) / 2))), 8)

    # Run KMeans
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    labels = kmeans.fit_predict(features_scaled)

    # Build segment results
    segment_names = [
        "Top Performers",
        "Strong Technical",
        "Well Rounded",
        "High Potential",
        "Emerging Talent",
        "Academic Leaders",
        "Versatile Candidates",
        "Growth Oriented",
    ]

    clusters = []
    for i in range(n_clusters):
        cluster_mask = labels == i
        cluster_students = [s for s, m in zip(students, cluster_mask) if m]
        cluster_cgpas = [s.cgpa for s in cluster_students]
        avg_cgpa = float(np.mean(cluster_cgpas)) if cluster_cgpas else 0.0

        # Compute normalized score (0–1)
        avg_score = min(avg_cgpa / 10.0, 1.0)

        clusters.append(
            {
                "name": segment_names[i % len(segment_names)],
                "description": f"Segment {i + 1}: {len(cluster_students)} students, avg CGPA {avg_cgpa:.2f}",
                "studentIds": [s.id for s in cluster_students],
                "avgScore": round(avg_score, 3),
                "criteria": {
                    "avgCGPA": round(avg_cgpa, 2),
                    "minCGPA": round(min(cluster_cgpas), 2) if cluster_cgpas else 0,
                    "maxCGPA": round(max(cluster_cgpas), 2) if cluster_cgpas else 0,
                    "studentCount": len(cluster_students),
                },
            }
        )

    # Sort by avg score descending
    clusters.sort(key=lambda c: c["avgScore"], reverse=True)

    return {"clusters": clusters, "totalStudents": len(students), "nClusters": n_clusters}
