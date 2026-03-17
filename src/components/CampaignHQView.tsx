import React, { useMemo } from 'react';
import './CampaignHQView.css';
import { useGameStore } from '../store/gameStore';
import { evaluateEndorsement, getCandidateEndorsementSummary, type ActiveEndorsement, type CandidateEndorsementSnapshot } from '../core/EndorsementData';
import type { PlayerDemographics } from '../core/ElectionMath';
import { buildPlayerSurrogateRoster, getAssignedStateForSurrogate, getFieldNetworkSummary, getTotalOfficeUpkeep } from '../core/FieldOperations';
import { getMediaSummary } from '../core/CampaignStrategy';

const AVAILABLE_STAFF = [
  {
    id: 'data_analyst',
    name: 'Chief Data Analyst',
    cost: 150000,
    desc: 'Improves national targeting efficiency by reducing the staff penalty in polling formulas. Best for ad-heavy campaigns that need cleaner reads on the map.',
    icon: 'DA'
  },
  {
    id: 'field_organizer',
    name: 'National Field Organizer',
    cost: 100000,
    desc: 'Doubles the effect of candidate visits, making local rallies matter much more in narrow states and late primary contests.',
    icon: 'FO'
  },
  {
    id: 'pr_manager',
    name: 'Crisis PR Manager',
    cost: 200000,
    desc: 'Softens weekly momentum decay by 1 point and restores 1 stamina per week, helping you survive scandal chains and ugly debate nights.',
    icon: 'PR'
  }
];

