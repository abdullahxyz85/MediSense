const DIABETES_SYMPTOMS = [
  "thirst",
  "frequent urination",
  "fatigue",
  "weight change",
  "blurry vision",
  "slow healing",
  "tingling",
];

const CALCIUM_SYMPTOMS = [
  "muscle cramps",
  "tingling around mouth",
  "tingling in fingers",
  "constipation",
  "bone pain",
  "nausea",
  "confusion",
];

const URGENT_PATTERNS = [
  "confusion",
  "fainting",
  "seizure",
  "seizures",
  "trouble breathing",
  "chest pain",
  "severe dehydration",
  "unresponsive",
];

import { RED_FLAGS } from "../config/clinicalConfig";

export function detectRedFlags(onboarding = {}, latestTracking = {}) {
  const trackingText =
    `${latestTracking?.symptomsNote || ""} ${latestTracking?.notes || ""}`.toLowerCase();
  const foundInTracking = mergeKeywordMatches(
    [trackingText],
    RED_FLAGS.concat(URGENT_PATTERNS),
  );
  const foundInOnboarding = [];

  // Check onboarding free-text fields if present
  const onboardingText =
    `${onboarding?.notes || ""} ${onboarding?.symptomsNote || ""} ${onboarding?.medicalHistory || ""}`.toLowerCase();
  if (onboardingText) {
    foundInOnboarding.push(
      ...mergeKeywordMatches(
        [onboardingText],
        RED_FLAGS.concat(URGENT_PATTERNS),
      ),
    );
  }

  const matches = Array.from(
    new Set([...foundInTracking, ...foundInOnboarding]),
  );

  return {
    found: matches.length > 0,
    matches,
  };
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasAnyKeyword(text, patterns) {
  const normalized = String(text || "").toLowerCase();
  return patterns.some((pattern) => normalized.includes(pattern));
}

function mergeKeywordMatches(items, patterns) {
  return patterns.filter((pattern) =>
    items.some((item) =>
      String(item || "")
        .toLowerCase()
        .includes(pattern),
    ),
  );
}

function scoreToLevel(score) {
  if (score >= 5) {
    return "high";
  }

  if (score >= 2) {
    return "medium";
  }

  return "low";
}

function buildNextSteps(level, type) {
  const base =
    type === "diabetes"
      ? ["Watch symptoms closely", "Review food, sleep, and activity patterns"]
      : ["Track symptoms closely", "Review hydration and related symptoms"];

  if (level === "high") {
    return [
      "Arrange in-person medical review soon",
      "Repeat or confirm readings with a clinician",
      ...base,
    ];
  }

  if (level === "medium") {
    return ["Continue daily tracking", "Watch for worsening symptoms", ...base];
  }

  return [
    "Keep logging daily data",
    "Use the AI consultation for questions",
    ...base,
  ];
}

export function calculateRiskAssessment(onboarding, latestTracking) {
  const diabetesSymptoms = Array.isArray(onboarding?.diabetesSymptoms)
    ? onboarding.diabetesSymptoms
    : [];
  const calciumSymptoms = Array.isArray(onboarding?.calciumSymptoms)
    ? onboarding.calciumSymptoms
    : [];
  const trackingText =
    `${latestTracking?.symptomsNote || ""} ${latestTracking?.notes || ""}`.toLowerCase();

  const redFlagResult = detectRedFlags(onboarding, latestTracking);

  let diabetesScore = 0;
  const diabetesReasons = [];

  if (onboarding?.familyHistory?.diabetes) {
    diabetesScore += 1;
    diabetesReasons.push("Family history of diabetes");
  }

  if (diabetesSymptoms.length > 0) {
    diabetesScore += Math.min(3, diabetesSymptoms.length);
    diabetesReasons.push(`Onboarding symptoms: ${diabetesSymptoms.join(", ")}`);
  }

  const diabetesKeywordMatches = mergeKeywordMatches(
    [trackingText],
    DIABETES_SYMPTOMS,
  );
  if (diabetesKeywordMatches.length > 0) {
    diabetesScore += 1;
    diabetesReasons.push(
      `Daily tracking mentions: ${diabetesKeywordMatches.join(", ")}`,
    );
  }

  const glucoseValue = toNumber(
    latestTracking?.glucoseReading || onboarding?.measurements?.glucoseReading,
  );
  const hba1cValue = toNumber(onboarding?.measurements?.hba1c);

  if (glucoseValue !== null) {
    if (glucoseValue >= 250) {
      diabetesScore += 5;
      diabetesReasons.push(`Glucose reading is very high (${glucoseValue})`);
    } else if (glucoseValue >= 180) {
      diabetesScore += 3;
      diabetesReasons.push(`Glucose reading is elevated (${glucoseValue})`);
    } else if (glucoseValue >= 140) {
      diabetesScore += 2;
      diabetesReasons.push(`Glucose reading is above ideal (${glucoseValue})`);
    }
  }

  if (hba1cValue !== null) {
    if (hba1cValue >= 6.5) {
      diabetesScore += 5;
      diabetesReasons.push(`HbA1c is in the diabetes range (${hba1cValue})`);
    } else if (hba1cValue >= 5.7) {
      diabetesScore += 2;
      diabetesReasons.push(`HbA1c is in the prediabetes range (${hba1cValue})`);
    }
  }

  if (
    latestTracking?.activityMinutes &&
    Number(latestTracking.activityMinutes) < 20
  ) {
    diabetesScore += 1;
    diabetesReasons.push("Low activity minutes in the latest daily log");
  }

  const diabetesLevel = scoreToLevel(diabetesScore);

  let calciumScore = 0;
  const calciumReasons = [];

  if (onboarding?.familyHistory?.thyroid) {
    calciumScore += 1;
    calciumReasons.push("Family history of thyroid issues");
  }

  if (onboarding?.familyHistory?.kidney) {
    calciumScore += 1;
    calciumReasons.push("Family history of kidney issues");
  }

  if (calciumSymptoms.length > 0) {
    calciumScore += Math.min(3, calciumSymptoms.length);
    calciumReasons.push(`Onboarding symptoms: ${calciumSymptoms.join(", ")}`);
  }

  const calciumKeywordMatches = mergeKeywordMatches(
    [trackingText],
    CALCIUM_SYMPTOMS,
  );
  if (calciumKeywordMatches.length > 0) {
    calciumScore += 1;
    calciumReasons.push(
      `Daily tracking mentions: ${calciumKeywordMatches.join(", ")}`,
    );
  }

  const calciumValue = toNumber(
    latestTracking?.calciumReading || onboarding?.measurements?.calcium,
  );
  const vitaminDValue = toNumber(onboarding?.measurements?.vitaminD);

  if (calciumValue !== null) {
    if (calciumValue < 8.5 || calciumValue > 10.5) {
      calciumScore += 4;
      calciumReasons.push(`Calcium reading is outside range (${calciumValue})`);
    }
  }

  if (vitaminDValue !== null && vitaminDValue < 20) {
    calciumScore += 1;
    calciumReasons.push(`Vitamin D appears low (${vitaminDValue})`);
  }

  if (hasAnyKeyword(trackingText, URGENT_PATTERNS)) {
    calciumScore += 3;
    calciumReasons.push(
      "Urgent symptom words were mentioned in daily tracking",
    );
  }

  if (redFlagResult.found) {
    calciumReasons.push(
      `Red-flag symptoms detected: ${redFlagResult.matches.join(", ")}`,
    );
  }

  const calciumLevel = scoreToLevel(calciumScore);
  const urgent =
    redFlagResult.found || diabetesLevel === "high" || calciumLevel === "high";

  const overallLevel =
    diabetesLevel === "high" || calciumLevel === "high"
      ? "high"
      : diabetesLevel === "medium" || calciumLevel === "medium"
        ? "medium"
        : "low";

  return {
    overallLevel,
    diabetesLevel,
    calciumLevel,
    diabetesScore,
    calciumScore,
    urgent,
    urgentMatches: redFlagResult.matches,
    diabetesReasons,
    calciumReasons,
    diabetesNextSteps: buildNextSteps(diabetesLevel, "diabetes"),
    calciumNextSteps: buildNextSteps(calciumLevel, "calcium"),
    summary:
      overallLevel === "high"
        ? "This screen suggests a high-priority review is worth considering soon."
        : overallLevel === "medium"
          ? "This screen suggests some signals to watch and re-check."
          : "This screen currently looks lower risk, but continue tracking and monitoring symptoms.",
  };
}

function buildBackground(onboarding, latestTracking, assessment) {
  const profileLines = [
    `Preferred name: ${onboarding?.preferredName || "Unknown"}`,
    `Age: ${onboarding?.age || "Unknown"}`,
    `Sex at birth: ${onboarding?.sexAtBirth || "Unknown"}`,
    `Location: ${onboarding?.countryRegion || onboarding?.locationType || "Unknown"}`,
    `Current activity: ${onboarding?.activityLevel || "Unknown"}`,
    `Clinic access: ${onboarding?.clinicAccess || "Unknown"}`,
  ];

  const dailyLines = latestTracking
    ? [
        `Latest daily entry date: ${latestTracking.date || "Unknown"}`,
        `Water intake: ${latestTracking.waterLiters || "Unknown"}`,
        `Meals count: ${latestTracking.mealsCount || "Unknown"}`,
        `Sleep hours: ${latestTracking.sleepHours || "Unknown"}`,
        `Activity minutes: ${latestTracking.activityMinutes || "Unknown"}`,
        `Mood: ${latestTracking.mood || "Unknown"}`,
        `Energy level: ${latestTracking.energyLevel || "Unknown"}`,
        `Stress level: ${latestTracking.stressLevel || "Unknown"}`,
        `Symptoms note: ${latestTracking.symptomsNote || "None"}`,
        `Notes: ${latestTracking.notes || "None"}`,
      ]
    : ["No daily tracking entries have been saved yet."];

  return [
    "Use the following health context only for education and next-step guidance.",
    "Do not diagnose, prescribe, or claim certainty.",
    "Encourage in-person care when urgent symptoms are present.",
    `Overall risk: ${assessment.overallLevel}`,
    `Diabetes risk: ${assessment.diabetesLevel}`,
    `Calcium risk: ${assessment.calciumLevel}`,
    "Profile:",
    ...profileLines.map((line) => `- ${line}`),
    "Latest daily tracking:",
    ...dailyLines.map((line) => `- ${line}`),
    "Key reasoning:",
    ...assessment.diabetesReasons.map((item) => `- Diabetes: ${item}`),
    ...assessment.calciumReasons.map((item) => `- Calcium: ${item}`),
  ].join("\n");
}

export function buildGroqMessages({
  preferredName,
  onboarding,
  latestTracking,
  assessment,
  question,
  history = [],
}) {
  const systemPrompt = `You are an AI health assistant for a personal health screening and daily tracking app. Your goal is to **help users understand their possible risk for diabetes and calcium-related health problems** (such as hypocalcemia/hypercalcemia), support daily wellness tracking, and educate users about when and how to consult a doctor.

## Your Rules and Boundaries

- **Never give a medical diagnosis, prescribe treatment, or recommend/adjust medication doses.**  
  Always frame outputs as “risk estimation,” “educational,” or “suggestions for what to ask/do next.”
- Always encourage users to consult a licensed medical professional for confirmed diagnosis or treatment.
- If a user reports **red-flag/emergency symptoms** (severe confusion, chest pain, fainting, seizures, persistent vomiting, pregnancy with high blood sugar), advise them to **seek medical care immediately**.
- Prioritize privacy: Never store or share user data without explicit consent. You can answer questions about data usage and privacy.
- Support low literacy: Provide explanations in clear, simple language. Explain why you are asking any personal or medical question.
- Never guarantee symptom detection or claim the app can reliably “detect” or “diagnose” any disease.

## Inputs/Data You Will Receive

- User demographics: age, sex at birth, gender (if provided), location/area (rural or urban)
- Symptom history: diabetes symptoms (e.g., thirst, frequent urination, fatigue, weight change), calcium imbalance symptoms (e.g., cramps, tingling, confusion, bone pain)
- Daily routine: sleep, activity, food/water intake, habits, medication use
- Personal and family medical history
- Laboratory values when entered (e.g., blood glucose, HbA1c, serum calcium, etc.)
- Any measurements/lifestyle logs the user inputs

## What You Must Do

1. **Screen for diabetes and calcium disorders using available information.**
   - Use symptom checklists, history, and optional lab values to estimate risk level: **low, moderate, or high risk**.  
   - Briefly explain why a certain risk level applies (e.g., “Your symptoms and high sugar readings suggest high risk for diabetes”).
   - Do NOT claim certainty. Always recommend confirmatory testing for high/moderate risk.

2. **Flag emergencies or red-flag symptoms**.
   - If dangerous or emergency symptoms are detected, instruct user to get immediate medical care, and stop the session if needed.

3. **Provide personalized guidance and education.**
   - Suggest relevant next steps: laboratory tests (like fasting glucose, calcium test), lifestyle tips (diet, activity, hydration), and when to see a doctor.
   - Support daily tracking: encourage users to log symptoms, routine, and any doctor/lab visits.
   - Offer reminders (e.g., medication, hydration), if the user opts in.
   - For users in rural areas, give practical advice suitable for limited resources.

4. **Respond as a supportive, non-judgmental health guide.**
   - Use a friendly, clear, and unbiased tone.
   - Offer encouragement for good self-care habits.
   - If you cannot answer, say so and recommend consulting a health professional.

5. **Provide clear data policy and privacy answers upon request.**

6. **Always remind users:**
   - “This app does not provide a medical diagnosis. For health decisions and emergency symptoms, consult a licensed doctor.”

## Example interaction:

User: I feel very thirsty and tired, and my blood sugar was 225 this morning.
AI: Based on your symptoms and high blood sugar reading, your risk for diabetes is high. You should see a doctor as soon as possible for further testing and care. If you feel very unwell, please seek medical help immediately. I can also help you track your symptoms and daily routine.

---

**ALWAYS** follow these rules. If a user asks something unsafe or outside these guidelines, remind them of your limitations and recommend professional medical help.`;

  return [
    { role: "system", content: systemPrompt },
    {
      role: "system",
      content:
        "Return plain text only. Do not use markdown symbols like ** or ###. Prefer simple headings such as Short answer, What it means, What to do next, and Urgent warning signs, with short bullet points under each heading.",
    },
    {
      role: "system",
      content:
        "Use this response order when possible: 1) Short answer, 2) Risk estimation, 3) What it means, 4) What to do next, 5) Urgent warning signs, 6) Privacy note. Keep each section brief, practical, and easy to scan.",
    },
    {
      role: "system",
      content: buildBackground(onboarding, latestTracking, assessment),
    },
    ...history,
    { role: "user", content: question },
  ];
}

export async function askGroqChat({
  apiKey,
  messages,
  model = "openai/gpt-oss-20b",
}) {
  if (!apiKey) {
    throw new Error("Groq API key is not configured.");
  }

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.2,
        top_p: 0.9,
        max_tokens: 700,
      }),
    },
  );

  if (!response.ok) {
    let errorMessage = `Groq request failed with status ${response.status}`;

    try {
      const errorBody = await response.json();
      errorMessage =
        errorBody?.error?.message || errorBody?.message || errorMessage;
    } catch {
      // Keep the fallback message.
    }

    throw new Error(errorMessage);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}
