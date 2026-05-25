import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageShell } from "../components/layout/PageShell";
import { useUserProfileData } from "../hooks/useUserProfileData";
import { SafetyBanner } from "../components/SafetyBanner";
import {
  askGroqChat,
  buildGroqMessages,
  calculateRiskAssessment,
} from "../lib/healthInsights";

const GROQ_API_KEY = (import.meta.env.VITE_GROQ_API_KEY || "").trim();

function formatConversation(messages) {
  return messages.map((message, index) => ({
    ...message,
    id: `${message.role}-${index}`,
  }));
}

function renderMessageContent(content) {
  const lines = String(content || "")
    .split(/\n+/)
    .map((line) => line.trim());
  const blocks = [];
  let listItems = [];
  const sectionHeaders = new Set([
    "Short answer",
    "Risk estimation",
    "What it means",
    "What to do next",
    "Urgent warning signs",
    "Privacy note",
  ]);

  function normalizeInlineText(text) {
    return String(text || "")
      .replace(/^#+\s*/, "")
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/__(.*?)__/g, "$1")
      .trim();
  }

  const flushList = () => {
    if (listItems.length === 0) {
      return;
    }

    blocks.push(
      <ul className="chat-list" key={`list-${blocks.length}`}>
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{item}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    if (!line) {
      flushList();
      return;
    }

    const cleanedLine = normalizeInlineText(line);
    const headingText = cleanedLine.replace(/:\s*$/, "");
    const isSectionHeader = sectionHeaders.has(headingText);

    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);
    const numberedMatch = line.match(/^\d+[.)]\s+(.*)$/);

    if (bulletMatch) {
      listItems.push(normalizeInlineText(bulletMatch[1]));
      return;
    }

    if (numberedMatch) {
      listItems.push(normalizeInlineText(numberedMatch[1]));
      return;
    }

    flushList();

    if (isSectionHeader) {
      blocks.push(
        <h3 className="chat-section-heading" key={`heading-${index}`}>
          {headingText}
        </h3>,
      );
      return;
    }

    const colonMatch = cleanedLine.match(/^([^:]{2,42}):\s*(.+)$/);
    if (colonMatch && colonMatch[1].length <= 24) {
      blocks.push(
        <p className="chat-paragraph" key={`paragraph-${index}`}>
          <strong className="chat-inline-label">
            {normalizeInlineText(colonMatch[1])}:
          </strong>{" "}
          {normalizeInlineText(colonMatch[2])}
        </p>,
      );
      return;
    }

    blocks.push(
      <p className="chat-paragraph" key={`paragraph-${index}`}>
        {cleanedLine}
      </p>,
    );
  });

  flushList();

  return blocks.length > 0 ? (
    blocks
  ) : (
    <p className="chat-paragraph">{normalizeInlineText(content)}</p>
  );
}

