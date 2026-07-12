// =============================================================================
// PDF Question Import — extract multiple-choice questions from an uploaded PDF.
//
// Parsing is heuristic by design: real-world question PDFs vary wildly, so this
// service NEVER writes to the database. It returns structured candidates plus
// warnings, and the admin reviews/corrects them in the UI before the confirmed
// subset is inserted through the existing validated bulk endpoint.
//
// Recognized layouts (all combinable in one document):
//   1. What is X?                     ← "1.", "1)", "Q1.", "Question 1:" …
//   A) foo    B) bar                  ← options "A)".."E)", "(a)", "a."; one or
//   C) baz                              many per line; wrapped continuation lines
//   D) qux
//   Answer: B                         ← inline answer (letter or option number)
//   Explanation: because …            ← optional, attached to the question
//   …
//   Answer Key / Answers              ← trailing key section: "1. B  2-C 3) d"
// =============================================================================

// pdf-parse's package entry (index.js) runs its own debug harness when loaded
// via ESM import (module.parent is undefined there) and crashes looking for a
// bundled test PDF — import the actual implementation file instead.
// @ts-ignore — no bundled types for the deep path
import pdfParse from "pdf-parse/lib/pdf-parse.js";

export interface ParsedPdfQuestion {
  /** 1-based question number as printed in the document. */
  number: number;
  question_text: string;
  options: string[];
  /** Index into options as a string ("0".."4"), matching question_bank data. Null when undetected. */
  correct_answer: string | null;
  explanation: string | null;
  /** True when no answer could be detected — the admin must pick one before import. */
  needs_answer: boolean;
}

export interface PdfParseResult {
  questions: ParsedPdfQuestion[];
  warnings: string[];
  meta: { pages: number; characters: number };
}

const QUESTION_START =
  /^\s*(?:Q(?:uestion)?\s*[.\-:]?\s*)?(\d{1,3})\s*[).:]\s+(\S.*)$/i;
// Option marker at line start: "A) ", "(b) ", "C. ", "[d] " — delimiter required.
const OPTION_START = /^\s*[(\[]?([A-Ea-e])[)\].:]\s+(\S.*)$/;
// Additional option markers inside a line (for "A) foo  B) bar" rows).
const OPTION_INLINE = /(?:\s{2,}|\t)[(\[]?([A-Ea-e])[)\].:]\s+/g;
const ANSWER_LINE =
  /^\s*(?:correct\s+answer|answer|ans|key)\s*[:.\-]?\s*[(\[]?([A-Ea-e]|[1-5])[)\]]?\s*\.?\s*$/i;
const EXPLANATION_LINE = /^\s*(?:explanation|solution|sol)\s*[:.\-]\s*(.*)$/i;
const ANSWER_KEY_HEADER = /^\s*(?:answer\s*key|answers)\s*[:.]?\s*$/i;
const ANSWER_KEY_ENTRY = /(\d{1,3})\s*[-–.):]\s*[(\[]?([A-Ea-e]|[1-5])[)\]]?/g;

