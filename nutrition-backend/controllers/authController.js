const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// --- ฟังก์ชันคำนวณ BMI และ สถานะ ---
const calculateBMI = (weight, height) => {
  const bmi = Number((weight / ((height / 100) ** 2)).toFixed(1));
  let status = "";
  let color = "";

  if (bmi < 18.5) {
    status = "น้ำหนักน้อย";
    color = "blue";
  } else if (bmi < 23) {
    status = "น้ำหนักปกติ";
    color = "green";
  } else if (bmi < 25) {
    status = "น้ำหนักเกิน";
    color = "yellow";
  } else {
    status = "อ้วน";
    color = "red";
  }

  return { bmi, status, color };
};

// ฟังก์ชันคำนวณอายุจากวันเกิด
const calculateAge = (dateOfBirth) => {
  const birthDate = new Date(dateOfBirth);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age;
};

// ฟังก์ชันคำนวณ TDEE (สมองของระบบ)
const calculateTDEE = (gender, weight, height, age, activityLevel) => {
  let bmr = (10 * weight) + (6.25 * height) - (5 * age);
  bmr = (gender === 'ชาย') ? bmr + 5 : bmr - 161;

  const factors = {
    'น้อย': 1.2,
    'ปานกลาง': 1.375,
    'มาก': 1.55,
    'หนัก': 1.725
  };

  const factor = factors[activityLevel] || 1.2;
  return Math.round(bmr * factor);
};

// --- ฟังก์ชันสร้าง "คำแนะนำอัจฉริยะ" ---
const generateAdvice = (bmiStatus, userGoal) => {
  if (bmiStatus === "น้ำหนักน้อย" && userGoal === "เพิ่มกล้ามเนื้อ") {
    return "แนะนำให้เน้นทานโปรตีนและคาร์โบไฮเดรตเชิงซ้อน เพื่อช่วยในการสร้างมวลกล้ามเนื้อและเพิ่มน้ำหนักอย่างมีสุขภาพ";
  } else if (bmiStatus === "อ้วน" || userGoal === "ลดน้ำหนัก") {
    return "ควรเน้นการทำ IF หรือลดปริมาณคาร์โบไฮเดรตในมื้อเย็น และเพิ่มการทำคาร์ดิโออย่างน้อย 150 นาทีต่อสัปดาห์";
  } else if (bmiStatus === "น้ำหนักปกติ") {
    return "ร่างกายของคุณอยู่ในเกณฑ์ดีเยี่ยม แนะนำให้เน้นการประคองระดับสารอาหารเพื่อความแข็งแรงในระยะยาว";
  }
  return "เริ่มต้นแผนการกินที่สมดุล และดื่มน้ำให้เพียงพอต่อความต้องการของร่างกาย";
};

const normalizeGender = (gender) => {
  const map = {
    male: 'ชาย',
    female: 'หญิง',
    other: 'อื่นๆ',
    ชาย: 'ชาย',
    หญิง: 'หญิง',
    'อื่นๆ': 'อื่นๆ',
  };
  return map[gender] || gender || 'อื่นๆ';
};

const normalizeGoal = (goal) => {
  const map = {
    lose_weight: 'ลดน้ำหนัก',
    maintain: 'รักษาน้ำหนัก',
    gain_weight: 'เพิ่มกล้ามเนื้อ',
    ลดน้ำหนัก: 'ลดน้ำหนัก',
    รักษาน้ำหนัก: 'รักษาน้ำหนัก',
    เพิ่มกล้ามเนื้อ: 'เพิ่มกล้ามเนื้อ',
  };
  return map[goal] || goal || 'รักษาน้ำหนัก';
};

const normalizeActivity = (activity) => {
  const map = {
    sedentary: 'น้อย',
    light: 'ปานกลาง',
    moderate: 'มาก',
    active: 'หนัก',
    very_active: 'หนัก',
    น้อย: 'น้อย',
    ปานกลาง: 'ปานกลาง',
    มาก: 'มาก',
    หนัก: 'หนัก',
  };
  return map[activity] || activity || 'น้อย';
};

