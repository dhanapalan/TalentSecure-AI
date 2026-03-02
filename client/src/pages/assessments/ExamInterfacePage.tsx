import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Editor from "@monaco-editor/react";
import api from "../../lib/api";
import {
  connectProctoringSocket,
  disconnectProctoringSocket,
  getProctoringSocket,
} from "../../lib/socket";

// ── Types ────────────────────────────────────────────────────────────────────

interface Violation {
  type: string;
  time: string;
}

interface MCQQuestion {
  id: string;
  type: "mcq";
  text: string;
  options: string[];
  marks: number;
}

interface CodingQuestion {
  id: string;
  type: "coding";
  title: string;
  description: string;
  constraints: string;
  sampleInput: string;
  sampleOutput: string;
  marks: number;
  starterCode: Record<string, string>;
  testCases: { input: string; expectedOutput: string }[];
}

type ExamQuestion = MCQQuestion | CodingQuestion;

interface TestCaseResult {
  testCaseIndex: number;
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  passed: boolean;
  status: string;
  time: string | null;
  memory: number | null;
  error: string | null;
}

interface ValidationReport {
  language: string;
  totalTestCases: number;
  passed: number;
  failed: number;
  score: number;
  testResults: TestCaseResult[];
  compilationError: string | null;
}

interface RunResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  status: { id: number; description: string };
  time: string | null;
  memory: number | null;
}

type Difficulty = "easy" | "medium" | "hard";

interface AdaptiveState {
  currentDifficulty: Difficulty;
  seenIds: string[];
  history: { questionId: string; correct: boolean; difficulty: Difficulty }[];
  streak: number; // positive = consecutive correct, negative = consecutive wrong
}

interface AdaptiveQuestion {
  id: string;
  type: "multiple_choice" | "coding_challenge";
  category: string;
  difficulty_level: Difficulty;
  question_text: string;
  options: string[] | null;
  correct_answer: string | null;
  test_cases: { input: string; expectedOutput: string }[] | null;
  starter_code: Record<string, string> | null;
  marks: number;
  tags: string[];
}

interface AdaptiveApiResponse {
  question: AdaptiveQuestion | null;
  target_difficulty: Difficulty;
  previous_difficulty: Difficulty;
  direction: "up" | "down" | "same";
  pool_remaining: number;
  fallback: boolean;
}

// ── Placeholder questions (mixed MCQ + coding) ──────────────────────────────

const PLACEHOLDER_QUESTIONS: ExamQuestion[] = [
  {
    id: "q1",
    type: "mcq",
    text: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
    marks: 5,
  },
  {
    id: "q2",
    type: "mcq",
    text: "Which data structure uses LIFO (Last-In-First-Out) ordering?",
    options: ["Queue", "Stack", "Heap", "Graph"],
    marks: 5,
  },
  {
    id: "q3",
    type: "mcq",
    text: "What is the worst-case time complexity of quicksort?",
    options: ["O(n log n)", "O(n²)", "O(n)", "O(log n)"],
    marks: 5,
  },
  {
    id: "q4",
    type: "coding",
    title: "Two Sum",
    description: `Given an array of integers and a target, return the indices of the two numbers that add up to the target.

You may assume each input has exactly one solution and you may not use the same element twice.

**Input Format:**
- Line 1: integer n (size of array)
- Line 2: n space-separated integers
- Line 3: integer target

**Output Format:**
- Two space-separated 0-based indices`,
    constraints:
      "2 ≤ n ≤ 10⁴\n-10⁹ ≤ nums[i] ≤ 10⁹\nExactly one valid answer exists.",
    sampleInput: "4\n2 7 11 15\n9",
    sampleOutput: "0 1",
    marks: 15,
    starterCode: {
      python:
        "import sys\n\ndef two_sum(nums, target):\n    # Write your solution here\n    pass\n\n# --- Do not modify below ---\nn = int(input())\nnums = list(map(int, input().split()))\ntarget = int(input())\nresult = two_sum(nums, target)\nprint(result[0], result[1])\n",
      java:
        'import java.util.*;\n\npublic class Main {\n    public static int[] twoSum(int[] nums, int target) {\n        // Write your solution here\n        return new int[]{0, 0};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int target = sc.nextInt();\n        int[] res = twoSum(nums, target);\n        System.out.println(res[0] + " " + res[1]);\n    }\n}\n',
      cpp:
        '#include <iostream>\n#include <vector>\nusing namespace std;\n\npair<int,int> twoSum(vector<int>& nums, int target) {\n    // Write your solution here\n    return {0, 0};\n}\n\nint main() {\n    int n; cin >> n;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) cin >> nums[i];\n    int target; cin >> target;\n    auto [a, b] = twoSum(nums, target);\n    cout << a << " " << b << endl;\n}\n',
    },
    testCases: [
      { input: "4\n2 7 11 15\n9", expectedOutput: "0 1" },
      { input: "3\n3 2 4\n6", expectedOutput: "1 2" },
      { input: "2\n3 3\n6", expectedOutput: "0 1" },
    ],
  },
  {
    id: "q5",
    type: "coding",
    title: "Reverse a String",
    description: `Write a program that reads a string and prints it reversed.

**Input Format:**
- A single line containing the string.

**Output Format:**
- The reversed string.`,
    constraints: "1 ≤ length ≤ 10⁵\nASCII characters only.",
    sampleInput: "hello",
    sampleOutput: "olleh",
    marks: 10,
    starterCode: {
      python: "s = input()\n# Write your solution here\nprint(s[::-1])\n",
      java:
        'import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String s = sc.nextLine();\n        // Write your solution here\n        System.out.println(new StringBuilder(s).reverse().toString());\n    }\n}\n',
      cpp:
        '#include <iostream>\n#include <algorithm>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n    // Write your solution here\n    reverse(s.begin(), s.end());\n    cout << s << endl;\n}\n',
    },
    testCases: [
      { input: "hello", expectedOutput: "olleh" },
      { input: "abcdef", expectedOutput: "fedcba" },
      { input: "a", expectedOutput: "a" },
    ],
  },
];

