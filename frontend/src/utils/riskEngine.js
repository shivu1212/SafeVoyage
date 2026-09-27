/**
 * SafeVoyage Demo Risk Scoring Engine
 * 
 * Computes a 0–100 composite traveler risk index based on:
 * - Weather Risk (0–25 pts)
 * - Health Risk (0–25 pts)
 * - Safety Risk (0–25 pts)
 * - Advisory / Affected Itinerary Risk (0–25 pts)
 */

export function calculateTripRisk({
  advisories = [],
  affectedActivitiesCount = 1,
  weatherCondition = 'Partly Cloudy',
  rainProbability = 45,
  travellers = []
} = {}) {
  // 1. Weather Factor (0–25)
  let weatherScore = 12; // Base coastal score
  if (rainProbability > 60 || weatherCondition.toLowerCase().includes('thunder') || weatherCondition.toLowerCase().includes('surf')) {
    weatherScore = 20;
  } else if (rainProbability < 30) {
    weatherScore = 8;
  }

  // 2. Health Factor (0–25)
  // Check if vulnerable travellers present (Child, Senior, Pregnant)
  let healthScore = 10;
  const hasVulnerable = travellers.some(t => 
    t.specialNeeds?.some(n => ['Senior Citizen', 'Child', 'Pregnant Traveller'].includes(n))
  );
  if (hasVulnerable) {
    healthScore += 5;
  }

  // 3. Safety Factor (0–25)
  let safetyScore = 18;
  const highSeverityAdv = advisories.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
  if (highSeverityAdv.length > 0) {
    safetyScore = 24;
  }

  // 4. Advisory & Affected Itinerary Factor (0–25)
  let advisoryScore = 0;
  if (affectedActivitiesCount > 0) {
    advisoryScore = 20 + Math.min(affectedActivitiesCount * 2, 5);
  } else if (advisories.length > 0) {
    advisoryScore = 10;
  }

  const totalScore = Math.min(100, Math.max(0, weatherScore + healthScore + safetyScore + advisoryScore));

  let level = 'LOW';
  let badgeColor = 'safe';
  let color = '#10B981';

  if (totalScore >= 81) {
    level = 'CRITICAL';
    badgeColor = 'danger';
    color = '#991B1B';
  } else if (totalScore >= 61) {
    level = 'HIGH';
    badgeColor = 'danger';
    color = '#EF4444';
  } else if (totalScore >= 31) {
    level = 'MODERATE';
    badgeColor = 'caution';
    color = '#F59E0B';
  }

  const reasons = [];
  if (highSeverityAdv.length > 0) {
    reasons.push(`${highSeverityAdv.length} active high-severity coastal safety advisory`);
  }
  if (affectedActivitiesCount > 0) {
    reasons.push(`${affectedActivitiesCount} itinerary activity directly mapped to risk zone`);
  }
  if (weatherScore >= 18) {
    reasons.push('Elevated ocean swells and monsoon precipitation potential');
  }
  if (hasVulnerable) {
    reasons.push('Special precautions recommended for senior & child co-travellers');
  }

  return {
    score: totalScore,
    level,
    badgeColor,
    color,
    breakdown: {
      weather: { score: weatherScore, max: 25, label: weatherScore > 15 ? 'MODERATE' : 'LOW' },
      health: { score: healthScore, max: 25, label: healthScore > 12 ? 'MODERATE' : 'LOW' },
      safety: { score: safetyScore, max: 25, label: safetyScore > 20 ? 'HIGH' : 'MODERATE' },
      advisory: { score: advisoryScore, max: 25, label: advisoryScore > 15 ? 'HIGH' : 'LOW' }
    },
    reasons,
    disclaimer: 'SafeVoyage Demo Risk Score (Normalized composite model for hackathon evaluation)'
  };
}
