import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { ProfileOnboardingForm } from "../components/onboarding/ProfileOnboardingForm";
import { SafetyBanner } from "../components/SafetyBanner";

export function OnboardingPage({ authUser, authLoading }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !authUser) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, authUser, navigate]);

  return (
    <PageShell authUser={authUser}>
      <main className="onboarding-page">
        <SafetyBanner />
        <section className="onboarding-hero">
          <p className="auth-kicker">Step 1 of the MVP</p>
          <h1>
            Build your <span className="accent-text">profile</span> once, then
            reuse it for screening and care.
          </h1>
          <p>
            This onboarding is the first feature we are implementing. It
            collects the minimum clinical and lifestyle context so later risk
            scoring can stay transparent, explainable, and safe.
          </p>
          <div className="hero-actions left-aligned">
            <Link className="ghost-button" to="/dashboard">
              Back to dashboard
            </Link>
          </div>
        </section>

        <section className="onboarding-card">
          <ProfileOnboardingForm
            user={authUser}
            onSaved={() => navigate("/dashboard", { replace: true })}
          />
        </section>
      </main>
    </PageShell>
  );
}
