import { Router } from "express";
import { z } from "zod";
import { authenticate, authorize } from "../middleware/auth.js";
import { query } from "../config/database.js";
import { env } from "../config/env.js";
import { AppError } from "../middleware/errorHandler.js";
import { ApiResponse } from "../types/index.js";

const router = Router();

const runSegmentationSchema = z.object({
  algorithm: z.string().trim().min(1).optional().default("kmeans"),
  features: z.array(z.string().trim().min(1)).min(1).optional().default(["cgpa", "skills"]),
});

interface SegmentationStudentRow {
  id: string;
  degree: string | null;
  major: string | null;
  cgpa: number | string | null;
}

interface SegmentView {
  id: string;
  name: string;
  description: string;
  studentCount: number;
  avgMatchScore: number;
  criteria: Record<string, unknown>;
}

async function getStudentsForSegmentation() {
  return query<SegmentationStudentRow>(
    `SELECT
        sd.user_id AS id,
        sd.degree,
        sd.class_name AS major,
        COALESCE(
          ROUND((AVG(ms.final_score)::numeric / 10.0), 2),
          6.00
        ) AS cgpa
     FROM student_details sd
     JOIN users u ON u.id = sd.user_id
     LEFT JOIN marks_scored ms ON ms.student_id = sd.user_id
     WHERE LOWER(u.role::text) = 'student'
       AND u.is_active = TRUE
     GROUP BY sd.user_id, sd.degree, sd.class_name
     ORDER BY sd.user_id`,
  );
}

async function runSegmentationFromAiEngine(
  algorithm: string,
  features: string[],
): Promise<SegmentView[]> {
  const students = await getStudentsForSegmentation();
  if (students.length === 0) {
    return [];
  }

  const aiPayload = {
    students: students.map((s) => ({
      id: s.id,
      cgpa: Number(s.cgpa ?? 6),
      skills: [] as string[],
      major: s.major ?? "General",
      degree: s.degree ?? "General",
      graduationYear: null,
    })),
    minClusterSize: Math.min(10, Math.max(2, students.length)),
    algorithm,
    features,
  };

  const response = await fetch(`${env.AI_ENGINE_URL}/api/segmentation/cluster`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.AI_ENGINE_API_KEY,
    },
    body: JSON.stringify(aiPayload),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new AppError(`Segmentation engine error (${response.status}): ${details}`, 502);
  }

  const result = (await response.json()) as {
    clusters?: Array<{
      name?: string;
      description?: string;
      studentIds?: string[];
      avgScore?: number;
      criteria?: Record<string, unknown>;
    }>;
    error?: string;
  };

  if (result.error) {
    // Treat "insufficient data" as a successful empty state in the UI.
    if (result.error.toLowerCase().includes("need at least")) {
      return [];
    }
    throw new AppError(result.error, 400);
  }

  const clusters = Array.isArray(result.clusters) ? result.clusters : [];
  return clusters.map((cluster, index) => {
    const studentIds = Array.isArray(cluster.studentIds) ? cluster.studentIds : [];
    const avgScore = Number(cluster.avgScore ?? 0);
    return {
      id: `segment-${index + 1}`,
      name: cluster.name ?? `Segment ${index + 1}`,
      description: cluster.description ?? "AI-generated student cluster",
      studentCount: studentIds.length,
      avgMatchScore: avgScore,
      criteria: cluster.criteria ?? {},
    };
  });
}

router.get(
  "/segments",
  authenticate,
  authorize("super_admin", "admin", "hr", "cxo", "engineer"),
  async (_req, res: import("express").Response<ApiResponse>, next) => {
    try {
      const segments = await runSegmentationFromAiEngine("kmeans", ["cgpa", "skills"]);
      res.json({ success: true, data: segments });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/run",
  authenticate,
  authorize("super_admin", "admin", "hr", "cxo", "engineer"),
  async (req, res: import("express").Response<ApiResponse>, next) => {
    try {
      const parsed = runSegmentationSchema.parse(req.body ?? {});
      const segments = await runSegmentationFromAiEngine(parsed.algorithm, parsed.features);
      res.json({
        success: true,
        data: segments,
        message: "Segmentation completed",
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
