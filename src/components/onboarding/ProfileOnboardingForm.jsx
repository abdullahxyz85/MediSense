import { useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { FieldGroup } from "./FieldGroup";

const initialFormState = {
  preferredName: "",
  age: "",
  sexAtBirth: "",
  genderIdentity: "",
  height: "",
  weight: "",
  pregnancyStatus: "",
  countryRegion: "",
  locationType: "urban",
  language: "English",
  clinicAccess: "",
  dietPattern: "",
  waterIntake: "",
  sleepHours: "",
  activityLevel: "",
  smoking: "",
  alcohol: "",
  familyHistoryDiabetes: false,
  familyHistoryThyroid: false,
  familyHistoryKidney: false,
  diabetesSymptoms: [],
  calciumSymptoms: [],
  conditions: "",
  medications: "",
  glucoseReading: "",
  hba1c: "",
  calcium: "",
  vitaminD: "",
  pth: "",
  creatinine: "",
  bloodPressure: "",
  heartRate: "",
  notes: "",
  consent: false,
};

const diabetesSymptomOptions = [
  "Thirst",
  "Frequent urination",
  "Fatigue",
  "Weight change",
  "Blurry vision",
  "Slow healing",
  "Tingling",
];

const calciumSymptomOptions = [
  "Muscle cramps",
  "Tingling around mouth",
  "Tingling in fingers",
  "Constipation",
  "Bone pain",
  "Nausea",
  "Confusion",
];

function toggleValue(values, value) {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

function CheckboxChip({ label, checked, onChange, name }) {
  return (
    <label className={`choice-chip ${checked ? "selected" : ""}`}>
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
      />
      <span>{label}</span>
    </label>
  );
}

function SelectField({ label, value, onChange, children, name }) {
  return (
    <label className="auth-field onboarding-field">
      <span>{label}</span>
      <select name={name} value={value} onChange={onChange}>
        {children}
      </select>
    </label>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  name,
  readOnly = false,
}) {
  return (
    <label className="auth-field onboarding-field">
      <span>{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        readOnly={readOnly}
      />
    </label>
  );
}

export function ProfileOnboardingForm({ user, onSaved }) {
  const [form, setForm] = useState(initialFormState);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const bmi = useMemo(() => {
    const height = Number(form.height);
    const weight = Number(form.weight);

    if (!height || !weight) {
      return "";
    }

    const heightMeters = height / 100;
    const score = weight / (heightMeters * heightMeters);
    return Number.isFinite(score) ? score.toFixed(1) : "";
  }, [form.height, form.weight]);

  function handleChange(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!db) {
      setError("Firestore is not configured yet.");
      return;
    }

    if (!form.consent) {
      setError(
        "Please accept the consent and screening disclaimer to continue.",
      );
      return;
    }

    if (!form.age || !form.sexAtBirth || !form.height || !form.weight) {
      setError("Please fill the basic profile fields before continuing.");
      return;
    }

    try {
      setPending(true);

      await setDoc(
        doc(db, "users", user.uid),
        {
          profileComplete: true,
          profileUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          displayName: form.preferredName.trim() || user.displayName || "",
          onboardingProfile: {
            preferredName: form.preferredName.trim(),
            age: form.age,
            sexAtBirth: form.sexAtBirth,
            genderIdentity: form.genderIdentity,
            height: form.height,
            weight: form.weight,
            bmi,
            pregnancyStatus: form.pregnancyStatus,
            countryRegion: form.countryRegion,
            locationType: form.locationType,
            language: form.language,
            clinicAccess: form.clinicAccess,
            dietPattern: form.dietPattern,
            waterIntake: form.waterIntake,
            sleepHours: form.sleepHours,
            activityLevel: form.activityLevel,
            smoking: form.smoking,
            alcohol: form.alcohol,
            familyHistory: {
              diabetes: form.familyHistoryDiabetes,
              thyroid: form.familyHistoryThyroid,
              kidney: form.familyHistoryKidney,
            },
            diabetesSymptoms: form.diabetesSymptoms,
            calciumSymptoms: form.calciumSymptoms,
            conditions: form.conditions,
            medications: form.medications,
            measurements: {
              glucoseReading: form.glucoseReading,
              hba1c: form.hba1c,
              calcium: form.calcium,
              vitaminD: form.vitaminD,
              pth: form.pth,
              creatinine: form.creatinine,
              bloodPressure: form.bloodPressure,
              heartRate: form.heartRate,
            },
            notes: form.notes,
            consent: form.consent,
          },
        },
        { merge: true },
      );

      setNotice("Profile saved successfully. Redirecting to your dashboard...");
      onSaved?.();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save profile.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="onboarding-form" onSubmit={handleSubmit}>
      <FieldGroup title="01" description="Basic profile">
        <div className="field-grid two-col">
          <TextField
            label="Preferred name"
            value={form.preferredName}
            onChange={handleChange}
            placeholder="Your name"
            name="preferredName"
          />
          <TextField
            label="Age"
            value={form.age}
            onChange={handleChange}
            placeholder="Enter age"
            type="number"
            name="age"
          />
          <SelectField
            label="Sex at birth"
            value={form.sexAtBirth}
            onChange={handleChange}
            name="sexAtBirth"
          >
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="intersex">Intersex</option>
          </SelectField>
          <TextField
            label="Gender identity (optional)"
            value={form.genderIdentity}
            onChange={handleChange}
            placeholder="Optional"
            name="genderIdentity"
          />
          <TextField
            label="Height (cm)"
            value={form.height}
            onChange={handleChange}
            placeholder="170"
            type="number"
            name="height"
          />
          <TextField
            label="Weight (kg)"
            value={form.weight}
            onChange={handleChange}
            placeholder="65"
            type="number"
            name="weight"
          />
          <SelectField
            label="Pregnancy status"
            value={form.pregnancyStatus}
            onChange={handleChange}
            name="pregnancyStatus"
          >
            <option value="">Select</option>
            <option value="not-applicable">Not applicable</option>
            <option value="pregnant">Pregnant</option>
            <option value="possible">Possibly pregnant</option>
            <option value="postpartum">Postpartum</option>
          </SelectField>
          <TextField
            label="BMI (auto-calculated)"
            value={bmi}
            onChange={() => {}}
            placeholder="Auto"
            type="text"
            name="bmi"
            readOnly
          />
        </div>
      </FieldGroup>

      <FieldGroup title="02" description="Location and access">
        <div className="field-grid two-col">
          <TextField
            label="Country / region"
            value={form.countryRegion}
            onChange={handleChange}
            placeholder="Country or region"
            name="countryRegion"
          />
          <SelectField
            label="Area type"
            value={form.locationType}
            onChange={handleChange}
            name="locationType"
          >
            <option value="urban">Urban</option>
            <option value="rural">Rural</option>
            <option value="semi-urban">Semi-urban</option>
          </SelectField>
          <SelectField
            label="Language"
            value={form.language}
            onChange={handleChange}
            name="language"
          >
            <option value="English">English</option>
          </SelectField>
          <SelectField
            label="Clinic / lab access"
            value={form.clinicAccess}
            onChange={handleChange}
            name="clinicAccess"
          >
            <option value="">Select</option>
            <option value="easy">Easy access</option>
            <option value="limited">Limited access</option>
            <option value="none">No current access</option>
          </SelectField>
        </div>
      </FieldGroup>

      <FieldGroup title="03" description="Medical history and routine">
        <div className="field-grid two-col">
          <TextField
            label="Diet pattern"
            value={form.dietPattern}
            onChange={handleChange}
            placeholder="Home-cooked, mixed, frequent takeout..."
            name="dietPattern"
          />
          <TextField
            label="Water intake per day"
            value={form.waterIntake}
            onChange={handleChange}
            placeholder="Around 2L"
            name="waterIntake"
          />
          <TextField
            label="Sleep hours"
            value={form.sleepHours}
            onChange={handleChange}
            placeholder="7 hours"
            name="sleepHours"
          />
          <TextField
            label="Activity level"
            value={form.activityLevel}
            onChange={handleChange}
            placeholder="Low / moderate / high"
            name="activityLevel"
          />
          <TextField
            label="Smoking"
            value={form.smoking}
            onChange={handleChange}
            placeholder="No / occasional / yes"
            name="smoking"
          />
          <TextField
            label="Alcohol"
            value={form.alcohol}
            onChange={handleChange}
            placeholder="No / occasional / yes"
            name="alcohol"
          />
          <TextField
            label="Existing conditions"
            value={form.conditions}
            onChange={handleChange}
            placeholder="Diabetes, thyroid, kidney..."
            name="conditions"
          />
          <TextField
            label="Current medications"
            value={form.medications}
            onChange={handleChange}
            placeholder="Metformin, diuretics, calcium, vitamin D..."
            name="medications"
          />
        </div>

        <div className="checkbox-grid">
          <CheckboxChip
            label="Family history: diabetes"
            checked={form.familyHistoryDiabetes}
            onChange={handleChange}
            name="familyHistoryDiabetes"
          />
          <CheckboxChip
            label="Family history: thyroid / parathyroid"
            checked={form.familyHistoryThyroid}
            onChange={handleChange}
            name="familyHistoryThyroid"
          />
          <CheckboxChip
            label="Family history: kidney disease"
            checked={form.familyHistoryKidney}
            onChange={handleChange}
            name="familyHistoryKidney"
          />
        </div>
      </FieldGroup>

      <FieldGroup title="04" description="Current symptoms">
        <div className="symptom-block">
          <p className="mini-label">Diabetes related</p>
          <div className="checkbox-grid">
            {diabetesSymptomOptions.map((item) => (
              <CheckboxChip
                key={item}
                label={item}
                checked={form.diabetesSymptoms.includes(item)}
                onChange={() =>
                  setForm((current) => ({
                    ...current,
                    diabetesSymptoms: toggleValue(
                      current.diabetesSymptoms,
                      item,
                    ),
                  }))
                }
              />
            ))}
          </div>
        </div>

        <div className="symptom-block">
          <p className="mini-label">Calcium related</p>
          <div className="checkbox-grid">
            {calciumSymptomOptions.map((item) => (
              <CheckboxChip
                key={item}
                label={item}
                checked={form.calciumSymptoms.includes(item)}
                onChange={() =>
                  setForm((current) => ({
                    ...current,
                    calciumSymptoms: toggleValue(current.calciumSymptoms, item),
                  }))
                }
              />
            ))}
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="05" description="Measurements and notes">
        <div className="field-grid two-col">
          <TextField
            label="Glucose reading"
            value={form.glucoseReading}
            onChange={handleChange}
            placeholder="e.g. 110 mg/dL"
            name="glucoseReading"
          />
          <TextField
            label="HbA1c"
            value={form.hba1c}
            onChange={handleChange}
            placeholder="e.g. 6.1%"
            name="hba1c"
          />
          <TextField
            label="Serum calcium"
            value={form.calcium}
            onChange={handleChange}
            placeholder="e.g. 8.6 mg/dL"
            name="calcium"
          />
          <TextField
            label="Vitamin D"
            value={form.vitaminD}
            onChange={handleChange}
            placeholder="e.g. 22 ng/mL"
            name="vitaminD"
          />
          <TextField
            label="PTH"
            value={form.pth}
            onChange={handleChange}
            placeholder="e.g. 45 pg/mL"
            name="pth"
          />
          <TextField
            label="Creatinine"
            value={form.creatinine}
            onChange={handleChange}
            placeholder="e.g. 0.9 mg/dL"
            name="creatinine"
          />
          <TextField
            label="Blood pressure"
            value={form.bloodPressure}
            onChange={handleChange}
            placeholder="120/80"
            name="bloodPressure"
          />
          <TextField
            label="Heart rate"
            value={form.heartRate}
            onChange={handleChange}
            placeholder="72 bpm"
            name="heartRate"
          />
        </div>

        <label className="auth-field onboarding-field notes-field">
          <span>Notes / free text</span>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Anything else the user wants to share..."
            rows="4"
          />
        </label>
      </FieldGroup>

      <label className="consent-card">
        <input
          type="checkbox"
          name="consent"
          checked={form.consent}
          onChange={handleChange}
        />
        <span>
          I agree that this app is for screening and education only, not a
          diagnosis, and I consent to my data being stored securely for this
          care flow.
        </span>
      </label>

      {error && <div className="auth-alert error">{error}</div>}
      {notice && <div className="auth-alert success">{notice}</div>}

      <div className="dashboard-actions onboarding-actions">
        <button
          className="primary-button auth-button"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving..." : "Save profile"}
        </button>
        <button
          className="ghost-button auth-switch"
          type="button"
          onClick={onSaved}
        >
          Skip for now
        </button>
      </div>
    </form>
  );
}
