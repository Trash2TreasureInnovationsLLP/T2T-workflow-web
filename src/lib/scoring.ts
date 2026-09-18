// T2T Work-Based Scoring System

export const PRIORITY_POINTS: Record<string, number> = {
  URGENT: 100,
  HIGH: 60,
  MEDIUM: 35,
  LOW: 15,
};

export const STORY_POINT_MULTIPLIER = 10;
export const ON_TIME_BONUS = 25;

export interface TaskScoringItem {
  id: string;
  taskId: string;
  title: string;
  priority: string;
  status: string;
  storyPoints?: number | null;
  dueDate?: Date | string | null;
  completedAt?: Date | string | null;
}

export interface TaskPointsBreakdown {
  basePoints: number;
  storyPointsBonus: number;
  onTimeBonus: number;
  totalPoints: number;
  isOnTime: boolean;
}

/**
 * Calculates points for an individual completed task.
 */
export function calculateTaskPoints(task: TaskScoringItem): TaskPointsBreakdown {
  const priority = (task.priority || "MEDIUM").toUpperCase();
  const basePoints = PRIORITY_POINTS[priority] ?? 35;
  const storyPointsBonus = (task.storyPoints || 1) * STORY_POINT_MULTIPLIER;

  let isOnTime = true;
  let onTimeBonus = 0;

  if (task.dueDate && task.completedAt) {
    const due = new Date(task.dueDate).getTime();
    const completed = new Date(task.completedAt).getTime();
    // Allow end of day grace
    isOnTime = completed <= due + 24 * 60 * 60 * 1000;
  }

  if (isOnTime) {
    onTimeBonus = ON_TIME_BONUS;
  }

  const totalPoints = basePoints + storyPointsBonus + onTimeBonus;

  return {
    basePoints,
    storyPointsBonus,
    onTimeBonus,
    totalPoints,
    isOnTime,
  };
}

export interface TierInfo {
  tier: string;
  label: string;
  badgeColor: string;
  nextTier: string | null;
  pointsNeeded: number;
  progressPercent: number;
}

/**
 * Returns member achievement tier based on total points.
 */
export function getMemberTier(points: number): TierInfo {
  if (points >= 500) {
    return {
      tier: "GRANDMASTER",
      label: "👑 Grandmaster",
      badgeColor: "bg-purple-100 text-purple-700 border-purple-300",
      nextTier: null,
      pointsNeeded: 0,
      progressPercent: 100,
    };
  }
  if (points >= 300) {
    return {
      tier: "CHAMPION",
      label: "🏆 Circular Champion",
      badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
      nextTier: "Grandmaster (500 pts)",
      pointsNeeded: 500 - points,
      progressPercent: Math.round(((points - 300) / 200) * 100),
    };
  }
  if (points >= 150) {
    return {
      tier: "SPECIALIST",
      label: "⚡ Agile Specialist",
      badgeColor: "bg-sky-100 text-sky-800 border-sky-300",
      nextTier: "Circular Champion (300 pts)",
      pointsNeeded: 300 - points,
      progressPercent: Math.round(((points - 150) / 150) * 100),
    };
  }
  if (points >= 50) {
    return {
      tier: "CONTRIBUTOR",
      label: "⭐ Active Contributor",
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-300",
      nextTier: "Agile Specialist (150 pts)",
      pointsNeeded: 150 - points,
      progressPercent: Math.round(((points - 50) / 100) * 100),
    };
  }
  return {
    tier: "INNOVATOR",
    label: "🌱 Rising Innovator",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-300",
    nextTier: "Active Contributor (50 pts)",
    pointsNeeded: 50 - points,
    progressPercent: Math.round((points / 50) * 100),
  };
}
