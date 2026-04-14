export const PSL_TEAMS = [
  { id: 0, name: 'Islamabad United', short: 'ISL' },
  { id: 1, name: 'Karachi Kings', short: 'KAR' },
  { id: 2, name: 'Lahore Qalandars', short: 'LHR' },
  { id: 3, name: 'Multan Sultans', short: 'MUL' },
  { id: 4, name: 'Peshawar Zalmi', short: 'PSH' },
  { id: 5, name: 'Quetta Gladiators', short: 'QUE' },
  { id: 6, name: 'Hyderabad Kingsmen', short: 'HYD' },
  { id: 7, name: 'Rawalpindi Pindiz', short: 'RWP' },
] as const;

export type Team = (typeof PSL_TEAMS)[number];
export type TeamId = Team['id'];
