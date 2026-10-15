export default function ProgressBar({ name, value, variant, label }) {
  const p = Math.max(0, Math.min(100, value));
  return (
    <div
      className={`bar bar--${variant}`}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(p)}
    >
      <span className="bar__fill" style={{ width: p + '%' }} />
      <span className="bar__name">{name}</span>
      <span className="bar__pct">{Math.round(p)}%</span>
    </div>
  );
}
