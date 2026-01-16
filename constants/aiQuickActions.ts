
export interface QuickAction {
  id: string;
  icon: string;
  title: string;
  prompt: string;
  requiresImage?: boolean;
  isPremium?: boolean;
}

export const quickActions: QuickAction[] = [
  {
    id: 'crop-recommendation',
    icon: '🌱',
    title: 'Crop Recommendations',
    prompt: 'Based on my farm location and current season, what crops would you recommend I plant?',
    isPremium: true,
  },
  {
    id: 'identify-plant-issues',
    icon: '🔍',
    title: 'Identify Plant Issues',
    prompt: 'I need help diagnosing a problem with my crops. Can you help me identify what might be wrong?',
    isPremium: true,
  },
  {
    id: 'weather-insights',
    icon: '🌤️',
    title: 'Weather Insights',
    prompt: 'Show me the weather forecast and suggest tasks I should complete based on upcoming conditions.',
    isPremium: true,
  },
  {
    id: 'personalized-advice',
    icon: '👨‍🌾',
    title: 'Personalized Advice',
    prompt: 'Can you provide personalized advice for my farm based on my current crops and fields?',
    isPremium: true,
  },
];
