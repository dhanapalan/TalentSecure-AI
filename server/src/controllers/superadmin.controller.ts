import { Request, Response, NextFunction } from "express";
import { pool, queryOne } from "../config/database.js";
import { AppError } from "../middleware/errorHandler.js";
import { ApiResponse } from "../types/index.js";

// ────────────────────────────────────────────────────────────────────
// METRICS ENDPOINTS
// ────────────────────────────────────────────────────────────────────

export const getPlatformMetrics = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const [
      collegesResult,
      studentsResult,
      activeUsersResult,
      questionsResult,
      testsResult,
      certificationsResult,
      approvalsResult,
      placementReadinessResult,
    ] = await Promise.all([
      pool.query("SELECT COUNT(*) as count FROM colleges WHERE deleted_at IS NULL"),
      pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'student' AND deleted_at IS NULL"
      ),
      pool.query(
        "SELECT COUNT(DISTINCT user_id) as count FROM audit_logs WHERE action LIKE '%login%' AND created_at > NOW() - INTERVAL '24 hours'"
      ),
      pool.query(
        "SELECT COUNT(*) as count FROM question_bank WHERE deleted_at IS NULL"
      ),
      pool.query(
        "SELECT COUNT(DISTINCT exam_id) as count FROM exam_attempts WHERE status = 'completed' AND deleted_at IS NULL"
      ),
      pool.query(
        "SELECT COUNT(*) as count FROM certifications WHERE deleted_at IS NULL"
      ),
      pool.query(
        "SELECT COUNT(*) as count FROM colleges WHERE status = 'pending' AND deleted_at IS NULL"
      ),
      pool.query(
        `SELECT COALESCE(AVG(CAST(score AS FLOAT) / 100), 0) as avg_readiness
        FROM exam_attempts
        WHERE status = 'completed' AND deleted_at IS NULL AND score IS NOT NULL`
      ),
    ]);

    const metrics = {
      totalColleges: parseInt(collegesResult.rows[0]?.count || 0),
      totalStudents: parseInt(studentsResult.rows[0]?.count || 0),
      activeUsers: parseInt(activeUsersResult.rows[0]?.count || 0),
      totalQuestions: parseInt(questionsResult.rows[0]?.count || 0),
      totalTests: parseInt(testsResult.rows[0]?.count || 0),
      certifications: parseInt(certificationsResult.rows[0]?.count || 0),
      pendingApprovals: parseInt(approvalsResult.rows[0]?.count || 0),
      avgPlacementReadiness: parseFloat(placementReadinessResult.rows[0]?.avg_readiness || 0),
    };

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    next(error);
  }
};

export const getGrowthData = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const [collegeGrowthResult, studentGrowthResult] = await Promise.all([
      pool.query(
        `SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM colleges
        WHERE created_at > NOW() - INTERVAL '30 days' AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
        LIMIT 30`
      ),
      pool.query(
        `SELECT
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE role = 'student' AND created_at > NOW() - INTERVAL '30 days' AND deleted_at IS NULL
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
        LIMIT 30`
      ),
    ]);

    const collegeGrowth = collegeGrowthResult.rows.map((row) => ({
      label: new Date(row.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: parseInt(row.count),
    }));

    const studentGrowth = studentGrowthResult.rows.map((row) => ({
      label: new Date(row.date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: parseInt(row.count),
    }));

    res.json({
      success: true,
      data: [...collegeGrowth, ...studentGrowth],
    });
  } catch (error) {
    next(error);
  }
};

