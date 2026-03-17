import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import './AnalyticsDashboard.css';
import { useGameStore } from '../store/gameStore';
import type { PlayerDemographics } from '../core/ElectionMath';
import { CandidateIdentityCard } from './CandidateIdentityCard';

export const AnalyticsDashboard: React.FC = () => {
  const { nationalPollingHistory, primaryFieldHistory, primaryFieldAverages, states, pollingData, playerIdeology, gamePhase, voterParty, rivalAIs, playerName } = useGameStore();
  const latestNationalSnapshot = nationalPollingHistory[nationalPollingHistory.length - 1];
  const fieldPalette = ['#38bdf8', '#f97316', '#f43f5e', '#34d399', '#f6c453'];
  const lineCandidates = primaryFieldAverages.length > 0
    ? primaryFieldAverages
    : [
        { candidateId: 'player', name: playerName, share: 0, delegates: 0, status: 'player' as const },
        ...rivalAIs.slice(0, 4).map((rival) => ({
          candidateId: rival.id,
          name: rival.name,
          share: 0,
          delegates: 0,
          status: rival.status
        }))
      ];
  const fieldChartData = primaryFieldHistory.map((entry) => {
    const chartRow: Record<string, number | string> = { week: entry.week };
    lineCandidates.forEach((candidate) => {
      chartRow[candidate.candidateId] = entry.standings.find((standing) => standing.candidateId === candidate.candidateId)?.share ?? 0;
    });
    return chartRow;
  });

  // Calculate ACTUAL weighted national support by demographic trait
  // For each trait, average the player polling in states where that trait is above 50 (strong presence)
  const traitNames: Array<keyof PlayerDemographics> = ['worker', 'owner', 'religious', 'libertarian', 'liberal', 'immigrant'];
  const demographicData = traitNames.map(trait => {
    const relevantStates = states.filter(s => s[trait] > 50);
    if (relevantStates.length === 0) return { name: trait, support: playerIdeology[trait] };

    const totalEV = relevantStates.reduce((sum, s) => sum + s.delegatesOrEV, 0);
    const weightedSupport = relevantStates.reduce((sum, s) => {
      const poll = pollingData[s.stateName];
      return sum + (poll ? poll.player * s.delegatesOrEV : 0);
    }, 0);

    return {
      name: trait === 'owner' ? 'Business Owners' : trait === 'worker' ? 'Working Class' : trait.charAt(0).toUpperCase() + trait.slice(1),
      support: Math.round((weightedSupport / totalEV) * 10) / 10
    };
  });

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header">
        <h2>Campaign Data Center</h2>
        <p>Review national polling trends and demographic performance across the full national map.</p>
      </div>

      <div className="chart-grid">
        {/* National Polling Trend */}
        <div className="chart-card">
          <h3>National Polling Average</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={nationalPollingHistory} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" stroke="var(--text-muted)" />
              <YAxis stroke="var(--text-muted)" domain={[0, 60]} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.1)' }}
                itemStyle={{ color: 'var(--text-main)' }}
              />
              <Legend />
              <Line type="monotone" dataKey="player" name="Your Campaign" stroke="var(--primary-accent)" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="rival" name="Opposition" stroke="var(--secondary-accent)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Polling by Demographic Strongholds (Tier 4 #2) */}
        <div className="chart-card">
          <h3>Polling by Demographic Strongholds</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '0.5rem' }}>
            Your EV-weighted polling average in states where each demographic is dominant (above 50%).
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={demographicData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" stroke="var(--text-muted)" domain={[0, 70]} />
              <YAxis dataKey="name" type="category" stroke="var(--text-muted)" width={120} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.1)' }}
              />
              <Bar dataKey="support" name="Avg. Polling %" fill="var(--primary-accent)" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {gamePhase === 'primary' && lineCandidates.length > 0 && (
        <>
          <div className="chart-card" style={{ marginTop: '2rem' }}>
            <h3>National Primary Field</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-0.4rem', marginBottom: '0.9rem' }}>
              Weighted by delegates at stake, so crowded-state polling now reflects the full field instead of a single rival proxy.
            </p>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={fieldChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" stroke="var(--text-muted)" />
                <YAxis stroke="var(--text-muted)" domain={[0, 60]} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid rgba(255,255,255,0.1)' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Legend />
                {lineCandidates.map((candidate, index) => (
                  <Line
                    key={candidate.candidateId}
                    type="monotone"
                    dataKey={candidate.candidateId}
                    name={candidate.name}
                    stroke={fieldPalette[index % fieldPalette.length]}
                    strokeWidth={candidate.candidateId === 'player' ? 3 : 2}
                    dot={{ r: candidate.candidateId === 'player' ? 4 : 2 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="chart-card" style={{ marginTop: '1.5rem' }}>
            <h3>Current Candidate Standing</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
              {lineCandidates.map((candidate) => {
                const rival = rivalAIs.find((entry) => entry.id === candidate.candidateId);
                return (
                  <CandidateIdentityCard
                    key={candidate.candidateId}
                    name={candidate.name}
                    subtitle={candidate.candidateId === 'player' ? 'Your campaign' : rival?.tagline ?? 'Primary rival'}
                    tagline={candidate.candidateId === 'player'
                      ? 'National field average and delegate-weighted standing'
                      : rival?.strengths[0] ?? 'Crowded field contender'}
                    party={voterParty}
                    compact
                    chips={candidate.candidateId === 'player' ? [] : (rival?.issueBrands ?? []).slice(0, 2)}
                    stats={[
                      { label: 'National avg', value: `${candidate.share.toFixed(1)}%` },
                      { label: 'Status', value: candidate.status === 'player' ? 'Active' : candidate.status }
                    ]}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Pathway to Victory (New Section) */}
      <div className="chart-card" style={{ marginTop: '2rem', background: 'rgba(56, 189, 248, 0.03)', border: '1px solid rgba(56, 189, 248, 0.1)' }}>
        <h3 style={{ color: 'var(--primary-accent)' }}>Pathway to Victory</h3>
        <p style={{ fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Strategic analysis of the closest races and the delegates remaining to reach your target.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Closest Opportunities</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {states
                .filter(s => {
                  const poll = pollingData[s.stateName];
                  return poll && Math.abs(poll.player - poll.rival) < 8; // Closest races
                })
                .sort((a, b) => {
                  const pollA = pollingData[a.stateName];
                  const pollB = pollingData[b.stateName];
                  return Math.abs(pollA.player - pollA.rival) - Math.abs(pollB.player - pollB.rival);
                })
                .slice(0, 5)
                .map(s => {
                  const poll = pollingData[s.stateName];
                  const margin = poll.player - poll.rival;
                  const stateValue = gamePhase === 'primary'
                    ? voterParty === 'Democrat' ? s.demDelegates : s.repDelegates
                    : s.delegatesOrEV;
                  return (
                    <div key={s.stateName} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span>{s.stateName} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({stateValue} {gamePhase === 'primary' ? 'Del' : 'EV'})</span></span>
                      <span style={{ color: margin >= 0 ? 'var(--primary-accent)' : 'var(--secondary-accent)', fontWeight: 'bold' }}>
                        {margin >= 0 ? '+' : ''}{margin.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(56, 189, 248, 0.05)', borderRadius: '12px' }}>
            <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--primary-accent)' }}>Strategic Summary</h4>
            <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
              {latestNationalSnapshot && latestNationalSnapshot.player > latestNationalSnapshot.rival
                ? "You currently hold a national lead. Focus on defending your narrowest advantage states before the map swings back."
                : "The race is tightening. Prioritize your closest high-value states first and shore up thematically aligned regions before the opposition hardens." 
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
