import React, { memo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import './USAMap.css';
import { useGameStore } from '../store/gameStore';

const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface MapGeography {
  rsmKey: string;
  properties: {
    name: string;
  };
}

interface USAMapProps {
  onStateClick: (stateName: string) => void;
  activeStateName?: string;
}

const USAMapComponent: React.FC<USAMapProps> = ({ onStateClick, activeStateName }) => {
  const { pollingData, states } = useGameStore();
  const [tooltip, setTooltip] = React.useState<{ content: string; x: number; y: number } | null>(null);
  
  const getStateFill = (stateName: string, isActive: boolean) => {
    if (isActive) return 'var(--primary-accent)';

    // Find state in store to ensure name matching
    const state = states.find(s => s.stateName.toLowerCase() === stateName.toLowerCase());
    const poll = state ? pollingData[state.stateName] : pollingData[stateName];
    
    if (!poll) return 'rgba(255, 255, 255, 0.07)';

    const margin = poll.player - poll.rival;

    if (margin > 10) return 'rgba(56, 189, 248, 0.6)';      // Strong player lead - blue
    if (margin > 3) return 'rgba(56, 189, 248, 0.35)';       // Lean player - light blue
    if (margin > -3) return 'rgba(168, 85, 247, 0.4)';       // Toss-up - purple
    if (margin > -10) return 'rgba(239, 68, 68, 0.35)';      // Lean rival - light red
    return 'rgba(239, 68, 68, 0.6)';                          // Strong rival lead - red
  };

  return (
    <div className="usa-map-container">
      <ComposableMap projection="geoAlbersUsa" projectionConfig={{ scale: 1000 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }: { geographies: MapGeography[] }) =>
            geographies.map((geo) => {
              const stateName = geo.properties.name;
              const isActive = stateName === activeStateName;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onClick={() => onStateClick(stateName)}
                  onMouseEnter={() => {
                    const state = states.find(s => s.stateName === stateName);
                    const poll = state ? pollingData[state.stateName] : null;
                    if (poll) {
                      setTooltip({
                        content: `${stateName}: Support ${poll.player.toFixed(1)}% | Turnout ${poll.turnout.toFixed(1)}%`,
                        x: 0, y: 0 // Will update on move
                      });
                    }
                  }}
                  onMouseMove={(e: React.MouseEvent) => {
                    if (tooltip) {
                      setTooltip({ ...tooltip, x: e.clientX, y: e.clientY });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  style={{
                    default: {
                      fill: getStateFill(stateName, isActive),
                      stroke: 'rgba(255, 255, 255, 0.25)',
                      strokeWidth: 0.8,
                      outline: 'none',
                    },
                    hover: {
                      fill: isActive ? 'var(--primary-accent)' : 'rgba(59, 130, 246, 0.6)',
                      stroke: '#fff',
                      strokeWidth: 1.5,
                      outline: 'none',
                      cursor: 'pointer'
                    },
                    pressed: {
                      fill: 'var(--primary-accent)',
                      outline: 'none',
                    },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-item"><span className="legend-dot" style={{ background: 'rgba(56, 189, 248, 0.6)' }}></span> Strong Lead</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: 'rgba(56, 189, 248, 0.35)' }}></span> Lean</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: 'rgba(168, 85, 247, 0.4)' }}></span> Toss-up</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: 'rgba(239, 68, 68, 0.35)' }}></span> Rival Lean</div>
        <div className="legend-item"><span className="legend-dot" style={{ background: 'rgba(239, 68, 68, 0.6)' }}></span> Rival Lead</div>
      </div>

      {tooltip && (
        <div style={{
          position: 'fixed',
          top: tooltip.y + 15,
          left: tooltip.x + 15,
          background: 'var(--bg-card)',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '8px 12px',
          borderRadius: '4px',
          pointerEvents: 'none',
          zIndex: 1000,
          fontSize: '0.8rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
          color: 'var(--text-main)',
          whiteSpace: 'nowrap'
        }}>
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

export const USAMap = memo(USAMapComponent);
