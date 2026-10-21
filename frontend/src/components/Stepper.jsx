// Wizard progress: "Krok 2 z 3", the step title and one segment per step.
export default function Stepper({ steps, current }) {
  return (
    <div className="stepper">
      <div className="overline">
        Krok {current + 1} z {steps.length}
      </div>
      <ol className="stepper-segments" aria-label="Kroki">
        {steps.map((label, index) => (
          <li
            key={label}
            className={index <= current ? "stepper-segment done" : "stepper-segment"}
            aria-current={index === current ? "step" : undefined}
          >
            <span className="stepper-bar" aria-hidden="true" />
            <span className="stepper-label">{label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
