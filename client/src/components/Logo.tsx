

interface LogoProps {
    size?: number;
    className?: string;
}

/**
 * Nallas Connect brand logo — an abstract "network graph" with N and C nodes,
 * symbolising talent connecting. Renders as pure SVG so it scales to any size.
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
                <linearGradient id="nc-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4F46E5" />
                    <stop offset="50%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#06B6D4" />
                </linearGradient>
                <linearGradient id="nc-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="100%" stopColor="#38BDF8" />
                </linearGradient>
            </defs>
            {/* Rounded square */}
            <rect width="512" height="512" rx="96" ry="96" fill="url(#nc-bg)" />
            {/* Connection lines (behind nodes) */}
            <line x1="220" y1="198" x2="312" y2="314" stroke="white" strokeWidth="12" strokeLinecap="round" opacity="0.6" />
            <line x1="208" y1="164" x2="324" y2="160" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
            <line x1="172" y1="208" x2="164" y2="324" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
            <line x1="348" y1="188" x2="340" y2="304" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
            <line x1="188" y1="348" x2="304" y2="340" stroke="white" strokeWidth="8" strokeLinecap="round" opacity="0.4" />
            {/* Large nodes */}
            <circle cx="176" cy="176" r="56" fill="white" opacity="0.95" />
            <circle cx="336" cy="336" r="56" fill="white" opacity="0.95" />
            {/* Small accent nodes */}
            <circle cx="352" cy="160" r="28" fill="url(#nc-accent)" opacity="0.8" />
            <circle cx="160" cy="352" r="28" fill="url(#nc-accent)" opacity="0.8" />
            {/* N in top-left node */}
            <text x="176" y="190" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="52" fontWeight="900" fill="#4F46E5">N</text>
            {/* C in bottom-right node */}
            <text x="336" y="350" textAnchor="middle" fontFamily="Inter, system-ui, sans-serif" fontSize="52" fontWeight="900" fill="#2563EB">C</text>
        </svg>
    );
}