export const getSystemAlerts = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const alerts = [
      {
        id: "alert-1",
        type: "info" as const,
        title: "System Running Normally",
        message: "All systems operational. No issues detected.",
        timestamp: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: alerts,
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// COLLEGES ENDPOINTS
// ────────────────────────────────────────────────────────────────────

export const listColleges = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    let query = "SELECT * FROM colleges WHERE deleted_at IS NULL";
    const params: any[] = [];

    if (status && status !== "all") {
      query += " AND status = $" + (params.length + 1);
      params.push(status);
    }

    if (search) {
      query += " AND (name ILIKE $" + (params.length + 1) + " OR email ILIKE $" + (params.length + 1) + ")";
      params.push(`%${search}%`);
    }

    const countResult = await pool.query(query.replace("SELECT *", "SELECT COUNT(*) as total"), params);
    const total = parseInt(countResult.rows[0]?.total || 0);

    query += " ORDER BY created_at DESC LIMIT " + limit + " OFFSET " + offset;
    const result = await pool.query(query, params);

    res.json({
      success: true,
      data: {
        colleges: result.rows,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createCollege = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { name, email, phone, address, city, state, tpoName, tpoEmail, studentLimit } = req.body;

    // Validation
    if (!name || !email || !city || !state) {
      throw new AppError("Missing required fields", 400);
    }

    // Check duplicate email
    const existing = await queryOne(
      "SELECT id FROM colleges WHERE email = $1",
      [email]
    );
    if (existing) {
      throw new AppError("College with this email already exists", 409);
    }

    // college_code is NOT NULL + unique — derive a slug from the name and
    // suffix it if the slug is already taken.
    const baseCode = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    let collegeCode = baseCode;
    const codeTaken = await queryOne(
      "SELECT id FROM colleges WHERE college_code = $1",
      [collegeCode]
    );
    if (codeTaken) {
      collegeCode = `${baseCode}-${Date.now().toString(36)}`;
    }

    const result = await pool.query(
      `INSERT INTO colleges (college_code, name, email, phone, address, city, state, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())
       RETURNING *`,
      [collegeCode, name, email, phone, address, city, state]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const getCollege = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const result = await queryOne(
      "SELECT * FROM colleges WHERE id = $1 AND deleted_at IS NULL",
      [id]
    );

    if (!result) {
      throw new AppError("College not found", 404);
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCollege = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address, city, state } = req.body;

    const result = await pool.query(
      `UPDATE colleges
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           city = COALESCE($5, city),
           state = COALESCE($6, state),
           updated_at = NOW()
       WHERE id = $7 AND deleted_at IS NULL
       RETURNING *`,
      [name, email, phone, address, city, state, id]
    );

    if (result.rows.length === 0) {
      throw new AppError("College not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCollege = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE colleges SET deleted_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("College not found", 404);
    }

    res.json({
      success: true,
      message: "College deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const getPendingCollegeRequests = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const result = await pool.query(
      "SELECT * FROM colleges WHERE status = 'pending' AND deleted_at IS NULL ORDER BY created_at DESC"
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const approveCollege = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE colleges SET status = 'active', updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("College not found", 404);
    }

    res.json({
      success: true,
      message: "College approved successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const rejectCollege = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      "UPDATE colleges SET status = 'suspended', updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("College not found", 404);
    }

    res.json({
      success: true,
      message: "College rejected successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// CATEGORIES ENDPOINTS
// ────────────────────────────────────────────────────────────────────

export const listCategories = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const result = await pool.query(
      `SELECT
        c.id, c.name, c.slug, c.description,
        COUNT(q.id) as question_count
       FROM categories c
       LEFT JOIN question_bank q ON q.category::text = c.slug AND q.deleted_at IS NULL
       WHERE c.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      throw new AppError("Category name is required", 400);
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const result = await pool.query(
      `INSERT INTO categories (name, slug, description, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [name, slug, description]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE categories SET deleted_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Category not found", 404);
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// REVIEW QUEUE ENDPOINTS
// ────────────────────────────────────────────────────────────────────

export const getReviewQueue = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

    const countResult = await pool.query(
      "SELECT COUNT(*) as total FROM question_bank WHERE 'ai-generated' = ANY(tags) AND status = 'pending'"
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    const result = await pool.query(
      `SELECT * FROM question_bank
       WHERE 'ai-generated' = ANY(tags) AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: {
        questions: result.rows,
        total,
        page: parseInt(page as string),
        limit: parseInt(limit as string),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const approveAIQuestion = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE question_bank SET status = 'published', updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Question not found", 404);
    }

    res.json({
      success: true,
      message: "Question approved and published",
    });
  } catch (error) {
    next(error);
  }
};

export const rejectAIQuestion = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      throw new AppError("Rejection reason required", 400);
    }

    const result = await pool.query(
      "UPDATE question_bank SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Question not found", 404);
    }

    res.json({
      success: true,
      message: "Question rejected",
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// ANNOUNCEMENTS ENDPOINTS
// ────────────────────────────────────────────────────────────────────

export const listAnnouncements = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, type, active, created_at, expires_at
       FROM announcements
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const createAnnouncement = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { title, message, type } = req.body;

    if (!title || !message) {
      throw new AppError("Title and message required", 400);
    }

    const result = await pool.query(
      `INSERT INTO announcements (title, message, type, active, created_at)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING *`,
      [title, message, type]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE announcements SET deleted_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Announcement not found", 404);
    }

    res.json({
      success: true,
      message: "Announcement deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// EMAIL TEMPLATES ENDPOINTS
// ────────────────────────────────────────────────────────────────────

export const listEmailTemplates = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const result = await pool.query(
      `SELECT id, name, subject, body, variables, created_at
       FROM email_templates
       WHERE deleted_at IS NULL
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    next(error);
  }
};

export const createEmailTemplate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { name, subject, body, variables } = req.body;

    if (!name || !subject || !body) {
      throw new AppError("Name, subject, and body required", 400);
    }

    const result = await pool.query(
      `INSERT INTO email_templates (name, subject, body, variables, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [name, subject, body, variables || []]
    );

    res.status(201).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const updateEmailTemplate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { name, subject, body, variables } = req.body;

    const result = await pool.query(
      `UPDATE email_templates
       SET name = COALESCE($1, name),
           subject = COALESCE($2, subject),
           body = COALESCE($3, body),
           variables = COALESCE($4, variables),
           updated_at = NOW()
       WHERE id = $5 AND deleted_at IS NULL
       RETURNING *`,
      [name, subject, body, variables, id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Template not found", 404);
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    next(error);
  }
};

export const deleteEmailTemplate = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "UPDATE email_templates SET deleted_at = NOW() WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rows.length === 0) {
      throw new AppError("Template not found", 404);
    }

    res.json({
      success: true,
      message: "Template deleted",
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// ANALYTICS ENDPOINTS
// ────────────────────────────────────────────────────────────────────

export const getAnalyticsPlatform = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const days = Math.min(parseInt((req.query.days as string) || "30", 10) || 30, 365);

    const [summary, usersGrowth, attemptsTrend, questionsByCategory] =
      await Promise.all([
        pool.query(
          `SELECT
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL) AS total_users,
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND status = 'active') AS active_users,
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'student') AS student_count,
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role IN ('super_admin','admin','college_admin')) AS admin_count,
            (SELECT COUNT(*) FROM colleges WHERE deleted_at IS NULL) AS total_colleges,
            (SELECT COUNT(*) FROM question_bank WHERE deleted_at IS NULL) AS total_questions,
            (SELECT COUNT(*) FROM exam_attempts WHERE deleted_at IS NULL) AS total_attempts,
            (SELECT COALESCE(ROUND(AVG(final_score)::numeric, 1), 0) FROM marks_scored) AS avg_score,
            (SELECT COUNT(*) FROM workflows WHERE deleted_at IS NULL) AS total_workflows,
            (SELECT COUNT(*) FROM roles WHERE deleted_at IS NULL) AS total_roles,
            (SELECT COUNT(*) FROM audit_logs) AS total_audit_logs`
        ),
        pool.query(
          `SELECT TO_CHAR(created_at::date, 'Mon DD') AS date, COUNT(*) AS new_users
           FROM users
           WHERE deleted_at IS NULL AND created_at >= NOW() - ($1 || ' days')::interval
           GROUP BY created_at::date ORDER BY created_at::date`,
          [days]
        ),
        pool.query(
          `SELECT TO_CHAR(started_at::date, 'Mon DD') AS date, COUNT(*) AS attempts
           FROM exam_attempts
           WHERE deleted_at IS NULL AND started_at >= NOW() - ($1 || ' days')::interval
           GROUP BY started_at::date ORDER BY started_at::date`,
          [days]
        ),
        pool.query(
          `SELECT category::text AS category, COUNT(*) AS count
           FROM question_bank WHERE deleted_at IS NULL
           GROUP BY category ORDER BY count DESC`
        ),
      ]);

    res.json({
      success: true,
      data: {
        summary: summary.rows[0],
        users_growth: usersGrowth.rows,
        attempts_trend: attemptsTrend.rows,
        questions_by_category: questionsByCategory.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalyticsColleges = async (
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const result = await pool.query(
      `SELECT
        c.id, c.name, c.status,
        COUNT(DISTINCT u.id) AS student_count,
        COUNT(DISTINCT ea.id) AS attempts,
        COALESCE(ROUND(AVG(ms.final_score)::numeric, 1), 0) AS avg_score,
        COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'paid') AS paid_students,
        COALESCE(SUM(sp.amount) FILTER (WHERE sp.status = 'paid'), 0) AS collected
       FROM colleges c
       LEFT JOIN users u ON u.college_id = c.id AND u.role = 'student' AND u.deleted_at IS NULL
       LEFT JOIN exam_attempts ea ON ea.student_id = u.id AND ea.deleted_at IS NULL
       LEFT JOIN marks_scored ms ON ms.student_id = u.id
       LEFT JOIN student_payments sp ON sp.student_id = u.id
       WHERE c.deleted_at IS NULL
       GROUP BY c.id
       ORDER BY student_count DESC`
    );

    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// BILLING SUMMARY
// ────────────────────────────────────────────────────────────────────

export const getBillingSummary = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const feeRow = await queryOne(
      "SELECT value FROM system_settings WHERE key = 'billing.fee_per_student'"
    );
    const yearRow = await queryOne(
      "SELECT value FROM system_settings WHERE key = 'billing.academic_year'"
    );
    const fee = Number(feeRow?.value ?? 500);
    const academicYear =
      (req.query.year as string) || String(yearRow?.value ?? "2026-27").replace(/"/g, "");

    const [totals, byCollege, recent] = await Promise.all([
      pool.query(
        `SELECT
          (SELECT COUNT(*) FROM users WHERE role = 'student' AND deleted_at IS NULL) AS total_students,
          COUNT(*) FILTER (WHERE sp.status = 'paid') AS paid,
          COUNT(*) FILTER (WHERE sp.status = 'pending') AS pending,
          COALESCE(SUM(sp.amount) FILTER (WHERE sp.status = 'paid'), 0) AS collected
         FROM student_payments sp
         WHERE sp.academic_year = $1`,
        [academicYear]
      ),
      pool.query(
        `SELECT
          c.id, c.name,
          COUNT(DISTINCT u.id) AS students,
          COUNT(DISTINCT sp.id) FILTER (WHERE sp.status = 'paid') AS paid,
          COALESCE(SUM(sp.amount) FILTER (WHERE sp.status = 'paid'), 0) AS collected
         FROM colleges c
         LEFT JOIN users u ON u.college_id = c.id AND u.role = 'student' AND u.deleted_at IS NULL
         LEFT JOIN student_payments sp ON sp.college_id = c.id AND sp.academic_year = $1
         WHERE c.deleted_at IS NULL
         GROUP BY c.id
         ORDER BY collected DESC`,
        [academicYear]
      ),
      pool.query(
        `SELECT sp.id, sp.amount, sp.status, sp.payment_method, sp.paid_at,
                u.full_name AS student_name, c.name AS college_name
         FROM student_payments sp
         LEFT JOIN users u ON u.id = sp.student_id
         LEFT JOIN colleges c ON c.id = sp.college_id
         WHERE sp.academic_year = $1
         ORDER BY sp.updated_at DESC
         LIMIT 10`,
        [academicYear]
      ),
    ]);

    const t = totals.rows[0];
    res.json({
      success: true,
      data: {
        academic_year: academicYear,
        fee_per_student: fee,
        total_students: Number(t.total_students),
        paid: Number(t.paid),
        pending: Number(t.pending),
        collected: Number(t.collected),
        expected: Number(t.total_students) * fee,
        by_college: byCollege.rows,
        recent_payments: recent.rows,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ────────────────────────────────────────────────────────────────────
// SYSTEM SETTINGS (key/value)
// ────────────────────────────────────────────────────────────────────

export const getSystemSettings = async (
  _req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const result = await pool.query(
      "SELECT key, value, updated_at FROM system_settings ORDER BY key"
    );
    const settings: Record<string, unknown> = {};
    for (const row of result.rows) settings[row.key] = row.value;
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
};

export const updateSystemSettings = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
) => {
  try {
    const { settings } = req.body as { settings?: Record<string, unknown> };
    if (!settings || typeof settings !== "object" || Array.isArray(settings)) {
      throw new AppError("Body must include a 'settings' object", 400);
    }

    const userId = (req as Request & { user?: { userId?: string } }).user?.userId || "system";
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at, updated_by)
         VALUES ($1, $2::jsonb, NOW(), $3)
         ON CONFLICT (key) DO UPDATE
           SET value = EXCLUDED.value, updated_at = NOW(), updated_by = EXCLUDED.updated_by`,
        [key, JSON.stringify(value), userId]
      );
    }

    await pool.query(
      `INSERT INTO audit_logs (user_id, action, resource_type, changes, ip_address)
       VALUES ($1, 'UPDATE_SETTINGS', 'system_settings', $2, $3)`,
      [userId, JSON.stringify(Object.keys(settings)), req.ip]
    );

    res.json({ success: true, message: "Settings updated" });
  } catch (error) {
    next(error);
  }
};
