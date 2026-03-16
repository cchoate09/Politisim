import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import './AnalyticsDashboard.css';
import { useGameStore } from '../store/gameStore';

export const AnalyticsDashboard: React.FC = () => {
  const { nationalPollingHistory, states, pollingData, playerIdeology } = useGameStore();

  // Calculate ACTUAL weighted national support by demographic trait
  // For each trait, average the player polling in states where that trait is above 50 (strong presence)
  const traitNames: (keyof typeof playerIdeology)[] = ['worker', 'owner', 'religious', 'libertarian', 'liberal', 'immigrant'];
  const demographicData = traitNames.map(trait => {
    const relevantStates = states.filter(s => (s as any)[trait] > 50);
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
        <p>Review national polling trends and demographic performance across all 50 states.</p>
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
              <Line type="monotone" dataKey="rival" name="Rival Nominee" stroke="var(--secondary-accent)" strokeWidth={3} dot={{ r: 4 }} />
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
                  return (
                    <div key={s.stateName} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                      <span>{s.stateName} <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({s.delegatesOrEV} Del)</span></span>
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
              {nationalPollingHistory.length > 0 && nationalPollingHistory[0].player > nationalPollingHistory[0].rival 
                ? "You currently hold a national lead. Focus on defending 'Lean' states in the Midwest and South to secure your delegate floor."
                : "The race is tightening. To overcome the rival lead, prioritize high-EV swing states like Florida and Pennsylvania where your 'worker' demographic support is trending upward."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
