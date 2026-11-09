// Team id of the API → color of the stripe on the driver cards, for the teams of 2026
const TEAM_COLORS: Record<string, string> = {
  alpine: '#0093cc',
  aston_martin: '#229971',
  audi: '#a7acb1',
  cadillac: '#c8a84b',
  ferrari: '#e8002d',
  haas: '#ffffff',
  mclaren: '#ff8000',
  mercedes: '#27f4d2',
  rb: '#6692ff',
  red_bull: '#3671c6',
  williams: '#64c4ff',
}

const UNKNOWN_TEAM_COLOR = '#5a5a64'

/** The color of the team, or a neutral grey for an unknown team or a driver without a team. */
export function teamColor(teamId: string | undefined): string {
  return (teamId && TEAM_COLORS[teamId]) || UNKNOWN_TEAM_COLOR
}
