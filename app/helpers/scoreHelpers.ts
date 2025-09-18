import { type TransportMode } from '@/lib/routing-schema';

export interface CommuteScore {
  mode: TransportMode;
  time: number; // in seconds
  distance: number; // in meters
  timeFormatted: string;
  distanceFormatted: string;
  score: number;
}

/**
 * Calculate commute score based on time and distance
 * Score ranges from 0-100, with higher scores being better
 */
export const calculateCommuteScore = (
  timeInSeconds: number, 
  distanceInMeters: number, 
  mode: TransportMode
): number => {
  // Base scoring - lower time and reasonable distance = higher score
  let score = 100;
  
  // Time penalty - anything over 30 minutes starts losing points rapidly
  const timeInMinutes = timeInSeconds / 60;
  if (timeInMinutes > 30) {
    score -= (timeInMinutes - 30) * 2; // -2 points per minute over 30
  } else if (timeInMinutes > 20) {
    score -= (timeInMinutes - 20) * 1; // -1 point per minute over 20
  }
  
  // Distance penalty - very long distances lose points
  const distanceInKm = distanceInMeters / 1000;
  if (distanceInKm > 25) {
    score -= (distanceInKm - 25) * 1.5; // -1.5 points per km over 25
  }
  
  // Mode-specific adjustments
  switch (mode) {
    case 'bike':
      // Biking gets bonus points for health/environment, but distance matters more
      score += 10;
      if (distanceInKm > 15) score -= (distanceInKm - 15) * 3; // Biking long distances is hard
      break;
    case 'walk':
      // Walking gets big bonus but only practical for short distances
      score += 15;
      if (distanceInKm > 3) score -= (distanceInKm - 3) * 10; // Walking far is impractical
      break;
    case 'drive':
      // Driving is reliable but no bonus points
      break;
    case 'transit':
      // Transit gets environmental bonus
      score += 8;
      break;
  }
  
  // Ensure score stays within 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
};

/**
 * Get color for score display
 */
export const getScoreColor = (score: number): string => {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-yellow-600';
  if (score >= 60) return 'text-orange-600';
  return 'text-red-600';
};

/**
 * Get ring color for circular score display
 */
export const getScoreRingColor = (score: number): string => {
  if (score >= 90) return '#16a34a'; // green-600
  if (score >= 80) return '#2563eb'; // blue-600
  if (score >= 70) return '#ca8a04'; // yellow-600
  if (score >= 60) return '#ea580c'; // orange-600
  return '#dc2626'; // red-600
};

/**
 * Get user-friendly transport mode name
 */
export const getTransportModeName = (mode: TransportMode): string => {
  switch (mode) {
    case 'drive':
      return 'Driving';
    case 'bike':
      return 'Biking';
    case 'walk':
      return 'Walking';
    case 'transit':
      return 'Transit';
    default:
      return mode;
  }
};

/**
 * Calculate overall commute score from multiple transport modes
 */
export const calculateOverallScore = (scores: CommuteScore[]): number => {
  if (scores.length === 0) return 0;
  
  // Weight scores by mode preference (higher weight = more important for overall score)
  const modeWeights: Partial<Record<TransportMode, number>> = {
    drive: 1.0,    // Standard weight
    transit: 1.2,  // Slightly higher weight for environmental benefit
    bike: 1.1,     // Slight bonus for health/environment
    walk: 0.8,     // Lower weight since walking isn't practical for long distances
    // truck and taxi are not commonly used for commuting, so no weights
  };
  
  let weightedSum = 0;
  let totalWeight = 0;
  
  scores.forEach(scoreData => {
    const weight = modeWeights[scoreData.mode] || 1.0;
    weightedSum += scoreData.score * weight;
    totalWeight += weight;
  });
  
  return Math.round(weightedSum / totalWeight);
};