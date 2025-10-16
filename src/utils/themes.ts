import { Theme } from '../types';

export const themes = {
  classic: {
    name: 'Iron Man Classic',
    primary: '#dc2626',
    secondary: '#fbbf24',
    accent: '#ef4444',
    glow: 'rgba(220, 38, 38, 0.5)',
    background: 'from-red-950 via-gray-900 to-yellow-950',
  },
  'arc-reactor': {
    name: 'Arc Reactor Blue',
    primary: '#06b6d4',
    secondary: '#3b82f6',
    accent: '#22d3ee',
    glow: 'rgba(6, 182, 212, 0.5)',
    background: 'from-gray-900 via-blue-950 to-black',
  },
  stealth: {
    name: 'Stealth Mode',
    primary: '#6b7280',
    secondary: '#9ca3af',
    accent: '#d1d5db',
    glow: 'rgba(156, 163, 175, 0.5)',
    background: 'from-gray-950 via-gray-900 to-black',
  },
  mark85: {
    name: 'Mark 85',
    primary: '#dc2626',
    secondary: '#3b82f6',
    accent: '#fbbf24',
    glow: 'rgba(220, 38, 38, 0.5)',
    background: 'from-red-950 via-blue-950 to-gray-900',
  },
  'war-machine': {
    name: 'War Machine',
    primary: '#4b5563',
    secondary: '#1f2937',
    accent: '#9ca3af',
    glow: 'rgba(75, 85, 99, 0.5)',
    background: 'from-gray-800 via-gray-900 to-black',
  },
};

export const getTheme = (theme: Theme) => themes[theme];
