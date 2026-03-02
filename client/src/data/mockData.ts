export const exams = [
    {
        id: 1,
        title: "Midterm Exam",
        status: "Active",
        duration: 60,
        totalQuestions: 50,
        cutoff: 40,
        type: "Regular",
        scheduledDate: "Today",
    },
    {
        id: 2,
        title: "Final Exam",
        status: "Scheduled",
        duration: 120,
        totalQuestions: 100,
        cutoff: 70,
        type: "Important",
        scheduledDate: "Next Week",
    },
];

export const studentResults = [
    {
        score: 85,
        maxScore: 100,
        examName: "Midterm Exam",
        date: "2023-10-15",
        rank: 12,
        percentile: 90,
        status: "Pass",
        cutoff: 40,
    },
    {
        score: 45,
        maxScore: 100,
        examName: "Quiz 1",
        date: "2023-09-01",
        rank: 105,
        percentile: 50,
        status: "Fail",
        cutoff: 50,
    },
];

export const examQuestions = [
    {
        id: 1,
        section: "Math",
        marks: 5,
        negativeMarks: 1,
        question: "What is 2 + 2?",
        options: ["2", "3", "4", "5"],
        correct: 2,
    },
    {
        id: 2,
        section: "Science",
        marks: 10,
        negativeMarks: 2,
        question: "What is the speed of light?",
        options: ["3e8", "3e5", "3e4", "3e2"],
        correct: 0,
    },
];
