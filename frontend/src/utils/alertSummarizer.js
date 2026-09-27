/**
 * SafeVoyage Plain-Language Alert Summarizer
 * 
 * Converts technical meteorological/geological bulletins into actionable traveler guidance.
 */

export function summarizeAdvisory(advisory, affectedActivity = null) {
  if (!advisory) return '';

  const { type, city, category, description, recommendation } = advisory;

  if (affectedActivity) {
    return {
      title: `${type} Alert for ${affectedActivity.place}`,
      plainSummary: `High waves and hazardous currents are reported near ${affectedActivity.place} in ${city}. Your scheduled Day ${affectedActivity.day} visit at ${affectedActivity.time} falls directly in the affected timeframe.`,
      recommendation: recommendation || `We advise postponing your ${category.toLowerCase()} activity and relocating to safer inland landmarks.`,
      urgency: advisory.severity === 'HIGH' || advisory.severity === 'CRITICAL' ? 'Immediate Action Advised' : 'Monitor Updates'
    };
  }

  // General advisory summary
  return {
    title: `${type} in ${city}`,
    plainSummary: description || `Safety advisory issued for ${city} concerning ${category.toLowerCase()} activities.`,
    recommendation: recommendation || 'Check local updates and observe posted safety warning flags.',
    urgency: advisory.severity === 'HIGH' ? 'High Caution' : 'Informational'
  };
}
