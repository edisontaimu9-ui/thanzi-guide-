// ThanziNutrition engine — ported from the standalone Thanzi app's
// thanzi-nutrition.js (vanilla JS IIFE) to TypeScript for Thanzi Guide.
// Logic, coefficients, and safety rules are unchanged from the original;
// only the module shape and types are new.
//
// References: Krause & Mahan (14th ed), DRI/NASEM 2005-2019,
//             ACSM/AND/DC Joint Position Stand 2016, WHO Guidelines

export type Sex = 'M' | 'F';
export type ActivityLevel = 'sedentary' | 'low_active' | 'active' | 'very_active';
export type Goal = 'lose' | 'maintain' | 'gain';
export type SportType = 'endurance' | 'strength' | 'team_sport' | 'power' | 'recreational';

// ── SECTION 1 — Constants & DRI lookup tables ──────────────────────────────

// Physical Activity (PA) coefficients for the unified adult EER equation
// (Krause & Mahan Box 2.1 — "Normal and Overweight or Obese Men/Women 19
// Years and Older, BMI ≥18.5 kg/m²"). Sex-specific, not a flat multiplier.
const PA_COEFFICIENTS: Record<Sex, Record<ActivityLevel, number>> = {
  M: { sedentary: 1.0, low_active: 1.12, active: 1.27, very_active: 1.54 },
  F: { sedentary: 1.0, low_active: 1.14, active: 1.27, very_active: 1.45 }
};

function calciumDRI(age: number, sex: Sex): number {
  if (age <= 18) return 1300;
  if (age <= 50) return 1000;
  if (sex === 'F') return 1200; // post-menopausal female
  return 1000; // male 51-70
}

function vitDDRI(age: number): number {
  return age >= 70 ? 800 : 600;
}

function ironDRI(age: number, sex: Sex): number {
  if (sex === 'M') return 8;
  return age <= 50 ? 18 : 8;
}

function fiberAI(age: number, sex: Sex): number {
  if (sex === 'M') return age <= 50 ? 38 : 30;
  return age <= 50 ? 25 : 21;
}

// Total water — weight-tiered, age-adjusted (California Diet Manual Method
// 3, via Krause & Mahan Appendix). Returns liters/day.
function fluidAI(weightKg: number, age: number): number {
  let mL: number;
  if (weightKg <= 10) {
    mL = weightKg * 100;
  } else if (weightKg <= 20) {
    mL = 1000 + (weightKg - 10) * 50;
  } else {
    const perKgRemaining = age > 50 ? 15 : 20;
    mL = 1500 + (weightKg - 20) * perKgRemaining;
  }
  return mL / 1000;
}

// Sport-specific protein/carb ranges (g/kg BW/day) — ACSM/AND/DC 2016.
const SPORT_PROTEIN_RANGES: Record<SportType, { min: number; max: number }> = {
  endurance: { min: 1.2, max: 1.4 },
  strength: { min: 1.6, max: 2.2 },
  team_sport: { min: 1.4, max: 1.7 },
  power: { min: 1.6, max: 2.0 },
  recreational: { min: 0.8, max: 1.0 }
};

const SPORT_CARB_RANGES: Record<SportType, { min: number; max: number }> = {
  endurance: { min: 5, max: 7 },
  strength: { min: 4, max: 7 },
  team_sport: { min: 5, max: 7 },
  power: { min: 5, max: 7 },
  recreational: { min: 3, max: 5 }
};

export interface MalawiFoodSource {
  name: string;
  query: string;
  source: string;
  note: string;
}

