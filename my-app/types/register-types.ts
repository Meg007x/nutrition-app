export type Gender = 'male' | 'female' | 'other' | 'ชาย' | 'หญิง' | 'อื่นๆ' | '';
export type GoalType = 'lose_weight' | 'maintain' | 'gain_weight' | '';
export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active'
  | 'extra_active'
  | '';

export type ProteinLevel = 'low' | 'medium' | 'high' | '';
export type ProteinInputMode = 'auto' | 'custom';

// 🚀 สร้าง Type ใหม่สำหรับเก็บหมวดหมู่อาหาร (ใช้ได้ทั้งแพ้อาหาร และ อาหารที่ไม่ชอบ)
export type CategorizedFood = {
  veg: string[];
  condiment: string[];
  meat: string[];
  other: string[];
};

export type AllergyV2Item = {
  type: "specific";
  code: string;
  label: string;
  ingredient_id: string | null;
};

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
  proteinInputMode: ProteinInputMode;
  recommendedProteinG: number | null;

  // step6
  // step6
  hasAllergies: boolean | null;
  allergies: CategorizedFood | any;
  allergies_v2: AllergyV2Item[];

  // step7
  dislikedFoods: CategorizedFood | any; // 👈 เผื่อหน้า 7 ทำเป็นหมวดหมู่ด้วยเลย

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
  proteinInputMode: 'auto',
  recommendedProteinG: null,

  hasAllergies: null,
  allergies: { veg: [], condiment: [], meat: [], other: [] }, // 👈 เปลี่ยนค่าเริ่มต้นให้เป็น Object
  allergies_v2: [],

  dislikedFoods: { veg: [], condiment: [], meat: [], other: [] }, // 👈 เปลี่ยนค่าเริ่มต้นให้เป็น Object

  interestedCuisines: [],

  mealTimes: {
    breakfast: '',
    lunch: '',
    dinner: '',
    snack: '',
  },
};