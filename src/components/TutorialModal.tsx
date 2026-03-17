import React, { useState } from 'react';
import './TutorialModal.css';
import { TUTORIAL_STEPS } from '../core/CampaignGuide';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenGuide: () => void;
}

export const TutorialModal: React.FC<Props> = ({ isOpen, onClose, onOpenGuide }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const step = TUTORIAL_STEPS[stepIndex];
  const isLastStep = stepIndex >= TUTORIAL_STEPS.length - 1;

  if (!isOpen || !step) return null;

  return (
    <div className="tutorial-overlay" onClick={onClose}>
      <div className="tutorial-modal" onClick={(event) => event.stopPropagation()}>
        <div className="tutorial-progress-row">
          <div className="tutorial-step-counter">Step {stepIndex + 1} of {TUTORIAL_STEPS.length}</div>
          <button type="button" className="tutorial-skip-btn" onClick={onClose}>
            Skip for now
          </button>
        </div>

        <div className="tutorial-eyebrow">{step.eyebrow}</div>
        <h2>{step.title}</h2>
        <p className="tutorial-body">{step.body}</p>

        <div className="tutorial-takeaways">
          {step.takeaways.map((takeaway) => (
            <div key={`${step.id}-${takeaway}`} className="tutorial-takeaway-card">
              {takeaway}
            </div>
          ))}
        </div>

        <div className="tutorial-footer">
          <button
            type="button"
            className="tutorial-secondary-btn"
            disabled={stepIndex === 0}
            onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          >
            Back
          </button>

          <div className="tutorial-footer-actions">
            <button
              type="button"
              className="tutorial-secondary-btn"
              onClick={() => {
                onClose();
                onOpenGuide();
              }}
            >
              Open Full Guide
            </button>
            <button
              type="button"
              className="tutorial-primary-btn"
              onClick={() => {
                if (isLastStep) {
                  onClose();
                } else {
                  setStepIndex((current) => Math.min(TUTORIAL_STEPS.length - 1, current + 1));
                }
              }}
            >
              {isLastStep ? 'Start Campaigning' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
