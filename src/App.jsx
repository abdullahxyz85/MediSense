import { useEffect, useMemo, useState } from "react";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { auth, db } from "./firebase";
import { PageShell } from "./components/layout/PageShell";
import { OnboardingPage } from "./pages/OnboardingPage";
import { RiskScreeningPage } from "./pages/RiskScreeningPage";
import { ConsultationPage } from "./pages/ConsultationPage";
import { EmergencyPage } from "./pages/EmergencyPage";

const features = [
  {
    icon: "◌",
    title: "Screening by symptoms",
    text: "Collects diabetes and calcium-related symptoms with duration, severity, and free text.",
  },
  {
    icon: "◈",
    title: "Transparent risk view",
    text: "Shows low, medium, or high risk with the exact factors behind the result.",
  },
  {
    icon: "⌁",
    title: "Daily routine tracking",
    text: "Tracks water, meals, sleep, activity, and optional glucose or calcium readings.",
  },
  {
    icon: "⚑",
    title: "Red-flag triage",
    text: "Flags urgent symptoms such as confusion, fainting, seizures, or severe dehydration.",
  },
  {
    icon: "✦",
    title: "Safe AI consultation",
    text: "Answers questions with education only and nudges users toward medical review.",
  },
  {
    icon: "▣",
    title: "Doctor-ready summary",
    text: "Creates a short shareable report for clinicians, family, or referral support.",
  },
];

const steps = [
  {
    number: "01",
    title: "Describe",
    text: "Enter age, sex at birth, location, history, symptoms, and recent routine.",
  },
  {
    number: "02",
    title: "Review",
    text: "See a clear screening result for diabetes and calcium imbalance risk.",
  },
  {
    number: "03",
    title: "Act",
    text: "Get suggested tests, self-care guidance, reminders, and urgent care prompts when needed.",
  },
];

const benefits = [
  "Low-bandwidth and mobile-first",
  "Simple language and voice-ready flow",
  "Consent-first privacy and delete/export controls",
  "Optional doctor referral and teleconsult support",
];

const stats = [
  { value: "2", label: "main risk areas" },
  { value: "6", label: "feature cards" },
  { value: "3", label: "step flow" },
];

