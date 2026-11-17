import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatScore(score: number): string {
  return (score * 100).toFixed(0);
}

export function getScoreColor(score: number): string {
  if (score >= 0.8) return "text-emerald-500";
  if (score >= 0.6) return "text-blue-500";
  if (score >= 0.4) return "text-amber-500";
  return "text-red-500";
}

export function getScoreBgColor(score: number): string {
  if (score >= 0.8) return "bg-emerald-500";
  if (score >= 0.6) return "bg-blue-500";
  if (score >= 0.4) return "bg-amber-500";
  return "bg-red-500";
}

export function getSignalTypeColor(type: string): string {
  const colors: Record<string, string> = {
    hot: "bg-red-500/10 text-red-500 border-red-500/20",
    emerging: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    stable: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    saturated: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    declining: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    "niche but promising":
      "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };
  return colors[type] || "bg-gray-500/10 text-gray-400 border-gray-500/20";
}
