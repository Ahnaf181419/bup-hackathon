import mongoose from "mongoose";

const HourSchema = new mongoose.Schema(
  {
    hour: { type: Number, required: true, min: 0, max: 23 },
    demandKwh: { type: Number, required: true, min: 0 },
    solarKwh: { type: Number, required: true, min: 0 },
    tariffBdtPerKwh: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const BatteryConfigSchema = new mongoose.Schema(
  {
    capacityKwh: { type: Number, required: true, min: 0 },
    initialEnergyKwh: { type: Number, required: true, min: 0 },
    minimumEnergyKwh: { type: Number, required: true, min: 0 },
    maxChargeKwhPerHour: { type: Number, required: true, min: 0 },
    maxDischargeKwhPerHour: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const ScenarioSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    scenarioId: { type: String, required: true, trim: true },
    label: { type: String, trim: true, default: "" },
    description: { type: String, trim: true, default: "" },
    operatorNotes: {
      type: [String],
      validate: {
        validator: (val) => val.length >= 1 && val.length <= 3,
        message: "operatorNotes must contain between 1 and 3 items",
      },
      required: true,
    },
    hours: {
      type: [HourSchema],
      validate: {
        validator: (val) => val.length === 24,
        message: "hours must contain exactly 24 entries (0-23)",
      },
      required: true,
    },
    battery: {
      type: BatteryConfigSchema,
      required: true,
    },
  },
  { timestamps: true }
);

ScenarioSchema.index({ userId: 1, scenarioId: 1 });

export const Scenario = mongoose.models.Scenario || mongoose.model("Scenario", ScenarioSchema);
