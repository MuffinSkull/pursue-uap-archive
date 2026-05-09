/** Fixed atmospheric layers — noise, nebula blobs, subtle scan rhythm (pointer-events none). */
export function CosmicBackdrop() {
  return (
    <div className="cosmic-backdrop" aria-hidden>
      <div className="cosmic-backdrop__noise" />
      <div className="cosmic-backdrop__nebula cosmic-backdrop__nebula--cyan" />
      <div className="cosmic-backdrop__nebula cosmic-backdrop__nebula--violet" />
      <div className="cosmic-backdrop__nebula cosmic-backdrop__nebula--green" />
      <div className="cosmic-backdrop__grid" />
      <div className="cosmic-backdrop__vignette" />
    </div>
  );
}
