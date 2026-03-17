import React, { useMemo } from 'react';
import './BudgetAllocationView.css';
import { useGameStore } from '../store/gameStore';
import { getMediaSummary, getPassiveDonorIncome } from '../core/CampaignStrategy';

export const BudgetAllocationView: React.FC = () => {
  const {
    budget,
    publicTrust,
    momentum,
    stamina,
    donorBlocs,
    mediaChannels,
    fundraiseFromBloc,
    investInMedia
  } = useGameStore();

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(budget);

  const donorEngine = useMemo(
    () => getPassiveDonorIncome(donorBlocs, publicTrust, momentum),
    [donorBlocs, momentum, publicTrust]
  );
  const mediaSummary = useMemo(() => getMediaSummary(mediaChannels), [mediaChannels]);
  const strongestBlocs = [...donorBlocs].sort((a, b) => {
    if (a.relationship !== b.relationship) return b.relationship - a.relationship;
    return b.energy - a.energy;
  });
  const activeChannels = [...mediaChannels].sort((a, b) => b.intensity - a.intensity);

  return (
    <div className="budget-view">
      <div className="budget-header">
        <h2>Finance and Media War Room</h2>
        <p>Build a real funding coalition, decide which media channels deserve oxygen, and keep the campaign solvent without letting the brand rot.</p>
      </div>

      <div className="finance-metrics">
        <MetricCard label="War Chest" value={formattedBudget} accent="#2ea043" />
        <MetricCard label="Passive Donor Engine" value={formatCompactDollars(donorEngine)} accent="var(--primary-accent)" />
        <MetricCard label="Media Carry Cost" value={formatCompactDollars(mediaSummary.weeklyCost)} accent="#f59e0b" />
        <MetricCard label="Candidate Stamina" value={`${stamina}/100`} accent={stamina >= 45 ? '#2ea043' : '#f59e0b'} />
      </div>

      <div className="budget-status-banner">
        <div>
          <strong>Finance Outlook</strong>
          <p>
            {budget > 600000
              ? 'You can afford to build a real media footprint, but expensive lanes will still compound into painful weekly overhead.'
              : budget > 220000
                ? 'You still have room to maneuver, but repeated asks and idle media buys can leave you cash-poor quickly.'
                : 'Cash is tight. Lean on warm donor relationships and avoid carrying more media intensity than you can sustain.'}
          </p>
        </div>
        <div className="budget-status-meta">
          <span>Trust {publicTrust}%</span>
          <span>Momentum {momentum}</span>
          <span>{mediaSummary.strongestChannels.length} hot channels</span>
        </div>
      </div>

      <div className="budget-columns">
        <section className="budget-panel">
          <div className="budget-panel-header">
            <div>
              <h3>Donor Blocs</h3>
              <p>Each bloc funds you differently, asks different things in return, and recovers on a different rhythm.</p>
            </div>
          </div>

          <div className="strategy-card-grid">
            {strongestBlocs.map((bloc) => {
              const canAsk = stamina >= bloc.staminaCost;
              return (
                <article key={bloc.id} className="strategy-card">
                  <div className="strategy-card-top">
                    <div>
                      <h4>{bloc.name}</h4>
                      <span>{bloc.askLabel}</span>
                    </div>
                    <div className={`strategy-pill ${bloc.relationship >= 70 ? 'good' : bloc.relationship >= 50 ? 'warm' : 'cold'}`}>
                      {bloc.relationship}% warm
                    </div>
                  </div>

                  <p className="strategy-copy">{bloc.description}</p>

                  <div className="strategy-stats">
                    <span>Weekly lane: {formatCompactDollars(bloc.weeklyPotential)}</span>
                    <span>Energy: {bloc.energy}%</span>
                    <span>Stamina cost: -{bloc.staminaCost}</span>
                  </div>

                  <div className="strategy-tags">
                    {bloc.preferredIssues.slice(0, 2).map((issue) => (
                      <span key={`${bloc.id}-${issue}`}>{issue}</span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="strategy-action-btn"
                    disabled={!canAsk}
                    onClick={() => fundraiseFromBloc(bloc.id)}
                  >
                    {canAsk ? bloc.askLabel : 'Need More Stamina'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        <section className="budget-panel">
          <div className="budget-panel-header">
            <div>
              <h3>Media Channels</h3>
              <p>Choose what kind of campaign people are seeing. Different channels move persuasion, turnout, stability, and scandal resistance in different ways.</p>
            </div>
          </div>

          <div className="strategy-card-grid">
            {activeChannels.map((channel) => (
              <article key={channel.id} className="strategy-card">
                <div className="strategy-card-top">
                  <div>
                    <h4>{channel.name}</h4>
                    <span>{channel.intensity}% intensity</span>
                  </div>
                  <div className={`strategy-pill ${channel.intensity >= 45 ? 'good' : channel.intensity >= 20 ? 'warm' : 'cold'}`}>
                    {formatCompactDollars(channel.investmentCost)}
                  </div>
                </div>

                <p className="strategy-copy">{channel.description}</p>

                <div className="strategy-stats">
                  <span>Weekly carry: {formatCompactDollars(channel.weeklyCostPerPoint * channel.intensity)}</span>
                  <span>Decay: -{channel.decay}/wk</span>
                </div>

                <div className="channel-meter">
                  <div className="channel-meter-fill" style={{ width: `${channel.intensity}%` }} />
                </div>

                <button
                  type="button"
                  className="strategy-action-btn secondary"
                  disabled={budget < channel.investmentCost}
                  onClick={() => investInMedia(channel.id)}
                >
                  {budget >= channel.investmentCost ? `Fund ${channel.name}` : 'Insufficient Funds'}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

function MetricCard({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="metric-card">
      <div className="metric-label">{label}</div>
      <div className="metric-value" style={{ color: accent }}>{value}</div>
    </div>
  );
}

function formatCompactDollars(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}
