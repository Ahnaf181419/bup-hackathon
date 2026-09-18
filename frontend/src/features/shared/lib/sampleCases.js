import casesData from "./sampleCases.json";

export const SAMPLE_CASES = casesData;

export function getSampleCases() {
  return SAMPLE_CASES.map((c) => ({
    id: c.id,
    label: c.label || c.id,
    notesCount: c.input.operator_notes.length,
    totalDemand: c.input.hours.reduce((acc, h) => acc + h.demand_kwh, 0),
    totalSolar: c.input.hours.reduce((acc, h) => acc + h.solar_kwh, 0),
    batteryCapacity: c.input.battery.capacity_kwh,
    refCost: c.expected_output ? c.expected_output.total_cost_bdt : null,
  }));
}

export function getSampleCaseById(id) {
  return SAMPLE_CASES.find((c) => c.id === id) || SAMPLE_CASES[0];
}
