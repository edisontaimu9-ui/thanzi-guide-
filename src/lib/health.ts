// Pure calculation helpers for the health tools. No backend involved —
// these are client-side estimates only, never diagnoses.

export interface BmiResult {
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese';
}

export function calculateBmi(weightKg: number, heightCm: number): BmiResult {
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);

  let category: BmiResult['category'];
  if (bmi < 18.5) category = 'Underweight';
  else if (bmi < 25) category = 'Normal weight';
  else if (bmi < 30) category = 'Overweight';
  else category = 'Obese';

  return { bmi: Math.round(bmi * 10) / 10, category };
}

export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; multiplier: number }[] = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)', multiplier: 1.2 },
  { value: 'light', label: 'Light (exercise 1–3 days/week)', multiplier: 1.375 },
  { value: 'moderate', label: 'Moderate (exercise 3–5 days/week)', multiplier: 1.55 },
  { value: 'active', label: 'Active (exercise 6–7 days/week)', multiplier: 1.725 },
  { value: 'very_active', label: 'Very active (hard exercise + physical job)', multiplier: 1.9 }
];

export interface EnergyResult {
  bmr: number;
  tdee: number;
}

// Mifflin-St Jeor equation — commonly used, reasonably accurate for most adults.
export function calculateEnergy(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
  activity: ActivityLevel
): EnergyResult {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const bmr = sex === 'male' ? base + 5 : base - 161;
  const multiplier = ACTIVITY_LEVELS.find((a) => a.value === activity)?.multiplier ?? 1.2;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(bmr * multiplier)
  };
}
