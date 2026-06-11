'use client';

import { useEffect, useState, useRef } from 'react';
import { useI18n } from '@/hooks/use-i18n';

interface RiskScoreProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

function getRiskColor(score: number): string {
  if (score <= 30) return '#10b981'; // emerald
  if (score <= 60) return '#f59e0b'; // amber
  if (score <= 80) return '#ef4444'; // red
  return '#991b1b'; // dark red
}

function getRiskLabelKey(score: number): string {
  if (score <= 30) return 'riskLow';
  if (score <= 60) return 'riskMedium';
  if (score <= 80) return 'riskHigh';
  return 'riskCritical';
}

function getRiskBgColor(score: number): string {
  if (score <= 30) return 'rgba(16, 185, 129, 0.1)';
  if (score <= 60) return 'rgba(245, 158, 11, 0.1)';
  if (score <= 80) return 'rgba(239, 68, 68, 0.1)';
  return 'rgba(153, 27, 27, 0.1)';
}

export function RiskScore({ score, size = 200, strokeWidth = 12 }: RiskScoreProps) {
  const { t } = useI18n();
  const [animatedScore, setAnimatedScore] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    // Cancel any ongoing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    const start = animatedScore; // Capture current value at effect start
    const diff = score - start;
    if (diff === 0) return;

    const duration = 1200;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const newScore = Math.round(start + diff * eased);
      setAnimatedScore(newScore);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
      }
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;
  const color = getRiskColor(score);
  const bgColor = getRiskBgColor(score);

  // Track background segments
  const segments = [
    { start: 0, end: 30, color: '#10b981' },
    { start: 30, end: 60, color: '#f59e0b' },
    { start: 60, end: 80, color: '#ef4444' },
    { start: 80, end: 100, color: '#991b1b' },
  ];

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background track segments */}
          {segments.map((seg, i) => {
            const segStart = (seg.start / 100) * circumference;
            const segEnd = (seg.end / 100) * circumference;
            const segOffset = circumference - segEnd;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeOpacity={0.12}
                strokeDasharray={`${segEnd - segStart} ${circumference - (segEnd - segStart)}`}
                strokeDashoffset={-segStart}
                strokeLinecap="butt"
              />
            );
          })}

          {/* Active arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-5xl font-bold tracking-tight tabular-nums"
            style={{ color }}
          >
            {animatedScore}
          </span>
          <span className="text-xs text-muted-foreground font-medium mt-1">
            / 100
          </span>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-sm font-semibold text-foreground">
          {t('riskScore')}
        </h3>
        <p
          className="text-xs font-semibold mt-1 px-3 py-1 rounded-full inline-block"
          style={{ color, backgroundColor: bgColor }}
        >
          {t(getRiskLabelKey(score) as any)}
        </p>
        <p className="text-xs text-muted-foreground mt-2 max-w-[200px]">
          {t('riskScoreDesc')}
        </p>
      </div>
    </div>
  );
}
