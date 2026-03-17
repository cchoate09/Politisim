import React, { useMemo, useState } from 'react';
import './CampaignGuideDrawer.css';
import { GUIDE_SECTIONS } from '../core/CampaignGuide';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CampaignGuideDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeSectionId, setActiveSectionId] = useState(GUIDE_SECTIONS[0]?.id ?? 'campaign-loop');
  const [query, setQuery] = useState('');
  const handleClose = () => {
    setQuery('');
    onClose();
  };

  const activeSection = GUIDE_SECTIONS.find((section) => section.id === activeSectionId) ?? GUIDE_SECTIONS[0];
  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return GUIDE_SECTIONS.flatMap((section) =>
      section.entries
        .filter((entry) =>
          `${section.title} ${entry.term} ${entry.description} ${entry.coaching}`.toLowerCase().includes(normalized)
        )
        .map((entry) => ({
          sectionTitle: section.title,
          ...entry
        }))
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="guide-overlay" onClick={handleClose}>
      <aside className="guide-drawer" onClick={(event) => event.stopPropagation()}>
        <div className="guide-header">
          <div>
            <div className="guide-eyebrow">Guide & Glossary</div>
            <h2>Campaign Handbook</h2>
            <p>Use this whenever you need to remember what a system does, what a stat really means, or how to structure the next few weeks.</p>
          </div>
          <button type="button" className="guide-close-btn" onClick={handleClose}>
            Close
          </button>
        </div>

        <div className="guide-search-row">
          <input
            type="text"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search trust, turnout, delegates, fatigue..."
            className="guide-search-input"
          />
        </div>

        <div className="guide-layout">
          <nav className="guide-sidebar">
            {GUIDE_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={`guide-section-btn ${activeSectionId === section.id ? 'active' : ''}`}
                onClick={() => {
                  setActiveSectionId(section.id);
                  setQuery('');
                }}
              >
                <strong>{section.title}</strong>
                <span>{section.summary}</span>
              </button>
            ))}
          </nav>

          <div className="guide-content">
            {query.trim() ? (
              <>
                <div className="guide-content-header">
                  <div>
                    <div className="guide-content-eyebrow">Search Results</div>
                    <h3>{searchResults.length} match{searchResults.length === 1 ? '' : 'es'}</h3>
                  </div>
                </div>

                {searchResults.length === 0 ? (
                  <div className="guide-empty-state">
                    No glossary entries match that search yet. Try broader terms like `trust`, `momentum`, `office`, or `delegate`.
                  </div>
                ) : (
                  <div className="guide-entry-list">
                    {searchResults.map((entry) => (
                      <article key={`${entry.sectionTitle}-${entry.term}`} className="guide-entry-card">
                        <div className="guide-entry-top">
                          <strong>{entry.term}</strong>
                          <span>{entry.sectionTitle}</span>
                        </div>
                        <p>{entry.description}</p>
                        <div className="guide-coaching-tip">{entry.coaching}</div>
                      </article>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="guide-content-header">
                  <div>
                    <div className="guide-content-eyebrow">Section Overview</div>
                    <h3>{activeSection.title}</h3>
                    <p>{activeSection.summary}</p>
                  </div>
                </div>

                <div className="guide-entry-list">
                  {activeSection.entries.map((entry) => (
                    <article key={`${activeSection.id}-${entry.term}`} className="guide-entry-card">
                      <div className="guide-entry-top">
                        <strong>{entry.term}</strong>
                      </div>
                      <p>{entry.description}</p>
                      <div className="guide-coaching-tip">{entry.coaching}</div>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};
