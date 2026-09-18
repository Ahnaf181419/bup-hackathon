import mongoose from "mongoose";

const DirectiveInterpretationSchema = new mongoose.Schema(
  {
    note_index: { type: Number, required: true },
    applies: { type: Boolean, required: true },
    directive_type: {
      type: String,
      required: true,
      enum: [
        "solar_reduction",
        "minimum_battery_reserve",
        "no_charge_window",
        "no_discharge_window",
        "max_grid_window",
        "no_op",
      ],
    },
    structured_adjustment: { type: mongoose.Schema.Types.Mixed, default: null },
    explanation: { type: String, default: "" },
  },
  { _id: false }
);

const HourlyPlanEntrySchema = new mongoose.Schema(
  {
    hour: { type: Number, required: true, min: 0, max: 23 },
    grid_kwh: { type: Number, required: true, min: 0 },
    solar_used_kwh: { type: Number, required: true, min: 0 },
    battery_action: {
      type: String,
      required: true,
      enum: ["charge", "discharge", "idle"],
    },
    battery_kwh: { type: Number, required: true, min: 0 },
    battery_energy_after_kwh: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const OptimizationResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    scenario_id: { type: String, required: true, index: true },
    directive_interpretation: {
      type: [DirectiveInterpretationSchema],
      required: true,
    },
    hourly_plan: {
      type: [HourlyPlanEntrySchema],
      required: true,
      validate: {
        validator: (val) => val.length === 24,
        message: "hourly_plan must contain exactly 24 entries",
      },
    },
    total_grid_kwh: { type: Number, required: true },
    total_cost_bdt: { type: Number, required: true },
    peak_grid_kwh: { type: Number, required: true },
    plan_summary: { type: String, default: "" },
    status: {
      type: String,
      enum: ["optimal", "feasible", "infeasible", "error"],
      default: "optimal",
    },
    processingTimeMs: { type: Number, default: 0 },
    scenario_input: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

OptimizationResultSchema.index({ userId: 1, createdAt: -1 });

export const OptimizationResult =
  mongoose.models.OptimizationResult ||
  mongoose.model("OptimizationResult", OptimizationResultSchema);