export const MALAWI_FOOD_SOURCES: Record<string, MalawiFoodSource[]> = {
  protein: [
    { name: 'Dagaa / Usipa (dried)', query: 'dagaa usipa', source: 'local', note: 'High protein + calcium (eaten whole)' },
    { name: 'Kapenta', query: 'kapenta', source: 'local', note: 'Protein + omega-3 fatty acids' },
    { name: 'Matemba', query: 'matemba', source: 'local', note: 'Small fish, calcium-rich' },
    { name: 'Groundnut flour', query: 'groundnut flour', source: 'local', note: 'Protein + healthy fats, affordable' },
    { name: 'Beans (boiled)', query: 'beans boiled', source: 'local', note: 'Plant protein + fiber + iron' },
    { name: 'Eggs', query: 'egg', source: 'fatsecret', note: 'Complete protein, all EAAs' },
    { name: 'Chicken (grilled)', query: 'grilled chicken', source: 'fatsecret', note: 'Lean protein source' }
  ],
  carbs: [
    { name: 'Nsima (maize)', query: 'nsima maize flour', source: 'local', note: 'Primary staple; portion-control for weight loss' },
    { name: 'Sweet potato', query: 'sweet potato', source: 'local', note: 'Carbs + beta-carotene, lower GI than nsima' },
    { name: 'Cassava (boiled)', query: 'cassava', source: 'local', note: 'Energy-dense, low protein' },
    { name: 'Rice (cooked)', query: 'rice cooked', source: 'usda', note: 'Easily digestible, good pre-workout' },
    { name: 'Banana', query: 'banana', source: 'fatsecret', note: 'Pre/post-workout carbs + potassium' },
    { name: 'Likuni Phala', query: 'likuni phala', source: 'local', note: 'Fortified maize-soya blend' }
  ],
  calcium: [
    { name: 'Dagaa / Usipa (dried)', query: 'dagaa', source: 'local', note: 'Highest local calcium (eaten whole with bones)' },
    { name: 'Matemba', query: 'matemba', source: 'local', note: 'Calcium-rich small fish' },
    { name: 'Rape / Mustard leaves', query: 'rape leaves', source: 'local', note: 'Plant-source calcium + iron' },
    { name: 'Milk (fresh/UHT)', query: 'whole milk', source: 'fatsecret', note: 'Bioavailable calcium + D + B12' },
    { name: 'Soybeans', query: 'soybean', source: 'usda', note: 'Plant calcium for dairy-free users' }
  ],
  iron: [
    { name: 'Liver (beef/chicken)', query: 'chicken liver', source: 'fatsecret', note: 'Best bioavailable heme iron' },
    { name: 'Red beans', query: 'red beans', source: 'local', note: 'Non-heme iron — pair with vitamin C' },
    { name: 'Nchunga / Dark greens', query: 'pumpkin leaves', source: 'local', note: 'Iron + folate + vitamin C' },
    { name: 'Kapenta', query: 'kapenta', source: 'local', note: 'Iron + calcium' }
  ],
  healthy_fats: [
    { name: 'Groundnuts', query: 'groundnuts raw', source: 'local', note: 'Monounsaturated fats + protein + zinc' },
    { name: 'Avocado', query: 'avocado', source: 'fatsecret', note: 'Calorie-dense, heart-healthy fats' },
    { name: 'Sunflower oil', query: 'sunflower oil', source: 'usda', note: 'Cooking fat, vitamin E' }
  ]
};

// ── SECTION 2 — Utility functions ──────────────────────────────────────────

function round(n: number, dp = 0): number {
  return parseFloat(n.toFixed(dp));
}

export function bmi(wtKg: number, htM: number): number {
  return round(wtKg / (htM * htM), 1);
}

export function bmiCategory(bmiValue: number): 'Underweight' | 'Normal weight' | 'Overweight' | 'Obese' {
  if (bmiValue < 18.5) return 'Underweight';
  if (bmiValue < 25.0) return 'Normal weight';
  if (bmiValue < 30.0) return 'Overweight';
  return 'Obese';
}

// Devine formula (1974)
function ibw(htM: number, sex: Sex): number {
  const htIn = htM * 39.3701;
  const base = sex === 'M' ? 50 : 45.5;
  return round(base + 2.3 * Math.max(0, htIn - 60), 1);
}

function adjustedBW(actualKg: number, ibwKg: number): number {
  return round(ibwKg + 0.25 * (actualKg - ibwKg), 1);
}

