import { useEffect, useMemo, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { PageShell } from "../components/layout/PageShell";
import { useUserProfileData } from "../hooks/useUserProfileData";
import { calculateRiskAssessment } from "../lib/healthInsights";

function RiskLevelBadge({ level }) {
  return <span className={`risk-pill ${level}`}>{level.toUpperCase()}</span>;
}

export function RiskScreeningPage({ authUser, authLoading }) {
  const navigate = useNavigate();
  const [pendingSave, setPendingSave] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");

  const {
    profileLoading,
    profileError,
    onboarding,
    latestTracking,
    latestTrackingDate,
    preferredName,
    profileReady,
  } = useUserProfileData(authUser, authLoading);

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/login?next=/risk-screening", { replace: true });
    }
  }, [authLoading, authUser, navigate]);

  const assessment = useMemo(
    () => calculateRiskAssessment(onboarding, latestTracking),
    [latestTracking, onboarding],
  );

  async function saveScreening() {
    setSaveError("");
    setSaveNotice("");

    if (!db) {
      setSaveError("Firestore is not configured yet.");
      return;
    }

    if (!authUser) {
      setSaveError("Please sign in first.");
      return;
    }

    try {
      setPendingSave(true);

      await setDoc(
        doc(db, "users", authUser.uid),
        {
          latestRiskScreen: {
            overallLevel: assessment.overallLevel,
            diabetesLevel: assessment.diabetesLevel,
            calciumLevel: assessment.calciumLevel,
            urgent: assessment.urgent,
            diabetesReasons: assessment.diabetesReasons,
            calciumReasons: assessment.calciumReasons,
            diabetesNextSteps: assessment.diabetesNextSteps,
            calciumNextSteps: assessment.calciumNextSteps,
            assessedAt: serverTimestamp(),
            sourceTrackingDate: latestTrackingDate || "",
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true },
      );

      setSaveNotice("Risk screening snapshot saved to your profile.");
    } catch (writeError) {
      setSaveError(
        writeError instanceof Error
          ? writeError.message
          : "Could not save the screening snapshot.",
      );
    } finally {
      setPendingSave(false);
    }
  }

  return (
    <PageShell authUser={authUser}>
      <main className="risk-page">
        <section className="risk-card">
          <div className="risk-head">
            <p className="auth-kicker">Risk screening</p>
            <h1>
              <span className="accent-text">Profile</span>-based screening
              result
            </h1>
            <p>
              Based on your onboarding profile and latest daily tracking for{" "}
              {preferredName}.
            </p>
          </div>

          {profileLoading && (
            <p className="dashboard-note">Loading screening data...</p>
          )}
          {profileError && (
            <div className="auth-alert error">{profileError}</div>
          )}

          {!profileLoading && !profileError && !profileReady && (
            <div className="dashboard-empty-state">
              <p>Complete onboarding first to unlock the risk screen.</p>
              <Link className="primary-button" to="/onboarding">
                Complete onboarding
              </Link>
            </div>
          )}

          {!profileLoading && !profileError && profileReady && (
            <>
              <div className="risk-summary-row">
                <div className="risk-overall-card">
                  <p>Overall risk</p>
                  <RiskLevelBadge level={assessment.overallLevel} />
                  <strong>{assessment.summary}</strong>
                </div>
                <div className="risk-overall-card">
                  <p>Latest tracking date</p>
                  <strong>{latestTrackingDate || "No daily entry yet"}</strong>
                  <span>
                    {latestTracking
                      ? "This is the latest saved routine log."
                      : "Track one day to improve accuracy."}
                  </span>
                </div>
              </div>

              <div className="risk-grid">
                <article className="risk-detail-card">
                  <div className="risk-detail-head">
                    <h3>
                      Diabetes <span className="accent-text">risk</span>
                    </h3>
                    <RiskLevelBadge level={assessment.diabetesLevel} />
                  </div>
                  <p>Score: {assessment.diabetesScore}</p>
                  <ul>
                    {assessment.diabetesReasons.length > 0 ? (
                      assessment.diabetesReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))
                    ) : (
                      <li>No strong diabetes signals found yet.</li>
                    )}
                  </ul>
                  <div className="risk-next-steps">
                    {assessment.diabetesNextSteps.map((step) => (
                      <span key={step}>{step}</span>
                    ))}
                  </div>
                </article>

                <article className="risk-detail-card">
                  <div className="risk-detail-head">
                    <h3>
                      Calcium <span className="accent-text">risk</span>
                    </h3>
                    <RiskLevelBadge level={assessment.calciumLevel} />
                  </div>
                  <p>Score: {assessment.calciumScore}</p>
                  <ul>
                    {assessment.calciumReasons.length > 0 ? (
                      assessment.calciumReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))
                    ) : (
                      <li>No strong calcium signals found yet.</li>
                    )}
                  </ul>
                  <div className="risk-next-steps">
                    {assessment.calciumNextSteps.map((step) => (
                      <span key={step}>{step}</span>
                    ))}
                  </div>
                </article>
              </div>

              {assessment.urgent && (
                <div className="risk-urgent-card">
                  <strong>Urgent review recommended</strong>
                  <span>
                    Some symptoms or readings suggest you should get in-person
                    medical help soon.
                  </span>
                </div>
              )}

              <div className="risk-actions">
                <button
                  className="primary-button"
                  type="button"
                  onClick={saveScreening}
                  disabled={pendingSave}
                >
                  {pendingSave ? "Saving..." : "Save screening snapshot"}
                </button>
                <Link className="primary-button" to="/consultation">
                  Open AI consultation
                </Link>
                <Link className="ghost-button" to="/dashboard">
                  Back to dashboard
                </Link>
              </div>

              {saveError && <div className="auth-alert error">{saveError}</div>}
              {saveNotice && (
                <div className="auth-alert success">{saveNotice}</div>
              )}
            </>
          )}
        </section>
      </main>
    </PageShell>
  );
}