export const CampaignHQView: React.FC = () => {
  const {
    hiredStaff,
    hireStaff,
    budget,
    stamina,
    currentWeek,
    publicTrust,
    momentum,
    playerName,
    playerDelegates,
    delegateTarget,
    playerIdeology,
    endorsements,
    rivalAIs,
    primaryResults,
    gamePhase,
    activeConvention,
    courtEndorsement,
    states,
    pollingData,
    fieldOperations,
    volunteerReserve,
    vpPick,
    deploySurrogate,
    donorBlocs,
    mediaChannels
  } = useGameStore();

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(budget);

  const candidateSnapshots = useMemo(() => {
    const getWinStats = (candidateId: string) => {
      return Object.values(primaryResults).reduce((totals, result) => {
        const winnerId = result.fieldShares[0]?.candidateId;
        if (winnerId !== candidateId) return totals;
        totals.stateWins += 1;
        if (result.week >= Math.max(1, currentWeek - 6)) totals.recentWins += 1;
        return totals;
      }, { stateWins: 0, recentWins: 0 });
    };

    const playerStats = getWinStats('player');
    const playerSnapshot: CandidateEndorsementSnapshot = {
      id: 'player',
      name: playerName,
      ideology: playerIdeology,
      momentum,
      trust: publicTrust,
      delegates: playerDelegates,
      delegateTarget,
      stateWins: playerStats.stateWins,
      recentWins: playerStats.recentWins,
      homeRegion: 'National',
      supportBase: 14,
      status: 'player'
    };

    const rivalSnapshots = rivalAIs.map((rival) => {
      const winStats = getWinStats(rival.id);
      return {
        id: rival.id,
        name: rival.name,
        ideology: rival.ideology,
        momentum: rival.momentum,
        trust: rival.trust,
        delegates: rival.delegates,
        delegateTarget,
        stateWins: winStats.stateWins,
        recentWins: winStats.recentWins,
        homeRegion: rival.homeRegion,
        supportBase: rival.supportBase,
        status: rival.status === 'nominee' ? 'nominee' : rival.status
      } satisfies CandidateEndorsementSnapshot;
    });

    return [playerSnapshot, ...rivalSnapshots];
  }, [currentWeek, delegateTarget, momentum, playerDelegates, playerIdeology, playerName, primaryResults, publicTrust, rivalAIs]);

  const playerCoalition = getCandidateEndorsementSummary(endorsements, 'player');
  const playerBackers = endorsements.filter((endorsement) => endorsement.endorsedCandidateId === 'player');
  const unresolvedEndorsements = endorsements
    .filter((endorsement) => !endorsement.endorsedCandidateId)
    .map((endorsement) => ({
      endorsement,
      evaluation: evaluateEndorsement(endorsement, candidateSnapshots, currentWeek)
    }))
    .sort((left, right) => {
      const leftAvailable = currentWeek >= left.endorsement.availableWeek ? 1 : 0;
      const rightAvailable = currentWeek >= right.endorsement.availableWeek ? 1 : 0;
      if (leftAvailable !== rightAvailable) return rightAvailable - leftAvailable;
      return right.evaluation.standings[0]?.score - left.evaluation.standings[0]?.score;
    });
  const rivalCoalitions = rivalAIs
    .map((rival) => ({
      rival,
      summary: getCandidateEndorsementSummary(endorsements, rival.id),
      backers: endorsements.filter((endorsement) => endorsement.endorsedCandidateId === rival.id)
    }))
    .filter((entry) => entry.summary.count > 0)
    .sort((left, right) => {
      if (left.summary.prestige !== right.summary.prestige) return right.summary.prestige - left.summary.prestige;
      return right.rival.delegates - left.rival.delegates;
    })
    .slice(0, 3);
  const fieldSummary = useMemo(() => getFieldNetworkSummary(fieldOperations), [fieldOperations]);
  const officeUpkeep = useMemo(() => getTotalOfficeUpkeep(fieldOperations, states), [fieldOperations, states]);
  const surrogateRoster = useMemo(() => buildPlayerSurrogateRoster(vpPick, hiredStaff, endorsements), [endorsements, hiredStaff, vpPick]);
  const recommendedTargets = useMemo(() => {
    return [...states]
      .map((state) => {
        const poll = pollingData[state.stateName];
        if (!poll) return null;
        const margin = Math.abs(poll.player - poll.rival);
        const operation = fieldOperations[state.stateName];
        const fieldGap = Math.max(0, 2 - (operation?.officeLevel ?? 0));
        const battlegroundWeight = gamePhase === 'general'
          ? Math.max(0, 10 - Math.abs(state.partisanLean ?? 0))
          : state.delegatesOrEV / 6;
        return {
          name: state.stateName,
          margin,
          score: battlegroundWeight + fieldGap * 7 + Math.max(0, 12 - margin),
          poll
        };
      })
      .filter(Boolean)
      .sort((left, right) => right!.score - left!.score)
      .slice(0, 4) as { name: string; margin: number; poll: { player: number; rival: number } }[];
  }, [fieldOperations, gamePhase, pollingData, states]);
  const strongestOperations = useMemo(() => {
    return Object.entries(fieldOperations)
      .map(([stateName, operation]) => ({
        stateName,
        operation
      }))
      .filter(({ operation }) => operation.officeLevel > 0 || operation.volunteerStrength > 0 || operation.assignedSurrogates.length > 0)
      .sort((left, right) => {
        const leftScore = left.operation.officeLevel * 100 + left.operation.officeReadiness + left.operation.volunteerStrength;
        const rightScore = right.operation.officeLevel * 100 + right.operation.officeReadiness + right.operation.volunteerStrength;
        return rightScore - leftScore;
      })
      .slice(0, 5);
  }, [fieldOperations]);
  const donorHeat = useMemo(() => donorBlocs.filter((bloc) => bloc.relationship >= 60).length, [donorBlocs]);
  const mediaSummary = useMemo(() => getMediaSummary(mediaChannels), [mediaChannels]);

  return (
    <div className="campaign-hq-view">
      <div className="hq-header">
        <h2>Campaign HQ & Coalition</h2>
        <p>Manage the staff, validators, and interest-group lanes that can turn a strong polling operation into a durable nomination coalition.</p>
        <div className="hq-budget">Campaign Funds: {formattedBudget}</div>
      </div>

      <div className="hq-summary-grid">
        <SummaryCard label="Endorsements Held" value={playerCoalition.count.toString()} detail="Committed public validators currently backing you." />
        <SummaryCard label="Coalition Finance" value={`$${Math.round(playerCoalition.weeklyFundraising / 1000)}K`} detail="Approximate weekly network fundraising unlocked by endorsements." />
        <SummaryCard label="Convention Weight" value={playerCoalition.conventionWeight.toString()} detail="Broker leverage if the nomination reaches a contested floor." />
        <SummaryCard label="Warm Donor Lanes" value={donorHeat.toString()} detail="Funding blocs currently ready to respond without a cold ask." />
        <SummaryCard label="Media Pressure" value={mediaSummary.strongestChannels.length.toString()} detail="Channels carrying meaningful national intensity right now." />
        <SummaryCard label="Office States" value={fieldSummary.officeStates.toString()} detail="States where you have a permanent on-the-ground footprint." />
        <SummaryCard label="Volunteer Reserve" value={volunteerReserve.toString()} detail="Unassigned volunteers ready to reinforce a state operation." />
        <SummaryCard label="Surrogates" value={surrogateRoster.length.toString()} detail="Running mate, staff, and endorsers available for weekly deployment." />
        <SummaryCard label="Candidate Stamina" value={`${stamina}/100`} detail="Courtship costs stamina as well as money, so not every meeting fits every week." />
      </div>

      <div className="hq-columns">
        <section className="hq-panel">
          <div className="panel-header">
            <div>
              <h3>Field Operations Network</h3>
              <p>Long-cycle investment in offices and volunteer labor. This is where campaigns become durable instead of flashy.</p>
            </div>
          </div>

          <div className="operations-summary-grid">
            <MiniMetric label="Office levels" value={fieldSummary.officeLevelTotal.toString()} />
            <MiniMetric label="Volunteer strength" value={fieldSummary.volunteerStrength.toString()} />
            <MiniMetric label="Avg readiness" value={`${fieldSummary.averageReadiness}%`} />
            <MiniMetric label="Weekly upkeep" value={formatCompactDollars(officeUpkeep)} />
          </div>

          {strongestOperations.length === 0 ? (
            <div className="empty-state-card">
              You have not planted a real state organization yet. Open offices in early or swing states to turn ad spend into something sturdier.
            </div>
          ) : (
            <div className="ops-state-list">
              {strongestOperations.map(({ stateName, operation }) => (
                <button
                  key={stateName}
                  type="button"
                  className="ops-state-card"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('politisim-navigate', { detail: { tab: 'map', state: stateName } }));
                  }}
                >
                  <div className="ops-state-top">
                    <strong>{stateName}</strong>
                    <span>Level {operation.officeLevel}</span>
                  </div>
                  <div className="ops-state-meta">
                    <span>{operation.officeReadiness}% ready</span>
                    <span>{operation.volunteerStrength} volunteers</span>
                    <span>{operation.assignedSurrogates.length} surrogates</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="hq-panel">
          <div className="panel-header">
            <div>
              <h3>Surrogate Desk</h3>
              <p>Quick-deploy validators and ticket partners into the states where the map is thinnest.</p>
            </div>
          </div>

          <div className="surrogate-desk">
            {surrogateRoster.length === 0 ? (
              <div className="empty-state-card">
                Your surrogate bench is empty. A running mate, more staff depth, and visible endorsements all expand this desk.
              </div>
            ) : (
              surrogateRoster.map((surrogate) => {
                const assignedState = getAssignedStateForSurrogate(fieldOperations, surrogate.id);
                return (
                  <div key={surrogate.id} className="surrogate-card">
                    <div className="surrogate-card-top">
                      <div>
                        <strong>{surrogate.name}</strong>
                        <span>{surrogate.summary}</span>
                      </div>
                      <div className={`surrogate-status ${assignedState ? 'active' : ''}`}>
                        {assignedState ? assignedState : 'Unassigned'}
                      </div>
                    </div>
                    <div className="surrogate-target-row">
                      {recommendedTargets.slice(0, 3).map((target) => (
                        <button
                          key={`${surrogate.id}-${target.name}`}
                          type="button"
                          className="surrogate-target-btn"
                          onClick={() => deploySurrogate(surrogate.id, target.name)}
                        >
                          Send to {target.name}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      <div className="hq-columns">
        <section className="hq-panel">
          <div className="panel-header">
            <div>
              <h3>Senior Staff</h3>
              <p>Operational hires that stabilize the campaign before the coalition race gets ugly.</p>
            </div>
          </div>

          <div className="staff-grid">
            {AVAILABLE_STAFF.map((staff) => {
              const isHired = hiredStaff.includes(staff.id);
              const canAfford = budget >= staff.cost;

              return (
                <div key={staff.id} className={`staff-card ${isHired ? 'hired' : ''}`}>
                  <div className="staff-icon">{staff.icon}</div>
                  <div className="staff-details">
                    <h3>{staff.name}</h3>
                    <p className="staff-desc">{staff.desc}</p>
                    <div className="staff-footer">
                      <span className="staff-cost">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(staff.cost)}
                      </span>
                      <button
                        className="hire-btn"
                        disabled={isHired || !canAfford}
                        onClick={() => hireStaff(staff.id, staff.cost)}
                      >
                        {isHired ? 'Employed' : canAfford ? 'Hire Staff' : 'Insufficient Funds'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="hq-panel">
          <div className="panel-header">
            <div>
              <h3>Your Coalition</h3>
              <p>These public validators now carry your message into unions, donor rooms, activist networks, and state party machinery.</p>
            </div>
          </div>

          {playerBackers.length === 0 ? (
            <div className="empty-state-card">
              No major endorsers have committed yet. Use cash and stamina to court blocs before rivals lock them down.
            </div>
          ) : (
            <div className="endorsement-grid compact">
              {playerBackers.map((endorsement) => (
                <EndorsementCard key={endorsement.id} endorsement={endorsement} mode="committed" />
              ))}
            </div>
          )}

          {rivalCoalitions.length > 0 && (
            <>
              <div className="subsection-label">Rival Blocs</div>
              <div className="rival-coalition-list">
                {rivalCoalitions.map(({ rival, summary, backers }) => (
                  <div key={rival.id} className="rival-coalition-card">
                    <div className="rival-coalition-header">
                      <strong>{rival.name}</strong>
                      <span>{summary.count} backers | {summary.prestige} prestige</span>
                    </div>
                    <div className="rival-coalition-tags">
                      {backers.slice(0, 3).map((endorsement) => (
                        <span key={endorsement.id}>{endorsement.name}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      <section className="hq-panel">
        <div className="panel-header">
          <div>
            <h3>Open Endorsement Board</h3>
            <p>Track who is available, what they care about, and whether they are leaning toward your campaign or drifting to a rival.</p>
          </div>
        </div>

        <div className="endorsement-grid">
          {unresolvedEndorsements.map(({ endorsement, evaluation }) => {
            const availableNow = currentWeek >= endorsement.availableWeek;
            const canCourt = gamePhase === 'primary'
              && availableNow
              && !activeConvention
              && budget >= endorsement.courtingCost
              && stamina >= endorsement.staminaCost
              && endorsement.lastContactWeek !== currentWeek;

            return (
              <div key={endorsement.id} className={`endorsement-card ${availableNow ? '' : 'locked'}`}>
                <div className="endorsement-top">
                  <div className="endorsement-icon">{endorsement.icon}</div>
                  <div>
                    <div className="endorsement-title">{endorsement.name}</div>
                    <div className="endorsement-subtitle">{endorsement.title}</div>
                  </div>
                  <div className={`endorsement-status ${evaluation.playerLean}`}>
                    {availableNow ? getLeanLabel(evaluation.playerLean) : `Opens W${endorsement.availableWeek}`}
                  </div>
                </div>

                <p className="endorsement-copy">{endorsement.description}</p>

                <div className="endorsement-tags">
                  <span>{endorsement.category.replace('_', ' ')}</span>
                  {endorsement.regions.slice(0, 2).map((region) => <span key={`${endorsement.id}-${region}`}>{region}</span>)}
                  {describePriorityTags(endorsement.priorities).map((tag) => <span key={`${endorsement.id}-${tag}`}>{tag}</span>)}
                </div>

                <div className="endorsement-meta">
                  <span>Courtship cost: {formatCompactDollars(endorsement.courtingCost)}</span>
                  <span>Stamina: -{endorsement.staminaCost}</span>
                </div>

                <div className="endorsement-meter">
                  <div className="endorsement-meter-row">
                    <span>Field leader</span>
                    <strong>{evaluation.standings[0]?.name ?? 'Unclear'}</strong>
                  </div>
                  <div className="endorsement-meter-copy">
                    {availableNow
                      ? `Threshold to decide: ${Math.round(evaluation.threshold)}. This endorsement currently reads as ${getLeanSentence(evaluation.playerLean)}.`
                      : `Still frozen early. This bloc will not move publicly until week ${endorsement.availableWeek}.`}
                  </div>
                </div>

                <button
                  type="button"
                  className="court-btn"
                  disabled={!canCourt}
                  onClick={() => courtEndorsement(endorsement.id)}
                >
                  {!availableNow
                    ? `Available Week ${endorsement.availableWeek}`
                    : activeConvention
                      ? 'Resolve Convention First'
                      : endorsement.lastContactWeek === currentWeek
                        ? 'Already Courted This Week'
                        : gamePhase !== 'primary'
                          ? 'Primary Season Only'
                          : budget < endorsement.courtingCost || stamina < endorsement.staminaCost
                            ? 'Need Cash or Stamina'
                            : 'Court Endorsement'}
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

function SummaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="summary-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <p>{detail}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-metric-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EndorsementCard({ endorsement, mode }: { endorsement: ActiveEndorsement; mode: 'committed' }) {
  return (
    <div className={`endorsement-card ${mode}`}>
      <div className="endorsement-top">
        <div className="endorsement-icon">{endorsement.icon}</div>
        <div>
          <div className="endorsement-title">{endorsement.name}</div>
          <div className="endorsement-subtitle">{endorsement.title}</div>
        </div>
      </div>
      <p className="endorsement-copy">{endorsement.description}</p>
      <div className="endorsement-tags">
        {endorsement.homeStates.slice(0, 3).map((state) => <span key={`${endorsement.id}-${state}`}>{state}</span>)}
        {describePriorityTags(endorsement.priorities).map((tag) => <span key={`${endorsement.id}-${tag}`}>{tag}</span>)}
      </div>
      <div className="endorsement-meta">
        <span>Finance lane: {formatCompactDollars(endorsement.effects.weeklyFundraising)}/wk</span>
        <span>Convention weight: {endorsement.effects.conventionWeight}</span>
      </div>
    </div>
  );
}

function describePriorityTags(priorities: Partial<PlayerDemographics>): string[] {
  return Object.entries(priorities)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)
    .map(([key]) => {
      if (key === 'owner') return 'Business';
      if (key === 'worker') return 'Working class';
      return key.charAt(0).toUpperCase() + key.slice(1);
    });
}

function getLeanLabel(lean: 'strong' | 'lean' | 'competitive' | 'cold') {
  if (lean === 'strong') return 'Leaning to you';
  if (lean === 'lean') return 'Open to you';
  if (lean === 'competitive') return 'Contested';
  return 'Leaning rival';
}

function getLeanSentence(lean: 'strong' | 'lean' | 'competitive' | 'cold') {
  if (lean === 'strong') return 'close to breaking your way';
  if (lean === 'lean') return 'persuadable if you keep investing';
  if (lean === 'competitive') return 'a live fight between campaigns';
  return 'a difficult chase unless the race changes';
}

function formatCompactDollars(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
}