function dosingWeight(actualKg: number, ibwKg: number, bmiValue: number): number {
  if (bmiValue >= 30) return adjustedBW(actualKg, ibwKg);
  return Math.min(actualKg, ibwKg * 1.2);
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

// ── SECTION 3 — EER / BMR engine ───────────────────────────────────────────

/**
 * Estimated Energy Requirement — unified adult equation (Krause & Mahan
 * Box 2.1), covering the whole normal/overweight/obese adult range with one
 * continuous model (no discontinuity at the BMI 25 boundary). Includes the
 * age-50+ aging correction (~7 kcal/year decline from progressive
 * sarcopenia).
 */
export function calcEER(age: number, sex: Sex, wtKg: number, htM: number, activity: ActivityLevel): number {
  const pa = PA_COEFFICIENTS[sex][activity] || PA_COEFFICIENTS[sex].sedentary;
  let eer: number;

  if (sex === 'M') {
    eer = 864 - 9.72 * age + pa * (14.2 * wtKg + 503 * htM);
  } else {
    eer = 387 - 7.31 * age + pa * (10.9 * wtKg + 660.7 * htM);
  }

  if (age > 50) eer -= (age - 50) * 7;

  return round(eer);
}

/** Mifflin-St Jeor BMR (1990) — used as a cross-check reference. */
export function calcBMR(age: number, sex: Sex, wtKg: number, htM: number): number {
  const base = sex === 'M' ? 5 : -161;
  return round(10 * wtKg + 6.25 * htM * 100 - 5 * age + base);
}

// ── SECTION 4 — Weight management engine ───────────────────────────────────

export interface RateRange {
  min: number;
  max: number;
  default: number;
  presets: { label: string; value: number }[];
}

/** Safe weight-change rate range, by goal and sex (Krause & Mahan Ch. 23). */
export function getRateRange(goal: Goal, sex: Sex): RateRange | null {
  let min: number, max: number;
  if (goal === 'lose') {
    min = 0.25;
    max = 0.9;
  } else if (goal === 'gain') {
    min = sex === 'M' ? 0.23 : 0.11;
    max = sex === 'M' ? 0.45 : 0.34;
  } else {
    return null;
  }
  const mid = round(min + (max - min) / 2, 2);
  return {
    min,
    max,
    default: mid,
    presets: [
      { label: 'Gradual', value: min },
      { label: 'Moderate', value: mid },
      { label: 'Faster', value: max }
    ]
  };
}

export interface WeightPlan {
  eer_kcal: number;
  target_kcal: number;
  goal: Goal;
  goal_override: boolean;
  override_reason?: string | null;
  rate_kg_per_week: number;
  note: string;
  min_floor_applied?: boolean;
}

/**
 * Turns EER into a calorie target with safety rails: sex-specific safe
 * rate ranges, minimum calorie floors (1500 M / 1200 F), a 500 kcal/day
 * surplus cap on gains, and an automatic override to 'maintain' if
 * BMI < 18.5 and the goal was 'lose'.
 */
export function weightEngine(eer: number, sex: Sex, bmiValue: number, goal: Goal, rateKgPerWeek?: number): WeightPlan {
  const MIN_KCAL = sex === 'M' ? 1500 : 1200;
  const range = getRateRange(goal, sex);

  const rate = range ? clamp(rateKgPerWeek ?? range.default, range.min, range.max) : 0;
  const dailyDelta = round((rate * 7700) / 7);

  if (bmiValue < 18.5 && goal === 'lose') {
    return {
      eer_kcal: eer,
      target_kcal: eer,
      goal: 'maintain',
      goal_override: true,
      override_reason: 'BMI < 18.5 (underweight) — weight loss is contraindicated.',
      rate_kg_per_week: 0,
      note: 'Calories set to maintenance. Consider weight gain instead.'
    };
  }

  let targetKcal: number, note: string, actualRate: number;
  let minFloorApplied = false;

  switch (goal) {
    case 'lose': {
      const rawTarget = eer - dailyDelta;
      targetKcal = Math.max(rawTarget, MIN_KCAL);
      const actualDeficit = eer - targetKcal;
      actualRate = round((actualDeficit * 7) / 7700, 2);
      minFloorApplied = targetKcal === MIN_KCAL;
      note = minFloorApplied
        ? `Calorie floor applied (${MIN_KCAL} kcal/day min). Actual deficit: ${actualDeficit} kcal → ~${actualRate} kg/week`
        : `${dailyDelta} kcal/day deficit → ~${rate} kg/week loss`;
      break;
    }
    case 'gain': {
      const surplus = Math.min(dailyDelta, 500);
      targetKcal = eer + surplus;
      actualRate = round((surplus * 7) / 7700, 2);
      note =
        surplus < dailyDelta
          ? `Surplus capped at ${surplus} kcal/day (fat-gain limit) → ~${actualRate} kg/week, below the ${rate} kg/week requested`
          : `${surplus} kcal/day surplus → ~${actualRate} kg/week gain (lean mass focus)`;
      break;
    }
    default:
      targetKcal = eer;
      actualRate = 0;
      note = 'Eating at maintenance (EER). Monitor weight monthly.';
  }

  return {
    eer_kcal: eer,
    target_kcal: round(targetKcal),
    goal,
    goal_override: false,
    rate_kg_per_week: actualRate,
    min_floor_applied: minFloorApplied,
    note
  };
}

// ── SECTION 5 — Macro engine ───────────────────────────────────────────────

export interface MacroPlan {
  protein: { g: number; kcal: number; g_per_kg: number; pct: number };
  fat: { g: number; kcal: number; pct: number };
  carbs: { g: number; kcal: number; pct: number };
  dosing_weight_kg: number;
  amdr_flag: string | null;
}

/**
 * Protein/fat/carb targets tailored to goal + activity + BMI. Uses
 * adjusted body weight for protein dosing when BMI ≥30 rather than actual
 * weight, so protein targets don't over-prescribe for larger body sizes.
 */
export function macroEngine(
  targetKcal: number,
  wtKg: number,
  ibwKg: number,
  bmiValue: number,
  goal: Goal,
  activity: ActivityLevel
): MacroPlan {
  const dw = dosingWeight(wtKg, ibwKg, bmiValue);

  let proGPerKg: number;
  if (goal === 'lose') {
    proGPerKg = activity === 'sedentary' || activity === 'low_active' ? 1.2 : 1.6;
  } else if (goal === 'gain') {
    proGPerKg = 1.8;
  } else {
    proGPerKg = activity === 'very_active' || activity === 'active' ? 1.2 : 1.0;
  }

  const proteinG = round(dw * proGPerKg);
  const proteinKcal = proteinG * 4;

  const fatPct = goal === 'lose' ? 0.25 : goal === 'gain' ? 0.3 : 0.28;
  const fatKcal = round(targetKcal * fatPct);
  const fatG = round(fatKcal / 9);

  const carbKcal = round(targetKcal - proteinKcal - fatKcal);
  const carbG = round(carbKcal / 4);
  const carbPct = round((carbKcal / targetKcal) * 100, 1);

  const amdrFlag = carbPct < 40 ? 'Carbohydrate below AMDR lower limit — review protein or fat targets' : null;

  return {
    protein: { g: proteinG, kcal: proteinKcal, g_per_kg: proGPerKg, pct: round((proteinKcal / targetKcal) * 100, 1) },
    fat: { g: fatG, kcal: fatKcal, pct: round(fatPct * 100, 1) },
    carbs: { g: carbG, kcal: carbKcal, pct: carbPct },
    dosing_weight_kg: dw,
    amdr_flag: amdrFlag
  };
}

// ── SECTION 6 — Sports nutrition engine ─────────────────────────────────────

export interface SportsPlan {
  sport_type: SportType;
  protein: { min_g: number; max_g: number; g_per_kg: string; note: string };
  carbs: { min_g_day: number; max_g_day: number; g_per_kg: string; heavy_training_note: string | null };
  timing: {
    pre_workout: { window: string; carbs_g: string; protein_g: string; fat: string; local_foods: string[]; note: string };
    during: { window?: string; carbs_g_per_hr?: string; fluids_ml_per_hr?: string; local_foods?: string[]; note: string };
    post_workout: { window: string; carbs_g: string; protein_g: string; carb_protein_ratio: string; local_foods: string[] };
  };
  hydration: {
    pre_exercise: string;
    during: string;
    post_exercise: string;
    sodium: string | null;
    urine_target: string;
    malawi_note: string;
  };
}

export function sportsEngine(wtKg: number, sportType: SportType, sessionMin = 60): SportsPlan {
  const sp = SPORT_PROTEIN_RANGES[sportType] || SPORT_PROTEIN_RANGES.recreational;
  const sc = SPORT_CARB_RANGES[sportType] || SPORT_CARB_RANGES.recreational;

  const protein = {
    min_g: round(wtKg * sp.min),
    max_g: round(wtKg * sp.max),
    g_per_kg: `${sp.min}–${sp.max} g/kg`,
    note: 'Distribute across 4–5 meals/snacks; 20–40g per meal for max MPS'
  };

  const carbs = {
    min_g_day: round(wtKg * sc.min),
    max_g_day: round(wtKg * sc.max),
    g_per_kg: `${sc.min}–${sc.max} g/kg/day`,
    heavy_training_note: sportType === 'endurance' ? 'Heavy endurance training (>90 min/day): increase to 7–10 g/kg' : null
  };

  const timing = {
    pre_workout: {
      window: '1–4 hours before exercise',
      carbs_g: `${round(wtKg * 1)}–${round(wtKg * 4)} g`,
      protein_g: '10–20 g (optional, improves MPS)',
      fat: 'Low-fat meal — fat slows gastric emptying',
      local_foods: [
        'Nsima (small portion) + beans',
        'Banana + groundnut butter (1 tbsp)',
        'Sweet potato + egg (boiled)',
        'Rice porridge (thobwa) with milk'
      ],
      note: 'Large meal 3–4 hr before; small snack only 30–60 min before'
    },
    during:
      sessionMin > 60
        ? {
            window: 'Every 15–20 min for sessions > 60 min',
            carbs_g_per_hr: '30–60 g/hour',
            fluids_ml_per_hr: '400–800 mL/hour',
            local_foods: ['Banana (1 medium = ~27g carbs)', 'Sugar cane (natural glucose)', 'ORS / homemade sports drink (water + sugar + pinch of salt)'],
            note: 'Multiple carb sources (glucose + fructose) improve absorption at high rates'
          }
        : { note: `Session duration (${sessionMin} min) < 60 min — water only is sufficient during exercise` },
    post_workout: {
      window: 'Within 30 minutes (critical anabolic window)',
      carbs_g: `${round(wtKg * 1.0)}–${round(wtKg * 1.5)} g`,
      protein_g: `${round(wtKg * 0.25)}–${round(wtKg * 0.3)} g`,
      carb_protein_ratio: '3:1 (carb:protein) for glycogen + muscle repair',
      local_foods: ['Milk + banana (ideal ratio)', 'Groundnut porridge with milk', 'Eggs + nsima', 'Kapenta + rice', 'Likuni Phala made with milk']
    }
  };

  const hydration = {
    pre_exercise: `${round(wtKg * 5)}–${round(wtKg * 7)} mL — drink 4 hours before`,
    during: '400–800 mL per hour (drink to thirst; do not over-hydrate)',
    post_exercise: '1.5 L per kg of body weight lost in sweat',
    sodium:
      sessionMin > 60
        ? '0.5–0.7 g sodium per liter of fluid — improves palatability and drive to drink, reduces hyponatremia and muscle cramp risk during sessions over 1 hour'
        : null,
    urine_target: 'Pale yellow urine = adequate hydration',
    malawi_note: 'High heat and humidity in Malawi increase sweat losses — increase to upper end of range during hot season'
  };

  return { sport_type: sportType, protein, carbs, timing, hydration };
}

// ── SECTION 7 — Bone health engine ──────────────────────────────────────────

export interface BoneHealthInputs {
  dairy_servings_day?: number;
  sun_exposure?: 'low' | 'moderate' | 'high';
  weight_bearing_activity?: boolean;
}

export interface BoneHealthPlan {
  calcium: { target_mg: number; estimated_from_dairy_mg: number; gap_mg: number; percent_met: number; local_sources: MalawiFoodSource[]; tip: string };
  vitamin_d: { target_iu: number; malawi_sun_note: string; supplement_flag: boolean };
  risk_score: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  risk_flags: string[];
  recommendation: string;
}

export function boneHealthEngine(age: number, sex: Sex, inputs: BoneHealthInputs = {}): BoneHealthPlan {
  const { dairy_servings_day = 0, sun_exposure = 'moderate', weight_bearing_activity = true } = inputs;

  const caTarget = calciumDRI(age, sex);
  const vdTarget = vitDDRI(age);

  const caFromDairy = dairy_servings_day * 300;
  const caGapMg = Math.max(0, caTarget - caFromDairy);
  const caPctMet = round((caFromDairy / caTarget) * 100, 0);

  let riskScore = 0;
  const riskFlags: string[] = [];

  if (caFromDairy < caTarget * 0.7) {
    riskScore += 2;
    riskFlags.push(`Low calcium intake (~${caFromDairy}mg vs ${caTarget}mg target)`);
  }
  if (sun_exposure === 'low') {
    riskScore += 1;
    riskFlags.push('Low sun exposure → likely vitamin D insufficiency');
  }
  if (!weight_bearing_activity) {
    riskScore += 1;
    riskFlags.push('No weight-bearing exercise (critical for bone density maintenance)');
  }
  if (sex === 'F' && age >= 45) {
    riskScore += 1;
    riskFlags.push('Female ≥ 45 years: oestrogen decline → accelerated bone resorption');
  }

  const riskLevel: BoneHealthPlan['risk_level'] = riskScore <= 1 ? 'Low' : riskScore <= 3 ? 'Moderate' : 'High';

  const recommendation = {
    High: 'Consult a health professional. Consider bone density assessment (DXA if available). Supplement calcium and vitamin D.',
    Moderate: 'Increase calcium-rich foods (especially dagaa). Ensure daily sun exposure. Add resistance exercise 3×/week.',
    Low: 'Maintain current bone-protective habits. Reassess annually.'
  }[riskLevel];

  return {
    calcium: {
      target_mg: caTarget,
      estimated_from_dairy_mg: caFromDairy,
      gap_mg: caGapMg,
      percent_met: caPctMet,
      local_sources: MALAWI_FOOD_SOURCES.calcium,
      tip: 'Dagaa eaten whole is the richest local calcium source in Malawi — include 2–3 times per week'
    },
    vitamin_d: {
      target_iu: vdTarget,
      malawi_sun_note: 'Malawi has excellent solar UVB — 15–20 min midday sun on arms and legs is usually sufficient for vitamin D synthesis',
      supplement_flag: sun_exposure === 'low'
    },
    risk_score: riskScore,
    risk_level: riskLevel,
    risk_flags: riskFlags,
    recommendation
  };
}

// ── SECTION 8 — Aging module (45-60) ────────────────────────────────────────

export interface AgingPlan {
  age_group: string;
  key_adjustments: Record<string, string>;
  special_flags: string[];
}

export function agingModule(age: number, sex: Sex, weightKg: number): AgingPlan | null {
  if (age < 45) return null;

  return {
    age_group: '45–60',
    key_adjustments: {
      energy: 'EER decreases due to declining lean mass; avoid excess restriction to prevent further muscle loss',
      protein: '1.0–1.2 g/kg/day (higher than 0.8 g/kg young adult RDA) — preserves muscle mass (sarcopenia prevention)',
      calcium: sex === 'F' && age >= 51 ? '1200mg/day (increased from 1000mg at menopause — bone protection)' : '1000mg/day',
      vitamin_d: '600 IU/day via sun + food; critical for calcium absorption at this age',
      fiber: `${fiberAI(age, sex)}g/day — bowel health, cholesterol, blood glucose regulation`,
      fluid: `${round(fluidAI(weightKg, age) * 1000)} mL/day minimum — thirst sensation diminishes with age; schedule fluid intake`
    },
    special_flags: [
      'Vitamin B12 (2.4 µg/day): absorption declines with age → consider fortified foods or supplement',
      'Resistance training 2–3×/week alongside adequate protein is the best sarcopenia prevention',
      sex === 'F' ? 'Iron: requirement decreases to 8mg/day post-menopause' : null,
      'Screen for hypertension: reduce sodium <2300mg/day; increase potassium (fruits, vegetables)',
      'Blood glucose: reduce refined carbs; choose lower-GI options (sweet potato, legumes over white nsima)'
    ].filter((s): s is string => Boolean(s))
  };
}

// ── SECTION 9 — Adolescent / young adult module (18-24) ───────────────────

export interface AdolescentPlan {
  age_group: string;
  flags: string[];
  local_focus: string[];
}

export function adolescentModule(age: number, sex: Sex): AdolescentPlan | null {
  if (age > 24) return null;

  const flags = [
    `Calcium: ${calciumDRI(age, sex)}mg/day — peak bone mass accumulation continues until ~age 25`,
    `Protein: 0.85 g/kg/day — slightly higher than later adult RDA to support final growth`,
    `Zinc: ${sex === 'M' ? '11mg' : '8mg'}/day — growth, immunity, wound healing`
  ];

  if (sex === 'F') {
    flags.push('Iron: 18mg/day — menstrual blood loss significantly increases requirement');
    flags.push('Folate: 400 µg/day — critical for all females of reproductive age (neural tube protection)');
  }

  return {
    age_group: '18–24 (Young Adult)',
    flags,
    local_focus: [
      'Encourage variety beyond nsima + one relish — diversify protein and vegetable sources',
      'Dagaa 3× per week covers both calcium and protein needs affordably',
      sex === 'F' ? 'Pair beans/greens (non-heme iron) with tomatoes/guava (vitamin C) at the same meal' : null
    ].filter((s): s is string => Boolean(s))
  };
}

// ── SECTION 10 — Oral health engine ─────────────────────────────────────────

export interface OralHealthInputs {
  sugary_drink_times?: number;
  sweet_snack_times?: number;
  water_as_main_drink?: boolean;
  fruit_veg_servings?: number;
}

export interface OralHealthPlan {
  cariogenic_exposures_per_day: number;
  risk_level: 'Low' | 'Moderate' | 'High';
  notes: string[];
  protective_nutrients: { nutrient: string; role: string; sources: string[] }[];
  tip: string;
}

export function oralHealthEngine(inputs: OralHealthInputs = {}): OralHealthPlan {
  const { sugary_drink_times = 0, sweet_snack_times = 0, water_as_main_drink = true, fruit_veg_servings = 0 } = inputs;

  const totalExposures = sugary_drink_times + sweet_snack_times;
  const risk: OralHealthPlan['risk_level'] = totalExposures >= 5 ? 'High' : totalExposures >= 3 ? 'Moderate' : 'Low';

  const notes: string[] = [];
  if (totalExposures >= 5) {
    notes.push('Reduce sugary drink and snack frequency — limit to mealtimes only');
    notes.push('Each sugary drink/snack is a separate acid attack on enamel — frequency matters more than amount');
  } else if (totalExposures >= 3) {
    notes.push('Consolidate sweet foods/drinks to mealtimes to reduce acid exposure episodes');
  }
  if (!water_as_main_drink) {
    notes.push('Switch main beverage to water — fluoridated water where available strengthens enamel');
  }
  if (fruit_veg_servings < 5) {
    notes.push('Increase fruit and vegetable intake — antioxidants and vitamins support gum health');
  }

  const protectiveNutrients = [
    { nutrient: 'Calcium + Phosphorus', role: 'Enamel remineralisation after acid attacks', sources: ['Milk', 'Dagaa (whole)', 'Cheese', 'Kapenta'] },
    { nutrient: 'Vitamin C', role: 'Collagen synthesis for gum health; deficiency → gingivitis', sources: ['Guava', 'Tomatoes', 'Baobab fruit', 'Citrus'] },
    { nutrient: 'Fluoride', role: 'Enamel hardening and remineralisation', sources: ['Fluoridated water', 'Tea (where fluoride content is adequate)'] },
    { nutrient: 'Vitamin D', role: 'Supports calcium absorption for bone/tooth mineralisation', sources: ['Sunlight (primary in Malawi)', 'Kapenta', 'Egg yolk'] }
  ];

  return {
    cariogenic_exposures_per_day: totalExposures,
    risk_level: risk,
    notes,
    protective_nutrients: protectiveNutrients,
    tip: 'Rinse with water after sugary foods; wait 30 min before brushing (enamel temporarily softened)'
  };
}

// ── SECTION 11 — Micronutrient flags ────────────────────────────────────────

export interface MicronutrientFlag {
  nutrient: string;
  target: string;
  priority: 'high' | 'medium';
  note: string;
  sources?: MalawiFoodSource[];
  query_hint: string;
}

export function micronutrientFlags(age: number, sex: Sex, goal: Goal): MicronutrientFlag[] {
  const flags: MicronutrientFlag[] = [];

  if (sex === 'F' && age <= 50) {
    flags.push({
      nutrient: 'Iron',
      target: `${ironDRI(age, sex)} mg/day`,
      priority: 'high',
      note: 'Menstrual blood loss — include iron-rich foods daily; pair plant sources with vitamin C',
      sources: MALAWI_FOOD_SOURCES.iron,
      query_hint: 'liver OR kapenta OR beans'
    });
  }

  flags.push({
    nutrient: 'Calcium',
    target: `${calciumDRI(age, sex)} mg/day`,
    priority: age >= 45 ? 'high' : 'medium',
    note: age >= 45 ? 'Increased need; bone loss accelerates in this age group' : 'Peak bone mass window',
    sources: MALAWI_FOOD_SOURCES.calcium,
    query_hint: 'dagaa OR milk OR kapenta'
  });

  flags.push({
    nutrient: 'Vitamin D',
    target: `${vitDDRI(age)} IU/day`,
    priority: 'medium',
    note: 'Malawi sun exposure usually adequate. 15–20 min midday sun on arms + legs daily.',
    query_hint: 'egg yolk OR kapenta'
  });

  if (age >= 50) {
    flags.push({
      nutrient: 'Vitamin B12',
      target: '2.4 µg/day',
      priority: 'high',
      note: 'Gastric acid secretion declines with age — reduced B12 absorption. Consider supplement or fortified food.',
      query_hint: 'liver OR beef OR kapenta OR eggs'
    });
  }

  if (sex === 'F' && age <= 45) {
    flags.push({
      nutrient: 'Folate',
      target: '400 µg/day',
      priority: 'medium',
      note: 'Dark leafy greens (nchunga, rape), legumes, fortified flour',
      query_hint: 'pumpkin leaves OR rape OR beans'
    });
  }

  if (goal === 'lose') {
    flags.push({
      nutrient: 'Zinc',
      target: sex === 'M' ? '11 mg/day' : '8 mg/day',
      priority: 'medium',
      note: 'Caloric restriction diets risk zinc inadequacy — include legumes, nuts, meat',
      query_hint: 'groundnuts OR beans OR beef'
    });
  }

  if (age >= 40) {
    flags.push({
      nutrient: 'Potassium',
      target: sex === 'M' ? '3400 mg/day' : '2600 mg/day',
      priority: 'medium',
      note: 'Supports blood pressure regulation; increases in fruit and vegetable intake',
      query_hint: 'banana OR sweet potato OR beans'
    });
  }

  return flags.sort((a, _b) => (a.priority === 'high' ? -1 : 1));
}

// ── SECTION 12 — Food recommendation layer ──────────────────────────────────

export interface FoodRecommendations {
  primary_sources: Record<string, MalawiFoodSource[]>;
  api_priority: string[];
  routing_note: string;
  practical_tips: string[];
}

export function foodRecommendations(goal: Goal): FoodRecommendations {
  const tips: string[] = [];

  if (goal === 'gain') {
    tips.push('Add groundnut butter (PB) to porridge — ~100 kcal + 4g protein per tablespoon');
    tips.push('Cook nsima in milk instead of water for extra calories and protein');
    tips.push('Include avocado daily — calorie-dense, micronutrient-rich');
    tips.push('Eat 5–6 smaller meals per day — easier to hit a surplus than 3 large meals');
    tips.push('Post-workout: milk + banana within 30 min for muscle protein synthesis');
  } else if (goal === 'lose') {
    tips.push('Prioritise high-volume low-calorie foods: vegetables, greens, clear soups');
    tips.push('Control nsima portions: 1 cup cooked per meal (200–250 kcal)');
    tips.push('Cooking method: boil, grill, or steam rather than fry');
    tips.push('Protein at every meal increases satiety and preserves muscle in a deficit');
    tips.push('Eat slowly — satiety signals take 15–20 min to reach the brain');
  } else {
    tips.push('Aim for variety: different coloured vegetables, different protein sources each week');
    tips.push('The Malawian plate: ½ vegetables/relish, ¼ nsima, ¼ protein (fish/beans/meat)');
  }

  return {
    primary_sources: MALAWI_FOOD_SOURCES,
    api_priority: ['local (Malawi FCT)', 'fatsecret', 'usda_fdc', 'open_food_facts'],
    routing_note: 'Query Malawi FCT first for any local food name. Fall back to FatSecret → USDA → OFF for packaged/international foods.',
    practical_tips: tips
  };
}

// ── SECTION 13 — Master generate() function ────────────────────────────────

export interface NutritionProfile {
  age: number;
  sex: Sex;
  weight_kg: number;
  height_m: number;
  activity_level: ActivityLevel;
  goal: Goal;
  rate_kg_per_week?: number;
  sport_type?: SportType;
  session_min?: number;
  bone_inputs?: BoneHealthInputs;
  oral_inputs?: OralHealthInputs;
}

export interface NutritionPlan {
  _meta: { engine: string; reference: string; generated_at: string };
  assessment: { bmi: number; bmi_category: string; ibw_kg: number; bmr_kcal: number; eer_kcal: number };
  energy: WeightPlan;
  macros: MacroPlan;
  micronutrients: { fiber_g: number; fluid_L: number; flags: MicronutrientFlag[] };
  food_recommendations: FoodRecommendations;
  modules: {
    sports: SportsPlan | null;
    bone_health: BoneHealthPlan;
    aging: AgingPlan | null;
    young_adult: AdolescentPlan | null;
    oral_health: OralHealthPlan | null;
  };
}

/**
 * Main entry point — generates a complete personalized nutrition plan.
 * Targets adults 18–60. Returns { error } on invalid input instead of
 * throwing, so callers can render a friendly message.
 */
export function generate(profile: NutritionProfile): NutritionPlan | { error: string } {
  const { age, sex, weight_kg, height_m, activity_level, goal, rate_kg_per_week, sport_type, session_min, bone_inputs, oral_inputs } = profile;

  if (age < 18 || age > 60) return { error: 'This calculator targets ages 18–60.' };
  if (!PA_COEFFICIENTS[sex][activity_level]) return { error: 'Invalid activity level.' };

  const bmiValue = bmi(weight_kg, height_m);
  const ibwKg = ibw(height_m, sex);
  const bmrKcal = calcBMR(age, sex, weight_kg, height_m);
  const eerKcal = calcEER(age, sex, weight_kg, height_m, activity_level);

  const weight = weightEngine(eerKcal, sex, bmiValue, goal, rate_kg_per_week);
  const effGoal = weight.goal;

  const macros = macroEngine(weight.target_kcal, weight_kg, ibwKg, bmiValue, effGoal, activity_level);
  const micros = micronutrientFlags(age, sex, effGoal);
  const foods = foodRecommendations(effGoal);

  const sports = sport_type ? sportsEngine(weight_kg, sport_type, session_min) : null;
  const bone = boneHealthEngine(age, sex, bone_inputs || {});
  const aging = agingModule(age, sex, weight_kg);
  const youth = adolescentModule(age, sex);
  const oral = oral_inputs ? oralHealthEngine(oral_inputs) : null;

  return {
    _meta: {
      engine: 'ThanziNutrition v1.0 (ported)',
      reference: 'Krause & Mahan 14th Ed | DRI/NASEM | ACSM/AND 2016 | WHO',
      generated_at: new Date().toISOString()
    },
    assessment: { bmi: bmiValue, bmi_category: bmiCategory(bmiValue), ibw_kg: ibwKg, bmr_kcal: bmrKcal, eer_kcal: eerKcal },
    energy: weight,
    macros,
    micronutrients: { fiber_g: fiberAI(age, sex), fluid_L: fluidAI(weight_kg, age), flags: micros },
    food_recommendations: foods,
    modules: { sports, bone_health: bone, aging, young_adult: youth, oral_health: oral }
  };
}
