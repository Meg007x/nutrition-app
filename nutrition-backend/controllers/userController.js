const User = require("../models/User");
const bcrypt = require("bcrypt");
const NotificationSetting = require('../models/Notification');
const WaterLog = require('../models/WaterLog');

// 1. ฟังก์ชันดึงค่าตั้งเชื่อมโยงมื้ออาหาร
const getMealSettings = async (req, res) => {
  try {
    const { uid } = req.params;

    const user = await User.findOne({
      $or: [{ user_id: uid }, { email: uid }],
    }).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "ไม่พบผู้ใช้",
      });
    }

    const schedules = Array.isArray(user?.meal_settings?.schedules)
      ? user.meal_settings.schedules
      : [];

    const mealOptions = schedules
      .filter((item) => item && item.notify !== false)
      .map((item) => item.name)
      .filter(Boolean);

    return res.json({
      success: true,
      mealOptions:
        mealOptions.length > 0
          ? mealOptions
          : ["เช้า", "กลางวัน", "เย็น"],
      mealSchedules: schedules,
      mealsPerDay: user?.meal_settings?.meals_per_day || mealOptions.length || 0,
    });
  } catch (error) {
    console.error("❌ getMealSettings error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "เกิดข้อผิดพลาดในการดึง meal settings",
    });
  }
};

// 2. ฟังก์ชันดึงข้อมูลโปรไฟล์ทั้งหมดของผู้ใช้
const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง userId มาด้วย" });
    }

    const user = await User.findOne({ user_id: userId });

    if (!user) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้รายนี้" });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error("❌ Get User Profile Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 🟢 ส่งออกเฉพาะ 2 ฟังก์ชันที่มีอยู่จริงในไฟล์นี้ให้ระบบ Route เรียกใช้งาน
module.exports = { 
  getMealSettings,
  getUserProfile
};

