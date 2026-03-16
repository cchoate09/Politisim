import React from 'react';
import { useGameStore } from '../store/gameStore';

interface Props {
  maxEntries?: number;
}

export const ActivityLog: React.FC<Props> = ({ maxEntries = 5 }) => {
  const { activityLog } = useGameStore();
  const recent = activityLog.slice(-maxEntries).reverse();

  if (recent.length === 0) return null;

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
        Recent Activity
      </div>
      {recent.map((entry, idx) => (
        <div key={idx} style={{
          fontSize: '0.75rem',
          padding: '0.3rem 0.5rem',
          marginBottom: '0.25rem',
          borderRadius: '4px',
          background: 'rgba(255,255,255,0.03)',
          borderLeft: `3px solid ${
            entry.type === 'positive' ? '#2ea043' :
            entry.type === 'negative' ? '#f85149' :
            entry.type === 'event' ? '#d29922' :
            'rgba(255,255,255,0.2)'
          }`,
          color: 'var(--text-muted)',
          lineHeight: 1.3
        }}>
          <span style={{ opacity: 0.5 }}>W{entry.week}</span> {entry.message}
        </div>
      ))}
    </div>
  );
};
