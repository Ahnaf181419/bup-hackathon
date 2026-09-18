# API Endpoints — Complete Reference

> **Contract rule**: The frontend MUST use the exact payloads documented here.  
> Backend MUST validate incoming requests against these schemas.  
> Any change to this document must be agreed by both frontend and backend teams.

Base URL (dev): `http://localhost:3001`  
API prefix: `/api` (for authenticated/dashboard endpoints)  
All authenticated endpoints require the session cookie (`credentials: "include"` in fetch).

---

## 1. Health Check

### `GET /health`

**Auth**: None (public, judge-facing)

**Response** `200`:
```json
{
  "status": "ok"
}
```

---

## 2. Energy Optimization (Judge-Facing)

### `POST /optimize-energy`

**Auth**: None (public, judge-facing)  
**Content-Type**: `application/json`  
**Timeout**: 30 seconds max

#### Request Payload

```json
{
  "scenario_id": "GRID-101",
  "operator_notes": [
    "Solar output will drop to about 20% from 1 PM to 3 PM.",
    "Do not charge the battery between 2 PM and 4 PM.",
    "The cafeteria menu changes tomorrow."
  ],
  "hours": [
    {
      "hour": 0,
      "demand_kwh": 180,
      "solar_kwh": 0,
      "tariff_bdt_per_kwh": 7
    }
  ],
  "battery": {
    "capacity_kwh": 500,
    "initial_energy_kwh": 200,
    "minimum_energy_kwh": 50,
    "max_charge_kwh_per_hour": 100,
    "max_discharge_kwh_per_hour": 100
  }
}
```

| Field | Type | Validation |
|---|---|---|
| `scenario_id` | `string` | Required, non-empty |
| `operator_notes` | `string[]` | Required, 1-3 non-empty strings |
| `hours` | `object[]` | Required, exactly 24 entries, unique `hour` 0-23 |
| `hours[].hour` | `integer` | 0-23 |
| `hours[].demand_kwh` | `number` | >= 0, finite |
| `hours[].solar_kwh` | `number` | >= 0, finite |
| `hours[].tariff_bdt_per_kwh` | `number` | >= 0, finite |
| `battery.capacity_kwh` | `number` | > 0, finite |
| `battery.initial_energy_kwh` | `number` | >= `minimum_energy_kwh`, <= `capacity_kwh` |
| `battery.minimum_energy_kwh` | `number` | >= 0, <= `capacity_kwh` |
| `battery.max_charge_kwh_per_hour` | `number` | > 0, finite |
| `battery.max_discharge_kwh_per_hour` | `number` | > 0, finite |

#### Response `200` - Success

```json
{
  "scenario_id": "GRID-101",
  "directive_interpretation": [
    {
      "note_index": 0,
      "applies": true,
      "directive_type": "solar_reduction",
      "structured_adjustment": {
        "hours": [13, 14],
        "factor": 0.2
      },
      "explanation": "Solar panels reduced to 20% from 1 PM to 3 PM."
    },
    {
      "note_index": 1,
      "applies": true,
      "directive_type": "no_charge_window",
      "structured_adjustment": {
        "hours": [14, 15]
      },
      "explanation": "Battery charging blocked from 2 PM to 4 PM."
    },
    {
      "note_index": 2,
      "applies": false,
      "directive_type": "no_op",
      "structured_adjustment": null,
      "explanation": "Cafeteria menu change does not affect energy schedule."
    }
  ],
  "hourly_plan": [
    {
      "hour": 0,
      "grid_kwh": 180,
      "solar_used_kwh": 0,
      "battery_action": "idle",
      "battery_kwh": 0,
      "battery_energy_after_kwh": 200
    }
  ],
  "total_grid_kwh": 3200.5,
  "total_cost_bdt": 45230.75,
  "peak_grid_kwh": 215,
  "plan_summary": "Maximized solar usage during midday, discharged battery during peak tariff hours (17-20), recharged during off-peak overnight."
}
```

#### Response `400` - Malformed Request

```json
{
  "error": "Validation failed",
  "details": [
    { "field": "operator_notes", "message": "Must contain 1-3 non-empty strings" },
    { "field": "hours", "message": "Must contain exactly 24 entries" }
  ]
}
```

#### Response `500` - Internal Error

```json
{
  "error": "Optimization failed. Please retry."
}
```

---

## 3. Authentication (Better Auth Managed)

All auth endpoints are handled by Better Auth at `/api/auth/*`. The frontend uses the Better Auth client SDK.

### `POST /api/auth/sign-up/email`

**Auth**: None

**Payload** (sent by Better Auth client):
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response**: Set-Cookie header with session token + user object.

---

### `POST /api/auth/sign-in/email`

**Auth**: None

**Payload**:
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response**: Set-Cookie header with session token + user object.

---

### `POST /api/auth/sign-out`

**Auth**: Session cookie

**Payload**: None

**Response**: Clears session cookie.

---

### `GET /api/auth/get-session`

**Auth**: Session cookie

**Response**: Current session + user object, or `null` if not authenticated.

---

## 4. User Profile

### `GET /api/users/me` (Auth Required)

