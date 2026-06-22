const express = require("express");
const router = express.Router();

// 1. ดึงฟังก์ชันทั้งหมดมารวมกันในปีกกาให้ครบถ้วนอย่างถูกต้อง
const { 
    getMealSettings, 
    getUserProfile, 
    updateUserProfile,
    changePassword,
    updateUserGoal,
    updateUserActivity,
    updateUserAllergies,
    updateUserDislikedFoods,
    updateUserInterestedCuisines,
    updateMealWaterSettings
} = require("../controllers/userController");

// 2. เรียกใช้งานชื่อฟังก์ชันที่ดึงมาตรง ๆ ได้เลย (ห้ามใส่ userController. นำหน้า)
router.get("/:uid/meal-settings", getMealSettings);
router.get('/profile', getUserProfile);

router.put('/update-profile', updateUserProfile); // 👈 แก้ไข
router.put('/change-password', changePassword);   // 👈 แก้ไข
router.put('/update-goal', updateUserGoal);       // 👈 แก้ไข
router.put('/update-activity', updateUserActivity); // 👈 แก้ไข (ใช้ได้แน่นอน!)
router.put('/update-allergies', updateUserAllergies); // 👈 แก้ไข
router.put('/update-disliked-foods', updateUserDislikedFoods); // 👈 แก้ไข
router.put('/update-interested-cuisines', updateUserInterestedCuisines); // 👈 แก้ไข
router.put('/update-meal-water-settings', updateMealWaterSettings); // 👈 แก้ไข

module.exports = router;