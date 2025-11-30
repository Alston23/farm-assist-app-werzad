
export type ModalDemo = {
  color: string;
  description: string;
  route: string;
  title: string;
};

export const homeData: ModalDemo[] = [
  {
    color: '#6B8E23',
    title: 'Crop Database',
    description: 'Browse and manage your comprehensive crop database',
    route: '/(tabs)/crops',
  },
  {
    color: '#4ECDC4',
    title: 'Field Management',
    description: 'Organize and track your fields and planting areas',
    route: '/(tabs)/fields',
  },
  {
    color: '#FFB6C1',
    title: 'Plantings',
    description: 'Plan and monitor your current plantings',
    route: '/(tabs)/plantings',
  },
  {
    color: '#FF6B6B',
    title: 'Schedule',
    description: 'View upcoming tasks and harvest dates',
    route: '/(tabs)/schedule',
  },
  {
    color: '#D4A574',
    title: 'Revenue Tracking',
    description: 'Estimate revenue and track farm profitability',
    route: '/(tabs)/revenue',
  },
];
