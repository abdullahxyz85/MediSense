import { describe, expect, it } from "vitest";
import { buildClinicianSummary, buildExportPayload } from "../privacyTools";

describe("buildExportPayload", () => {
  it("sorts tracking entries and includes user metadata", () => {
    const payload = buildExportPayload({
      authUser: {
        uid: "user-123",
        email: "person@example.com",
        displayName: "Person",
        providerData: [{ providerId: "password" }],
      },
      userRecord: {
        profileComplete: true,
        onboardingProfile: { preferredName: "Person" },
        dailyTracking: {
          "2026-05-03": { mood: "good" },
          "2026-05-01": { mood: "tired" },
        },
      },
    });

    expect(payload.user.uid).toBe("user-123");
    expect(payload.profileComplete).toBe(true);
    expect(payload.dailyTracking).toEqual([
      { date: "2026-05-01", mood: "tired" },
      { date: "2026-05-03", mood: "good" },
    ]);
    expect(payload.latestTrackingDate).toBe("2026-05-03");
  });
});

describe("buildClinicianSummary", () => {
  it("formats a readable clinician-facing summary", () => {
    const summary = buildClinicianSummary({
      authUser: {
        uid: "user-123",
        email: "person@example.com",
        displayName: "Person",
      },
      userRecord: {
        profileComplete: true,
        onboardingProfile: {
          preferredName: "Person",
          age: 34,
          sexAtBirth: "Female",
          countryRegion: "India",
          clinicAccess: "Yes",
          activityLevel: "Low",
        },
        dailyTracking: {
          "2026-05-03": {
            waterLiters: 2,
            symptomsNote: "frequent urination",
          },
        },
      },
      assessment: {
        overallLevel: "high",
        diabetesLevel: "high",
        diabetesScore: 5,
        calciumLevel: "low",
        calciumScore: 0,
        urgent: true,
        urgentMatches: ["frequent urination"],
        diabetesReasons: ["HbA1c is in the diabetes range (7)"],
        calciumReasons: [],
        diabetesNextSteps: ["Arrange in-person medical review soon"],
        calciumNextSteps: ["Keep logging daily data"],
      },
    });

    expect(summary).toContain("MediSense clinician summary");
    expect(summary).toContain("Overall level: high");
    expect(summary).toContain("Urgent review advised: yes");
    expect(summary).toContain("Patient profile:");
    expect(summary).toContain("Latest daily tracking:");
    expect(summary).toContain("Suggested next steps:");
  });
});
