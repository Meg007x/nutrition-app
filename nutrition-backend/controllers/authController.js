const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


// --- ฟังก์ชันคำนวณ BMI และ สถานะ ---
const calculateBMI = (weight, height) => {
    const bmi = (weight / ((height / 100) ** 2)).toFixed(1);
    let status = "";
    let color = "";

    if (bmi < 18.5) { status = "น้ำหนักน้อย"; color = "blue"; }
    else if (bmi < 23) { status = "น้ำหนักปกติ"; color = "green"; }
    else if (bmi < 25) { status = "น้ำหนักเกิน"; color = "yellow"; }
    else { status = "อ้วน"; color = "red"; }

    return { bmi, status, color };
};


// ฟังก์ชันคำนวณ TDEE (สมองของระบบ)
const calculateTDEE = (gender, weight, height, age, activityLevel) => {
    // 1. คำนวณ BMR (Mifflin-St Jeor Equation)
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr = (gender === 'ชาย') ? bmr + 5 : bmr - 161;

    // 2. คูณค่า Activity Factor (ระดับกิจกรรม)
    const factors = { 'น้อย': 1.2, 'ปานกลาง': 1.375, 'มาก': 1.55, 'หนัก': 1.725 };
    const factor = factors[activityLevel] || 1.2;

    return Math.round(bmr * factor);
};

// --- ฟังก์ชันสร้าง "คำแนะนำอัจฉริยะ" (ไม่ฟิกคำตายตัว) ---
const generateAdvice = (bmiStatus, userGoal) => {
    if (bmiStatus === "น้ำหนักน้อย" && userGoal === "เพิ่มกล้ามเนื้อ") {
        return "แนะนำให้เน้นทานโปรตีนและคาร์โบไฮเดรตเชิงซ้อน เพื่อช่วยในการสร้างมวลกล้ามเนื้อและเพิ่มน้ำหนักอย่างมีสุขภาพ";
    } else if (bmiStatus === "อ้วน" || userGoal === "ลดน้ำหนัก") {
        return "ควรเน้นการทำ IF หรือลดปริมาณคาร์โบไฮเดรตในมื้อเย็น และเพิ่มการทำ Cardo อย่างน้อย 150 นาทีต่อสัปดาห์";
    } else if (bmiStatus === "น้ำหนักปกติ") {
        return "ร่างกายของคุณอยู่ในเกณฑ์ดีเยี่ยม! แนะนำให้เน้นการประคองระดับสารอาหาร (Maintain) เพื่อความแข็งแรงในระยะยาว";
    }
    return "เริ่มต้นแผนการกินที่สมดุล และดื่มน้ำให้เพียงพอต่อความต้องการของร่างกาย";
};



const registerUser = async (req, res) => {
    try {
        const db = mongoose.connection.db;
        const d = req.body; // ข้อมูลที่ส่งมาจากหน้าแอป (Frontend)

        // --- 0. ตรวจสอบ Email ซ้ำ ---
        const existingUser = await db.collection('Users').findOne({ email: d.email });
        if (existingUser) return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว!" });

        // --- 1. หน้า 1: ข้อมูลพื้นฐาน & ความปลอดภัย ---
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(d.password, salt);
        
        // คำนวณอายุจากวันเกิด (หน้า 1)
        const birthDate = new Date(d.date_of_birth);
        const age = new Date().getFullYear() - birthDate.getFullYear();

        // --- 2. ลอจิกการคำนวณเป้าหมาย (The Brain) ---
        // ใช้ข้อมูลจากหน้า 2, 3(น้ำหนัก), และ 5 เพื่อหาแคลอรี่ที่ควรได้รับต่อวัน
        const tdeeResult = calculateTDEE(d.gender, d.weight_kg, d.height_cm, age, d.activity_level);

        // --- 3. การประกอบร่างข้อมูล (Mapping Data 9 หน้า) ---
        const newUser = {
            user_id: "U" + Date.now(),
            
            // [หน้า 1] ข้อมูลบัญชี
            username: d.username,
            email: d.email,
            password: hashedPassword,
            gender: d.gender,
            date_of_birth: d.date_of_birth,
            age: age,

            // [หน้า 2 & 3] ร่างกาย
            height_cm: d.height_cm,
            weight_kg: d.weight_kg, // **อย่าลืมบอกเพื่อนให้เพิ่มช่องกรอกน้ำหนักนะ**

            // [หน้า 4 & 5] เป้าหมายและการคำนวณ
            health_goals: {
                primary_goal: d.primary_goal,         // เช่น "ลดน้ำหนัก"
                target_weight_kg: d.target_weight_kg, // เป้าหมายน้ำหนัก
                duration_weeks: d.duration_weeks,     // ระยะเวลา
                activity_level: d.activity_level,     // ระดับกิจกรรม
                protein_target_g: d.protein_target_g || 140, // เป้าหมายโปรตีน (หน้า 5)
                tdee_target_kcal: tdeeResult          // ผลลัพธ์จากการคำนวณหลังบ้าน
            },

            // [หน้า 6] การแพ้อาหาร
            allergies: d.allergies || [], // รับมาเป็น Array เช่น ["ถั่ว", "กุ้ง"]

            // [หน้า 7] อาหารที่ไม่ชอบ
            disliked_foods: d.disliked_foods || [],

            // [หน้า 8] สไตล์อาหารที่สนใจ
            interested_cuisines: d.interested_cuisines || [],

            // [หน้า 9] ตั้งค่ามื้ออาหาร
            meal_settings: {
                meals_per_day: d.meals_per_day || 3,
                schedules: d.meal_schedules || [] // Array ของ { name: "เช้า", time: "08:00" }
            },

            created_at: new Date(),
            updated_at: new Date()
        };

        // --- 4. บันทึกลง MongoDB ---
        await db.collection('Users').insertOne(newUser);

        // ส่ง Response กลับไปให้หน้าบ้าน (ไม่ต้องส่ง Password กลับไปนะ)
        const { password, ...userWithoutPassword } = newUser;
        res.status(201).json({ 
            message: "🎉 บันทึกข้อมูลสมาชิกเรียบร้อย!", 
            user: userWithoutPassword 
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่ระบบหลังบ้าน", error: error.message });
    }
};

module.exports = { registerUser };