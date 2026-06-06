// Centralised test data factories used across all phases

export const USERS = {
    admin: { email: 'admin@gradlogic.com', password: 'admin123', role: 'super_admin', name: 'Super Admin', id: 'admin-001' },
    hr: { email: 'hr@gradlogic.com', password: 'hr123456', role: 'hr', name: 'HR Manager', id: 'hr-001' },
    campusAdmin: { email: 'campus@mit.edu', password: 'campus123', role: 'college_admin', name: 'MIT Campus Admin', id: 'ca-001', college_id: 'col-001' },
    campusStaff: { email: 'staff@mit.edu', password: 'staff123', role: 'college_staff', name: 'MIT Staff', id: 'cs-001', college_id: 'col-001' },
    student: { email: 'john.doe@student.mit.edu', password: 'student123', role: 'student', name: 'John Doe', id: 'stu-001', college_id: 'col-001' },
    student2: { email: 'jane.smith@student.mit.edu', password: 'student123', role: 'student', name: 'Jane Smith', id: 'stu-002', college_id: 'col-001' },
};

export const CAMPUS = {
    id: 'col-001',
    name: 'MIT College of Engineering',
    code: 'MIT-CE',
    tier: 'Tier 1',
    naac_grade: 'A+',
    city: 'Chennai',
    state: 'Tamil Nadu',
    contact_email: 'placement@mit.edu',
    contact_phone: '+919876543210',
    student_count: 120,
};

export const CAMPUS_2 = {
    id: 'col-002',
    name: 'Anna University',
    code: 'AU-CE',
    tier: 'Tier 2',
    naac_grade: 'A',
    city: 'Chennai',
    state: 'Tamil Nadu',
    contact_email: 'placement@annauniv.edu',
    contact_phone: '+919876543211',
    student_count: 200,
};

export const ASSESSMENT_RULE = {
    id: 'rule-001',
    name: 'Software Engineer – 2026 Batch',
    version: 1,
    status: 'ACTIVE',
    duration_minutes: 90,
    total_questions: 50,
    cutoff_score: 60,
    proctoring_mode: 'STRICT',
    skill_distribution: { reasoning: 30, maths: 20, programming: 40, verbal: 10 },
    difficulty_distribution: { easy: 30, medium: 50, hard: 20 },
};

export const DRIVE = {
    id: 'drive-001',
    name: 'Campus Drive – June 2026',
    status: 'READY',
    rule_id: 'rule-001',
    scheduled_start: '2026-06-20T09:00:00Z',
    scheduled_end: '2026-06-20T12:00:00Z',
    proctoring_enabled: true,
    tab_switch_limit: 3,
    college_ids: ['col-001'],
};

export const DRIVE_PUBLISHED = { ...DRIVE, status: 'PUBLISHED' };
export const DRIVE_COMPLETED = { ...DRIVE, status: 'COMPLETED' };
export const DRIVE_CANCELLED = { ...DRIVE, status: 'CANCELLED' };

export const QUESTION_MCQ = {
    id: 'q-001',
    type: 'MCQ',
    category: 'reasoning',
    difficulty: 'medium',
    marks: 2,
    question_text: 'Which data structure uses LIFO ordering?',
    options: ['Queue', 'Stack', 'Tree', 'Graph'],
    correct_answer: 1,
    tags: ['data-structures'],
};

export const QUESTION_CODING = {
    id: 'q-002',
    type: 'CODING',
    category: 'programming',
    difficulty: 'hard',
    marks: 10,
    question_text: 'Write a function to reverse a linked list.',
    test_cases: [
        { input: '[1,2,3]', expected_output: '[3,2,1]', hidden: false },
        { input: '[1]', expected_output: '[1]', hidden: false },
        { input: '[5,4,3,2,1]', expected_output: '[1,2,3,4,5]', hidden: true },
    ],
};

export const EXAM_SESSION = {
    id: 'sess-001',
    drive_id: 'drive-001',
    student_id: 'stu-001',
    status: 'IN_PROGRESS',
    current_question_index: 3,
    time_remaining_seconds: 3600,
    answers: {},
    started_at: new Date().toISOString(),
};

export const EXAM_RESULT = {
    student_id: 'stu-001',
    drive_id: 'drive-001',
    final_score: 72,
    cutoff_score: 60,
    passed: true,
    integrity_score: 95,
    risk_score: 5,
    completed_at: new Date().toISOString(),
};

export const EXAM_RESULT_FAILED = { ...EXAM_RESULT, final_score: 45, passed: false };
export const EXAM_RESULT_FLAGGED = { ...EXAM_RESULT, integrity_score: 25, risk_score: 75 };

export const VIOLATION = {
    id: 'viol-001',
    session_id: 'sess-001',
    violation_type: 'TAB_SWITCH',
    risk_score: 15,
    timestamp: new Date().toISOString(),
};

export const STUDENTS_LIST = [
    { id: 'stu-001', name: 'John Doe', email: 'john.doe@student.mit.edu', roll_number: 'MIT001', degree: 'B.E. CSE', cgpa: 8.5, status: 'ACTIVE' },
    { id: 'stu-002', name: 'Jane Smith', email: 'jane.smith@student.mit.edu', roll_number: 'MIT002', degree: 'B.E. CSE', cgpa: 9.1, status: 'ACTIVE' },
    { id: 'stu-003', name: 'Raj Kumar', email: 'raj.kumar@student.mit.edu', roll_number: 'MIT003', degree: 'B.E. ECE', cgpa: 7.8, status: 'ACTIVE' },
];