export function ConsultationPage({ authUser, authLoading }) {
  const navigate = useNavigate();
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState([]);

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
      navigate("/login?next=/consultation", { replace: true });
    }
  }, [authLoading, authUser, navigate]);

  const assessment = useMemo(
    () => calculateRiskAssessment(onboarding, latestTracking),
    [latestTracking, onboarding],
  );

  useEffect(() => {
    if (!profileReady || messages.length > 0) {
      return;
    }

    setMessages([
      {
        role: "assistant",
        content:
          "Ask a question about your screening results, daily tracking, or what to do next. I will keep the answer short, structured, and educational.",
      },
    ]);
  }, [messages.length, profileReady]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      setError("Type a question first.");
      return;
    }

    if (!GROQ_API_KEY) {
      setError(
        "Groq API key is missing in the running app. Make sure it is named VITE_GROQ_API_KEY in .env and restart the dev server after editing it.",
      );
      return;
    }

    try {
      setPending(true);

      const userMessage = { role: "user", content: trimmedQuestion };
      const chatMessages = [
        ...buildGroqMessages({
          preferredName,
          onboarding,
          latestTracking,
          assessment,
          question: trimmedQuestion,
          history: messages.filter(
            (message) => message.role !== "assistant" || message.content,
          ),
        }),
      ];

      const assistantReply = await askGroqChat({
        apiKey: GROQ_API_KEY,
        messages: chatMessages,
      });

      setMessages((current) => [
        ...current,
        userMessage,
        {
          role: "assistant",
          content: assistantReply || "I could not generate a response.",
        },
      ]);
      setQuestion("");
      setNotice("Answer generated with Groq.");
    } catch (chatError) {
      setError(
        chatError instanceof Error
          ? chatError.message
          : "AI consultation failed.",
      );
    } finally {
      setPending(false);
    }
  }

  const quickPrompts = [
    "What does my risk mean?",
    "What should I do today?",
    "Is anything urgent?",
  ];

  return (
    <PageShell authUser={authUser}>
      <main className="consultation-page">
        <SafetyBanner />
        <section className="consultation-card">
          <div className="risk-head">
            <p className="auth-kicker">AI consultation</p>
            <h1>
              Ask <span className="accent-text">follow-up</span> questions in
              plain language.
            </h1>
            <p>
              Groq-powered education only, based on your latest onboarding and
              tracking data.
            </p>
          </div>

          {profileLoading && (
            <p className="dashboard-note">Loading consultation context...</p>
          )}
          {profileError && (
            <div className="auth-alert error">{profileError}</div>
          )}

          {!profileLoading && !profileError && !profileReady && (
            <div className="dashboard-empty-state">
              <p>
                Complete onboarding and daily tracking first to unlock
                consultation.
              </p>
              <Link className="primary-button" to="/onboarding">
                Complete onboarding
              </Link>
            </div>
          )}

          {!profileLoading && !profileError && profileReady && (
            <>
              <div className="consultation-summary-grid">
                <article className="dashboard-summary-item">
                  <p>Overall risk</p>
                  <strong>{assessment.overallLevel.toUpperCase()}</strong>
                </article>
                <article className="dashboard-summary-item">
                  <p>Latest tracking</p>
                  <strong>{latestTrackingDate || "No daily entry"}</strong>
                </article>
                <article className="dashboard-summary-item">
                  <p>Groq model</p>
                  <strong>openai/gpt-oss-20b</strong>
                </article>
              </div>

              <div className="quick-prompt-row">
                {quickPrompts.map((prompt) => (
                  <button
                    className="ghost-button quick-prompt"
                    key={prompt}
                    type="button"
                    onClick={() => setQuestion(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              <form className="consultation-form" onSubmit={handleSubmit}>
                <label className="auth-field">
                  <span>Your question</span>
                  <textarea
                    name="question"
                    value={question}
                    onChange={(event) => setQuestion(event.target.value)}
                    placeholder="Ask about your risk, daily log, symptoms, or next steps..."
                  />
                </label>

                <div className="risk-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={pending}
                  >
                    {pending ? "Thinking..." : "Ask AI"}
                  </button>
                  <Link className="ghost-button" to="/risk-screening">
                    Open risk screening
                  </Link>
                  <Link className="ghost-button" to="/dashboard">
                    Back to dashboard
                  </Link>
                </div>
              </form>

              {error && <div className="auth-alert error">{error}</div>}
              {notice && <div className="auth-alert success">{notice}</div>}

              <div className="chat-thread">
                {formatConversation(messages).map((message) => (
                  <article
                    key={message.id}
                    className={`chat-bubble ${message.role}`}
                  >
                    <div className="chat-bubble-header">
                      <span>
                        {message.role === "user" ? "You" : "MediSense"}
                      </span>
                      <span>
                        {message.role === "user" ? "Question" : "Guidance"}
                      </span>
                    </div>
                    <div className="chat-bubble-body">
                      {renderMessageContent(message.content)}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </PageShell>
  );
}
