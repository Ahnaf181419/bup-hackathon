/**
 * Deterministic BACKUP interpreter. Used only when the LLM is unavailable or returns an
 * interpretation the guardrails reject. It never guesses: if it cannot find a clear hour
 * window and value, it returns no_op rather than inventing a directive.
 *
 * Output is in the LLM intermediate format and still goes through the guardrails.
 */

const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
};
const WORD_RE = Object.keys(WORD_NUMBERS).join("|");

const FRACTIONS = [
  [/\bthree[- ]quarters?\b/, 0.75],
  [/\btwo[- ]thirds?\b/, 2 / 3],
  [/\b(?:one[- ]|a[- ])?third\b/, 1 / 3],
  [/\b(?:one[- ]|a[- ])?quarter\b|\bone[- ]fourth\b/, 0.25],
  [/\b(?:one[- ]|a[- ])?fifth\b/, 0.2],
  [/\b(?:one[- ]|a[- ])?tenth\b/, 0.1],
  [/\bhalf\b/, 0.5],
];

const RE = {
  otherDay: /\b(?:next|last|previous)\s+(?:week|month|year|semester|term|weekend)\b|\btomorrow\b|\byesterday\b/,
  solar: /\bsolar\b|\bpv\b|photovoltaic|\bpanels?\b|\barray\b|irradiance/,
  battery: /batter|\bstorage\b|\bbess\b|state of charge|\bsoc\b/,
  charge: /(?<!dis)charg/,
  discharge: /discharg/,
  grid: /\bgrid\b|\bimports?\b|\bimporting\b|\bfeeder\b|substation|transformer|\butility\b|\bintake\b|\bmains\b/,
  negation:
    /\b(?:no|not|never|disabled?|isolated?|unavailable|prohibit\w*|block\w*|forbid\w*|suspend\w*|paus\w*|offline|cannot|can't|mustn't|don't|avoid|lock\w*|halt\w*|stop\w*|without|out of service|down)\b/,
  cap: /exceed|\bcap\b|capped|\blimit|at most|no more than|not more than|maximum|\bmax\b|or below|or less|\bbelow\b|\bunder\b|up to|ceiling|restrict|constrain/,
  reserve:
    /reserve|\bkeep\b|maintain|preserve|retain|\bhold\b|at least|minimum|\bfloor\b|remain|backup|no less than|stay above|not (?:drop|fall|go) below/,
  reductionCue: /reduc|\bcut\b|\bdrop|lower|decrease|curtail|\blose\b|\bloss\b|down by|fall by/,
  zeroSolar: /\bno solar\b|\bzero\b|completely|fully|entirely|\ball\b.*\b(?:lost|unavailable|offline)/,
  kwh: /(\d+(?:\.\d+)?)\s*(?:kwh|kilowatt[- ]hours?)\b/,
  percent: /(\d+(?:\.\d+)?)\s*(?:%|percent\b)/,
};

// A time token: noon/midnight, "6", "6 pm", "18:00", "6:30 pm". Not a number followed by %/kWh/etc.
const T = String.raw`(noon|midday|midnight|(?<![\d.:])\d{1,2}(?::\d{2})?(?:\s*(?:am|pm))?)(?!\d|\s*(?:%|percent|kwh|kw\b|bdt|minutes?|mins?|hours?|hrs?|x\b))`;
const RANGE_RE = new RegExp(String.raw`${T}\s*(?:to|until|till|til|through|thru|and|-)\s*${T}`, "g");
const DURATION_RE = new RegExp(String.raw`(?:from|starting(?: at)?|beginning(?: at)?|at)\s*${T}\s*for\s*(?:the next\s*)?(\d+)\s*hours?`);

function normalizeText(note) {
  return note
    .toLowerCase()
    .replace(/a\.m\./g, "am")
    .replace(/p\.m\./g, "pm")
    .replace(/[–—]/g, " - ")
    .replace(/\s+/g, " ");
}

/** Replace spelled hour numbers only where they sit in a time expression. */
function spellOutTimes(text) {
  return text
    .replace(new RegExp(String.raw`\b(from|between|at|until|till|to|through|and)\s+(${WORD_RE})\b`, "g"), (_, kw, w) => `${kw} ${WORD_NUMBERS[w]}`)
    .replace(new RegExp(String.raw`\b(${WORD_RE})(\s*(?:am|pm|o'?clock|to|until|till|through|and|-))`, "g"), (_, w, rest) => `${WORD_NUMBERS[w]}${rest}`)
    .replace(new RegExp(String.raw`\bfor\s+(${WORD_RE})\s+hours?`, "g"), (_, w) => `for ${WORD_NUMBERS[w]} hours`)
    .replace(/o'?clock/g, "");
}

function parseToken(tok) {
  const t = tok.trim();
  if (t === "noon" || t === "midday") return { h: 12, mer: "pm", fixed: true };
  if (t === "midnight") return { h: 0, midnight: true, fixed: true };
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  const h = Number(m[1]);
  if (h > 24) return null;
  return { h, mer: m[3] || null, colon: m[2] !== undefined };
}

function to24(h, mer) {
  if (h > 12) return h;
  if (mer === "am") return h === 12 ? 0 : h;
  if (mer === "pm") return h === 12 ? 12 : h + 12;
  return h;
}

function resolveRange(a, b, text) {
  let start;
  let end;
  if (a.midnight) start = 0;
  if (b.midnight) end = 24;

  const flip = (mer) => (mer === "am" ? "pm" : "am");
  const bareA = !a.mer && !a.colon && !a.fixed;
  const bareB = !b.mer && !b.colon && !b.fixed;

  if (end === undefined) {
    if (b.mer) end = to24(b.h, b.mer);
    else if (!bareB) end = b.h;
  }
  if (start === undefined) {
    if (a.mer) start = to24(a.h, a.mer);
    else if (!bareA) start = a.h;
    else if (b.mer) {
      // "1 to 3 pm" -> 13..15 ; "11 to 2 pm" -> 11..14
      const same = to24(a.h, b.mer);
      start = same < end ? same : to24(a.h, flip(b.mer));
    }
  }
  if (end === undefined && a.mer) {
    const same = to24(b.h, a.mer);
    end = same > start ? same : to24(b.h, flip(a.mer));
  }
  if (start === undefined || end === undefined) {
    // Neither side has am/pm: use context words, else read as a 24-hour clock.
    const pmContext = /\b(?:evening|night|afternoon|tonight)\b/.test(text);
    if (start === undefined) start = pmContext && a.h < 12 ? a.h + 12 : a.h;
    if (end === undefined) end = pmContext && b.h < 12 ? b.h + 12 : b.h;
  }
  if (end === 0 && start > 0) end = 24;
  if (start < 0 || start > 23 || end < 0 || end > 24 || start === end) return null;
  return { start_hour: start, end_hour: end };
}

function findWindows(text) {
  const t = spellOutTimes(text);
  const windows = [];
  for (const m of t.matchAll(RANGE_RE)) {
    const a = parseToken(m[1]);
    const b = parseToken(m[2]);
    if (!a || !b) continue;
    const w = resolveRange(a, b, t);
    if (w) windows.push(w);
  }
  if (windows.length === 0) {
    const d = t.match(DURATION_RE);
    if (d) {
      const a = parseToken(d[1]);
      const n = Number(d[2]);
      if (a && n > 0 && n <= 24) {
        const start = a.mer ? to24(a.h, a.mer) : a.midnight ? 0 : a.h;
        if (start >= 0 && start <= 23) windows.push({ start_hour: start, end_hour: (start + n) % 24 });
      }
    }
  }
  return windows;
}

function fractionIn(text) {
  for (const [re, value] of FRACTIONS) if (re.test(text)) return value;
  return null;
}

function solarFraction(text) {
  const pct = text.match(RE.percent);
  const reductionWithPct =
    /(\d+(?:\.\d+)?)\s*(?:%|percent)\s*(?:reduction|lower|less|drop|decrease|cut|loss|curtailment)/.test(text) ||
    /(?:reduc\w*|cut|drop\w*|lower\w*|decreas\w*|curtail\w*|lose|loss of|down)\s*(?:by|of)?\s*(?:about|roughly|around|approximately|nearly)?\s*\d+(?:\.\d+)?\s*(?:%|percent)/.test(text);
  if (pct) {
    const p = Number(pct[1]);
    return reductionWithPct ? 1 - p / 100 : p / 100;
  }
  const frac = fractionIn(text);
  if (frac !== null) {
    const reducedByFraction = /(?:reduc\w*|cut|drop\w*|lower\w*|decreas\w*|lose|loss of|down)\s*(?:by|of)?\s*(?:about|roughly|around)?\s*(?:a|one|two|three)?[- ]?(?:half|third|quarter|fifth|tenth|fourth)/.test(text);
    return reducedByFraction ? 1 - frac : frac;
  }
  if (RE.zeroSolar.test(text)) return 0;
  return null;
}

function interpretOne(note) {
  const text = normalizeText(note);
  const windows = findWindows(text);
  const energyRelated =
    RE.solar.test(text) || RE.battery.test(text) || RE.charge.test(text) || RE.discharge.test(text) || RE.grid.test(text);

  if (!energyRelated || RE.otherDay.test(text)) {
    return { directive_type: "no_op", explanation: "No dispatch-relevant constraint for this operating day (fallback parser)." };
  }
  if (windows.length === 0) {
    return { directive_type: "no_op", explanation: "No clear hour window could be identified (fallback parser)." };
  }

  const kwh = text.match(RE.kwh);
  const pct = text.match(RE.percent);

  if (RE.solar.test(text) && !RE.battery.test(text)) {
    const f = solarFraction(text);
    if (f !== null) {
      return { directive_type: "solar_reduction", windows, usable_solar_fraction: Math.max(0, Math.min(1, f)) };
    }
  }

  if (RE.grid.test(text) && RE.cap.test(text) && kwh) {
    return { directive_type: "max_grid_window", windows, max_grid_kwh: Number(kwh[1]) };
  }

  if (RE.battery.test(text) && RE.reserve.test(text)) {
    if (kwh) return { directive_type: "minimum_battery_reserve", windows, reserve_kwh: Number(kwh[1]) };
    if (pct) return { directive_type: "minimum_battery_reserve", windows, reserve_percent_of_capacity: Number(pct[1]) };
    const frac = fractionIn(text);
    if (frac !== null && /capacity|full|battery/.test(text)) {
      return { directive_type: "minimum_battery_reserve", windows, reserve_percent_of_capacity: frac * 100 };
    }
  }

  if (RE.discharge.test(text) && RE.negation.test(text)) {
    return { directive_type: "no_discharge_window", windows };
  }
  if (RE.charge.test(text) && RE.negation.test(text)) {
    return { directive_type: "no_charge_window", windows };
  }

  return { directive_type: "no_op", explanation: "No supported directive recognized (fallback parser)." };
}

export function parseNotesDeterministically(notes) {
  return notes.map((note, index) => ({ note_index: index, ...interpretOne(note) }));
}
