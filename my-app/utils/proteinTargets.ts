import type { ProteinLevel } from "../types/register-types";

const PROTEIN_MULTIPLIERS: Record<Exclude<ProteinLevel, "">, number> = {
  low: 1.2,
  medium: 1.6,
  high: 2.0,
};

export function calculateProteinTarget(
  weightKg: number,
  proteinLevel: Exclude<ProteinLevel, "">
): number {
  return Math.round(weightKg * PROTEIN_MULTIPLIERS[proteinLevel]);
}

export function getRecommendedProteinLevel(
  activityLevel?: string | null
): Exclude<ProteinLevel, ""> {
  const activity = String(activityLevel || "").trim().toLowerCase();

  if (["sedentary", "light", "น้อย", "เบา", "เล็กน้อย"].includes(activity)) {
    return "low";
  }

  if (
    ["active", "very_active", "extra_active", "heavy", "หนัก", "หนักมาก"].includes(
      activity
    )
  ) {
    return "high";
  }

  return "medium";
}
