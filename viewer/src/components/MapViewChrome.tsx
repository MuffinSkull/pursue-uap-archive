import { AnimatePresence, motion } from 'framer-motion';

export function MapViewChrome({
  viewMode,
  onViewModeChange,
  showAllEdges,
  onShowAllEdgesChange,
  selectionSummary,
}: {
  viewMode: 'grid' | 'map';
  onViewModeChange: (v: 'grid' | 'map') => void;
  showAllEdges: boolean;
  onShowAllEdgesChange: (v: boolean) => void;
  selectionSummary: string | null;
}) {
  return (
    <section className="map-view-chrome" aria-label="Archive view options">
      <div className="map-view-chrome__bar">
        <p className="map-view-chrome__label">Presentation</p>
        <div className="map-view-chrome__toggle" role="tablist" aria-label="View mode">
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'grid'}
            className={`map-view-chrome__tab ${viewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('grid')}
          >
            Grid
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'map'}
            className={`map-view-chrome__tab ${viewMode === 'map' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('map')}
          >
            3D map
          </button>
        </div>
      </div>

      <AnimatePresence>
        {viewMode === 'map' && (
          <motion.div
            className="map-view-chrome__map-tools"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
          >
            <label className="map-view-chrome__check">
              <input
                type="checkbox"
                checked={showAllEdges}
                onChange={(e) => onShowAllEdgesChange(e.target.checked)}
              />
              <span>Show all links</span>
            </label>

            <div className="map-view-chrome__legend" aria-label="What each element represents">
              <p className="map-view-chrome__legend-title">What you’re seeing</p>
              <ul className="map-view-chrome__legend-list">
                <li>
                  <span className="map-view-chrome__swatch map-view-chrome__swatch--record" aria-hidden />
                  <span>
                    <strong>Small bright spheres</strong> — one archive record (title in the grid). Subtle tint by agency;
                    white by default.
                  </span>
                </li>
                <li>
                  <span className="map-view-chrome__swatch map-view-chrome__swatch--hub-agency" aria-hidden />
                  <span>
                    <strong>Large cyan hub</strong> — agency cluster (e.g. FBI, NASA).
                  </span>
                </li>
                <li>
                  <span className="map-view-chrome__swatch map-view-chrome__swatch--hub-year" aria-hidden />
                  <span>
                    <strong>Amber hub</strong> — incident year bucket.
                  </span>
                </li>
                <li>
                  <span className="map-view-chrome__swatch map-view-chrome__swatch--hub-location" aria-hidden />
                  <span>
                    <strong>Green hub</strong> — location cluster.
                  </span>
                </li>
                <li>
                  <span className="map-view-chrome__swatch map-view-chrome__swatch--hub-media" aria-hidden />
                  <span>
                    <strong>Violet hub</strong> — media type (PDF / video / image).
                  </span>
                </li>
                <li className="map-view-chrome__legend-edges">
                  <strong>Lines</strong> — connect a record to each hub it shares. Edge color matches that link type (same
                  as hubs above). Use “Show all links” to draw every edge.
                </li>
              </ul>
            </div>

            <p className="map-view-chrome__hint">
              <strong>Drag</strong> any sphere with the left button — springs pull it home.
              <strong> Right-drag a hub</strong> and tethered record spheres follow.
              Left empty space = orbit camera; right empty = pan. Edges brighten while you drag.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {selectionSummary && (
          <motion.p
            key={selectionSummary}
            className="map-view-chrome__selection"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            Selected: {selectionSummary}
          </motion.p>
        )}
      </AnimatePresence>
    </section>
  );
}
