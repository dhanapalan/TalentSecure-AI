interface LogoProps {
    size?: number;
    className?: string;
}

/**
 * GradLogic brand logo — minimalist graduation cap (mortarboard)
 * with a 4-pointed AI-spark tassel end. Pure SVG, scales to any size.
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
                <linearGradient id="cap-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%"   stopColor="#4338CA" />
                    <stop offset="55%"  stopColor="#1D4ED8" />
                    <stop offset="100%" stopColor="#0891B2" />
                </linearGradient>
                <linearGradient id="cap-spark" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%"   stopColor="#A5B4FC" />
                    <stop offset="100%" stopColor="#67E8F9" />
                </linearGradient>
            </defs>

            {/* ── Rounded square background ─────────────────────────── */}
            <rect width="512" height="512" rx="108" ry="108" fill="url(#cap-bg)" />

            {/* ── Subtle corner dots (circuit feel) ────────────────── */}
            <circle cx="80"  cy="80"  r="5" fill="white" opacity="0.10" />
            <circle cx="432" cy="80"  r="5" fill="white" opacity="0.10" />
            <circle cx="80"  cy="432" r="5" fill="white" opacity="0.10" />
            <circle cx="432" cy="432" r="5" fill="white" opacity="0.10" />

            {/* ── Cap board (flat diamond — top of mortarboard) ─────── */}
            {/*    Wide & flat: landscape diamond centred at (256, 196)   */}
            <polygon
                points="118,196 256,118 394,196 256,274"
                fill="white"
                opacity="0.96"
            />

            {/* ── Centre button on the board ───────────────────────── */}
            <circle cx="256" cy="196" r="16" fill="url(#cap-bg)" />

            {/* ── Cap body (compact trapezoid below diamond centre) ─── */}
            <path
                d="M222,274 L290,274 L274,332 L238,332 Z"
                fill="white"
                opacity="0.90"
            />

            {/* ── Brim / base band ──────────────────────────────────── */}
            <rect x="192" y="330" width="128" height="26" rx="13" fill="white" opacity="0.85" />

            {/* ── Tassel cord from right corner of board ────────────── */}
            <path
                d="M394,196 Q438,238 432,358"
                stroke="url(#cap-spark)"
                strokeWidth="10"
                strokeLinecap="round"
                fill="none"
            />

            {/* ── Tassel end — 4-pointed AI spark ───────────────────── */}
            {/*    Centred at (432, 374)                                  */}
            <path
                d="M432,352 L439,372 L459,379 L439,386 L432,406 L425,386 L405,379 L425,372 Z"
                fill="url(#cap-spark)"
            />
        </svg>
    );
}
