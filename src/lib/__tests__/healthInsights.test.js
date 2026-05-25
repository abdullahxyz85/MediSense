import { describe, it, expect } from "vitest";
import { detectRedFlags, calculateRiskAssessment } from "../healthInsights";

describe("detectRedFlags", () => {
  it("detects urgent keywords in latestTracking", () => {
    const onboarding = {};
    const latestTracking = { symptomsNote: "I had chest pain and felt faint" };
    const res = detectRedFlags(onboarding, latestTracking);
    expect(res.found).toBe(true);
    expect(res.matches.some((m) => m.includes("chest pain"))).toBe(true);
  });

  it("returns false when no flags", () => {
    const res = detectRedFlags({}, { symptomsNote: "mild thirst" });
    expect(res.found).toBe(false);
  });
});

describe("calculateRiskAssessment", () => {
  it("marks diabetes-range HbA1c as high risk", () => {
    const onboarding = { measurements: { hba1c: 7 } };
    const latestTracking = {};
    const assessment = calculateRiskAssessment(onboarding, latestTracking);
    expect(assessment.diabetesLevel).toBe("high");
    expect(assessment.urgent).toBe(true);
  });
});
