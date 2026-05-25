function mapDailyTracking(dailyTrackingMap = {}) {
  return Object.entries(dailyTrackingMap)
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))
    .map(([date, entry]) => ({ date, ...entry }));
}

function formatValue(value, fallback = "Not set") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return String(value);
}

function sectionLines(title, items) {
  const filteredItems = items.filter(Boolean);
  return filteredItems.length > 0
    ? [`${title}:`, ...filteredItems.map((item) => `- ${item}`)]
    : [];
}

export function buildExportPayload({ authUser, userRecord }) {
  const onboardingProfile = userRecord?.onboardingProfile || null;
  const dailyTracking = mapDailyTracking(userRecord?.dailyTracking || {});

  return {
    exportedAt: new Date().toISOString(),
    user: {
      uid: authUser?.uid || "",
      email: authUser?.email || "",
      displayName: authUser?.displayName || "",
      providerIds:
        authUser?.providerData?.map((provider) => provider.providerId) || [],
    },
    profileComplete: Boolean(userRecord?.profileComplete),
    onboardingProfile,
    dailyTracking,
    latestTrackingDate: dailyTracking.at(-1)?.date || "",
  };
}

export function buildClinicianSummary({ authUser, userRecord, assessment }) {
  const onboardingProfile = userRecord?.onboardingProfile || {};
  const dailyTracking = mapDailyTracking(userRecord?.dailyTracking || {});
  const latestTracking = dailyTracking.at(-1) || null;

  const profileLines = [
    `Name: ${formatValue(onboardingProfile.preferredName || authUser?.displayName || authUser?.email)}`,
    `Age: ${formatValue(onboardingProfile.age)}`,
    `Sex at birth: ${formatValue(onboardingProfile.sexAtBirth)}`,
    `Location: ${formatValue(onboardingProfile.countryRegion || onboardingProfile.locationType)}`,
    `Clinic access: ${formatValue(onboardingProfile.clinicAccess)}`,
    `Activity level: ${formatValue(onboardingProfile.activityLevel)}`,
  ];

  const latestTrackingLines = latestTracking
    ? [
        `Date: ${formatValue(latestTracking.date)}`,
        `Water: ${formatValue(latestTracking.waterLiters)} L`,
        `Meals: ${formatValue(latestTracking.mealsCount)}`,
        `Sleep: ${formatValue(latestTracking.sleepHours)} h`,
        `Activity: ${formatValue(latestTracking.activityMinutes)} min`,
        `Mood: ${formatValue(latestTracking.mood)}`,
        `Energy: ${formatValue(latestTracking.energyLevel)}`,
        `Stress: ${formatValue(latestTracking.stressLevel)}`,
        `Symptoms note: ${formatValue(latestTracking.symptomsNote)}`,
        `Notes: ${formatValue(latestTracking.notes)}`,
      ]
    : ["No daily tracking entry saved yet."];

  const urgentLine = assessment?.urgent
    ? `Urgent review advised: yes${assessment?.urgentMatches?.length ? ` (${assessment.urgentMatches.join(", ")})` : ""}`
    : "Urgent review advised: no";

  const sections = [
    "MediSense clinician summary",
    `Exported at: ${new Date().toISOString()}`,
    `Patient ID: ${formatValue(authUser?.uid)}`,
    `Email: ${formatValue(authUser?.email)}`,
    `Profile complete: ${userRecord?.profileComplete ? "yes" : "no"}`,
    "",
    ...sectionLines("Patient profile", profileLines),
    "",
    ...sectionLines("Latest daily tracking", latestTrackingLines),
    "",
    ...sectionLines("Screening assessment", [
      `Overall level: ${formatValue(assessment?.overallLevel)}`,
      `Diabetes risk: ${formatValue(assessment?.diabetesLevel)} (score ${formatValue(assessment?.diabetesScore)})`,
      `Calcium risk: ${formatValue(assessment?.calciumLevel)} (score ${formatValue(assessment?.calciumScore)})`,
      urgentLine,
    ]),
    "",
    ...sectionLines("Key diabetes reasons", assessment?.diabetesReasons || []),
    "",
    ...sectionLines("Key calcium reasons", assessment?.calciumReasons || []),
    "",
    ...sectionLines("Suggested next steps", [
      ...(assessment?.diabetesNextSteps || []).map(
        (step) => `Diabetes: ${step}`,
      ),
      ...(assessment?.calciumNextSteps || []).map((step) => `Calcium: ${step}`),
    ]),
    "",
    "Note: This summary is for clinician discussion and does not diagnose or replace medical review.",
  ];

  return sections.join("\n");
}