// 🟢 1. ฟังก์ชันอัปเดตโปรไฟล์ (แก้ไขเพิ่มเติมให้รองรับอีเมล และปิดคำเตือน Mongoose)
const updateUserProfile = async (req, res) => {
  try {
    // เพิ่มการรับค่า email จาก req.body
    const { userId, weight_kg, height_cm, gender, date_of_birth, username, email } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง userId มาด้วย" });
    }

    // 1. คำนวณอายุจาก วันเกิด
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    // 2. สูตรคำนวณ BMR (Mifflin-St Jeor Equation)
    let bmr = 0;
    if (gender === "ชาย") {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5;
    } else {
      bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161;
    }

    // 3. คำนวณ TDEE ตามระดับกิจกรรมเดิมที่มีใน DB (ถ้าไม่มีให้คูณ 1.55 เป็นค่ากลาง)
    const userExist = await User.findOne({ user_id: userId });
    const activityLevel = userExist?.health_goals?.activity_level || "ปานกลาง";
    
    let activityMultiplier = 1.375; // ออกกำลังกายน้อย
    if (activityLevel === "ปานกลาง") activityMultiplier = 1.55;
    if (activityLevel === "หนัก") activityMultiplier = 1.725;

    const tdee = Math.round(bmr * activityMultiplier);

    // 4. คำนวณ BMI และ สถานะร่างกายใหม่
    const heightInMeters = height_cm / 100;
    const bmi = parseFloat((weight_kg / (heightInMeters * heightInMeters)).toFixed(1));
    let status = "น้ำหนักปกติ";
    let color = "green";

    if (bmi < 18.5) { status = "น้ำหนักน้อยกว่าเกณฑ์"; color = "yellow"; }
    else if (bmi >= 23 && bmi < 25) { status = "น้ำหนักเกิน"; color = "orange"; }
    else if (bmi >= 25) { status = "อ้วน"; color = "red"; }

    // 5. อัปเดตข้อมูลลงฐานข้อมูล
    // เปลี่ยน { new: true } เป็น { returnDocument: 'after' } เพื่อเคลียร์ Warning ทิ้ง
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          username,
          email, // 👈 เพิ่มการอัปเดต Email ลงในข้อมูลส่วนตัว
          weight_kg,
          height_cm,
          gender,
          date_of_birth: birthDate,
          age,
          "body_analysis.bmi": bmi,
          "body_analysis.status": status,
          "body_analysis.color": color,
          "health_goals.tdee_target_kcal": tdee 
        }
      },
      { returnDocument: 'after' } // 👈 แก้ตามคำแนะนำของ Mongoose
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้รายนี้" });
    }

    return res.status(200).json({
      success: true,
      message: "อัปเดตข้อมูลส่วนตัวและคำนวณ TDEE ใหม่สำเร็จ",
      data: updatedUser
    });

  } catch (error) {
    console.error("❌ Update Profile Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 🔒 2. ฟังก์ชันสำหรับเปลี่ยนรหัสผ่าน (สร้างขึ้นใหม่)
const changePassword = async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบถ้วนสำหรับการเปลี่ยนรหัสผ่าน" });
    }

    // เข้ารหัสผ่านใหม่ (บดสับรหัสผ่าน) ด้วย bcrypt ก่อนจัดเก็บลงฐานข้อมูล เพื่อความปลอดภัย
    // หมายเหตุ: ถ้าในระบบของคุณตอนสมัครสมาชิกใช้สูตร bcrypt.hash ให้เปิดใช้งานตรงนี้ได้เลยครับ
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          password: hashedPassword // 👈 อัปเดตรหัสผ่านที่เข้ารหัสแล้วลงใน DB
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้ที่ต้องการเปลี่ยนรหัสผ่าน" });
    }

    return res.status(200).json({
      success: true,
      message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว"
    });

  } catch (error) {
    console.error("❌ Change Password Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ส่งออกฟังก์ชันอัปเดตทั้งหมดรวมถึงตัวใหม่
module.exports = {
  getMealSettings,
  getUserProfile,
  updateUserProfile,
  changePassword // 👈 เพิ่มฟังก์ชันเปลี่ยนรหัสผ่านลงในตัว Export ท้ายไฟล์
};

// 🎯 ฟังก์ชันปรับเป้าหมายสุขภาพและคำนวณเป้าหมายแคลอรี่ใหม่
const updateUserGoal = async (req, res) => {
  try {
    // 1. เปลี่ยนมารับชื่อตัวแปรให้ตรงกับหน้าบ้าน และ ฐานข้อมูล (MongoDB)
    const { userId, primary_goal, target_weight_kg, duration_weeks } = req.body;

    // 2. ด่านตรวจเช็กข้อมูล (แก้ชื่อเป้าหมายให้ตรงกัน)
    if (!userId || !primary_goal || duration_weeks === undefined) {
      return res.status(400).json({ success: false, message: "กรุณาส่งข้อมูลมาให้ครบถ้วน" });
    }

    // 3. ค้นหาผู้ใช้จาก userId
    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
    }

    // 4. อัปเดตข้อมูลลง MongoDB โดยอ้างอิงฟิลด์ให้ตรงเป๊ะ
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          "health_goals.primary_goal": primary_goal,
          "health_goals.target_weight_kg": target_weight_kg,
          "health_goals.duration_weeks": duration_weeks
        }
      },
      { new: true } // ให้ส่งคืนข้อมูลที่อัปเดตแล้วกลับมา
    );

    return res.status(200).json({
      success: true,
      message: "ปรับเปลี่ยนเป้าหมายสุขภาพใหม่เรียบร้อยแล้ว",
      data: updatedUser.health_goals
    });

  } catch (error) {
    console.error("❌ Update User Goal Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ⚠️ อย่าลืมเพิ่ม "updateUserGoal" ไปที่ module.exports ด้านล่างสุดของไฟล์ด้วยนะครับ!
module.exports = {
  getMealSettings,
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateUserGoal // 👈 เพิ่มต่อท้ายตรงนี้
};

// ฟังก์ชันสำหรับอัปเดตระดับกิจกรรมและโปรตีน (และคำนวณแคลอรี่ใหม่)
const updateUserActivity = async (req, res) => {
  try {
    const { userId, activity_level, protein_target_g, tdee_target_kcal } = req.body;

    if (!userId || !activity_level || !protein_target_g || !tdee_target_kcal) {
      return res.status(400).json({ success: false, message: "กรุณาส่งข้อมูลมาให้ครบถ้วน" });
    }

    // อัปเดตข้อมูลลง MongoDB ให้สัมพันธ์กันทั้งหมด
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          "health_goals.activity_level": activity_level,
          "health_goals.protein_target_g": protein_target_g,
          "health_goals.tdee_target_kcal": tdee_target_kcal
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
    }

    return res.status(200).json({
      success: true,
      message: "อัปเดตระดับกิจกรรมและเป้าหมายแคลอรี่เรียบร้อยแล้ว",
      data: updatedUser.health_goals
    });

  } catch (error) {
    console.error("❌ Update Activity Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// อย่าลืม export ตัว updateUserActivity ออกไป และไปผูก Route (เช่น router.put('/update-activity', updateUserActivity)) ด้วยนะครับ
module.exports = {
  getMealSettings,
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateUserGoal,
  updateUserActivity // 👈 เพิ่มตัวนี้เข้าไปใน export ด้วย
};

const updateUserAllergies = async (req, res) => {
  try {
    const { userId, allergies } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "ไม่มีรหัสผู้ใช้" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { "allergies": allergies } }, // ปรับให้ตรงกับฟิลด์ Database ของคุณ
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });

    return res.status(200).json({ success: true, message: "อัปเดตอาหารที่แพ้สำเร็จ" });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMealSettings,
  getUserProfile, 
  updateUserProfile,
  changePassword,
  updateUserGoal,
  updateUserActivity,
  updateUserAllergies // 👈 เพิ่มฟังก์ชันอัปเดตอาหารที่แพ้ลงใน export
};

const updateUserDislikedFoods = async (req, res) => {
  try {
    const { userId, disliked_foods } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: "ไม่มีรหัสผู้ใช้" });

    // ใช้ user_id ตรงๆ ให้ตรงกับฐานข้อมูลเป๊ะๆ
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { "disliked_foods": disliked_foods } }, 
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });

    return res.status(200).json({ success: true, message: "อัปเดตอาหารที่ไม่ชอบสำเร็จ" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMealSettings,
  getUserProfile,
  updateUserProfile,
  changePassword,
  updateUserGoal,
  updateUserActivity,
  updateUserAllergies,
  updateUserDislikedFoods // 👈 เพิ่มฟังก์ชันอัปเดตอาหารที่ไม่ชอบลงใน export
};

const updateUserInterestedCuisines = async (req, res) => {
  try {
    const { userId, interested_cuisines } = req.body;

    if (!userId) return res.status(400).json({ success: false, message: "ไม่มีรหัสผู้ใช้" });

    // ค้นหาผ่านคีย์ user_id และเซ็ตฟิลด์ interested_cuisines ตามอาร์เรย์ที่หน้าบ้านส่งมา
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { "interested_cuisines": interested_cuisines } }, 
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });

    return res.status(200).json({ success: true, message: "อัปเดตประเภทอาหารที่สนใจสำเร็จ" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// 🟢 เพิ่มฟังก์ชันอัปเดตรูปโปรไฟล์
const uploadAvatar = async (req, res) => {
  try {
    const { userId, avatar_url } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง userId" });
    }

    if (!avatar_url) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง avatar_url" });
    }

    const updated = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { avatar_url, updated_at: new Date() } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้" });
    }

    return res.status(200).json({
      success: true,
      message: "อัปเดตรูปโปรไฟล์สำเร็จ",
      data: { avatar_url: updated.avatar_url }
    });
  } catch (error) {
    console.error("❌ Upload Avatar Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const updateMealWaterSettings = async (req, res) => {
  try {
    const { userId, meals, water_target_ml } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "กรุณาระบุรหัสผู้ใช้" });
    }

    // ==========================================
    // 1. อัปเดตตารางหลัก (Users)
    // ==========================================
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { 
        $set: { 
          "meal_settings.meals_per_day": meals.length,
          "meal_settings.schedules": meals, 
          "water_target_ml": water_target_ml 
        } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "ไม่พบข้อมูลผู้ใช้ในระบบ" });
    }

    // ==========================================
    // 2. จัดการแจ้งเตือน (NotificationSettings)
    // ==========================================
    // ล้างของเก่าที่เป็น type: "meal" ของยูสเซอร์นี้
    await NotificationSetting.deleteMany({ user_id: userId, type: "meal" });

    // สร้างลิสต์ของใหม่เฉพาะมื้อที่ notify: true
    const notificationDocs = [];
    meals.forEach((meal) => {
      if (meal.notify) {
        notificationDocs.push({
          user_id: userId,
          type: "meal",
          title: `🍽️ ได้เวลามื้อ${meal.name}แล้ว! (${meal.time} น.)`,
          message: `อย่าลืมทานอาหารให้ครบ 5 หมู่ และบันทึกเมนูของคุณเข้าระบบนะ`,
          isRead: false
        });
      }
    });

    if (notificationDocs.length > 0) {
      await NotificationSetting.insertMany(notificationDocs);
    }

    // ==========================================
    // 3. อัปเดตเป้าหมายน้ำดื่มของ "วันนี้" (WaterLogs)
    // ==========================================
    // หาวันที่ปัจจุบันในฟอร์แมต YYYY-MM-DD อิงตาม Timezone ที่ใช้งาน
    // ตัวอย่างการสร้าง String วันที่ เช่น "2026-03-26"
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; 

    // อัปเดตเป้าหมายน้ำของวันนี้ (ถ้าวันนี้ยังไม่มี log ก็ไม่เป็นไร ระบบจะได้ไม่พัง ใช้ findOneAndUpdate)
    await WaterLog.findOneAndUpdate(
      { user_id: userId, date: todayString },
      { $set: { target_ml: water_target_ml } }
    );

    // ==========================================
    // 4. ส่งสถานะความสำเร็จกลับไปหน้าบ้าน
    // ==========================================
    return res.status(200).json({ 
      success: true, 
      message: "อัปเดตแผนมื้ออาหาร น้ำดื่ม แจ้งเตือน และเป้าหมายของวันนี้สำเร็จ" 
    });

  } catch (error) {
    console.error("❌ Update Meal/Water Settings Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getMealSettings,
  getUserProfile,
  updateUserProfile, 
  changePassword,
  updateUserGoal,
  updateUserActivity,
  updateUserAllergies,
  updateUserDislikedFoods,
  updateUserInterestedCuisines,
  updateMealWaterSettings,
  uploadAvatar
};