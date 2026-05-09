export type IncidentType = 'penalty' | 'red_card' | 'disallowed_goal'

const SEVERITY: Record<IncidentType, number> = {
  penalty:          1.0,
  disallowed_goal:  1.0,
  red_card:         0.8,
}

export function getTimeWeight(minute: number): number {
  if (minute >= 85) return 2.0
  if (minute >= 70) return 1.5
  return 1.0
}

export function calcPIV(type: IncidentType, minute: number, gameState: number): number {
  return SEVERITY[type] * getTimeWeight(minute) + gameState
}
