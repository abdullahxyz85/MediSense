import { Link, NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export function PageShell({ children, authUser }) {
  const [scrolled, setScrolled] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [hash, setHash] = useState(window.location.hash);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const isGoogleUser = Boolean(
    authUser?.providerData?.some(
      (provider) => provider.providerId === "google.com",
    ),
  );
  const dashboardTarget = authUser ? "/dashboard" : "/login?next=/dashboard";
  const onboardingTarget = authUser ? "/onboarding" : "/login?next=/onboarding";
  const accountTarget = authUser ? "/dashboard" : "/login";
  const fallbackInitial = (authUser?.displayName || authUser?.email || "A")
    .trim()
    .charAt(0)
    .toUpperCase();
  const onHome = location.pathname === "/";

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
      setShowBackToTop(window.scrollY > 360);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    function onHashChange() {
      setHash(window.location.hash);
    }

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search, hash]);

  function getRouteButtonClass(isActive) {
    return `ghost-button nav-button${isActive ? " active" : ""}`;
  }

  const topbarClass = onHome
    ? `topbar ${scrolled ? "scrolled" : "transparent"} home`
    : `topbar pinned`;

  return (
    <div className="site-shell">
      <div className="site-glow site-glow-left" />
      <div className="site-glow site-glow-right" />

      <header className={topbarClass}>
        <Link className="brand" to="/" aria-label="MediSense home">
          <span className="brand-mark">
            <img
              src="/icone_medisense.png"
              alt="MediSense"
              className="brand-img"
            />
          </span>
          <span className="brand-text">
            <strong>
              Medi<span className="accent-text">Sense</span>
            </strong>
            <em>Screen. Track. Act.</em>
          </span>
        </Link>

        <button
          className={`nav-toggle ${menuOpen ? "open" : ""}`}
          type="button"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((current) => !current)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`topbar-menu ${menuOpen ? "open" : ""}`}>
          <nav className="nav-links" aria-label="Primary">
            <a
              className={onHome && hash === "#features" ? "active" : ""}
              href="/#features"
              onClick={() => setMenuOpen(false)}
            >
              Features
            </a>
            <a
              className={onHome && hash === "#process" ? "active" : ""}
              href="/#process"
              onClick={() => setMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              className={onHome && hash === "#benefits" ? "active" : ""}
              href="/#benefits"
              onClick={() => setMenuOpen(false)}
            >
              Benefits
            </a>
          </nav>

          <div className="nav-actions">
            {!authUser && (
              <NavLink
                className="login-button nav-button nav-auth-button"
                to="/login"
                onClick={() => setMenuOpen(false)}
              >
                Login / Sign Up
              </NavLink>
            )}

            <NavLink
              className={({ isActive }) => getRouteButtonClass(isActive)}
              to={dashboardTarget}
              onClick={() => setMenuOpen(false)}
            >
              Dashboard
            </NavLink>

            <NavLink
              className={({ isActive }) => getRouteButtonClass(isActive)}
              to={onboardingTarget}
              onClick={() => setMenuOpen(false)}
            >
              Profile
            </NavLink>

            {authUser && (
              <NavLink
                className={({ isActive }) =>
                  `ghost-button nav-button account-chip avatar-only${isActive ? " active" : ""}`
                }
                to={accountTarget}
                aria-label={authUser.displayName || authUser.email || "Account"}
                onClick={() => setMenuOpen(false)}
              >
                {authUser.photoURL ? (
                  <img
                    className="account-avatar"
                    src={authUser.photoURL}
                    alt={`${authUser.displayName || "Google account"} avatar`}
                  />
                ) : (
                  <span className="account-avatar" aria-hidden="true">
                    {isGoogleUser ? "G" : fallbackInitial}
                  </span>
                )}
              </NavLink>
            )}
          </div>
        </div>
      </header>

      {/* spacer to keep layout when header is fixed/pinned */}
      {!onHome && <div className="topbar-spacer" aria-hidden="true" />}

      {children}

      {/* Back to top button */}
      {showBackToTop && (
        <button
          className="back-to-top"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          ↑
        </button>
      )}
    </div>
  );
}
