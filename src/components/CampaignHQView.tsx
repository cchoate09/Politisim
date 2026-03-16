import React from 'react';
import './CampaignHQView.css';
import { useGameStore } from '../store/gameStore';

const AVAILABLE_STAFF = [
  {
    id: 'data_analyst',
    name: 'Chief Data Analyst',
    cost: 150000,
    desc: 'Optimizes ad targeting logic. Substantially increases the polling impact of Internet and TV ads nationwide (-25% staff penalty on formulas).',
    icon: '📊'
  },
  {
    id: 'field_organizer',
    name: 'National Field Organizer',
    cost: 100000,
    desc: 'Doubles the effectiveness of holding Local Rallies. Great for campaign loops focusing heavily on key swing states vs national airwaves.',
    icon: '🤝'
  },
  {
    id: 'pr_manager',
    name: 'Crisis PR Manager',
    cost: 200000,
    desc: 'Reduces the natural decay of Campaign Momentum every week from -5 to -2. Ensures your hype survives until election day.',
    icon: '🛡️'
  }
];

export const CampaignHQView: React.FC = () => {
  const { hiredStaff, hireStaff, budget } = useGameStore();

  const formattedBudget = new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits: 0
  }).format(budget);

  return (
    <div className="campaign-hq-view">
      <div className="hq-header">
        <h2>Campaign HQ & Staff</h2>
        <p>Recruit senior staff to grant permanent passive boosts to your campaign engine.</p>
        <div className="hq-budget">Campaign Funds: {formattedBudget}</div>
      </div>

      <div className="staff-grid">
        {AVAILABLE_STAFF.map(staff => {
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
    </div>
  );
};
