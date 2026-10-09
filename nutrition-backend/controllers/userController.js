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

const updateUserAllergies = async (req, res) => {
  try {
    const { userId, allergies } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: "ไม่มีรหัสผู้ใช้" });
    }

    // Build atomic $set for each category to avoid full-document replacement
    const setOps = {};
    if (allergies && typeof allergies === 'object') {
      if (allergies.veg !== undefined) setOps["allergies.veg"] = allergies.veg;
      if (allergies.condiment !== undefined) setOps["allergies.condiment"] = allergies.condiment;
      if (allergies.meat !== undefined) setOps["allergies.meat"] = allergies.meat;
      if (allergies.other !== undefined) setOps["allergies.other"] = allergies.other;
    }

    if (Object.keys(setOps).length === 0) {
      return res.status(400).json({ success: false, message: "ไม่มีข้อมูล allergies ที่ต้องอัปเดต" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: setOps },
      { new: true, runValidators: false }
    );

    if (!updatedUser) return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });

    return res.status(200).json({ success: true, message: "อัปเดตอาหารที่แพ้สำเร็จ", data: updatedUser.allergies });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
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

// ==========================================
// GET /api/user/allergies?userId=xxx
// ดึงข้อมูลภูมิแพ้ของผู้ใช้
// ==========================================
const getUserAllergies = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง userId" });
    }

    const user = await User.findOne({ user_id: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }

    // ดึง allergies จาก User document
    const allergies = user.allergies || {};
    // แปลงเป็น flat array สำหรับ frontend
    const allItems = [
      ...(allergies.veg || []),
      ...(allergies.condiment || []),
      ...(allergies.meat || []),
      ...(allergies.other || []),
    ];

    return res.status(200).json({
      success: true,
      data: {
        allergies,
        allItems,
        // v2: structured allergy array
        allergies_v2: user.allergies_v2 || [],
      },
    });
  } catch (error) {
    console.error("❌ Get User Allergies Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PUT /api/users/allergies
// อัปเดตภูมิแพ้ของผู้ใช้ทั้งหมด (atomic $set)
// ==========================================
const saveUserAllergies = async (req, res) => {
  try {
    const { userId, allergies, allergies_v2 } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง userId" });
    }

    const setOps = { updated_at: new Date() };

    // v2: บันทึก allergies_v2 ถ้าส่งมา
    if (Array.isArray(allergies_v2)) {
      setOps.allergies_v2 = allergies_v2;
    }

    if (Array.isArray(allergies)) {
      // Frontend sends flat string[] — clear ALL categories, store all in "other"
      const cleaned = allergies.filter(Boolean).map(String);
      setOps["allergies.veg"] = [];
      setOps["allergies.condiment"] = [];
      setOps["allergies.meat"] = [];
      setOps["allergies.other"] = cleaned;
    } else if (allergies && typeof allergies === "object") {
      const categories = ["veg", "condiment", "meat", "other"];
      for (const cat of categories) {
        if (allergies[cat] !== undefined) {
          setOps[`allergies.${cat}`] = Array.isArray(allergies[cat])
            ? allergies[cat].filter(Boolean).map(String)
            : [];
        }
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: setOps },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }

    return res.status(200).json({
      success: true,
      message: "อัปเดตภูมิแพ้สำเร็จ",
      data: updatedUser.allergies,
      allergies_v2: updatedUser.allergies_v2 || [],
    });
  } catch (error) {
    console.error("❌ Save User Allergies Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// DELETE /api/user/allergies/:itemId
// ลบภูมิแพ้รายการเดียว
// ==========================================
const deleteUserAllergy = async (req, res) => {
  try {
    const { userId, itemName } = req.body;
    const cleanName = String(itemName || "").trim();

    if (!userId || !cleanName) {
      return res.status(400).json({
        success: false,
        message: "กรุณาส่ง userId และ itemName",
      });
    }

    // Verify user exists
    const userBefore = await User.findOne({ user_id: userId });
    if (!userBefore) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }

    // Atomic $pull: remove itemName from every category in one operation
    const categories = ["veg", "condiment", "meat", "other"];
    const pullOps = {};
    for (const cat of categories) {
      pullOps[`allergies.${cat}`] = cleanName;
    }
    // v2: Also remove from allergies_v2 by label match
    const pullV2 = { allergies_v2: { label: cleanName } };

    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      { $pull: { ...pullOps, ...pullV2 }, $set: { updated_at: new Date() } },
      { new: true, runValidators: false }
    );

    // Check if removal actually happened
    const countBefore = categories.reduce(
      (sum, c) => sum + ((userBefore.allergies?.[c]) || []).length, 0
    );
    const countAfter = categories.reduce(
      (sum, c) => sum + ((updatedUser.allergies?.[c]) || []).length, 0
    );

    return res.status(200).json({
      success: true,
      removed: countBefore > countAfter,
      allergies: updatedUser.allergies,
    });
  } catch (error) {
    console.error("❌ Delete User Allergy Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// PUT /api/user/profile-picture
// อัปเดตรูปโปรไฟล์ (base64 หรือ URL)
// ==========================================
const updateProfilePicture = async (req, res) => {
  try {
    const { userId, avatar_url } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง userId" });
    }
    if (!avatar_url) {
      return res.status(400).json({ success: false, message: "กรุณาส่ง avatar_url" });
    }

    // Atomic update: bypass full-document validation to avoid
    // MongoServerError Code 28 (schema mismatch on nested allergies)
    const updatedUser = await User.findOneAndUpdate(
      { user_id: userId },
      {
        $set: {
          avatar_url: avatar_url,
          updated_at: new Date(),
        },
      },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "ไม่พบผู้ใช้" });
    }

    return res.status(200).json({
      success: true,
      message: "อัปเดตรูปโปรไฟล์สำเร็จ",
      data: { avatar_url: updatedUser.avatar_url },
    });
  } catch (error) {
    console.error("❌ Update Profile Picture Error:", error);
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
  uploadAvatar,
  getUserAllergies,
  saveUserAllergies,
  deleteUserAllergy,
  updateProfilePicture,
};