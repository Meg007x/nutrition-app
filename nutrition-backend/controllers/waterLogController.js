const WaterLog = require("../models/WaterLog");
const User = require("../models/User"); // ถ้าไฟล์ชื่ออื่น ให้แก้ตามจริง

const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getCurrentTimeString = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
};

const normalizeContainerType = (value) => {
  if (value === "bottle") return "bottle";
  return "glass";
};

const resolveWaterTarget = async (userId) => {
  try {
    const user = await User.findOne({ user_id: userId }).lean();

    if (!user) return 2000;

    if (typeof user.water_target_ml === "number") {
      return user.water_target_ml;
    }

    if (
      user.health_goals &&
      typeof user.health_goals.water_target_ml === "number"
    ) {
      return user.health_goals.water_target_ml;
    }

    return 2000;
  } catch (error) {
    return 2000;
  }
};

exports.getDailyWaterLog = async (req, res) => {
  try {
    const { userId } = req.params;
    const date = req.query.date || getTodayDateString();

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "กรุณาระบุ userId",
      });
    }

    let doc = await WaterLog.findOne({
      user_id: userId,
      date,
    }).lean();

    if (!doc) {
      const target_ml = await resolveWaterTarget(userId);

      doc = {
        user_id: userId,
        date,
        target_ml,
        total_drank_ml: 0,
        records: [],
      };
    }

    return res.json({
      success: true,
      waterLog: doc,
    });
  } catch (error) {
    console.error("getDailyWaterLog error:", error);
    return res.status(500).json({
      success: false,
      error: "ไม่สามารถดึงข้อมูลการดื่มน้ำได้",
    });
  }
};

exports.addWaterRecord = async (req, res) => {
  try {
    const { user_id, date, amount_ml, time, container_type } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: "กรุณาระบุ user_id",
      });
    }

    const safeDate = date || getTodayDateString();
    const safeTime = time || getCurrentTimeString();
    const safeAmount = Number(amount_ml);
    const safeContainerType = normalizeContainerType(container_type);

    if (!safeAmount || safeAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "amount_ml ต้องมากกว่า 0",
      });
    }

    const target_ml = await resolveWaterTarget(user_id);

    let doc = await WaterLog.findOne({
      user_id,
      date: safeDate,
    });

    if (!doc) {
      doc = await WaterLog.create({
        user_id,
        date: safeDate,
        target_ml,
        total_drank_ml: safeAmount,
        records: [
          {
            time: safeTime,
            amount_ml: safeAmount,
            container_type: safeContainerType,
          },
        ],
      });
    } else {
      doc.records.unshift({
        time: safeTime,
        amount_ml: safeAmount,
        container_type: safeContainerType,
      });

      doc.total_drank_ml =
        Number(doc.total_drank_ml || 0) + Number(safeAmount);

      if (!doc.target_ml || doc.target_ml <= 0) {
        doc.target_ml = target_ml;
      }

      await doc.save();
    }

    return res.status(201).json({
      success: true,
      message: "บันทึกการดื่มน้ำเรียบร้อยแล้ว",
      waterLog: doc,
    });
  } catch (error) {
    console.error("addWaterRecord error:", error);
    return res.status(500).json({
      success: false,
      error: "ไม่สามารถบันทึกการดื่มน้ำได้",
    });
  }
};

exports.deleteWaterRecord = async (req, res) => {
try {
const { userId, date, index } = req.params;

if (!userId || !date || index === undefined) {
  return res.status(400).json({
    success: false,
    error: "ข้อมูลไม่ครบ",
  });
}

const recordIndex = Number(index);

if (Number.isNaN(recordIndex) || recordIndex < 0) {
  return res.status(400).json({
    success: false,
    error: "index ไม่ถูกต้อง",
  });
}

const doc = await WaterLog.findOne({
  user_id: userId,
  date,
});

if (!doc) {
  return res.status(404).json({
    success: false,
    error: "ไม่พบข้อมูลการดื่มน้ำของวันนี้",
  });
}

if (!doc.records[recordIndex]) {
  return res.status(404).json({
    success: false,
    error: "ไม่พบรายการที่ต้องการลบ",
  });
}

const removedAmount = Number(doc.records[recordIndex].amount_ml || 0);

doc.records.splice(recordIndex, 1);

// บรรทัดนี้คือส่วนที่เพิ่มเข้ามาเพื่อให้ Mongoose ยอมบันทึกการลบข้อมูลใน Array
doc.markModified("records");

doc.total_drank_ml = Math.max(
  0,
  Number(doc.total_drank_ml || 0) - removedAmount
);

await doc.save();

return res.json({
  success: true,
  message: "ลบรายการน้ำดื่มเรียบร้อยแล้ว",
  waterLog: doc,
});
} catch (error) {
console.error("deleteWaterRecord error:", error);
return res.status(500).json({
success: false,
error: "ไม่สามารถลบรายการน้ำดื่มได้",
});
}
};

exports.updateTargetWater = async (req, res) => {
  try {
    const { userId, date } = req.params;
    const { target_ml } = req.body;

    const safeTarget = Number(target_ml);

    if (!userId || !date) {
      return res.status(400).json({
        success: false,
        error: "ข้อมูลไม่ครบ",
      });
    }

    if (!safeTarget || safeTarget <= 0) {
      return res.status(400).json({
        success: false,
        error: "target_ml ต้องมากกว่า 0",
      });
    }

    let doc = await WaterLog.findOne({
      user_id: userId,
      date,
    });

    if (!doc) {
      doc = await WaterLog.create({
        user_id: userId,
        date,
        target_ml: safeTarget,
        total_drank_ml: 0,
        records: [],
      });
    } else {
      doc.target_ml = safeTarget;
      await doc.save();
    }

    return res.json({
      success: true,
      message: "อัปเดตเป้าหมายน้ำเรียบร้อยแล้ว",
      waterLog: doc,
    });
  } catch (error) {
    console.error("updateTargetWater error:", error);
    return res.status(500).json({
      success: false,
      error: "ไม่สามารถอัปเดตเป้าหมายน้ำได้",
    });
  }
};