// ── Convert adaptive question → ExamQuestion for unified rendering ───────────

function adaptiveToExamQuestion(aq: AdaptiveQuestion): ExamQuestion {
  if (aq.type === "multiple_choice") {
    return {
      id: aq.id,
      type: "mcq",
      text: aq.question_text,
      options: aq.options ?? [],
      marks: aq.marks,
    } as MCQQuestion;
  }
  // coding_challenge
  const firstLine = aq.question_text.split("\n")[0] || "Coding Challenge";
  return {
    id: aq.id,
    type: "coding",
    title: firstLine,
    description: aq.question_text,
    constraints: "",
    sampleInput: aq.test_cases?.[0]?.input ?? "",
    sampleOutput: aq.test_cases?.[0]?.expectedOutput ?? "",
    marks: aq.marks,
    starterCode: aq.starter_code ?? {
      python: "# Write your solution here\n",
      java: "// Write your solution here\n",
      cpp: "// Write your solution here\n",
    },
    testCases: aq.test_cases ?? [],
  } as CodingQuestion;
}

// ── Difficulty colour helpers ────────────────────────────────────────────────

const DIFF_COLORS: Record<Difficulty, string> = {
  easy: "bg-green-100 text-green-700 border-green-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  hard: "bg-red-100 text-red-700 border-red-300",
};

const CATEGORY_OPTIONS = [
  "data_structures",
  "algorithms",
  "system_design",
  "database",
  "general_programming",
] as const;

// ── Monaco language mapping ──────────────────────────────────────────────────

const LANG_OPTIONS = [
  { id: "python", label: "Python", monacoId: "python" },
  { id: "java", label: "Java", monacoId: "java" },
  { id: "cpp", label: "C++", monacoId: "cpp" },
] as const;

