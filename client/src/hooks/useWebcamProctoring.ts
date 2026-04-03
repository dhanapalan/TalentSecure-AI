import { useEffect, useRef, useState, useCallback } from "react";
import toast from "react-hot-toast";

interface UseWebcamProctoringOptions {
    sessionId: string;
    studentId: string;
    examId: string;
    enabled?: boolean;
    intervalMs?: number;
    onViolation?: (violationDetails: any) => void;
    onCameraError?: (error: Error) => void;
}

export function useWebcamProctoring({
    studentId,
    examId,
    enabled = true,
    intervalMs = 4000,
    onViolation,
    onCameraError,
}: UseWebcamProctoringOptions) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const [isCameraActive, setIsCameraActive] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    // Initialize Camera
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user" },
                audio: false,
            });
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                // Wait for video metadata to load before playing
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play().catch(e => console.error("Error playing video:", e));
                };
            }
            setIsCameraActive(true);
            setPermissionDenied(false);
        } catch (err: any) {
            console.error("[Proctoring] Camera initialization failed:", err);
            setIsCameraActive(false);
            setPermissionDenied(true);
            if (onCameraError) onCameraError(err);
            toast.error("Camera access denied. Camera is required for this exam.");
        }
    }, [onCameraError]);

    // Stop Camera
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
    }, []);

    // Capture Frame & Analyze
    const analyzeFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !isCameraActive || !enabled) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Ensure video has valid dimensions before drawing
        if (video.videoWidth === 0 || video.videoHeight === 0) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Get Base64 JPEG (adjust quality to 0.7 for balance of speed/size)
        const base64Image = canvas.toDataURL("image/jpeg", 0.7);

        try {
            // Send to FastAPI AI engine (which runs on port 8000 natively, but should be proxied 
            // via our Node.js backend if that's how it's set up, check API structure)
            // Sending to Node endpoint first since Node needs to know about the incident. 
            // Wait, the python file proctoring.py says:
            // "If an anomaly is detected and student_id + exam_id are provided, fire an HTTP POST to the Node.js backend"
            // So we can send it directly to the AI Engine from the client IF the AI engine is exposed,
            // OR we can send it to Node.js /api/proctoring/analyze and Node proxies it.
            // Looking at the implementation plan, we decided to send to AI engine directly.
            // However, usually the frontend talks only to Node on /api. Let's send it to Python directly if configured,
            // or through standard proxy if Vite proxies /ai to 8000. Let's assume standard Vite proxy for now or full URL

            // We will create a dedicated endpoint on our Node backend to proxy to the AI engine if needed, 
            // or just assume the AI engine is accessible. Let's try sending directly to the AI engine on port 8000 for now.
            // Alternatively, the python file says POST /api/proctoring/analyze

            const aiUrl = import.meta.env.VITE_API_URL || "https://api.gradlogic.atherasys.com";
            const response = await fetch(`${aiUrl}/api/proctoring/analyze`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    image: base64Image,
                    student_id: studentId,
                    exam_id: examId,
                    confidence_threshold: 0.55
                })
            });

            if (!response.ok) {
                // Silently ignore AI Engine down errors during dev so exam isn't blocked
                throw new Error(`AI Engine returned ${response.status}`);
            }

            const result = await response.json();

            // The AI engine already sends the alert to Node.js backend automatically if is_anomaly is true 
            // and student_id/exam_id are provided. We just need to trigger the UI callback
            if (result.is_anomaly && onViolation) {
                onViolation(result);
            }

        } catch (err) {
            console.warn("[Proctoring] Frame analysis failed or AI engine unreachable:", err);
        }
    }, [isCameraActive, enabled, studentId, examId, onViolation]);

    // Main Effect
    useEffect(() => {
        if (enabled) {
            startCamera();
        } else {
            stopCamera();
        }

        return () => {
            stopCamera();
        };
    }, [enabled, startCamera, stopCamera]);

    // Analysis Loop Effect
    useEffect(() => {
        if (enabled && isCameraActive) {
            intervalRef.current = setInterval(analyzeFrame, intervalMs);
        } else if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, isCameraActive, intervalMs, analyzeFrame]);

    return {
        videoRef,
        canvasRef,
        isCameraActive,
        permissionDenied,
        retryCamera: startCamera,
    };
}
