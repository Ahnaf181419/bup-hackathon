export function AtmosphereBackground() {
  return (
    <div className="atmosphere" aria-hidden="true">
      <div className="atmo-grid-mask">
        <div className="atmo-grid-field" />
      </div>
      <div className="atmo-bloom atmo-bloom-lime" />
      <div className="atmo-bloom atmo-bloom-cyan" />
      <div className="atmo-pulse" />
      <div className="atmo-noise" />
    </div>
  );
}
