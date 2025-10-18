export const BUSINESS_RULES_TEXT = `
Business rules (must be followed):
1) MBI is NOT available to trucks or racing cars.
2) Comprehensive Car Insurance is ONLY available to vehicles < 10 years old.
`;

export function violatesRules(rec, facts) {
  const name = (rec?.name || "").toLowerCase();
  const type = (facts?.vehicleType || "").toLowerCase();

  if (name.includes("mechanical breakdown")) {
    if (type.includes("truck") || facts?.isRacingCar) return true;
  }

  if (name.includes("comprehensive")) {
    const age = Number(facts?.vehicleAgeYears);
    if (!Number.isNaN(age) && age >= 10) return true;
  }
  return false;
}
