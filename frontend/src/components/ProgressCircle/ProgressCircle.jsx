function ProgressCircle({ progress }) {
    const radius = 40;
    const strokeWidth = 8;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress / 100);
    const size = (radius + strokeWidth) * 2;

    return (
        <div className="flex flex-col items-center gap-1">
            <svg width={size} height={size} className="drop-shadow-lg">
                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#1a252f"
                    strokeWidth={strokeWidth}
                    fill="none"
                    opacity="0.6"
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#progressGradient)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    className="transition-all duration-700 ease-out"
                />
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#60a5fa" />
                    </linearGradient>
                </defs>
                {/* Text */}
                <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dy="0.35em"
                    className="fill-text-primary text-sm font-bold"
                >
                    {progress}%
                </text>
            </svg>
        </div>
    );
}

export default ProgressCircle;