const registerUser = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const d = req.body;

    if (!d.username || !d.email || !d.password) {
      return res.status(400).json({ message: "กรุณากรอกชื่อผู้ใช้ อีเมล และรหัสผ่านให้ครบ" });
    }

    if (!d.date_of_birth || !d.gender) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลพื้นฐานให้ครบ" });
    }

    if (!d.height_cm || !d.weight_kg) {
      return res.status(400).json({ message: "กรุณากรอกส่วนสูงและน้ำหนักให้ครบ" });
    }

    const normalizedEmail = String(d.email).trim().toLowerCase();

    const existingUser = await db.collection('Users').findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว!" });
    }

    const normalizedGender = normalizeGender(d.gender);
    const normalizedGoal = normalizeGoal(d.primary_goal);
    const normalizedActivity = normalizeActivity(d.activity_level);

    const age = calculateAge(d.date_of_birth);
    const bmiResult = calculateBMI(Number(d.weight_kg), Number(d.height_cm));
    const tdeeResult = calculateTDEE(
      normalizedGender,
      Number(d.weight_kg),
      Number(d.height_cm),
      age,
      normalizedActivity
    );
    const adviceText = generateAdvice(bmiResult.status, normalizedGoal);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(d.password, salt);

    const newUser = {
      user_id: "U" + Date.now(),

      // [หน้า 1] ข้อมูลบัญชี
      username: d.username,
      email: normalizedEmail,
      password: hashedPassword,
      gender: normalizedGender,
      date_of_birth: d.date_of_birth,
      age: age,

      // [หน้า 2 & 3] ร่างกาย
      height_cm: Number(d.height_cm),
      weight_kg: Number(d.weight_kg),

      body_analysis: {
        bmi: bmiResult.bmi,
        status: bmiResult.status,
        color: bmiResult.color,
      },

      // [หน้า 4 & 5] เป้าหมายและการคำนวณ
      health_goals: {
        primary_goal: normalizedGoal,
        target_weight_kg: d.target_weight_kg ? Number(d.target_weight_kg) : null,
        duration_weeks: d.duration_weeks ? Number(d.duration_weeks) : null,
        activity_level: normalizedActivity,
        protein_target_g: d.protein_target_g ? Number(d.protein_target_g) : 140,
        tdee_target_kcal: tdeeResult
      },

      // [หน้า 6] การแพ้อาหาร
      allergies: Array.isArray(d.allergies) ? d.allergies : [],

      // [หน้า 7] อาหารที่ไม่ชอบ
      disliked_foods: Array.isArray(d.disliked_foods) ? d.disliked_foods : [],

      // [หน้า 8] สไตล์อาหารที่สนใจ
      interested_cuisines: Array.isArray(d.interested_cuisines) ? d.interested_cuisines : [],

      // [หน้า 9] ตั้งค่ามื้ออาหาร
      meal_settings: {
        meals_per_day: d.meals_per_day || 3,
        schedules: Array.isArray(d.meal_schedules) ? d.meal_schedules : []
      },

      summary: {
        advice: adviceText,
      },

      onboarding_completed: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    await db.collection('Users').insertOne(newUser);

    const { password, ...userWithoutPassword } = newUser;

    return res.status(201).json({
      message: "🎉 บันทึกข้อมูลสมาชิกเรียบร้อย!",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดที่ระบบหลังบ้าน",
      error: error.message
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await db.collection('Users').findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "ไม่พบบัญชีผู้ใช้นี้" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    const { password: hiddenPassword, ...userWithoutPassword } = user;

    return res.status(200).json({
      message: "เข้าสู่ระบบสำเร็จ",
      user: userWithoutPassword
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      message: "เกิดข้อผิดพลาดที่ระบบหลังบ้าน",
      error: error.message
    });
  }
};

module.exports = { registerUser, loginUser };