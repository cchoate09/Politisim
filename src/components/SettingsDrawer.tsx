import React from 'react';
import './SettingsDrawer.css';
import { DEFAULT_SETTINGS, useSettingsStore, type AnimationLevel, type MapPalette } from '../store/settingsStore';

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const ANIMATION_LEVELS: Array<{ id: AnimationLevel; label: string; description: string }> = [
  { id: 'full', label: 'Full Motion', description: 'Keep the full cinematic pulse, hover lifts, and animated urgency.' },
  { id: 'reduced', label: 'Reduced Motion', description: 'Keep transitions gentle and strip out the more aggressive motion effects.' },
  { id: 'minimal', label: 'Minimal Motion', description: 'Prefer a calmer interface with most decorative animation removed.' }
];

const MAP_PALETTES: Array<{ id: MapPalette; label: string; description: string }> = [
  { id: 'standard', label: 'Standard', description: 'Classic blue-red map with amber toss-ups.' },
  { id: 'colorblind', label: 'Colorblind Safe', description: 'Higher-separation hues with stronger neutral state contrast.' },
  { id: 'high_contrast', label: 'High Contrast', description: 'Sharper contrast for battleground reading on bright or low-vision setups.' }
];

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ isOpen, onClose }) => {
  const settings = useSettingsStore();
  const {
    updateSettings,
    resetSettings
  } = settings;

  const handleReset = () => {
    resetSettings();
  };

  return (
    <div className={`settings-overlay ${isOpen ? 'open' : ''}`} aria-hidden={!isOpen}>
      <div className="settings-backdrop" onClick={onClose} />
      <aside className="settings-drawer" role="dialog" aria-modal="true" aria-label="Settings and accessibility">
        <div className="settings-header">
          <div>
            <p className="settings-kicker">Settings</p>
            <h2>Audio, Accessibility, and Presentation</h2>
            <p className="settings-copy">
              Tune the campaign room to how you like to play. These preferences persist across runs.
            </p>
          </div>
          <button type="button" className="settings-close" onClick={onClose}>
            Close
          </button>
        </div>

        <section className="settings-section">
          <div className="settings-section-header">
            <div>
              <h3>Audio Mix</h3>
              <p>Enable the procedural soundtrack and action feedback, or dial everything to a quieter desk.</p>
            </div>
          </div>

          <div className="settings-toggle-grid">
            <ToggleRow
              label="Music"
              description="Ambient scene music for menus, debates, campaign phases, and election night."
              checked={settings.musicEnabled}
              onChange={(checked) => updateSettings({ musicEnabled: checked })}
            />
            <ToggleRow
              label="Sound Effects"
              description="Feedback for advancing the week, debate prompts, state calls, and major events."
              checked={settings.sfxEnabled}
              onChange={(checked) => updateSettings({ sfxEnabled: checked })}
            />
          </div>

          <div className="settings-slider-grid">
            <SliderRow
              label="Master Volume"
              value={settings.masterVolume}
              onChange={(value) => updateSettings({ masterVolume: value })}
            />
            <SliderRow
              label="Music Volume"
              value={settings.musicVolume}
              onChange={(value) => updateSettings({ musicVolume: value })}
            />
            <SliderRow
              label="Effects Volume"
              value={settings.sfxVolume}
              onChange={(value) => updateSettings({ sfxVolume: value })}
            />
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-header">
            <div>
              <h3>Accessibility</h3>
              <p>Keep the map readable, reduce sensory load, and make the interface easier to parse quickly.</p>
            </div>
          </div>

          <div className="settings-toggle-grid">
            <ToggleRow
              label="Gameplay Hints"
              description="Show dashboard coaching, tooltip help, and other system explanations."
              checked={settings.gameplayHints}
              onChange={(checked) => updateSettings({ gameplayHints: checked })}
            />
            <ToggleRow
              label="High Contrast Panels"
              description="Increase panel separation and brighten core text for easier scanning."
              checked={settings.highContrast}
              onChange={(checked) => updateSettings({ highContrast: checked })}
            />
          </div>

          <div className="settings-slider-grid">
            <SliderRow
              label="UI Scale"
              value={settings.uiScale}
              min={90}
              max={125}
              step={5}
              suffix="%"
              onChange={(value) => updateSettings({ uiScale: value })}
            />
          </div>

          <div className="settings-option-grid">
            {MAP_PALETTES.map((palette) => (
              <button
                key={palette.id}
                type="button"
                className={`settings-option-card ${settings.mapPalette === palette.id ? 'selected' : ''}`}
                onClick={() => updateSettings({ mapPalette: palette.id })}
              >
                <strong>{palette.label}</strong>
                <span>{palette.description}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <div className="settings-section-header">
            <div>
              <h3>Motion and Focus</h3>
              <p>Adjust how energetic the shell feels and how aggressively the UI animates game state changes.</p>
            </div>
          </div>

          <div className="settings-option-grid">
            {ANIMATION_LEVELS.map((level) => (
              <button
                key={level.id}
                type="button"
                className={`settings-option-card ${settings.animationLevel === level.id ? 'selected' : ''}`}
                onClick={() => updateSettings({ animationLevel: level.id })}
              >
                <strong>{level.label}</strong>
                <span>{level.description}</span>
              </button>
            ))}
          </div>
        </section>

        <div className="settings-footer">
          <button
            type="button"
            className="settings-reset"
            disabled={JSON.stringify(DEFAULT_SETTINGS) === JSON.stringify({
              masterVolume: settings.masterVolume,
              musicVolume: settings.musicVolume,
              sfxVolume: settings.sfxVolume,
              musicEnabled: settings.musicEnabled,
              sfxEnabled: settings.sfxEnabled,
              uiScale: settings.uiScale,
              mapPalette: settings.mapPalette,
              animationLevel: settings.animationLevel,
              gameplayHints: settings.gameplayHints,
              highContrast: settings.highContrast
            })}
            onClick={handleReset}
          >
            Reset to Defaults
          </button>
        </div>
      </aside>
    </div>
  );
};

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="settings-toggle-row">
      <div>
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function SliderRow({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  suffix = '%'
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="settings-slider-row">
      <div className="settings-slider-top">
        <span>{label}</span>
        <strong>{value}{suffix}</strong>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
