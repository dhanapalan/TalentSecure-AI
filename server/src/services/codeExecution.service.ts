// =============================================================================
// TalentSecure AI — Code Execution Service (Judge0 Integration)
// =============================================================================
// Integrates with Judge0 CE (open-source) for sandboxed code compilation
// and execution against hidden test cases.
//
// Judge0 self-hosted: docker run -p 2358:2358 judge0/judge0-ce
// or use Judge0 hosted: https://judge0-ce.p.rapidapi.com
// =============================================================================

import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { AppError } from "../middleware/errorHandler.js";

// ── Judge0 Language IDs ──────────────────────────────────────────────────────

export const LANGUAGE_MAP: Record<string, number> = {
  python: 71,       // Python 3.8.1
  javascript: 63,   // Node.js 12.14.0
  cpp: 54,          // C++ (GCC 9.2.0)
  c: 50,            // C (GCC 9.2.0)
  java: 62,         // Java (OpenJDK 13.0.1)
  typescript: 74,   // TypeScript 3.7.4
  go: 60,           // Go 1.13.5
  rust: 73,         // Rust 1.40.0
};

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubmissionRequest {
  sourceCode: string;
  language: string;
  stdin?: string;
  expectedOutput?: string;
  timeLimitMs?: number;
  memoryLimitKb?: number;
}

export interface SubmissionResult {
  stdout: string | null;
  stderr: string | null;
  compileOutput: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null;       // execution time in seconds
  memory: number | null;     // memory in KB
  exitCode: number | null;
}

export interface TestCaseResult {
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

export interface ExecutionReport {
  language: string;
  totalTestCases: number;
  passed: number;
  failed: number;
  score: number;          // percentage 0-100
  testResults: TestCaseResult[];
  compilationError: string | null;
}

// ── Judge0 Status Codes ──────────────────────────────────────────────────────

const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TIME_LIMIT: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_ERROR_SIGSEGV: 7,
  RUNTIME_ERROR_SIGXFSZ: 8,
  RUNTIME_ERROR_SIGFPE: 9,
  RUNTIME_ERROR_SIGABRT: 10,
  RUNTIME_ERROR_NZEC: 11,
  RUNTIME_ERROR_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

// ── Helper: wait for submission result ───────────────────────────────────────

async function judge0Fetch(path: string, options?: RequestInit): Promise<any> {
  const url = `${env.JUDGE0_API_URL}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // If using RapidAPI hosted Judge0, add auth headers
  if (env.JUDGE0_API_KEY) {
    headers["X-RapidAPI-Key"] = env.JUDGE0_API_KEY;
    headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
  }

  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options?.headers },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new AppError(`Judge0 API error (${res.status}): ${body}`, 502);
  }

  return res.json();
}

// ── Submit code and wait for result ──────────────────────────────────────────

async function submitAndWait(submission: {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number;
  memory_limit?: number;
}): Promise<SubmissionResult> {
  // Create submission
  const created = await judge0Fetch("/submissions?base64_encoded=false&wait=false", {
    method: "POST",
    body: JSON.stringify(submission),
  });

  const token = created.token;
  if (!token) {
    throw new AppError("Judge0 did not return a submission token", 502);
  }

  // Poll for result (max 30 seconds)
  const maxAttempts = 30;
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));

    const result = await judge0Fetch(
      `/submissions/${token}?base64_encoded=false&fields=stdout,stderr,compile_output,status,time,memory,exit_code`,
    );

    if (result.status?.id > STATUS.PROCESSING) {
      return {
        stdout: result.stdout,
        stderr: result.stderr,
        compileOutput: result.compile_output,
        status: result.status,
        time: result.time,
        memory: result.memory,
        exitCode: result.exit_code,
      };
    }
  }

  throw new AppError("Code execution timed out waiting for Judge0 result", 504);
}

// ── Execute single code submission ───────────────────────────────────────────

export async function executeCode(req: SubmissionRequest): Promise<SubmissionResult> {
  const languageId = LANGUAGE_MAP[req.language.toLowerCase()];
  if (!languageId) {
    throw new AppError(
      `Unsupported language: ${req.language}. Supported: ${Object.keys(LANGUAGE_MAP).join(", ")}`,
      400,
    );
  }

  logger.info("Executing code", { language: req.language, languageId });

  return submitAndWait({
    source_code: req.sourceCode,
    language_id: languageId,
    stdin: req.stdin,
    expected_output: req.expectedOutput,
    cpu_time_limit: req.timeLimitMs ? req.timeLimitMs / 1000 : 5,
    memory_limit: req.memoryLimitKb || 262144,
  });
}

// ── Run code against multiple test cases (auto-grading) ──────────────────────

export async function runTestCases(
  sourceCode: string,
  language: string,
  testCases: { input: string; expectedOutput: string }[],
  timeLimitMs: number = 5000,
  memoryLimitKb: number = 262144,
): Promise<ExecutionReport> {
  const languageId = LANGUAGE_MAP[language.toLowerCase()];
  if (!languageId) {
    throw new AppError(
      `Unsupported language: ${language}. Supported: ${Object.keys(LANGUAGE_MAP).join(", ")}`,
      400,
    );
  }

  logger.info("Running test cases", {
    language,
    testCaseCount: testCases.length,
  });

  const testResults: TestCaseResult[] = [];
  let compilationError: string | null = null;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];

    try {
      const result = await submitAndWait({
        source_code: sourceCode,
        language_id: languageId,
        stdin: tc.input,
        expected_output: tc.expectedOutput.trim() + "\n",
        cpu_time_limit: timeLimitMs / 1000,
        memory_limit: memoryLimitKb,
      });

      // Check for compilation error on first test case
      if (result.compileOutput && result.status.id === STATUS.COMPILATION_ERROR) {
        compilationError = result.compileOutput;
        // All remaining test cases will also fail
        for (let j = i; j < testCases.length; j++) {
          testResults.push({
            testCaseIndex: j,
            input: testCases[j].input,
            expectedOutput: testCases[j].expectedOutput,
            actualOutput: null,
            passed: false,
            status: "Compilation Error",
            time: null,
            memory: null,
            error: result.compileOutput,
          });
        }
        break;
      }

      const actualOutput = result.stdout?.trim() ?? "";
      const expectedTrimmed = tc.expectedOutput.trim();
      const passed = result.status.id === STATUS.ACCEPTED ||
        actualOutput === expectedTrimmed;

      testResults.push({
        testCaseIndex: i,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: result.stdout,
        passed,
        status: result.status.description,
        time: result.time,
        memory: result.memory,
        error: result.stderr || result.compileOutput,
      });
    } catch (err: any) {
      testResults.push({
        testCaseIndex: i,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        actualOutput: null,
        passed: false,
        status: "Execution Error",
        time: null,
        memory: null,
        error: err.message,
      });
    }
  }

  const passedCount = testResults.filter((r) => r.passed).length;

  return {
    language,
    totalTestCases: testCases.length,
    passed: passedCount,
    failed: testCases.length - passedCount,
    score: testCases.length > 0
      ? Math.round((passedCount / testCases.length) * 100)
      : 0,
    testResults,
    compilationError,
  };
}

// ── Get supported languages ──────────────────────────────────────────────────

export function getSupportedLanguages(): { id: string; name: string; judge0Id: number }[] {
  return Object.entries(LANGUAGE_MAP).map(([name, id]) => ({
    id: name,
    name: name.charAt(0).toUpperCase() + name.slice(1),
    judge0Id: id,
  }));
}
