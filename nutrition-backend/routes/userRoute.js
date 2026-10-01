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
    updateMealWaterSettings,
    uploadAvatar,
    getUserAllergies,
    saveUserAllergies,
    deleteUserAllergy,
    updateProfilePicture
} = require("../controllers/userController");

// 2. เรียกใช้งานชื่อฟังก์ชันที่ดึงมาตรง ๆ ได้เลย (ห้ามใส่ userController. นำหน้า)
router.get("/:uid/meal-settings", getMealSettings);
router.get('/profile', getUserProfile);

router.put('/update-profile', updateUserProfile);
router.put('/change-password', changePassword);
router.put('/update-goal', updateUserGoal);
router.put('/update-activity', updateUserActivity);
router.put('/update-allergies', updateUserAllergies);
router.put('/update-disliked-foods', updateUserDislikedFoods);
router.put('/update-interested-cuisines', updateUserInterestedCuisines);
router.put('/update-meal-water-settings', updateMealWaterSettings);
router.put('/upload-avatar', uploadAvatar);
router.put('/profile-picture', updateProfilePicture);

// Allergy CRUD
router.get('/allergies', getUserAllergies);
router.put('/allergies', saveUserAllergies);
router.delete('/allergies', deleteUserAllergy);

module.exports = router;