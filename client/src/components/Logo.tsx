interface LogoProps {
    size?: number;
    className?: string;
}

/**
 * GradLogic brand logo — redesigned.
 * "GL" monogram with an AI spark accent on a deep indigo-to-cyan gradient square.
 * Scales cleanly from 24 px (favicon) to display size.
 */
export default function Logo({ size = 36, className = "" }: LogoProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="gl-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4338CA" />
                    <stop offset="55%" stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#0891B2" />
                </linearGradient>
                <linearGradient id="gl-spark" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#A5B4FC" />
                    <stop offset="100%" stopColor="#67E8F9" />
                </linearGradient>
            </defs>

            {/* Rounded square background */}
            <rect width="512" height="512" rx="108" ry="108" fill="url(#gl-bg)" />

            {/* Subtle dot grid (very low opacity) */}
            <circle cx="128" cy="128" r="6" fill="white" opacity="0.08" />
            <circle cx="256" cy="128" r="6" fill="white" opacity="0.08" />
            <circle cx="384" cy="128" r="6" fill="white" opacity="0.08" />
            <circle cx="128" cy="256" r="6" fill="white" opacity="0.08" />
            <circle cx="384" cy="256" r="6" fill="white" opacity="0.08" />
            <circle cx="128" cy="384" r="6" fill="white" opacity="0.08" />
            <circle cx="256" cy="384" r="6" fill="white" opacity="0.08" />
            <circle cx="384" cy="384" r="6" fill="white" opacity="0.08" />

            {/* GL lettermark — bold, centered */}
            <text
                x="252"
                y="318"
                textAnchor="middle"
                fontFamily="Inter, system-ui, -apple-system, sans-serif"
                fontSize="164"
                fontWeight="900"
                fill="white"
                letterSpacing="-6"
            >GL</text>

            {/* AI spark — 4-pointed star, top-right quadrant */}
            <path
                d="M385 64 L394 93 L423 102 L394 111 L385 140 L376 111 L347 102 L376 93 Z"
                fill="url(#gl-spark)"
            />
        </svg>
    );
}