function letterToIndex(token: string): number {
  if (/^[1-5]$/.test(token)) return parseInt(token, 10) - 1;
  return token.toUpperCase().charCodeAt(0) - 65; // A → 0
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** Split a physical line that carries several options ("A) foo   B) bar"). */
function splitInlineOptions(letter: string, rest: string): Array<{ letter: string; text: string }> {
  const found: Array<{ letter: string; text: string }> = [];
  const matches = [...rest.matchAll(OPTION_INLINE)];
  if (matches.length === 0) return [{ letter, text: rest }];

  let cursor = 0;
  let currentLetter = letter;
  for (const m of matches) {
    found.push({ letter: currentLetter, text: rest.slice(cursor, m.index) });
    currentLetter = m[1];
    cursor = (m.index ?? 0) + m[0].length;
  }
  found.push({ letter: currentLetter, text: rest.slice(cursor) });
  return found;
}

interface WorkingQuestion {
  number: number;
  questionLines: string[];
  options: Array<{ letter: string; text: string }>;
  answerIndex: number | null;
  explanationLines: string[];
}

/**
 * pdf.js v1.10 (bundled inside pdf-parse) initializes its fake worker
 * asynchronously on first use. Until that finishes — a wall-clock delay, not a
 * per-call one — every parse rejects with a message-less UnknownErrorException
 * (verified empirically: parses in a fresh process fail, including an
 * immediate same-request retry, while requests issued seconds later succeed
 * with identical bytes). Two mitigations:
 *   1. Warm-up at module load: trigger worker init at server boot with a
 *      throwaway parse, so real requests never race it.
 *   2. Delayed backoff retries inside the request as a safety net.
 */
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const WARMUP_PDF = Buffer.from(
  "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n" +
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\n" +
    "trailer\n<< /Size 4 /Root 1 0 R >>\n%%EOF",
  "latin1"
);
// Fire-and-forget: failures here are expected while the worker spins up.
void pdfParse(WARMUP_PDF).catch(() => {});

async function extractPdf(buffer: Buffer) {
  const delays = [0, 500, 1500];
  let lastErr: unknown;
  for (const delay of delays) {
    if (delay > 0) await sleep(delay);
    try {
      return await pdfParse(buffer);
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr;
}

export async function parsePdfQuestions(buffer: Buffer): Promise<PdfParseResult> {
  const parsed = await extractPdf(buffer);
  const rawText: string = parsed.text || "";
  const warnings: string[] = [];

  if (!rawText.trim()) {
    warnings.push(
      "No extractable text found — the PDF appears to be scanned images. OCR is not supported; export the source document as a text-based PDF."
    );
    return { questions: [], warnings, meta: { pages: parsed.numpages ?? 0, characters: 0 } };
  }

  const lines = rawText.split(/\r?\n/);
  const working: WorkingQuestion[] = [];
  const answerKey = new Map<number, number>();

  let current: WorkingQuestion | null = null;
  // What the next wrapped (marker-less) line should attach to.
  let mode: "question" | "option" | "explanation" | "idle" = "idle";
  let inAnswerKey = false;

  for (const raw of lines) {
    const line = raw.replace(/ /g, " ");
    if (!line.trim()) continue;

    if (ANSWER_KEY_HEADER.test(line)) {
      inAnswerKey = true;
      continue;
    }
    if (inAnswerKey) {
      let matched = false;
      for (const m of line.matchAll(ANSWER_KEY_ENTRY)) {
        answerKey.set(parseInt(m[1], 10), letterToIndex(m[2]));
        matched = true;
      }
      // A non-matching line ends the key section (e.g. a new chapter heading).
      if (matched) continue;
      inAnswerKey = false;
    }

    const q = line.match(QUESTION_START);
    // Guard: an answer-key style line ("12. B") also matches QUESTION_START —
    // require some non-trivial text after the number to treat it as a question.
    if (q && cleanText(q[2]).length > 2) {
      if (current) working.push(current);
      current = {
        number: parseInt(q[1], 10),
        questionLines: [q[2]],
        options: [],
        answerIndex: null,
        explanationLines: [],
      };
      mode = "question";
      continue;
    }

    if (!current) continue; // preamble/header text before the first question

    const ans = line.match(ANSWER_LINE);
    if (ans) {
      current.answerIndex = letterToIndex(ans[1]);
      mode = "idle";
      continue;
    }

    const expl = line.match(EXPLANATION_LINE);
    if (expl) {
      current.explanationLines = [expl[1]];
      mode = "explanation";
      continue;
    }

    const opt = line.match(OPTION_START);
    if (opt) {
      current.options.push(...splitInlineOptions(opt[1], opt[2]));
      mode = "option";
      continue;
    }

    // Marker-less line: a wrapped continuation of whatever came last.
    if (mode === "question") current.questionLines.push(line.trim());
    else if (mode === "option" && current.options.length > 0)
      current.options[current.options.length - 1].text += ` ${line.trim()}`;
    else if (mode === "explanation") current.explanationLines.push(line.trim());
  }
  if (current) working.push(current);

  // ── Assemble + validate ─────────────────────────────────────────────────────
  const questions: ParsedPdfQuestion[] = [];
  const seenNumbers = new Set<number>();

  for (const w of working) {
    const questionText = cleanText(w.questionLines.join(" "));
    const options = w.options
      .map((o) => ({ letter: o.letter.toUpperCase(), text: cleanText(o.text) }))
      .filter((o) => o.text.length > 0);

    if (options.length < 2) {
      warnings.push(`Q${w.number}: skipped — found ${options.length} option(s), need at least 2.`);
      continue;
    }
    if (seenNumbers.has(w.number)) {
      warnings.push(`Q${w.number}: duplicate question number in document — imported both; verify.`);
    }
    seenNumbers.add(w.number);

    let answerIndex = w.answerIndex ?? answerKey.get(w.number) ?? null;
    if (answerIndex !== null && (answerIndex < 0 || answerIndex >= options.length)) {
      warnings.push(
        `Q${w.number}: detected answer "${String.fromCharCode(65 + answerIndex)}" is outside its ${options.length} options — cleared, set it manually.`
      );
      answerIndex = null;
    }

    questions.push({
      number: w.number,
      question_text: questionText,
      options: options.map((o) => o.text),
      correct_answer: answerIndex === null ? null : String(answerIndex),
      explanation: w.explanationLines.length ? cleanText(w.explanationLines.join(" ")) : null,
      needs_answer: answerIndex === null,
    });
  }

  if (questions.length === 0) {
    warnings.push(
      "No questions recognized. Expected numbered questions (\"1.\", \"Q1)\") each followed by lettered options (\"A)\", \"(b)\")."
    );
  }
  const missing = questions.filter((q) => q.needs_answer).length;
  if (missing > 0) {
    warnings.push(
      `${missing} question(s) have no detected correct answer — set them in the preview before importing.`
    );
  }

  return {
    questions,
    warnings,
    meta: { pages: parsed.numpages ?? 0, characters: rawText.length },
  };
}
