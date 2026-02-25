import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { connectProctoringSocket, disconnectProctoringSocket } from "../../lib/socket";

export default function AssessmentTakePage() {
  const { id } = useParams<{ id: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [integrityScore] = useState(100);
  const [timeLeft, setTimeLeft] = useState(0);

  const { data: assessment } = useQuery({
    queryKey: ["assessment", id],
    queryFn: async () => {
      const { data } = await api.get(`/exams/${id}/questions`);
      const { exam, questions, attemptId } = data.data;
      if (attemptId) {
        localStorage.setItem(`exam_attempt_${id}`, attemptId);
      }
      return { ...exam, questions };
    },
  });

  // Start assessment + proctoring
  const startAssessment = useCallback(async () => {
    try {
      // Start assessment session
      const { data: sessionData } = await api.post(`/assessments/${id}/start`);
      setSessionId(sessionData.data.id);

      // Start proctoring if enabled
      if (assessment?.proctoringEnabled) {
        await api.post("/proctoring/sessions", {
          assessmentId: id,
          referencePhotoUrl: "placeholder", // TODO: actual reference photo
        });

        // Connect to proctoring WebSocket
        const socket = connectProctoringSocket();
        socket.emit("join-session", sessionData.data.id);

        socket.on("violation-alert", (data: { type: string }) => {
          toast.error(`Violation detected: ${data.type}`);
        });

        // Start webcam
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }

      setTimeLeft(assessment!.durationMinutes * 60);
      toast.success("Assessment started!");
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to start assessment");
    }
  }, [id, assessment]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Browser lockdown listeners
  useEffect(() => {
    if (!sessionId || !assessment?.browserLockdown) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        api.post(`/proctoring/sessions/${sessionId}/violations`, {
          type: "TAB_SWITCH",
          severity: "HIGH",
          description: "Tab switched during assessment",
        });
        toast.error("Warning: Tab switching detected!");
      }
    };

    const handleContextMenu = (e: Event) => {
      e.preventDefault();
      api.post(`/proctoring/sessions/${sessionId}/violations`, {
        type: "RIGHT_CLICK",
        severity: "LOW",
        description: "Right-click attempted",
      });
    };

    const handleCopy = (e: Event) => {
      e.preventDefault();
      api.post(`/proctoring/sessions/${sessionId}/violations`, {
        type: "COPY_PASTE_ATTEMPT",
        severity: "MEDIUM",
        description: "Copy/paste attempted",
      });
      toast.error("Warning: Copy/paste is not allowed!");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handleCopy);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handleCopy);
      disconnectProctoringSocket();
    };
  }, [sessionId, assessment]);

  const handleSubmit = async () => {
    if (!sessionId) return;
    try {
      const answerArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));
      await api.post(`/assessments/sessions/${sessionId}/submit`, { answers: answerArray });
      toast.success("Assessment submitted successfully!");
      disconnectProctoringSocket();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Submission failed");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!assessment) return <div className="py-12 text-center text-gray-400">Loading…</div>;

  const questions = assessment.questions || [];
  const question = questions[currentQuestion];

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header bar */}
      <div className="card flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold">{assessment.title}</h1>
          <p className="text-sm text-gray-500">
            Question {currentQuestion + 1} of {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-6">
          {assessment.proctoringEnabled && (
            <div className="flex items-center gap-2">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-16 w-20 rounded-lg object-cover ring-2 ring-primary-500"
              />
              <div className="text-sm">
                <p className="font-medium text-gray-700">Integrity</p>
                <p
                  className={`text-lg font-bold ${integrityScore >= 80
                    ? "text-green-600"
                    : integrityScore >= 50
                      ? "text-yellow-600"
                      : "text-red-600"
                    }`}
                >
                  {integrityScore}%
                </p>
              </div>
            </div>
          )}
          <div className="text-right">
            <p className="text-sm text-gray-500">Time remaining</p>
            <p className="text-xl font-bold text-red-600">{formatTime(timeLeft)}</p>
          </div>
        </div>
      </div>

      {/* Start button */}
      {!sessionId && (
        <div className="card mt-6 text-center">
          <p className="mb-4 text-gray-600">
            This assessment has <strong>{questions.length}</strong> questions and lasts{" "}
            <strong>{assessment.durationMinutes} minutes</strong>.
            {assessment.proctoringEnabled && " Remote proctoring is enabled."}
            {assessment.browserLockdown && " Browser lockdown is active."}
          </p>
          <button onClick={startAssessment} className="btn-primary">
            Start Assessment
          </button>
        </div>
      )}

      {/* Question */}
      {sessionId && question && (
        <div className="card mt-6">
          <p className="text-sm font-medium text-gray-500">
            {question.difficulty} · {question.marks} marks
          </p>
          <p className="mt-2 text-lg font-medium text-gray-900">{question.text}</p>

          {question.type === "MCQ" && question.options && (
            <div className="mt-4 space-y-2">
              {question.options.map((opt: string, i: number) => (
                <label
                  key={i}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${answers[question.id] === opt
                    ? "border-primary-500 bg-primary-50"
                    : "border-gray-200 hover:border-gray-300"
                    }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    value={opt}
                    checked={answers[question.id] === opt}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: opt }))}
                    className="text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm">{opt}</span>
                </label>
              ))}
            </div>
          )}

          {question.type === "CODING" && (
            <textarea
              className="input-field mt-4 h-48 font-mono text-sm"
              placeholder="Write your code here…"
              value={answers[question.id] || ""}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
            />
          )}

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => setCurrentQuestion((c) => Math.max(0, c - 1))}
              disabled={currentQuestion === 0}
              className="btn-secondary"
            >
              Previous
            </button>
            {currentQuestion < questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestion((c) => c + 1)}
                className="btn-primary"
              >
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} className="btn-primary bg-green-600 hover:bg-green-700">
                Submit Assessment
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
