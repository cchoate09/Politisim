import React, { useMemo } from 'react';
import './CandidateIdentityCard.css';

type Party = 'Democrat' | 'Republican' | 'Independent' | 'Nonpartisan';

interface CandidateStat {
  label: string;
  value: string;
}

interface Props {
  name: string;
  subtitle: string;
  tagline?: string;
  party?: Party;
  accentLabel?: string;
  chips?: string[];
  stats?: CandidateStat[];
  compact?: boolean;
}

function hashSeed(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash) + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function getPalette(seed: number, party: Party) {
  const partyBase = party === 'Republican'
    ? ['#7f1d1d', '#ef4444', '#fca5a5']
    : party === 'Democrat'
      ? ['#0f3d91', '#38bdf8', '#bfdbfe']
      : ['#1f2937', '#94a3b8', '#e2e8f0'];
  const accentOptions = ['#f6c453', '#34d399', '#f97316', '#a78bfa', '#22c55e'];
  const accent = accentOptions[seed % accentOptions.length];

  return {
    dark: partyBase[0],
    mid: partyBase[1],
    light: partyBase[2],
    accent
  };
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'PS';
}

export const CandidateIdentityCard: React.FC<Props> = ({
  name,
  subtitle,
  tagline,
  party = 'Nonpartisan',
  accentLabel,
  chips = [],
  stats = [],
  compact = false
}) => {
  const seed = useMemo(() => hashSeed(`${name}-${subtitle}-${party}`), [name, party, subtitle]);
  const palette = useMemo(() => getPalette(seed, party), [party, seed]);
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <article className={`identity-card ${compact ? 'identity-card-compact' : ''}`}>
      <div className="identity-card-portrait">
        <svg viewBox="0 0 180 220" className="identity-card-svg" aria-hidden="true">
          <defs>
            <linearGradient id={`portrait-bg-${seed}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.dark} />
              <stop offset="58%" stopColor={palette.mid} />
              <stop offset="100%" stopColor={palette.accent} />
            </linearGradient>
            <linearGradient id={`portrait-sash-${seed}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="180" height="220" rx="24" fill={`url(#portrait-bg-${seed})`} />
          <circle cx="132" cy="36" r="28" fill="rgba(255,255,255,0.08)" />
          <circle cx="42" cy="186" r="34" fill="rgba(255,255,255,0.08)" />
          <path d="M90 58c-22 0-40 18-40 40v18c0 13 6 25 17 33l11 8h24l11-8c11-8 17-20 17-33V98c0-22-18-40-40-40Z" fill="#f8d7be" />
          <path d="M54 101c0-26 16-48 36-48s36 22 36 48v8c-8-8-17-12-28-12-19 0-31 9-44 22Z" fill="rgba(27, 32, 48, 0.9)" />
          <path d="M60 177c10-9 20-14 30-14s20 5 30 14l20 43H40l20-43Z" fill="rgba(15, 23, 42, 0.92)" />
          <path d="M77 164h26l-13 31-13-31Z" fill={`url(#portrait-sash-${seed})`} />
          <path d="M49 205c15-16 31-24 41-24s26 8 41 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
        </svg>
        <div className="identity-card-initials">{initials}</div>
      </div>

      <div className="identity-card-body">
        <div className="identity-card-topline">
          <span>{party}</span>
          {accentLabel && <span>{accentLabel}</span>}
        </div>
        <h3>{name}</h3>
        <div className="identity-card-subtitle">{subtitle}</div>
        {tagline && <p className="identity-card-tagline">{tagline}</p>}

        {chips.length > 0 && (
          <div className="identity-card-chips">
            {chips.slice(0, compact ? 2 : 4).map((chip) => (
              <span key={`${name}-${chip}`} className="identity-card-chip">{chip}</span>
            ))}
          </div>
        )}

        {stats.length > 0 && (
          <div className="identity-card-stats">
            {stats.slice(0, compact ? 2 : 4).map((stat) => (
              <div key={`${name}-${stat.label}`} className="identity-card-stat">
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </div>
            ))}
          </div>
        )}
      </div>
    </article>
  );
};