// ── Helper: format seconds as MM:SS ──────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ExamInterfacePage() {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Exam state
  const [examState, setExamState] = useState<'pre-exam' | 'active' | 'completed' | 'interrupted'>('pre-exam');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [savedQuestionIndex, setSavedQuestionIndex] = useState(0);

  // Code editor state (per-question)
  const [codeMap, setCodeMap] = useState<Record<string, string>>({});
  const [langMap, setLangMap] = useState<Record<string, string>>({});
  const [customStdin, setCustomStdin] = useState("");
  const [activeOutputTab, setActiveOutputTab] = useState<
    "output" | "results"
  >("output");
  const [runOutput, setRunOutput] = useState<RunResult | null>(null);
  const [validationReport, setValidationReport] =
    useState<ValidationReport | null>(null);
  const [codingScores, setCodingScores] = useState<
    Record<string, { passed: number; total: number }>
  >({});

  // Adaptive complexity state
  const [adaptiveEnabled, setAdaptiveEnabled] = useState(false);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState>({
    currentDifficulty: "medium",
    seenIds: [],
    history: [],
    streak: 0,
  });
  const [adaptiveQuestion, setAdaptiveQuestion] = useState<AdaptiveQuestion | null>(null);
  const [lastAnswerFeedback, setLastAnswerFeedback] = useState<{
    correct: boolean;
    direction: "up" | "down" | "same";
    newDifficulty: Difficulty;
  } | null>(null);

  // Proctoring state
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [warningFlash, setWarningFlash] = useState(false);
  const violationCooldown = useRef<Record<string, number>>({});

  // Guard against double-submission
  const isSubmittingRef = useRef(false);

  // Auto-save debounce timer
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSavingRef = useRef(false);

  // ── Fetch existing attempt on mount (resume support) ──────────────────────

  const { data: existingAttempt } = useQuery({
    queryKey: ["exam-attempt", examId],
    queryFn: async () => {
      const { data } = await api.get(`/exams/${examId}/attempt`);
      return data.data as {
        id: string;
        current_question_index: number;
        saved_answers: Record<string, string>;
        status: string;
      } | null;
    },
    enabled: !!examId,
    retry: false,
  });

  // Restore progress from existing attempt
  useEffect(() => {
    if (!existingAttempt) return;
    if (examState !== 'pre-exam') return; // only restore once, before exam starts

    const { current_question_index, saved_answers } = existingAttempt;

    if (current_question_index > 0) {
      setCurrentQuestion(current_question_index);
      setSavedQuestionIndex(current_question_index);
    }

    if (saved_answers && typeof saved_answers === 'object' && Object.keys(saved_answers).length > 0) {
      setAnswers(saved_answers);
    }

    toast.success(
      `Progress restored — resuming from Question ${current_question_index + 1}`,
      { duration: 4000 },
    );
  }, [existingAttempt]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch exam info
  const { data: exam } = useQuery({
    queryKey: ["exam", examId],
    queryFn: async () => {
      const { data } = await api.get(`/exams/${examId}`);
      return data.data as {
        id: string;
        title: string;
        duration: number;
        scheduled_time: string;
      };
    },
    enabled: !!examId,
  });

  // ── Submit exam mutation ───────────────────────────────────────────────────

  const submitExamMutation = useMutation({
    mutationFn: async (payload: {
      exam_id: string;
      answers: Record<string, string>;
      coding_scores: Record<string, { passed: number; total: number }>;
      violations_count: number;
      time_remaining: number;
      adaptive_history?: AdaptiveState['history'];
    }) => {
      const { data } = await api.post('/exams/submit', payload);
      return data;
    },
    onError: (err: any) => {
      console.error('Failed to submit exam:', err);
      // Still mark as completed locally even if API fails
    },
  });

  // ── Adaptive next-question mutation ────────────────────────────────────────

  const adaptiveMutation = useMutation({
    mutationFn: async (params: {
      category: string;
      current_difficulty: Difficulty;
      answered_correctly: boolean;
      seen_question_ids: string[];
    }) => {
      const { data } = await api.post<{
        success: boolean;
        data: AdaptiveApiResponse;
        message: string;
      }>("/exams/next-adaptive", params);
      return data;
    },
    onSuccess: (resp) => {
      const r = resp.data;
      if (r.question) {
        setAdaptiveQuestion(r.question);
        setAdaptiveState((prev) => ({
          ...prev,
          currentDifficulty: r.target_difficulty,
          seenIds: [...prev.seenIds, r.question!.id],
        }));
        setLastAnswerFeedback({
          correct: r.direction === "up" || r.direction === "same",
          direction: r.direction,
          newDifficulty: r.target_difficulty,
        });
        // Clear editor state for new question
        setRunOutput(null);
        setValidationReport(null);
        setCustomStdin("");

        const arrow = r.direction === "up" ? "⬆️" : r.direction === "down" ? "⬇️" : "➡️";
        toast(
          `${arrow} Difficulty: ${r.previous_difficulty} → ${r.target_difficulty}`,
          { icon: r.direction === "up" ? "🔥" : r.direction === "down" ? "📉" : "➡️" },
        );
      } else {
        toast("No more questions in this category!", { icon: "🎉" });
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error ?? "Failed to fetch next question");
    },
  });

  // ── Check MCQ correctness and trigger adaptive ────────────────────────────

  const confirmMCQAnswer = useCallback(() => {
    const q = adaptiveQuestion;
    if (!q || q.type !== "multiple_choice" || !q.options) return;

    const selectedAnswer = answers[q.id];
    if (selectedAnswer === undefined) {
      toast.error("Please select an answer first");
      return;
    }

    // Compare: correct_answer is 0-based index stored as string
    const selectedIdx = q.options.indexOf(selectedAnswer);
    const correctIdx = parseInt(q.correct_answer ?? "-1", 10);
    const isCorrect = selectedIdx === correctIdx;

    // Update adaptive history
    setAdaptiveState((prev) => {
      const newStreak = isCorrect
        ? Math.max(prev.streak + 1, 1)
        : Math.min(prev.streak - 1, -1);
      return {
        ...prev,
        history: [
          ...prev.history,
          {
            questionId: q.id,
            correct: isCorrect,
            difficulty: prev.currentDifficulty,
          },
        ],
        streak: newStreak,
      };
    });

    toast(
      isCorrect ? "✅ Correct!" : `❌ Wrong! Correct: ${q.options[correctIdx]}`,
      {
        icon: isCorrect ? "🎯" : "💡",
        duration: 2000,
      },
    );

    // Fetch next adaptive question
    adaptiveMutation.mutate({
      category: q.category,
      current_difficulty: adaptiveState.currentDifficulty,
      answered_correctly: isCorrect,
      seen_question_ids: adaptiveState.seenIds,
    });
  }, [adaptiveQuestion, answers, adaptiveState, adaptiveMutation]);

  // ── Check coding correctness (via validation score) and trigger adaptive ──

  const confirmCodingAnswer = useCallback(
    (score: number) => {
      const q = adaptiveQuestion;
      if (!q || q.type !== "coding_challenge") return;

      const isCorrect = score >= 75; // 75%+ = correct for adaptive purposes

      setAdaptiveState((prev) => {
        const newStreak = isCorrect
          ? Math.max(prev.streak + 1, 1)
          : Math.min(prev.streak - 1, -1);
        return {
          ...prev,
          history: [
            ...prev.history,
            {
              questionId: q.id,
              correct: isCorrect,
              difficulty: prev.currentDifficulty,
            },
          ],
          streak: newStreak,
        };
      });

      // Fetch next
      adaptiveMutation.mutate({
        category: q.category,
        current_difficulty: adaptiveState.currentDifficulty,
        answered_correctly: isCorrect,
        seen_question_ids: adaptiveState.seenIds,
      });
    },
    [adaptiveQuestion, adaptiveState, adaptiveMutation],
  );

  // ── Start adaptive mode ───────────────────────────────────────────────────

  const startAdaptiveMode = useCallback(
    (category: string, startDifficulty: Difficulty = "medium") => {
      setAdaptiveEnabled(true);
      setAdaptiveState({
        currentDifficulty: startDifficulty,
        seenIds: [],
        history: [],
        streak: 0,
      });
      setAdaptiveQuestion(null);
      setLastAnswerFeedback(null);
      // Fetch the first question
      adaptiveMutation.mutate({
        category,
        current_difficulty: startDifficulty,
        answered_correctly: true, // neutral start
        seen_question_ids: [],
      });
    },
    [adaptiveMutation],
  );

  // ── Report violation to backend ───────────────────────────────────────────

  const reportViolation = useCallback(
    async (violationType: string) => {
      if (!examId) return;

      // Cooldown: 5 seconds between same violation types
      const now = Date.now();
      const lastTime = violationCooldown.current[violationType] || 0;
      if (now - lastTime < 5000) return;
      violationCooldown.current[violationType] = now;

      // Update local state
      const violation: Violation = {
        type: violationType,
        time: new Date().toLocaleTimeString(),
      };
      setViolations((prev) => [...prev, violation]);

      // Flash warning
      setWarningFlash(true);
      setTimeout(() => setWarningFlash(false), 1000);

      // Toast
      toast.error(
        `⚠ Violation: ${violationType.replace(/_/g, " ").toUpperCase()}`,
        { duration: 3000 }
      );

      // Report to backend
      try {
        await api.post("/cheating-logs/report", {
          exam_id: examId,
          violation_type: violationType,
        });
      } catch (err) {
        console.error("Failed to report violation:", err);
      }
    },
    [examId]
  );

  // ── Coding helpers ─────────────────────────────────────────────────────────

  const getCurrentLang = useCallback(
    (qId: string) => langMap[qId] || "python",
    [langMap],
  );

  const getCurrentCode = useCallback(
    (q: CodingQuestion) => {
      const lang = getCurrentLang(q.id);
      return codeMap[`${q.id}_${lang}`] ?? q.starterCode[lang] ?? "";
    },
    [codeMap, getCurrentLang],
  );

  const setCurrentCode = useCallback(
    (qId: string, lang: string, code: string) => {
      setCodeMap((prev) => ({ ...prev, [`${qId}_${lang}`]: code }));
    },
    [],
  );

  const handleLangChange = useCallback(
    (qId: string, newLang: string) => {
      setLangMap((prev) => ({ ...prev, [qId]: newLang }));
      setRunOutput(null);
      setValidationReport(null);
    },
    [],
  );

  // ── Run Code mutation (single execution with custom stdin) ────────────────

  const runCodeMutation = useMutation({
    mutationFn: async ({
      sourceCode,
      language,
      stdin,
    }: {
      sourceCode: string;
      language: string;
      stdin: string;
    }) => {
      const { data } = await api.post("/exams/execute-code", {
        sourceCode,
        language,
        stdin,
      });
      return data.data as RunResult;
    },
    onSuccess: (data) => {
      setRunOutput(data);
      setActiveOutputTab("output");
      if (data.status.id === 3) toast.success("Code executed successfully");
      else if (data.compileOutput) toast.error("Compilation error");
      else toast.error(`Execution: ${data.status.description}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Execution failed"),
  });

  // ── Validate Code mutation (run against hidden test cases) ────────────────

  const validateCodeMutation = useMutation({
    mutationFn: async ({
      sourceCode,
      language,
      questionId,
      testCases,
    }: {
      sourceCode: string;
      language: string;
      questionId: string;
      testCases: { input: string; expectedOutput: string }[];
    }) => {
      const { data } = await api.post("/exams/validate-code", {
        sourceCode,
        language,
        questionId,
        testCases,
      });
      return data.data as ValidationReport;
    },
    onSuccess: (data, variables) => {
      setValidationReport(data);
      setActiveOutputTab("results");
      setCodingScores((prev) => ({
        ...prev,
        [variables.questionId]: {
          passed: data.passed,
          total: data.totalTestCases,
        },
      }));
      if (data.score === 100)
        toast.success(`All ${data.totalTestCases} test cases passed!`);
      else
        toast(`Passed ${data.passed}/${data.totalTestCases} test cases`, {
          icon: "📊",
        });
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Validation failed"),
  });

  // ── Start exam ────────────────────────────────────────────────────────────

  const startExam = useCallback(async () => {
    try {
      // Request webcam
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Enter fullscreen
      try {
        await document.documentElement.requestFullscreen();
      } catch {
        toast.error("Fullscreen is required for this exam.");
      }

      // Start timer (use duration_minutes if available, fallback to duration)
      const durationMin = (exam as any)?.duration_minutes ?? exam?.duration ?? 60;
      setTimeLeft(durationMin * 60);
      setExamState('active');

      toast.success("Exam started. Good luck!");
    } catch (err: any) {
      toast.error("Camera permission is required to start the exam.");
    }
  }, [exam]);

  // ── Timer countdown ───────────────────────────────────────────────────────

  useEffect(() => {
    if (examState !== 'active' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          finishExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState, timeLeft]);

  // ── Debounced auto-save on answer change ──────────────────────────────────

  useEffect(() => {
    if (examState !== 'active') return;
    if (!examId) return;

    // Clear any pending timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Debounce: save 1.5s after the last answer change
    autoSaveTimerRef.current = setTimeout(async () => {
      if (autoSavingRef.current) return; // skip if already in-flight
      autoSavingRef.current = true;
      try {
        await api.post('/exams/auto-save', {
          exam_id: examId,
          current_question_index: currentQuestion,
          answers_payload: answers,
        });
        setSavedQuestionIndex(currentQuestion);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        autoSavingRef.current = false;
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [answers, currentQuestion, examState, examId]);

  // ── Socket heartbeat — detect connection loss ─────────────────────────────

  useEffect(() => {
    if (examState !== 'active') return;

    const socket = getProctoringSocket() ?? connectProctoringSocket();

    const handleDisconnect = (reason: string) => {
      console.warn('Socket disconnected:', reason);

      // Mark as interrupted locally
      setExamState('interrupted');

      // Exit fullscreen
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      // Stop webcam
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }

      // Fire-and-forget: try to mark attempt as interrupted on the server
      if (examId) {
        api.post('/exams/auto-save', {
          exam_id: examId,
          current_question_index: currentQuestion,
          answers_payload: answers,
        }).catch(() => {});
      }
    };

    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('disconnect', handleDisconnect);
    };
  }, [examState, examId, currentQuestion, answers]);

  // ── Event listeners for violation detection ───────────────────────────────

  useEffect(() => {
    if (examState !== 'active') return;

    // 1. Tab switch (visibilitychange)
    const handleVisibility = () => {
      if (document.hidden) {
        reportViolation("tab_switch");
      }
    };

    // 2. Fullscreen exit
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && examState === 'active') {
        reportViolation("browser_minimized");
      }
    };

    // 3. Right-click
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      reportViolation("right_click");
    };

    // 4. Copy / Paste
    const handleCopyPaste = (e: Event) => {
      e.preventDefault();
      reportViolation("copy_paste_attempt");
    };

    // 5. Keyboard shortcuts (Ctrl+C, Ctrl+V, Ctrl+Tab, Alt+Tab)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey && (e.key === "c" || e.key === "v")) ||
        (e.ctrlKey && e.key === "Tab") ||
        (e.altKey && e.key === "Tab")
      ) {
        e.preventDefault();
        reportViolation("copy_paste_attempt");
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [examState, reportViolation]);

  // ── Finish exam ───────────────────────────────────────────────────────────

  const finishExam = useCallback(() => {
    // Prevent double-submission
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;

    // 1. Transition to completed state
    setExamState('completed');

    // 2. Exit fullscreen
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // 3. Stop webcam / PiP stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // 4. Submit final answers to the server
    if (examId) {
      submitExamMutation.mutate({
        exam_id: examId,
        answers,
        coding_scores: codingScores,
        violations_count: violations.length,
        time_remaining: timeLeft,
        adaptive_history: adaptiveEnabled ? adaptiveState.history : undefined,
      });
    }
  }, [examId, answers, codingScores, violations, timeLeft, adaptiveEnabled, adaptiveState.history, submitExamMutation]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      disconnectProctoringSocket();
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // ── Pre-exam screen ───────────────────────────────────────────────────────

  if (examState === 'pre-exam') {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card text-center">
          <h1 className="text-2xl font-bold text-gray-900">
            {exam?.title ?? "Loading exam…"}
          </h1>
          <p className="mt-4 text-gray-600">
            This is a proctored exam. Before starting, please ensure:
          </p>

          <div className="mt-6 space-y-3 text-left">
            {[
              "You are in a quiet, well-lit room",
              "Your webcam is working and your face is clearly visible",
              "You will not switch browser tabs or leave fullscreen",
              "No other persons are visible in the webcam frame",
              "Copy/paste and right-click are disabled during the exam",
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-gray-50 p-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {i + 1}
                </span>
                <span className="text-sm text-gray-700">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-lg bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Duration:</strong> {exam?.duration ?? "—"} minutes &middot;{" "}
            <strong>Questions:</strong> {PLACEHOLDER_QUESTIONS.length} &middot;{" "}
            <strong>Total Marks:</strong>{" "}
            {PLACEHOLDER_QUESTIONS.reduce((s, q) => s + q.marks, 0)}
          </div>

          {/* Resume banner (when existing attempt found) */}
          {existingAttempt && Object.keys(answers).length > 0 && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              <strong>📋 Previous progress detected:</strong> You answered{" "}
              {Object.keys(answers).length} question(s) and were on Question{" "}
              {currentQuestion + 1}. Your progress will be restored when you
              start.
            </div>
          )}

          <button
            onClick={startExam}
            disabled={!exam}
            className="btn-primary mt-8 px-10 py-3 text-base disabled:opacity-50"
          >
            Start Exam →
          </button>

          {/* ── Adaptive Practice Section ───────────────────────── */}
          <div className="mt-10 border-t pt-8">
            <h2 className="text-lg font-bold text-gray-800">
              🎯 Adaptive Practice Mode
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Questions adapt in difficulty based on your answers — get one right
              and the next is harder, get one wrong and it eases off.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-4 text-left">
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Category
                </label>
                <select
                  id="adaptive-category"
                  defaultValue="algorithms"
                  title="Select category"
                  aria-label="Category"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">
                  Starting Difficulty
                </label>
                <select
                  id="adaptive-difficulty"
                  defaultValue="medium"
                  title="Select starting difficulty"
                  aria-label="Starting Difficulty"
                  className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                >
                  {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                const cat =
                  (document.getElementById("adaptive-category") as HTMLSelectElement)?.value ??
                  "algorithms";
                const diff =
                  ((document.getElementById("adaptive-difficulty") as HTMLSelectElement)
                    ?.value as Difficulty) ?? "medium";
                // Start exam first (camera, fullscreen, timer) then kick off adaptive
                startExam().then(() => startAdaptiveMode(cat, diff));
              }}
              disabled={!exam}
              className="mt-6 w-full rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
            >
              Start Adaptive Practice →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Interrupted screen ────────────────────────────────────────────────────

  if (examState === 'interrupted') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-lg">
          {/* Orange warning icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
            <svg
              className="h-10 w-10 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Connection Lost
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
            Your progress up to{" "}
            <span className="font-semibold text-gray-800">
              Question {savedQuestionIndex + 1}
            </span>{" "}
            has been saved. Please contact the administrator to resume your exam.
          </p>

          {/* Saved progress summary */}
          <div className="mt-8 rounded-lg bg-amber-50 px-6 py-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {Object.keys(answers).length}
                </p>
                <p className="text-[11px] text-gray-400">Answers Saved</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">
                  Q{savedQuestionIndex + 1}
                </p>
                <p className="text-[11px] text-gray-400">Last Question</p>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-gray-400">
            Exam ID: <span className="font-mono">{examId}</span>
          </p>

          <button
            onClick={() => navigate('/')}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-gray-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-700"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Completed screen ──────────────────────────────────────────────────────

  if (examState === 'completed') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-lg">
          {/* Green checkmark */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900">
            Assessment Submitted Successfully
          </h1>

          <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-gray-500">
            Your responses and proctoring logs have been securely saved. You may
            now close this window or return to the dashboard.
          </p>

          {/* Submission summary (subtle) */}
          <div className="mt-8 rounded-lg bg-gray-50 px-6 py-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {Object.keys(answers).length}
                </p>
                <p className="text-[11px] text-gray-400">MCQs Answered</p>
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">
                  {Object.keys(codingScores).length}
                </p>
                <p className="text-[11px] text-gray-400">Coding Submitted</p>
              </div>
              <div>
                <p
                  className={`text-xl font-bold ${
                    violations.length === 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {violations.length}
                </p>
                <p className="text-[11px] text-gray-400">Violations</p>
              </div>
            </div>
          </div>

          {/* Adaptive performance (if applicable) */}
          {adaptiveEnabled && adaptiveState.history.length > 0 && (
            <div className="mt-4 rounded-lg bg-indigo-50 px-6 py-4 text-left">
              <p className="text-sm font-semibold text-indigo-800">
                Adaptive Performance
              </p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-2xl font-bold text-indigo-700">
                    {adaptiveState.history.length}
                  </p>
                  <p className="text-[10px] text-gray-500">Questions</p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-2xl font-bold text-green-600">
                    {adaptiveState.history.filter((h) => h.correct).length}
                  </p>
                  <p className="text-[10px] text-gray-500">Correct</p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm">
                  <p className="text-2xl font-bold text-gray-700">
                    {Math.round(
                      (adaptiveState.history.filter((h) => h.correct).length /
                        adaptiveState.history.length) *
                        100,
                    )}
                    %
                  </p>
                  <p className="text-[10px] text-gray-500">Accuracy</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {adaptiveState.history.map((h, i) => (
                  <span
                    key={i}
                    className={`flex h-6 w-6 items-center justify-center rounded text-[10px] font-bold ${
                      h.correct
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                    title={`Q${i + 1}: ${h.difficulty} — ${h.correct ? '✓' : '✗'}`}
                  >
                    {h.correct ? '✓' : '✗'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Return to dashboard — no back button to the exam */}
          <button
            onClick={() => navigate('/')}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0h4"
              />
            </svg>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Active exam screen (fullscreen) ───────────────────────────────────────

  // When adaptive mode is active use the live adaptive question;
  // otherwise fall through to the placeholder bank.
  const activeAdaptive = adaptiveEnabled && adaptiveQuestion;
  const question: ExamQuestion = activeAdaptive
    ? adaptiveToExamQuestion(adaptiveQuestion)
    : PLACEHOLDER_QUESTIONS[currentQuestion];
  const isCoding = question.type === "coding";
  const codingQ = isCoding ? (question as CodingQuestion) : null;
  const mcqQ = !isCoding ? (question as MCQQuestion) : null;
  const currentLang = codingQ ? getCurrentLang(codingQ.id) : "python";
  const currentCode = codingQ ? getCurrentCode(codingQ) : "";
  const monacoLang =
    LANG_OPTIONS.find((l) => l.id === currentLang)?.monacoId || "python";

  return (
    <div
      className={`relative flex min-h-screen flex-col bg-white ${
        warningFlash ? "ring-4 ring-inset ring-red-500" : ""
      }`}
    >
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-6 py-3 shadow-sm">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{exam?.title}</h1>
          <p className="text-xs text-gray-500">
            {activeAdaptive ? (
              <>
                Adaptive Mode &middot; Q#{adaptiveState.history.length + 1}
              </>
            ) : (
              <>
                Question {currentQuestion + 1} of {PLACEHOLDER_QUESTIONS.length}
              </>
            )}
            {isCoding && (
              <span className="ml-2 rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700">
                CODING
              </span>
            )}
            {!isCoding && (
              <span className="ml-2 rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                MCQ
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-6">
          {/* Adaptive difficulty + streak indicator */}
          {activeAdaptive && (
            <div className="flex items-center gap-3">
              {/* Difficulty badge */}
              <div className="text-center">
                <p className="text-xs text-gray-400">Difficulty</p>
                <span
                  className={`inline-block rounded-full border px-3 py-0.5 text-xs font-bold capitalize ${
                    DIFF_COLORS[adaptiveState.currentDifficulty]
                  }`}
                >
                  {lastAnswerFeedback && (
                    <span className="mr-1">
                      {lastAnswerFeedback.direction === "up"
                        ? "⬆"
                        : lastAnswerFeedback.direction === "down"
                        ? "⬇"
                        : "→"}
                    </span>
                  )}
                  {adaptiveState.currentDifficulty}
                </span>
              </div>

              {/* Streak counter */}
              <div className="text-center">
                <p className="text-xs text-gray-400">Streak</p>
                <p
                  className={`text-lg font-bold ${
                    adaptiveState.streak > 0
                      ? "text-green-600"
                      : adaptiveState.streak < 0
                      ? "text-red-600"
                      : "text-gray-400"
                  }`}
                >
                  {adaptiveState.streak > 0
                    ? `🔥 ${adaptiveState.streak}`
                    : adaptiveState.streak < 0
                    ? `${adaptiveState.streak}`
                    : "—"}
                </p>
              </div>

              {/* Questions answered */}
              <div className="text-center">
                <p className="text-xs text-gray-400">Answered</p>
                <p className="text-lg font-bold text-gray-700">
                  {adaptiveState.history.length}
                </p>
              </div>
            </div>
          )}

          {/* Violation counter */}
          <div className="text-center">
            <p className="text-xs text-gray-400">Violations</p>
            <p
              className={`text-lg font-bold ${
                violations.length === 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {violations.length}
            </p>
          </div>

          {/* Timer */}
          <div className="text-center">
            <p className="text-xs text-gray-400">Time Left</p>
            <p
              className={`text-xl font-mono font-bold ${
                timeLeft < 300 ? "text-red-600" : "text-gray-900"
              }`}
            >
              {formatTime(timeLeft)}
            </p>
          </div>
        </div>
      </header>

      {/* ── Main content ─────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {isCoding && codingQ ? (
          <>
            {/* ── LEFT: Problem description ──────────────────────────── */}
            <div className="flex w-2/5 flex-col border-r border-gray-200">
              <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {codingQ.title}
                  </h2>
                  <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                    {codingQ.marks} marks
                  </span>
                </div>

                <div className="prose prose-sm max-w-none text-gray-700">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {codingQ.description}
                  </div>
                </div>

                {/* Constraints */}
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">
                    Constraints
                  </p>
                  <pre className="mt-1 whitespace-pre-wrap font-mono text-xs text-amber-600">
                    {codingQ.constraints}
                  </pre>
                </div>

                {/* Sample I/O */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Sample Input
                    </p>
                    <pre className="mt-1 font-mono text-xs text-gray-800">
                      {codingQ.sampleInput}
                    </pre>
                  </div>
                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Sample Output
                    </p>
                    <pre className="mt-1 font-mono text-xs text-gray-800">
                      {codingQ.sampleOutput}
                    </pre>
                  </div>
                </div>

                {/* Custom stdin */}
                <div className="mt-4">
                  <label className="text-xs font-semibold text-gray-500">
                    Custom Input (stdin)
                  </label>
                  <textarea
                    value={customStdin}
                    onChange={(e) => setCustomStdin(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-md border border-gray-300 bg-white p-2 font-mono text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter custom test input…"
                  />
                </div>
              </div>

              {/* ── Output panel (below problem) ─────────────────────── */}
              <div className="h-52 border-t border-gray-200 bg-gray-50">
                {/* Tabs */}
                <div className="flex border-b bg-white">
                  {(["output", "results"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveOutputTab(tab)}
                      className={`px-4 py-2 text-xs font-medium capitalize ${
                        activeOutputTab === tab
                          ? "border-b-2 border-blue-500 text-blue-600"
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {tab}
                      {tab === "results" && validationReport && (
                        <span
                          className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
                            validationReport.score === 100
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {validationReport.passed}/{validationReport.totalTestCases}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="overflow-y-auto p-3 custom-scroll-area">
                  {activeOutputTab === "output" && (
                    <>
                      {runOutput ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-semibold ${
                                runOutput.status.id === 3
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {runOutput.status.description}
                            </span>
                            {runOutput.time && (
                              <span className="text-[10px] text-gray-400">
                                {runOutput.time}s
                              </span>
                            )}
                            {runOutput.memory && (
                              <span className="text-[10px] text-gray-400">
                                {(runOutput.memory / 1024).toFixed(1)}MB
                              </span>
                            )}
                          </div>
                          {runOutput.stdout && (
                            <pre className="whitespace-pre-wrap rounded bg-white p-2 font-mono text-xs text-gray-800 border border-gray-200">
                              {runOutput.stdout}
                            </pre>
                          )}
                          {runOutput.stderr && (
                            <pre className="whitespace-pre-wrap rounded bg-red-50 p-2 font-mono text-xs text-red-700 border border-red-200">
                              {runOutput.stderr}
                            </pre>
                          )}
                          {runOutput.compileOutput && (
                            <pre className="whitespace-pre-wrap rounded bg-amber-50 p-2 font-mono text-xs text-amber-700 border border-amber-200">
                              {runOutput.compileOutput}
                            </pre>
                          )}
                        </div>
                      ) : (
                        <p className="py-6 text-center text-xs text-gray-400">
                          Click "Run Code" to see output here.
                        </p>
                      )}
                    </>
                  )}

                  {activeOutputTab === "results" && (
                    <>
                      {validationReport ? (
                        <div className="space-y-2">
                          {/* Score bar */}
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-600">
                              Score
                            </span>
                            <span
                              className={`text-sm font-bold ${
                                validationReport.score === 100
                                  ? "text-green-600"
                                  : validationReport.score >= 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                              }`}
                            >
                              {validationReport.passed}/
                              {validationReport.totalTestCases} passed
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full rounded-full transition-all ${
                                validationReport.score === 100
                                  ? "bg-green-500"
                                  : validationReport.score >= 50
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              } progress-bar-width`}
                              style={{
                                ['--progress-bar-width' as any]: `${validationReport.score}%`
                              }}
                            />
                          </div>
                          {validationReport.compilationError && (
                            <pre className="whitespace-pre-wrap rounded bg-red-50 p-2 font-mono text-xs text-red-700 border border-red-200">
                              {validationReport.compilationError}
                            </pre>
                          )}
                          {validationReport.testResults.map((tc) => (
                            <div
                              key={tc.testCaseIndex}
                              className={`flex items-center justify-between rounded-md border px-3 py-1.5 text-xs ${
                                tc.passed
                                  ? "border-green-200 bg-green-50"
                                  : "border-red-200 bg-red-50"
                              }`}
                            >
                              <span className="font-medium">
                                Test {tc.testCaseIndex + 1}
                              </span>
                              <div className="flex items-center gap-2">
                                {tc.time && (
                                  <span className="text-gray-400">
                                    {tc.time}s
                                  </span>
                                )}
                                <span
                                  className={`font-semibold ${
                                    tc.passed
                                      ? "text-green-700"
                                      : "text-red-700"
                                  }`}
                                >
                                  {tc.passed ? "✓ Passed" : "✗ Failed"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="py-6 text-center text-xs text-gray-400">
                          Click "Submit" to validate against test cases.
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Monaco code editor ──────────────────────────── */}
            <div className="flex flex-1 flex-col">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <select
                    value={currentLang}
                    onChange={(e) =>
                      handleLangChange(codingQ.id, e.target.value)
                    }
                    title="Select programming language"
                    aria-label="Programming Language"
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {LANG_OPTIONS.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-400">
                    {currentCode.split("\n").length} lines
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Run Code */}
                  <button
                    onClick={() =>
                      runCodeMutation.mutate({
                        sourceCode: currentCode,
                        language: currentLang,
                        stdin: customStdin || codingQ.sampleInput,
                      })
                    }
                    disabled={runCodeMutation.isPending || !currentCode.trim()}
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      runCodeMutation.isPending || !currentCode.trim()
                        ? "cursor-not-allowed bg-gray-200 text-gray-400"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    }`}
                  >
                    {runCodeMutation.isPending ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Running…
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        Run Code
                      </>
                    )}
                  </button>

                  {/* Submit / Validate */}
                  <button
                    onClick={() =>
                      validateCodeMutation.mutate({
                        sourceCode: currentCode,
                        language: currentLang,
                        questionId: codingQ.id,
                        testCases: codingQ.testCases,
                      })
                    }
                    disabled={
                      validateCodeMutation.isPending || !currentCode.trim()
                    }
                    className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      validateCodeMutation.isPending || !currentCode.trim()
                        ? "cursor-not-allowed bg-green-200 text-green-500"
                        : "bg-green-600 text-white hover:bg-green-500"
                    }`}
                  >
                    {validateCodeMutation.isPending ? (
                      <>
                        <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Validating…
                      </>
                    ) : (
                      <>
                        <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1">
                <Editor
                  height="100%"
                  language={monacoLang}
                  theme="vs-dark"
                  value={currentCode}
                  onChange={(value) =>
                    setCurrentCode(codingQ.id, currentLang, value || "")
                  }
                  options={{
                    fontSize: 14,
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    tabSize: 4,
                    automaticLayout: true,
                    padding: { top: 12 },
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                  }}
                  loading={
                    <div className="flex h-full items-center justify-center bg-[#1e1e1e]">
                      <p className="text-sm text-gray-400">
                        Loading editor…
                      </p>
                    </div>
                  }
                />
              </div>
            </div>
          </>
        ) : (
          /* ── MCQ question layout ─────────────────────────────────── */
          <main className="mx-auto w-full max-w-3xl px-6 py-8">
            <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  Question {currentQuestion + 1}
                </span>
                <span className="text-sm text-gray-500">
                  {mcqQ?.marks} marks
                </span>
              </div>

              <p className="mt-4 text-lg font-medium text-gray-900">
                {mcqQ?.text}
              </p>

              <div className="mt-6 space-y-3">
                {mcqQ?.options.map((opt, i) => (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
                      answers[question.id] === opt
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={opt}
                      checked={answers[question.id] === opt}
                      onChange={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [question.id]: opt,
                        }))
                      }
                      className="text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          </main>
        )}
      </div>

      {/* ── Bottom navigation bar ────────────────────────────────────── */}
      <div className="sticky bottom-0 z-30 flex items-center justify-between border-t bg-white px-6 py-3 shadow-sm">
        {activeAdaptive ? (
          /* ── Adaptive-mode bottom bar ─────────────────────────────── */
          <>
            {/* History pills (last 10) */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {adaptiveState.history.slice(-10).map((h, i) => (
                <span
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold ${
                    h.correct
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                  title={`${h.difficulty} — ${h.correct ? "correct" : "wrong"}`}
                >
                  {h.correct ? "✓" : "✗"}
                </span>
              ))}
              {adaptiveState.history.length === 0 && (
                <span className="text-xs text-gray-400">Answer to begin…</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* Confirm Answer (MCQ) */}
              {!isCoding && (
                <button
                  onClick={confirmMCQAnswer}
                  disabled={
                    !answers[question.id] || adaptiveMutation.isPending
                  }
                  className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                    !answers[question.id] || adaptiveMutation.isPending
                      ? "cursor-not-allowed bg-gray-200 text-gray-400"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                  }`}
                >
                  {adaptiveMutation.isPending ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Loading next…
                    </>
                  ) : (
                    "Confirm & Next →"
                  )}
                </button>
              )}

              {/* For coding questions the "Submit" button already validates;
                  we add a secondary "Confirm & Next" after validation. */}
              {isCoding && validationReport && (
                <button
                  onClick={() => confirmCodingAnswer(validationReport.score)}
                  disabled={adaptiveMutation.isPending}
                  className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors ${
                    adaptiveMutation.isPending
                      ? "cursor-not-allowed bg-gray-200 text-gray-400"
                      : "bg-indigo-600 text-white hover:bg-indigo-500"
                  }`}
                >
                  {adaptiveMutation.isPending
                    ? "Loading next…"
                    : `Confirm (${validationReport.score}%) & Next →`}
                </button>
              )}

              {/* End adaptive session */}
              <button
                onClick={finishExam}
                className="btn-secondary text-sm"
              >
                End Session
              </button>
            </div>
          </>
        ) : (
          /* ── Standard-mode bottom bar ─────────────────────────────── */
          <>
            <button
              onClick={() => {
                setCurrentQuestion((c) => Math.max(0, c - 1));
                setRunOutput(null);
                setValidationReport(null);
              }}
              disabled={currentQuestion === 0}
              className="btn-secondary disabled:opacity-50"
            >
              ← Previous
            </button>

            {/* Question navigator dots */}
            <div className="flex gap-1.5">
              {PLACEHOLDER_QUESTIONS.map((q, i) => {
                const answered =
                  q.type === "mcq"
                    ? !!answers[q.id]
                    : !!codingScores[q.id];
                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      setCurrentQuestion(i);
                      setRunOutput(null);
                      setValidationReport(null);
                    }}
                    className={`h-7 w-7 rounded-full text-[10px] font-medium transition-colors ${
                      i === currentQuestion
                        ? "bg-primary-600 text-white"
                        : answered
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                    title={
                      q.type === "coding"
                        ? `Coding: ${(q as CodingQuestion).title}`
                        : `MCQ Q${i + 1}`
                    }
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {currentQuestion < PLACEHOLDER_QUESTIONS.length - 1 ? (
              <button
                onClick={() => {
                  setCurrentQuestion((c) => c + 1);
                  setRunOutput(null);
                  setValidationReport(null);
                }}
                className="btn-primary"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={finishExam}
                className="btn-primary bg-green-600 hover:bg-green-700"
              >
                Submit Exam
              </button>
            )}
          </>
        )}
      </div>

      {/* ── Webcam PiP (bottom-right corner) ─────────────────────────── */}
      <div className="fixed bottom-16 right-4 z-40">
        <div className="overflow-hidden rounded-xl shadow-lg ring-2 ring-primary-500">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="h-36 w-48 object-cover"
          />
        </div>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <span className="text-xs text-gray-500">Recording</span>
        </div>
      </div>

      {/* ── Warning overlay on violation ──────────────────────────────── */}
      {warningFlash && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-red-500/10">
          <div className="rounded-xl bg-red-600 px-8 py-4 text-lg font-bold text-white shadow-2xl">
            ⚠ Violation Detected!
          </div>
        </div>
      )}
    </div>
  );
}
