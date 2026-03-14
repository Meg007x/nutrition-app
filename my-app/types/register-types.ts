export type Gender = 'male' | 'female' | 'other' | 'ชาย' | 'หญิง' | 'อื่นๆ' | '';
export type GoalType = 'lose_weight' | 'maintain' | 'gain_weight' | '';
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'
  | '';

export type ProteinLevel = 'low' | 'medium' | 'high' | '';

export type RegisterData = {
  // step1 - account + basic info
  username: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  dateOfBirth: string;
  age: string;
  gender: Gender;

  // step2
  heightCm: string;

  // step3
  weightKg: string;
  bmi: number | null;

  // step4
  goalType: GoalType;
  targetWeightKg: string;
  goalDurationWeeks: string;

  // step5
  activityLevel: ActivityLevel;
  proteinLevel: ProteinLevel;
  recommendedProteinG: number | null;

  // step6
  hasAllergies: boolean | null;
  allergies: string[];

  // step7
  dislikedFoods: string[];

  // step8
  interestedCuisines: string[];

  // step9
  mealTimes: {
    breakfast: string;
    lunch: string;
    dinner: string;
    snack: string;
  };
};

export const initialRegisterData: RegisterData = {
  username: '',
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  dateOfBirth: '',
  age: '',
  gender: '',

  heightCm: '',

  weightKg: '',
  bmi: null,

  goalType: '',
  targetWeightKg: '',
  goalDurationWeeks: '',

  activityLevel: '',
  proteinLevel: '',
  recommendedProteinG: null,

  hasAllergies: null,
  allergies: [],

  dislikedFoods: [],

  interestedCuisines: [],

  mealTimes: {
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: '',
  },
};