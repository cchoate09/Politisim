declare module 'react-simple-maps' {
  import type { ComponentType, CSSProperties, KeyboardEventHandler, MouseEventHandler, ReactNode } from 'react';

  interface MapGeography {
    rsmKey: string;
    properties: {
      name: string;
    };
  }

  export const ComposableMap: ComponentType<Record<string, unknown>>;
  export const Geographies: ComponentType<{
    geography: string;
    children: (args: { geographies: MapGeography[] }) => ReactNode;
  }>;
  export const Geography: ComponentType<{
    geography: unknown;
    onClick?: MouseEventHandler<SVGPathElement>;
    onKeyDown?: KeyboardEventHandler<SVGPathElement>;
    onMouseEnter?: MouseEventHandler<SVGPathElement>;
    onMouseMove?: MouseEventHandler<SVGPathElement>;
    onMouseLeave?: MouseEventHandler<SVGPathElement>;
    role?: string;
    tabIndex?: number;
    'aria-label'?: string;
    style?: {
      default?: CSSProperties;
      hover?: CSSProperties;
      pressed?: CSSProperties;
    };
  }>;
}
