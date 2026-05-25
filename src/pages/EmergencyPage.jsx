import { Link } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { EMERGENCY_MSG, DISCLAIMER_TEXT } from "../config/clinicalConfig";

export function EmergencyPage({ authUser }) {
  return (
    <PageShell authUser={authUser}>
      <main className="emergency-page">
        <section className="emergency-card">
          <h1>Seek urgent medical care</h1>
          <p className="emergency-urgent">{EMERGENCY_MSG}</p>
          <p className="emergency-note">{DISCLAIMER_TEXT}</p>

          <div className="emergency-actions">
            <a href="tel:112" className="primary-button">
              Call local emergency services
            </a>
            <Link className="ghost-button" to="/dashboard">
              Back to dashboard
            </Link>
          </div>

          <div className="emergency-advice">
            <h3>Practical steps</h3>
            <ul>
              <li>Stay with the person and call emergency services.</li>
              <li>
                Provide clear history: symptoms, known conditions, medications.
              </li>
              <li>
                If safe, prepare recent readings or reports to share with
                responders.
              </li>
            </ul>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

export default EmergencyPage;
