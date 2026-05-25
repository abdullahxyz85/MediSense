export function FieldGroup({ title, description, children }) {
  return (
    <section className="onboarding-section">
      <div className="section-heading left">
        <p>{title}</p>
        <h2>{description}</h2>
      </div>
      {children}
    </section>
  );
}
