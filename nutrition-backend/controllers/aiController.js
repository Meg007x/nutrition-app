// 1. เปลี่ยนจาก import เป็น require ตามสไตล์ Node.js
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// 2. ตั้งค่า AI ด้วยกุญแจของเรา (ใช้ SDK ตัวใหม่)
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

exports.testAI = async (req, res) => {
  console.log("⏳ กำลังเรียก Gemini 3 Flash Preview...");

  try {
    // 3. ใช้ชื่อ Model ที่ถูกต้องเป๊ะๆ ตามที่คุณเจอมา
    const model = 'gemini-3-flash-preview';
    
    // 4. คำถามที่เราจะถามมัน
    const contents = "สวัสดี ขอคำคมสั้นๆ 1 ประโยคสำหรับคนทำแอปพลิเคชันหน่อย";

    // 5. สั่งรัน! (ผมปรับจาก Stream ให้เป็นแบบรอรับคำตอบรวดเดียวจบ เพื่อให้ส่งกลับไปหน้าเว็บง่ายๆ)
    const response = await ai.models.generateContent({
      model: model,
      contents: contents,
      // ใส่ config ตามที่คุณก๊อปมาได้เลย (ผมเอา Search ออกก่อนเพื่อให้มันเทสได้ไวๆ)
      config: {
        thinkingConfig: {
          thinkingLevel: "HIGH", // ให้มันคิดลึกๆ
        },
      }
    });

    console.log("✅ AI ตอบกลับมาว่า:\n", response.text);

    // 6. ส่งคำตอบกลับไปหาเบราว์เซอร์/Postman
    res.status(200).json({
      success: true,
      data: response.text
    });

  } catch (error) {
    console.error("❌ พังครับ Error:", error);
    res.status(500).json({
      success: false,
      message: "เรียก AI ไม่สำเร็จ",
      error: error.message
    });
  }
};