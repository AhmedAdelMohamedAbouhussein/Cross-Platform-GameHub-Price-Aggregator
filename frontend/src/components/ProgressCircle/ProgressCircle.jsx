import styles from './ProgressCircle.module.css'

function ProgressCircle({ progress }) 
{
  const radius = 45;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress / 100);

  return (
    <svg width="100" height="100" className={styles.progressCircle}>
      <circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#e6e6e6"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <circle
        cx="50"
        cy="50"
        r={radius}
        stroke="#4caf50"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50%" y="50%" textAnchor="middle" dy="0.3em" className={styles.progressCircleText}>
        {progress}%
      </text>
    </svg>
  );
}

export default ProgressCircle;