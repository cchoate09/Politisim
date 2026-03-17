import React from 'react';
import './BudgetAllocationView.css';
import { useGameStore } from '../store/gameStore';

export const BudgetAllocationView: React.FC = () => {
  const { budget, publicTrust, addBudget, fundraisingStreakWeeks, pacFundraisedThisWeek } = useGameStore();

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(budget);

  // Calculate current efficiency for UI feedback
  const fatigueLevel = fundraisingStreakWeeks + (pacFundraisedThisWeek ? 1 : 0);
  const efficiency = Math.max(0.1, 0.9 - (fatigueLevel * 0.3));
  const donorFatigueActive = fatigueLevel > 0;

  return (
    <div className="budget-view">
      <div className="budget-header">
        <h2>Campaign Finance</h2>
        <p>Manage your war chest. Repeated high-dollar fundraising burns through donor goodwill fast, while weekly overhead keeps the pressure on.</p>
        {donorFatigueActive && (
          <div style={{
            display: 'inline-block',
            background: 'rgba(210, 153, 34, 0.2)',
            color: '#d29922',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.85rem',
            fontWeight: 'bold',
            marginTop: '0.5rem'
          }}>
            ⚠️ Donor fatigue active — efficiency: {Math.round(efficiency * 100)}%
          </div>
        )}
      </div>

      <div className="finance-metrics">
        <div className="metric-card">
          <div className="metric-label">Current War Chest</div>
          <div className="metric-value" style={{ color: '#2ea043' }}>{formattedBudget}</div>
        </div>

        <div className="metric-card">
          <div className="metric-label">Public Trust</div>
          <div className="metric-value" style={{ color: publicTrust < 40 ? 'var(--secondary-accent)' : 'var(--text-main)' }}>
            {publicTrust}%
          </div>
          <div style={{ marginTop: '0.5rem' }}>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{
                width: `${publicTrust}%`,
                background: publicTrust > 60 ? '#2ea043' : publicTrust > 30 ? '#d29922' : '#f85149'
              }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="funding-options">
        <div className="funding-card">
          <h3>Grassroots Drive</h3>
          <p>
            Launch an email and text message campaign targeting small-dollar donors.
            Yields modest funds without damaging your candidate's reputation as a populist.
          </p>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            <span style={{ color: '#2ea043', fontWeight: 'bold' }}>+$50,000</span>
          </div>
          <button
            className="fund-btn btn-grassroots"
            onClick={() => addBudget(50000, false)}
          >
            Launch Drive
          </button>
        </div>

        <div className="funding-card">
          <h3>Super PAC Dinner</h3>
          <p>
            Attend a closed-door dinner with Wall Street executives and corporate lobbyists.
            Yields massive funding, but it cuts deeply into public trust and gets less efficient if you keep going back to the same donor class.
          </p>
          <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            <span style={{ color: '#2ea043', fontWeight: 'bold' }}>+${Math.floor(500000 * efficiency / 1000)}K</span>
            <br />
            <span style={{ color: 'var(--secondary-accent)', fontSize: '0.9rem' }}>-8 Public Trust</span>
          </div>
          <button
            className="fund-btn btn-pac"
            onClick={() => addBudget(500000, true)}
          >
            Attend Dinner
          </button>
        </div>
      </div>
    </div>
  );
};
