export interface RenderData {
  eventTitle: string;
  eventType: string;
  venueName?: string;
  venueCity?: string;
  eventDate: string;
  eventTime?: string;
  seat?: string;
  companions?: string;
  userName: string;
  userHandle: string;
  stubNumber: number;
  personalData?: Record<string, any>;
}

export interface StubTemplate {
  id: string;
  name: string;
  eventType: string | string[];
  tier: 'standard' | 'premium';
  width: number;
  height: number;
  colors: {
    background: string;
    accent: string;
    text: string;
    secondary: string;
    border: string;
    muted: string;
  };
  render: (ctx: any, data: RenderData) => void;
}

export type ColorPalette = StubTemplate['colors'];
