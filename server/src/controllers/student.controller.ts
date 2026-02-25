import { Request, Response, NextFunction } from "express";
import * as studentService from "../services/student.service.js";
import { ApiResponse } from "../types/index.js";

/**
 * POST /api/students/register
 * Multipart form: name, email, password, college_id, webcam_photo (file)
 */
export const register = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { name, email, password, college_id } = req.body;
    const webcamPhoto = req.file; // multer single("webcam_photo")

    const result = await studentService.registerStudent({
      name,
      email,
      password,
      college_id,
      webcamPhoto,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: "Student registered successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students/:studentId/exams
 * Returns the exam schedule (all active exams) for a given student.
 */
export const getExamSchedule = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const studentId = req.params.studentId as string;
    const exams = await studentService.getExamScheduleForStudent(studentId);
    res.json({ success: true, data: exams });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/students
 * List all students (HR/Admin)
 */
export const list = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const limit = parseInt(String(req.query.limit)) || 50;
    const offset = parseInt(String(req.query.offset)) || 0;

    const collegeId = req.user?.college_id;
    const isCentral = ["super_admin", "admin", "hr"].includes(req.user?.role || "");

    const students = await studentService.listStudents(limit, offset, isCentral ? undefined : (collegeId || undefined));
    res.json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/students/:id
 * Update student / profile (HR/Admin)
 */
export const update = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await studentService.updateStudent(id as string, req.body);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/students/:id
 * Delete student (HR/Admin)
 */
export const deleteStudent = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const result = await studentService.deleteStudent(id as string);
    res.json({ success: true, message: "Student deleted successfully" });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/students/me/onboarding
 * Student first-login onboarding profile completion.
 */
export const completeOnboarding = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const files = req.files as
      | {
        profile_photo?: Express.Multer.File[];
        resume?: Express.Multer.File[];
      }
      | undefined;

    const result = await studentService.updateStudent(
      req.user!.userId,
      {
        ...req.body,
        profilePhoto: files?.profile_photo?.[0],
        resumeFile: files?.resume?.[0],
      },
    );

    res.json({
      success: true,
      data: result,
      message: "Student profile completed successfully",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/students/bulk
 * Bulk register students.
 */
export const bulkRegister = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  try {
    const { college_id, students } = req.body;
    if (!college_id || !Array.isArray(students)) {
      return res.status(400).json({ success: false, error: "college_id and students mapping are required" });
    }

    const result = await studentService.bulkRegisterStudents(college_id, students);
    res.status(201).json({
      success: true,
      data: result,
      message: `${result.count} students registered successfully`,
    });
  } catch (err) {
    next(err);
  }
};
