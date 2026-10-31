const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authenticateUser");

// 1. ดึงฟังก์ชันทั้งหมดมารวมกันในปีกกาให้ครบถ้วนอย่างถูกต้อง
const { 
    getMealSettings, 
    getUserProfile, 
    updateUserProfile,
    changePassword,
    updateUserGoal,
    updateUserActivity,
    updateUserDislikedFoods,
    updateUserInterestedCuisines,
    updateMealWaterSettings,
    updateWaterTarget,
    uploadAvatar,
    getUserAllergies,
    saveUserAllergies,
    deleteUserAllergy,
    updateProfilePicture,
    saveUserDislikes,
    getUserDislikes,
} = require("../controllers/userController");

// 2. เรียกใช้งานชื่อฟังก์ชันที่ดึงมาตรง ๆ ได้เลย (ห้ามใส่ userController. นำหน้า)
router.get("/:uid/meal-settings", getMealSettings);
router.get('/profile', getUserProfile);

router.put('/update-profile', authenticateUser, updateUserProfile);
router.put('/change-password', authenticateUser, changePassword);
router.put('/update-goal', updateUserGoal);
router.put('/update-activity', updateUserActivity);
router.put('/update-disliked-foods', updateUserDislikedFoods);
router.put('/update-interested-cuisines', updateUserInterestedCuisines);
router.put('/update-meal-water-settings', updateMealWaterSettings);
router.put('/water-target', updateWaterTarget);
router.put('/upload-avatar', authenticateUser, uploadAvatar);
router.put('/profile-picture', authenticateUser, updateProfilePicture);

// Dislikes CRUD
router.get('/dislikes', getUserDislikes);
router.put('/dislikes', saveUserDislikes);

// Allergy CRUD
router.get('/allergies', getUserAllergies);
router.put('/allergies', saveUserAllergies);
router.delete('/allergies', deleteUserAllergy);

module.exports = router;