**Response** `200`:
```json
{
  "user": {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

**Response** `401`:
```json
{ "error": "Unauthorized" }
```

---

## 5. Scenarios (Dashboard Feature)

### `POST /api/scenarios` (Auth Required)

Save a new scenario for later use.

**Payload**:
```json
{
  "name": "Monday morning peak test",
  "scenarioId": "MY-SCENARIO-001",
  "operatorNotes": [
    "Solar output will drop to about 20% from 1 PM to 3 PM."
  ],
  "hours": [
    { "hour": 0, "demandKwh": 180, "solarKwh": 0, "tariffBdtPerKwh": 7 }
  ],
  "battery": {
    "capacityKwh": 500,
    "initialEnergyKwh": 200,
    "minimumEnergyKwh": 50,
    "maxChargeKwhPerHour": 100,
    "maxDischargeKwhPerHour": 100
  }
}
```

**Response** `201`:
```json
{
  "scenario": {
    "_id": "6507...",
    "userId": "abc123",
    "name": "Monday morning peak test",
    "scenarioId": "MY-SCENARIO-001",
    "operatorNotes": ["..."],
    "hours": [...],
    "battery": {...},
    "createdAt": "2026-09-18T12:00:00Z",
    "updatedAt": "2026-09-18T12:00:00Z"
  }
}
```

---

### `GET /api/scenarios` (Auth Required)

List all scenarios for the current user.

**Query params**:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page |

**Response** `200`:
```json
{
  "scenarios": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### `GET /api/scenarios/:id` (Auth Required)

**Response** `200`:
```json
{ "scenario": { ... } }
```

**Response** `404`:
```json
{ "error": "Scenario not found" }
```

---

### `PUT /api/scenarios/:id` (Auth Required)

**Payload**: Same shape as POST, all fields optional (partial update).

**Response** `200`:
```json
{ "scenario": { ... } }
```

---

### `DELETE /api/scenarios/:id` (Auth Required)

**Response** `200`:
```json
{ "message": "Scenario deleted" }
```

---

## 6. Optimization History (Dashboard Feature)

### `POST /api/energy/optimize` (Auth Required)

Run optimization from the dashboard (saves result to DB).

**Payload**: Same as `POST /optimize-energy` but with camelCase keys:

```json
{
  "scenarioId": "MY-SCENARIO-001",
  "operatorNotes": ["..."],
  "hours": [
    { "hour": 0, "demandKwh": 180, "solarKwh": 0, "tariffBdtPerKwh": 7 }
  ],
  "battery": {
    "capacityKwh": 500,
    "initialEnergyKwh": 200,
    "minimumEnergyKwh": 50,
    "maxChargeKwhPerHour": 100,
    "maxDischargeKwhPerHour": 100
  }
}
```

> The controller internally converts camelCase to snake_case before passing to the same optimization pipeline used by the judge endpoint.

**Response** `200`:
```json
{
  "result": {
    "_id": "6507...",
    "scenarioId": "MY-SCENARIO-001",
    "status": "success",
    "directiveInterpretation": [...],
    "hourlyPlan": [...],
    "totalGridKwh": 3200.5,
    "totalCostBdt": 45230.75,
    "peakGridKwh": 215,
    "planSummary": "...",
    "processingTimeMs": 2340,
    "createdAt": "2026-09-18T12:00:00Z"
  }
}
```

---

### `GET /api/history` (Auth Required)

List optimization run history for the current user.

**Query params**:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | 1 | Page number |
| `limit` | integer | 20 | Results per page |
| `status` | string | (all) | Filter: `"success"`, `"error"`, `"infeasible"` |
| `sortBy` | string | `"createdAt"` | Sort field |
| `sortOrder` | string | `"desc"` | `"asc"` or `"desc"` |

**Response** `200`:
```json
{
  "results": [
    {
      "_id": "6507...",
      "scenarioId": "MY-SCENARIO-001",
      "status": "success",
      "totalCostBdt": 45230.75,
      "totalGridKwh": 3200.5,
      "processingTimeMs": 2340,
      "createdAt": "2026-09-18T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

---

### `GET /api/history/:id` (Auth Required)

Get full optimization result detail.

**Response** `200`:
```json
{
  "result": {
    "_id": "6507...",
    "scenarioId": "MY-SCENARIO-001",
    "status": "success",
    "inputSnapshot": { ... },
    "directiveInterpretation": [...],
    "hourlyPlan": [...],
    "totalGridKwh": 3200.5,
    "totalCostBdt": 45230.75,
    "peakGridKwh": 215,
    "planSummary": "...",
    "processingTimeMs": 2340,
    "createdAt": "2026-09-18T12:00:00Z"
  }
}
```

---

## 7. Dashboard Stats

### `GET /api/dashboard/stats` (Auth Required)

**Response** `200`:
```json
{
  "stats": {
    "totalRuns": 42,
    "successfulRuns": 38,
    "failedRuns": 4,
    "averageCostBdt": 43500.25,
    "bestCostBdt": 38200.50,
    "averageProcessingTimeMs": 2100,
    "totalSavedScenarios": 5
  }
}
```

---

## 8. AI Chat (General Purpose)

### `POST /api/ai/generate` (Auth Required)

**Payload**:
```json
{
  "prompt": "Explain what solar_reduction directive does"
}
```

**Response** `200`:
```json
{
  "result": "The solar_reduction directive reduces the usable solar energy..."
}
```

---

## Status Code Summary

| Code | When |
|---|---|
| `200` | Success |
| `201` | Resource created |
| `400` | Malformed request / validation error |
| `401` | Not authenticated |
| `403` | Authenticated but not authorized |
| `404` | Resource not found |
| `422` | Semantically invalid (optional) |
| `429` | Rate limited |
| `500` | Internal error |
