import { motion } from 'framer-motion';
import type { ResolvedRecord } from '../lib/resolveRecord';

const typeLabel: Record<string, string> = {
  PDF: 'Document',
  VID: 'Video',
  IMG: 'Image',
};

export function RecordCard({
  item,
  layoutId,
  onOpen,
}: {
  item: ResolvedRecord;
  layoutId: string;
  onOpen: () => void;
}) {
  const { record, thumbnailUrl } = item;
  const preview = thumbnailUrl ?? '/favicon.svg';

  return (
    <motion.article
      layoutId={layoutId}
      className="record-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3, transition: { duration: 0.22 } }}
    >
      <button
        type="button"
        className="record-card__btn"
        onClick={onOpen}
        aria-label={`Open ${record.title}`}
      >
        <div className="record-card__thumb-wrap">
          <img
            src={preview}
            alt=""
            className="record-card__thumb"
            loading="lazy"
            decoding="async"
          />
          <span className={`record-card__badge record-card__badge--${record.type.toLowerCase()}`}>
            {typeLabel[record.type] ?? record.type}
          </span>
        </div>
        <div className="record-card__meta">
          <h3 className="record-card__title">{record.title}</h3>
          <p className="record-card__agency">{record.agency}</p>
        </div>
      </button>
    </motion.article>
  );
}
