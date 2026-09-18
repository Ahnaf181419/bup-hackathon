# Database Schemas — MongoDB Collections

> Better Auth manages its own collections (`user`, `session`, `account`, `verification`).  
> This document covers only application-specific schemas.

---

## Collection: `scenarios`

Stores user-saved energy scenarios for reuse in the dashboard.

### Mongoose Schema

```js
const scenarioSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    scenarioId: {
      type: String,
      required: true,
      trim: true,
    },
    operatorNotes: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => v.length >= 1 && v.length <= 3,
        message: "operatorNotes must contain 1-3 entries",
      },
    },
    hours: {
      type: [
        {
          hour: { type: Number, required: true, min: 0, max: 23 },
          demandKwh: { type: Number, required: true, min: 0 },
          solarKwh: { type: Number, required: true, min: 0 },
          tariffBdtPerKwh: { type: Number, required: true, min: 0 },
        },
      ],
      required: true,
      validate: {
        validator: (v) => v.length === 24,
        message: "hours must contain exactly 24 entries",
      },
    },
    battery: {
      capacityKwh: { type: Number, required: true, min: 0 },
      initialEnergyKwh: { type: Number, required: true, min: 0 },
      minimumEnergyKwh: { type: Number, required: true, min: 0 },
      maxChargeKwhPerHour: { type: Number, required: true, min: 0 },
      maxDischargeKwhPerHour: { type: Number, required: true, min: 0 },
    },
  },
  { timestamps: true }
);

// Indexes
scenarioSchema.index({ userId: 1, createdAt: -1 });
scenarioSchema.index({ userId: 1, scenarioId: 1 });
```

### Sample Document

```json
{
  "_id": "6507abc...",
  "userId": "demo-operator",
  "name": "Monday morning peak test",
  "scenarioId": "MY-SCENARIO-001",
  "operatorNotes": [
    "Solar output will drop to about 20% from 1 PM to 3 PM.",
    "Do not charge the battery between 2 PM and 4 PM."
  ],
  "hours": [
    { "hour": 0, "demandKwh": 180, "solarKwh": 0, "tariffBdtPerKwh": 7 },
    { "hour": 1, "demandKwh": 170, "solarKwh": 0, "tariffBdtPerKwh": 6 }
  ],
  "battery": {
    "capacityKwh": 500,
    "initialEnergyKwh": 200,
    "minimumEnergyKwh": 50,
    "maxChargeKwhPerHour": 100,
    "maxDischargeKwhPerHour": 100
  },
  "createdAt": "2026-09-18T12:00:00.000Z",
  "updatedAt": "2026-09-18T12:00:00.000Z"
}
```

---

## Collection: `optimization_results`

Stores every optimization run result for history and analytics.

### Mongoose Schema

```js
const optimizationResultSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    scenarioId: {
      type: String,
      required: true,
    },
    scenarioRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scenario",
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ["success", "error", "infeasible"],
      default: "success",
    },

    // Input snapshot (for replay without needing the scenario)
    inputSnapshot: {
      operatorNotes: [String],
      hours: [
        {
          hour: Number,
          demand_kwh: Number,
          solar_kwh: Number,
          tariff_bdt_per_kwh: Number,
        },
      ],
      battery: {
        capacity_kwh: Number,
        initial_energy_kwh: Number,
        minimum_energy_kwh: Number,
        max_charge_kwh_per_hour: Number,
        max_discharge_kwh_per_hour: Number,
      },
    },

    // LLM interpretation
    directiveInterpretation: [
      {
        noteIndex: { type: Number, required: true },
        applies: { type: Boolean, required: true },
        directiveType: {
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
        structuredAdjustment: {
          type: mongoose.Schema.Types.Mixed,
          default: null,
        },
        explanation: { type: String, default: "" },
      },
    ],

    // Optimized schedule
    hourlyPlan: [
      {
        hour: { type: Number, required: true },
        gridKwh: { type: Number, required: true },
        solarUsedKwh: { type: Number, required: true },
        batteryAction: {
          type: String,
          required: true,
          enum: ["charge", "discharge", "idle"],
        },
        batteryKwh: { type: Number, required: true },
        batteryEnergyAfterKwh: { type: Number, required: true },
      },
    ],

    // Aggregates
    totalGridKwh: { type: Number, default: 0 },
    totalCostBdt: { type: Number, default: 0 },
    peakGridKwh: { type: Number, default: 0 },
    planSummary: { type: String, default: "" },

    // Metadata
    processingTimeMs: { type: Number, default: 0 },
    errorMessage: { type: String, default: null },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
optimizationResultSchema.index({ userId: 1, createdAt: -1 });
optimizationResultSchema.index({ userId: 1, status: 1 });
optimizationResultSchema.index({ scenarioId: 1 });
```

### Sample Document

```json
{
  "_id": "6507def...",
  "userId": "demo-operator",
  "scenarioId": "SAMPLE-01",
  "scenarioRef": null,
  "status": "success",
  "inputSnapshot": {
    "operatorNotes": [
      "Facilities will wash the rooftop solar panels from noon until 2 PM.",
      "The sports office moved next month's registration deadline."
    ],
    "hours": [...],
    "battery": { ... }
  },
  "directiveInterpretation": [
    {
      "noteIndex": 0,
      "applies": true,
      "directiveType": "solar_reduction",
      "structuredAdjustment": { "hours": [12, 13], "factor": 0.25 },
      "explanation": "Solar reduced to 25% during panel cleaning."
    },
    {
      "noteIndex": 1,
      "applies": false,
      "directiveType": "no_op",
      "structuredAdjustment": null,
      "explanation": "Registration deadline doesn't affect energy."
    }
  ],
  "hourlyPlan": [
    {
      "hour": 0,
      "gridKwh": 90,
      "solarUsedKwh": 0,
      "batteryAction": "idle",
      "batteryKwh": 0,
      "batteryEnergyAfterKwh": 300
    }
  ],
  "totalGridKwh": 2850.0,
  "totalCostBdt": 38200.50,
  "peakGridKwh": 205,
  "planSummary": "Discharged battery during peak tariff hours 17-20.",
  "processingTimeMs": 2340,
  "errorMessage": null,
  "createdAt": "2026-09-18T12:00:00.000Z"
}
```

---

## Better Auth Managed Collections

These collections are auto-created and managed by Better Auth. **Do NOT create Mongoose schemas for these.**

| Collection | Purpose | Key Fields |
|---|---|---|
| `user` | User accounts | `_id`, `name`, `email`, `emailVerified`, `image`, `createdAt`, `updatedAt` |
| `verification` | Email/token verification | `_id`, `identifier`, `value`, `expiresAt` |

---

## Index Strategy

| Collection | Index | Purpose |
|---|---|---|
| `scenarios` | `{ userId: 1, createdAt: -1 }` | List user's scenarios sorted by newest |
| `scenarios` | `{ userId: 1, scenarioId: 1 }` | Lookup by user + scenario ID |
| `optimization_results` | `{ userId: 1, createdAt: -1 }` | History listing sorted by newest |
| `optimization_results` | `{ userId: 1, status: 1 }` | Filter by status |
| `optimization_results` | `{ scenarioId: 1 }` | Find results for a scenario |
