const mongoose = require("mongoose");

const WaterRecordSchema = new mongoose.Schema(
  {
    time: {
      type: String,
      required: true,
      trim: true,
    },
    amount_ml: {
      type: Number,
      required: true,
      min: 1,
    },
    container_type: {
      type: String,
      enum: ["glass", "bottle"],
      default: "glass",
    },
  },
  { _id: false }
);

const WaterLogSchema = new mongoose.Schema(
  {
    user_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    target_ml: {
      type: Number,
      required: true,
      default: 2000,
      min: 0,
    },
    total_drank_ml: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    records: {
      type: [WaterRecordSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: "WaterLogs",
  }
);

WaterLogSchema.index({ user_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("WaterLog", WaterLogSchema);