function useAuthSession() {
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setAuthLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setAuthUser(nextUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  return { authUser, authLoading, setAuthUser };
}

async function ensureProfileDocument(user, provider) {
  if (!db) {
    return;
  }

  await setDoc(
    doc(db, "users", user.uid),
    {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      photoURL: user.photoURL || "",
      authProvider: provider,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}

function LandingPage({ authUser }) {
  return (
    <PageShell authUser={authUser}>
      <main id="top">
        <section className="hero hero-split" id="start">
          <div className="hero-logo" aria-hidden="true">
            <img
              src="/icone_medisense.png"
              alt="MediSense"
              className="hero-brand-img"
            />
          </div>
          <h1>
            The Future of <span className="accent-text">Health Screening</span>
          </h1>

          <p className="hero-copy">
            Simple screening support for diabetes and calcium-related concerns,
            with clear next steps, daily tracking, and safe consultation
            guidance for everyday care.
          </p>

          <div className="hero-actions">
            <Link
              className="primary-button hero-button"
              to={authUser ? "/dashboard" : "/login?next=/onboarding"}
            >
              Get Started
            </Link>
            <Link
              className="ghost-button hero-button"
              to={authUser ? "/dashboard" : "/login?next=/dashboard"}
            >
              Dashboard
            </Link>
          </div>
        </section>

        <section className="section section-tight" id="features">
          <div className="section-heading center">
            <h2>
              Powerful <span className="accent-text">Features</span>
            </h2>
            <p>Built for practical screening, not diagnosis.</p>
          </div>

          <div className="feature-grid">
            {features.map((feature) => (
              <article className="feature-card" key={feature.title}>
                <span className="feature-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section section-tight" id="process">
          <div className="section-heading center">
            <h2>
              How It <span className="accent-text">Works</span>
            </h2>
            <p>The 3-step screening cycle</p>
          </div>

          <div className="step-grid">
            {steps.map((step) => (
              <article className="step-card" key={step.number}>
                <span className="step-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="section benefits-section" id="benefits">
          <div className="benefits-copy">
            <div className="section-heading left">
              <h2>
                Why Choose <span className="accent-text">MediSense?</span>
              </h2>
              <p>Simple, explainable, and safe for first-contact guidance.</p>
            </div>

            <ul className="check-list">
              {benefits.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <aside className="benefits-panel" id="safety">
            <div className="metric-box metric-success">
              <strong>High-risk</strong>
              <span>red flags route to urgent care</span>
              <span className="metric-icon" aria-hidden="true">
                ↗
              </span>
            </div>
            <div className="metric-box metric-warning">
              <strong>Low literacy</strong>
              <span>clear language and voice input</span>
              <span className="metric-icon" aria-hidden="true">
                ⌛
              </span>
            </div>
            <div className="metric-box metric-info">
              <strong>Privacy-first</strong>
              <span>minimum data and export/delete</span>
              <span className="metric-icon" aria-hidden="true">
                ◎
              </span>
            </div>
          </aside>
        </section>
      </main>

      <footer className="footer">
        <div className="footer-brand">
          <span className="footer-brand-mark" aria-hidden="true">
            <img
              src="/icone_medisense.png"
              alt="MediSense"
              className="footer-brand-img"
            />
          </span>
          <div>
            <strong>
              Medi<span className="accent-text">Sense</span>
            </strong>
            <span>
              Screening support for{" "}
              <span className="accent-text">diabetes</span> and calcium-related{" "}
              <span className="accent-text">concerns</span>.
            </span>
          </div>
        </div>
        <p>
          Not a <span className="accent-text">diagnosis</span>. Seek in-person
          medical care for <span className="accent-text">urgent</span> or
          <span className="accent-text"> worsening</span> symptoms.
        </p>
      </footer>
    </PageShell>
  );
}

function AuthPage({ mode, authUser, authLoading }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isSignup = mode === "signup";
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const headline = isSignup ? (
    <>
      Create your <span className="accent-text">account</span>
    </>
  ) : (
    <>
      Welcome <span className="accent-text">back</span>
    </>
  );

  const nextPath = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const next = params.get("next");
    return next && next.startsWith("/") ? next : "";
  }, [location.search]);

  useEffect(() => {
    if (!authLoading && authUser) {
      navigate(nextPath || "/dashboard", { replace: true });
    }
  }, [authLoading, authUser, navigate, nextPath]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function createOrLoginWithEmail(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!auth) {
      setError(
        "Firebase auth is not configured yet. Add your VITE_FIREBASE_* values first.",
      );
      return;
    }

    if (!form.email || !form.password) {
      setError("Email and password are required.");
      return;
    }

    try {
      setPending(true);

      if (isSignup) {
        const credentials = await createUserWithEmailAndPassword(
          auth,
          form.email,
          form.password,
        );

        if (form.name.trim()) {
          await updateProfile(credentials.user, {
            displayName: form.name.trim(),
          });
        }

        await ensureProfileDocument(credentials.user, "password");
        setNotice("Account created. Redirecting to your profile onboarding...");
        navigate(nextPath || "/onboarding", { replace: true });
      } else {
        await signInWithEmailAndPassword(auth, form.email, form.password);
        setNotice("Signed in successfully. Redirecting...");
        navigate(nextPath || "/dashboard", { replace: true });
      }

      setForm({ name: "", email: form.email, password: "" });
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed.",
      );
    } finally {
      setPending(false);
    }
  }

  async function handleGoogleSignIn() {
    if (!auth) {
      setError("Firebase auth is not configured yet.");
      return;
    }

    try {
      setPending(true);
      setError("");
      setNotice("");

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      await ensureProfileDocument(result.user, "google");
      setNotice("Google sign-in successful. Redirecting to onboarding...");
      navigate(nextPath || "/onboarding", { replace: true });
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Google sign-in failed.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell authUser={authUser}>
      <main className="auth-page">
        <section className="auth-page-panel">
          <div className="auth-page-copy">
            <div className="hero-logo auth-page-logo" aria-hidden="true">
              <img
                src="/icone_medisense.png"
                alt="MediSense"
                className="hero-brand-img"
              />
            </div>
            <p className="auth-kicker">Secure access</p>
            <h1>{headline}</h1>
            <p>
              Use email/password or Google sign-in to access screening,
              tracking, and your next-step guidance.
            </p>
            <ul className="check-list auth-check-list">
              <li>Separate pages for login and signup</li>
              <li>Safe account creation with Firestore profile support</li>
              <li>Google sign-in for faster onboarding</li>
            </ul>
          </div>

          <form className="auth-form-card" onSubmit={createOrLoginWithEmail}>
            <div className="auth-card-top">
              <div>
                <p className="auth-kicker">
                  {isSignup ? "Join MediSense" : "Login to MediSense"}
                </p>
                <h2>
                  {isSignup ? (
                    <>
                      Sign <span className="accent-text">up</span>
                    </>
                  ) : (
                    <>
                      <span className="accent-text">Login</span>
                    </>
                  )}
                </h2>
              </div>
              <span className="auth-status">
                {isSignup ? "New account" : "Returning user"}
              </span>
            </div>
            {isSignup && (
              <label className="auth-field">
                <span>Name</span>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </label>
            )}

            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete={isSignup ? "new-password" : "current-password"}
              />
            </label>

            {error && <div className="auth-alert error">{error}</div>}
            {notice && <div className="auth-alert success">{notice}</div>}

            <button
              className="primary-button auth-button"
              disabled={pending}
              type="submit"
            >
              {pending
                ? "Please wait..."
                : isSignup
                  ? "Create account"
                  : "Login"}
            </button>

            <button
              className="google-button auth-button"
              disabled={pending}
              type="button"
              onClick={handleGoogleSignIn}
            >
              Continue with Google
            </button>

            <div className="auth-links-row">
              <Link
                to={
                  isSignup
                    ? `/login${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
                    : `/signup${nextPath ? `?next=${encodeURIComponent(nextPath)}` : ""}`
                }
              >
                {isSignup
                  ? "Already have an account? Login"
                  : "Need an account? Sign up"}
              </Link>
              <Link to="/">Back to home</Link>
            </div>

            <p className="auth-footnote">
              By continuing, users accept the screening disclaimer and privacy
              terms.
            </p>
          </form>
        </section>
      </main>
    </PageShell>
  );
}

function DashboardPage({ authUser, authLoading }) {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");
  const [userRecord, setUserRecord] = useState(null);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    if (authLoading || !authUser) {
      return;
    }

    let isMounted = true;

    async function loadProfile() {
      setProfileLoading(true);
      setProfileError("");

      if (!db) {
        if (isMounted) {
          setProfileError("Firestore is not configured yet.");
          setProfileLoading(false);
        }
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", authUser.uid));
        if (!isMounted) {
          return;
        }

        setUserRecord(snapshot.exists() ? snapshot.data() : null);
      } catch (readError) {
        if (!isMounted) {
          return;
        }

        setProfileError(
          readError instanceof Error
            ? readError.message
            : "Could not load your dashboard profile.",
        );
      } finally {
        if (isMounted) {
          setProfileLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [authLoading, authUser]);

  const onboarding = userRecord?.onboardingProfile;
  const dailyTrackingMap = userRecord?.dailyTracking || {};
  const latestTrackingDate = Object.keys(dailyTrackingMap).sort().at(-1);
  const latestTracking = latestTrackingDate
    ? dailyTrackingMap[latestTrackingDate]
    : null;
  const preferredName =
    onboarding?.preferredName || authUser?.displayName || "there";
  const profileReady = Boolean(userRecord?.profileComplete && onboarding);

  const keyFacts = [
    { label: "Age", value: onboarding?.age || "Not set" },
    { label: "Sex at birth", value: onboarding?.sexAtBirth || "Not set" },
    { label: "BMI", value: onboarding?.bmi || "Auto pending" },
    {
      label: "Location",
      value: onboarding?.countryRegion || onboarding?.locationType || "Not set",
    },
    {
      label: "Activity",
      value: onboarding?.activityLevel || "Not set",
    },
    {
      label: "Clinic access",
      value: onboarding?.clinicAccess || "Not set",
    },
  ];

  async function handleSignOut() {
    if (!auth) {
      return;
    }

    try {
      setPending(true);
      await signOut(auth);
      navigate("/", { replace: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell authUser={authUser}>
      <main className="dashboard-page">
        <section className="dashboard-grid">
          <article className="dashboard-card dashboard-main-card">
            <p className="auth-kicker">Dashboard</p>
            <h1>
              <span className="accent-text">Welcome</span>, {preferredName}.
            </h1>
            <p>
              This is your onboarding summary. We will use this profile for
              daily tracking, risk screening, and AI guidance.
            </p>

            {profileLoading && (
              <p className="dashboard-note">Loading your profile summary...</p>
            )}

            {profileError && (
              <div className="auth-alert error">{profileError}</div>
            )}

            {!profileLoading && !profileError && !profileReady && (
              <div className="dashboard-empty-state">
                <p>
                  Your onboarding profile is not complete yet. Complete it first
                  to unlock risk screening and AI consultation.
                </p>
                <Link className="primary-button" to="/onboarding">
                  Complete onboarding
                </Link>
              </div>
            )}

            {!profileLoading && !profileError && profileReady && (
              <>
                <div className="dashboard-status-row">
                  <span className="dashboard-status-pill complete">
                    Profile complete
                  </span>
                  <span className="dashboard-status-pill">
                    Daily tracking: Ready
                  </span>
                  <span className="dashboard-status-pill">
                    Risk screening: Ready
                  </span>
                </div>

                <div className="dashboard-summary-grid">
                  {keyFacts.map((fact) => (
                    <article
                      className="dashboard-summary-item"
                      key={fact.label}
                    >
                      <p>{fact.label}</p>
                      <strong>{fact.value}</strong>
                    </article>
                  ))}
                </div>

                <div className="dashboard-tracking-card">
                  <div className="dashboard-tracking-head">
                    <h3>Latest daily tracking</h3>
                    <span>
                      {latestTrackingDate
                        ? `Date: ${latestTrackingDate}`
                        : "No entries yet"}
                    </span>
                  </div>

                  {latestTracking ? (
                    <div className="dashboard-tracking-grid">
                      <article className="dashboard-summary-item">
                        <p>Water</p>
                        <strong>{latestTracking.waterLiters || "-"} L</strong>
                      </article>
                      <article className="dashboard-summary-item">
                        <p>Sleep</p>
                        <strong>{latestTracking.sleepHours || "-"} h</strong>
                      </article>
                      <article className="dashboard-summary-item">
                        <p>Activity</p>
                        <strong>
                          {latestTracking.activityMinutes || "-"} min
                        </strong>
                      </article>
                      <article className="dashboard-summary-item">
                        <p>Mood</p>
                        <strong>{latestTracking.mood || "Not set"}</strong>
                      </article>
                      <article className="dashboard-summary-item">
                        <p>Energy</p>
                        <strong>
                          {latestTracking.energyLevel || "Not set"}
                        </strong>
                      </article>
                      <article className="dashboard-summary-item">
                        <p>Stress</p>
                        <strong>
                          {latestTracking.stressLevel || "Not set"}
                        </strong>
                      </article>
                    </div>
                  ) : (
                    <p className="dashboard-note">
                      Save your first daily tracking entry to see it here.
                    </p>
                  )}
                </div>
              </>
            )}

            <div className="dashboard-actions">
              <Link className="primary-button" to="/tracking">
                Start daily tracking
              </Link>
              <Link className="primary-button" to="/risk-screening">
                Run risk screening
              </Link>
              <Link className="primary-button" to="/consultation">
                Open AI consultation
              </Link>
              <Link className="primary-button" to="/onboarding">
                Edit onboarding
              </Link>
              <Link className="ghost-button" to="/">
                Back to home
              </Link>
              <button
                className="ghost-button"
                type="button"
                onClick={handleSignOut}
                disabled={pending}
              >
                {pending ? "Signing out..." : "Sign out"}
              </button>
            </div>
          </article>

          <aside className="dashboard-card dashboard-side-card">
            <p className="auth-kicker">Roadmap</p>
            <h2>
              Coming <span className="accent-text">Next</span>
            </h2>
            <div className="dashboard-next-list">
              <article className="dashboard-next-item">
                <h3>
                  Daily <span className="accent-text">tracking</span>
                </h3>
                <p>
                  Log water, meals, sleep, activity, and optional readings in a
                  simple daily flow.
                </p>
                <Link
                  className="ghost-button dashboard-inline-button"
                  to="/tracking"
                >
                  Open tracking
                </Link>
              </article>
              <article className="dashboard-next-item">
                <h3>
                  Risk <span className="accent-text">screening</span>
                </h3>
                <p>
                  Get explainable low/medium/high risk from profile + symptom
                  signals.
                </p>
                <Link
                  className="ghost-button dashboard-inline-button"
                  to="/risk-screening"
                >
                  Open screening
                </Link>
              </article>
              <article className="dashboard-next-item">
                <h3>
                  AI <span className="accent-text">consultation</span>
                </h3>
                <p>
                  Ask follow-up questions and receive safe, education-first
                  guidance.
                </p>
                <Link
                  className="ghost-button dashboard-inline-button"
                  to="/consultation"
                >
                  Open consultation
                </Link>
              </article>
            </div>
          </aside>
        </section>
      </main>
    </PageShell>
  );
}

const dailyTrackingDefaults = {
  date: new Date().toISOString().slice(0, 10),
  waterLiters: "",
  mealsCount: "",
  sleepHours: "",
  activityMinutes: "",
  mood: "",
  energyLevel: "",
  stressLevel: "",
  symptomsNote: "",
  glucoseReading: "",
  calciumReading: "",
  notes: "",
};

function DailyTrackingPage({ authUser, authLoading }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(dailyTrackingDefaults);
  const [pending, setPending] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/login?next=/tracking", { replace: true });
    }
  }, [authLoading, authUser, navigate]);

  useEffect(() => {
    if (authLoading || !authUser) {
      return;
    }

    let isMounted = true;

    async function loadTrackingEntry() {
      setError("");
      setNotice("");
      setLoadingEntry(true);

      if (!db) {
        if (isMounted) {
          setError("Firestore is not configured yet.");
          setLoadingEntry(false);
        }
        return;
      }

      try {
        const snapshot = await getDoc(doc(db, "users", authUser.uid));

        if (!isMounted) {
          return;
        }

        const data = snapshot.exists() ? snapshot.data() : null;
        const entry = data?.dailyTracking?.[form.date];

        if (entry) {
          setForm((current) => ({
            ...current,
            waterLiters: entry.waterLiters || "",
            mealsCount: entry.mealsCount || "",
            sleepHours: entry.sleepHours || "",
            activityMinutes: entry.activityMinutes || "",
            mood: entry.mood || "",
            energyLevel: entry.energyLevel || "",
            stressLevel: entry.stressLevel || "",
            symptomsNote: entry.symptomsNote || "",
            glucoseReading: entry.glucoseReading || "",
            calciumReading: entry.calciumReading || "",
            notes: entry.notes || "",
          }));
        } else {
          setForm((current) => ({
            ...current,
            waterLiters: "",
            mealsCount: "",
            sleepHours: "",
            activityMinutes: "",
            mood: "",
            energyLevel: "",
            stressLevel: "",
            symptomsNote: "",
            glucoseReading: "",
            calciumReading: "",
            notes: "",
          }));
        }
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Could not load the selected daily entry.",
        );
      } finally {
        if (isMounted) {
          setLoadingEntry(false);
        }
      }
    }

    loadTrackingEntry();

    return () => {
      isMounted = false;
    };
  }, [authLoading, authUser, form.date]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!db) {
      setError("Firestore is not configured yet.");
      return;
    }

    if (!form.date) {
      setError("Please select a tracking date.");
      return;
    }

    try {
      setPending(true);

      await setDoc(
        doc(db, "users", authUser.uid),
        {
          dailyTracking: {
            [form.date]: {
              date: form.date,
              waterLiters: form.waterLiters,
              mealsCount: form.mealsCount,
              sleepHours: form.sleepHours,
              activityMinutes: form.activityMinutes,
              mood: form.mood,
              energyLevel: form.energyLevel,
              stressLevel: form.stressLevel,
              symptomsNote: form.symptomsNote.trim(),
              glucoseReading: form.glucoseReading,
              calciumReading: form.calciumReading,
              notes: form.notes.trim(),
              updatedAt: serverTimestamp(),
            },
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setNotice("Daily tracking entry saved.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save daily tracking entry.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <PageShell authUser={authUser}>
      <main className="daily-page">
        <section className="daily-card">
          <div className="daily-head">
            <p className="auth-kicker">Daily tracking</p>
            <h1>
              Log today's routine and{" "}
              <span className="accent-text">symptoms</span>.
            </h1>
            <p>
              Save one entry per day. This data will feed the risk screening and
              AI consultation steps.
            </p>
          </div>

          <form className="daily-form" onSubmit={handleSubmit}>
            <div className="field-grid two-col">
              <label className="auth-field">
                <span>Date</span>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </label>

              <label className="auth-field">
                <span>Water intake (liters)</span>
                <input
                  type="number"
                  step="0.1"
                  name="waterLiters"
                  value={form.waterLiters}
                  onChange={handleChange}
                  placeholder="2.0"
                />
              </label>

              <label className="auth-field">
                <span>Meals count</span>
                <input
                  type="number"
                  name="mealsCount"
                  value={form.mealsCount}
                  onChange={handleChange}
                  placeholder="3"
                />
              </label>

              <label className="auth-field">
                <span>Sleep hours</span>
                <input
                  type="number"
                  step="0.5"
                  name="sleepHours"
                  value={form.sleepHours}
                  onChange={handleChange}
                  placeholder="7.5"
                />
              </label>

              <label className="auth-field">
                <span>Activity (minutes)</span>
                <input
                  type="number"
                  name="activityMinutes"
                  value={form.activityMinutes}
                  onChange={handleChange}
                  placeholder="30"
                />
              </label>

              <label className="auth-field">
                <span>Mood</span>
                <select name="mood" value={form.mood} onChange={handleChange}>
                  <option value="">Select mood</option>
                  <option value="good">Good</option>
                  <option value="neutral">Neutral</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label className="auth-field">
                <span>Energy level</span>
                <select
                  name="energyLevel"
                  value={form.energyLevel}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </label>

              <label className="auth-field">
                <span>Stress level</span>
                <select
                  name="stressLevel"
                  value={form.stressLevel}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="low">Low</option>
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                </select>
              </label>

              <label className="auth-field">
                <span>Glucose reading (optional)</span>
                <input
                  type="number"
                  step="0.1"
                  name="glucoseReading"
                  value={form.glucoseReading}
                  onChange={handleChange}
                  placeholder="mg/dL"
                />
              </label>

              <label className="auth-field">
                <span>Calcium reading (optional)</span>
                <input
                  type="number"
                  step="0.1"
                  name="calciumReading"
                  value={form.calciumReading}
                  onChange={handleChange}
                  placeholder="mg/dL"
                />
              </label>
            </div>

            <label className="auth-field">
              <span>Symptoms today</span>
              <textarea
                name="symptomsNote"
                value={form.symptomsNote}
                onChange={handleChange}
                placeholder="Any important symptoms, severity, or red flags today..."
              />
            </label>

            <label className="auth-field">
              <span>Notes</span>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                placeholder="Food changes, medication timing, stress events, or anything else..."
              />
            </label>

            {loadingEntry && (
              <p className="dashboard-note">Loading selected day...</p>
            )}
            {error && <div className="auth-alert error">{error}</div>}
            {notice && <div className="auth-alert success">{notice}</div>}

            <div className="daily-actions">
              <button
                className="primary-button"
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving..." : "Save daily entry"}
              </button>
              <Link className="ghost-button" to="/dashboard">
                Back to dashboard
              </Link>
            </div>
          </form>
        </section>
      </main>
    </PageShell>
  );
}

function AppRoutes() {
  const { authUser, authLoading } = useAuthSession();

  return (
    <Routes>
      <Route path="/" element={<LandingPage authUser={authUser} />} />
      <Route
        path="/login"
        element={
          <AuthPage
            mode="login"
            authUser={authUser}
            authLoading={authLoading}
          />
        }
      />
      <Route
        path="/onboarding"
        element={
          <OnboardingPage authUser={authUser} authLoading={authLoading} />
        }
      />
      <Route
        path="/signup"
        element={
          <AuthPage
            mode="signup"
            authUser={authUser}
            authLoading={authLoading}
          />
        }
      />
      <Route
        path="/dashboard"
        element={
          <DashboardPage authUser={authUser} authLoading={authLoading} />
        }
      />
      <Route
        path="/tracking"
        element={
          <DailyTrackingPage authUser={authUser} authLoading={authLoading} />
        }
      />
      <Route
        path="/risk-screening"
        element={
          <RiskScreeningPage authUser={authUser} authLoading={authLoading} />
        }
      />
      <Route
        path="/consultation"
        element={
          <ConsultationPage authUser={authUser} authLoading={authLoading} />
        }
      />
      <Route
        path="/emergency"
        element={<EmergencyPage authUser={authUser} />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;
