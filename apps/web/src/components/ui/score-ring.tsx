"use client";

import { formatScore } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  label: string;
  size?: number;
}

function getStrokeColor(score: number): string {
  if (score >= 0.8) return "#10b981";
  if (score >= 0.6) return "#3b82f6";
  if (score >= 0.4) return "#f59e0b";
  return "#ef4444";
}

export function ScoreRing({ score, label, size = 120 }: ScoreRingProps) {
  const strokeWidth = size * 0.08;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - score * circumference;
  const center = size / 2;
  const color = getStrokeColor(score);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ width: size, height: size }}
      >
        <span className="text-2xl font-bold" style={{ color }}>
          {formatScore(score)}
        </span>
      </div>
      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {label}
      </span>
    </div>
  );
}
