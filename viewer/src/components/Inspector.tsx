import * as React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import type { ResolvedRecord } from '../lib/resolveRecord';

function PrimaryPreview({ item }: { item: ResolvedRecord }) {
  const { record, videoUrl, files } = item;
  const pdfs = files.filter((f) => f.kind === 'pdf');
  const imgs = files.filter((f) => f.kind === 'image');

  if (record.type === 'VID' && videoUrl) {
    return (
      <div className="inspector__media">
        <video className="inspector__video" controls playsInline src={videoUrl} />
        {pdfs[0] && (
          <div className="inspector__sub">
            <p className="inspector__label">Related PDF</p>
            <iframe className="inspector__pdf" title="Related PDF" src={pdfs[0].url} />
          </div>
        )}
      </div>
    );
  }

  if (record.type === 'IMG' && imgs[0]) {
    return (
      <div className="inspector__media">
        <img src={imgs[0].url} alt={record.title} className="inspector__fullimg" />
      </div>
    );
  }

  const mainPdf = pdfs[0];
  if (mainPdf) {
    return (
      <div className="inspector__media">
        <iframe className="inspector__pdf inspector__pdf--main" title={record.title} src={mainPdf.url} />
      </div>
    );
  }

  if (imgs[0]) {
    return (
      <div className="inspector__media">
        <img src={imgs[0].url} alt={record.title} className="inspector__fullimg" />
      </div>
    );
  }

  return (
    <div className="inspector__empty">
      <p>No inline preview for this entry. Use the file links below or open the original release site.</p>
      {record.link ? (
        <a className="inspector__link" href={record.link} target="_blank" rel="noreferrer">
          Open war.gov link
        </a>
      ) : null}
    </div>
  );
}

type Tab = 'overview' | 'media' | 'files' | 'raw';

export function Inspector({
  item,
  open,
  onClose,
}: {
  item: ResolvedRecord | null;
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = React.useState<Tab>('media');
  const [portalEl, setPortalEl] = React.useState<HTMLElement | null>(null);
  const rec = item?.record;

  React.useEffect(() => {
    setPortalEl(document.body);
  }, []);

  React.useEffect(() => {
    if (open) setTab('media');
  }, [open, item?.index]);

  if (!portalEl) return null;

  return createPortal(
      <AnimatePresence>
        {open && item && rec ? (
          <React.Fragment key={`inspector-${item.index}`}>
            <motion.button
              type="button"
              className="inspector__backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              aria-label="Close"
            />
            <motion.aside
              className="inspector"
              role="dialog"
              aria-modal="true"
              aria-labelledby="inspector-title"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <header className="inspector__head">
                <div>
                  <p className="inspector__kicker">{rec.agency}</p>
                  <h2 id="inspector-title" className="inspector__h2">
                    {rec.title}
                  </h2>
                </div>
                <button type="button" className="inspector__close" onClick={onClose}>
                  Close
                </button>
              </header>

              <div className="inspector__tabs" role="tablist">
                {(['overview', 'media', 'files', 'raw'] as Tab[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={tab === t}
                    className={`inspector__tab ${tab === t ? 'is-active' : ''}`}
                    onClick={() => setTab(t)}
                  >
                    {t === 'raw' ? 'Raw JSON' : t[0].toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              <div className="inspector__body">
                {tab === 'overview' && (
                  <div className="inspector__prose">
                    <dl className="inspector__dl">
                      <div>
                        <dt>Type</dt>
                        <dd>{rec.type}</dd>
                      </div>
                      <div>
                        <dt>Incident date</dt>
                        <dd>{rec.incident_date}</dd>
                      </div>
                      <div>
                        <dt>Location</dt>
                        <dd>{rec.incident_location}</dd>
                      </div>
                    </dl>
                    <p className="inspector__desc">{rec.description}</p>
                    {rec.link ? (
                      <a className="inspector__link" href={rec.link} target="_blank" rel="noreferrer">
                        Original war.gov URL
                      </a>
                    ) : null}
                  </div>
                )}

                {tab === 'media' && <PrimaryPreview item={item} />}

                {tab === 'files' && (
                  <ul className="inspector__filelist">
                    {item.files.map((f) => (
                      <li key={f.path}>
                        <a href={f.url} target="_blank" rel="noreferrer">
                          {f.path}
                        </a>
                        <span className="inspector__filekind">{f.kind}</span>
                      </li>
                    ))}
                    {item.videoUrl ? (
                      <li>
                        <a href={item.videoUrl} target="_blank" rel="noreferrer">
                          DVIDS / CloudFront video (source file)
                        </a>
                        <span className="inspector__filekind">video</span>
                      </li>
                    ) : null}
                  </ul>
                )}

                {tab === 'raw' && <pre className="inspector__pre">{JSON.stringify(rec, null, 2)}</pre>}
              </div>
            </motion.aside>
          </React.Fragment>
        ) : null}
      </AnimatePresence>,
      portalEl,
    );
}
