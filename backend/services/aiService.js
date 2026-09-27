/**
 * SafeVoyage Unified AI Travel Safety Intelligence Service
 * 
 * Supports:
 * - Groq Cloud API (openai/gpt-oss-20b, qwen/qwen3.8-27b)
 * - Google Gemini API (gemini-1.5-flash, gemini-2.0-flash)
 * - OpenAI API (gpt-4o-mini)
 * 
 * Enforces Strict Safety Grounding:
 * The AI MUST NOT invent safety statuses; it strictly interprets deterministic data.
 */

function buildSystemInstruction(context = {}) {
  const {
    trip = {},
    travellers = [],
    itinerary = [],
    advisories = [],
    matchingResults = {},
    weather = {},
    riskAssessment = {}
  } = context;

  const destination = context.activeDestination || context.destination || trip.destination || 'Unspecified Destination';
  const origin = context.origin || trip.origin || 'Unspecified Origin';
  const travelDates = `${context.startDate || trip.startDate || 'N/A'} to ${context.endDate || trip.endDate || 'N/A'}`;

  const travellersList = Array.isArray(travellers) ? travellers : [];
  const itineraryList = Array.isArray(itinerary) ? itinerary : [];
  const advisoriesList = Array.isArray(advisories) ? advisories : [];

  const travellersSummary = (travellersList.length > 0)
    ? travellersList.map(t => `- ${t.name} (${t.relationship || 'Traveller'}, Age: ${t.age || 'N/A'}, Status: ${t.safetyStatus || 'SAFE'}, Special Notes: ${t.specialNeeds?.join(', ') || 'None'})`).join('\n')
    : 'No specific co-travellers registered.';

  const itinerarySummary = (itineraryList.length > 0)
    ? itineraryList.map(a => `- Day ${a.day} • ${a.time} • ${a.place} (${a.category || 'General'}) in ${a.city || destination} ${a.notes ? `[Notes: ${a.notes}]` : ''}`).join('\n')
    : 'No itinerary items added yet.';

  const affectedList = (matchingResults && Array.isArray(matchingResults.affected)) ? matchingResults.affected : (Array.isArray(context.affectedItems) ? context.affectedItems : []);
  const clearList = (matchingResults && Array.isArray(matchingResults.clear)) ? matchingResults.clear : (Array.isArray(context.clearItems) ? context.clearItems : []);

  const affectedSummary = affectedList.length > 0
    ? affectedList.map(item => {
        const a = item.activity || item;
        const adv = item.advisory || item;
        const reasons = item.matchReasons || item.reasons || [adv.title || adv.type || 'Hazard zone overlap'];
        return `- [AFFECTED] Day ${a.day || 'N/A'} • ${a.time || 'N/A'} • ${a.place || 'Unknown Place'} | Advisory: ${adv.title || adv.type || 'Active Advisory'} | Reasons: ${Array.isArray(reasons) ? reasons.join('; ') : reasons}`;
      }).join('\n')
    : 'None. All scheduled activities are currently verified CLEAR.';

  const clearSummary = clearList.length > 0
    ? clearList.map(item => {
        const c = item.activity || item;
        return `- [CLEAR] Day ${c.day || 'N/A'} • ${c.time || 'N/A'} • ${c.place || 'Location'}`;
      }).join('\n')
    : 'None';

  const advisoriesSummary = advisoriesList.length > 0
    ? advisoriesList.map(adv => 
        `- [${adv.severity || 'ALERT'}] ${adv.type} in ${adv.city}: ${adv.description} (Valid: ${adv.startDate} to ${adv.endDate}). Recommendation: ${adv.recommendation || 'Caution'}`
      ).join('\n')
    : 'No active advisories for this destination.';

  const explicitElderly = context.elderly !== undefined ? Number(context.elderly) : (context.travelPartners?.elderly !== undefined ? Number(context.travelPartners.elderly) : (trip.elderly !== undefined ? Number(trip.elderly) : null));
  const explicitChildren = context.children !== undefined ? Number(context.children) : (context.travelPartners?.children !== undefined ? Number(context.travelPartners.children) : (trip.children !== undefined ? Number(trip.children) : null));
  const explicitAdults = context.adults !== undefined ? Number(context.adults) : (context.travelPartners?.adults !== undefined ? Number(context.travelPartners.adults) : (trip.adults !== undefined ? Number(trip.adults) : null));

  const elderlyCount = explicitElderly !== null ? explicitElderly : travellersList.filter(t => t.category === 'Elderly' || t.age >= 60).length;
  const childCount = explicitChildren !== null ? explicitChildren : travellersList.filter(t => t.category === 'Child' || t.age < 12).length;
  const adultCount = explicitAdults !== null ? explicitAdults : (travellersList.filter(t => (t.category === 'Adult' || t.category === 'Family' || t.category === 'Friend') && t.age >= 12 && t.age < 60).length || 1);

  const destinationsList = Array.isArray(context.destinations) && context.destinations.length > 0
    ? context.destinations.map(d => `- ${d.name} (${d.startDate || 'TBD'} to ${d.endDate || 'TBD'}) [Travel Partners: ${d.adults !== undefined ? d.adults : 1} Adult(s), ${d.children !== undefined ? d.children : 0} Child(ren), ${d.elderly !== undefined ? d.elderly : 0} Elderly]`).join('\n')
    : `- Primary Destination: ${destination} (${travelDates}) [Travel Partners: ${adultCount} Adult(s), ${childCount} Child(ren), ${elderlyCount} Elderly]`;

  return `You are SafeVoyage Sentinel AI, the travel and safety intelligence companion on the SafeVoyage platform.

CRITICAL SAFETY DIRECTIVES (MANDATORY):
1. SEPARATE REAL DATA FROM AI INTERPRETATION:
   - The deterministic itinerary matching system below is the SINGLE SOURCE OF TRUTH for whether an itinerary activity is affected.
   - You MUST NOT invent, guess, or randomly alter safety statuses.
   - If an item is listed under DETERMINISTIC AFFECTED ACTIVITIES, state clearly that it is affected and explain the exact matching criteria (city, location, date, time, category).
   - If an item is listed under DETERMINISTIC CLEAR ACTIVITIES, confirm it is clear.
2. EXACT USER-ENTERED TRAVEL PARTNERS & VULNERABLE TRAVELLER SAFETY:
   - Active Travel Partners: EXACTLY ${adultCount} adult(s), ${childCount} child(ren), and ${elderlyCount} elderly traveller(s).
   - CRITICAL: You must NOT invent, guess, or alter the number of travellers. You must use the exact numbers entered by the user (${adultCount} adults, ${childCount} children, ${elderlyCount} elderly).
   - When Children are present (${childCount} children):
     Provide relevant child-friendly travel-safety guidance:
     * Suggest child-friendly activities and appropriate timings (avoiding peak heat hours or overly late outings).
     * Recommend hydration, sun/weather protection, and comfortable travel pacing.
     * Strategies for keeping children together in crowded areas (constant visual supervision, buddy system, meeting points).
     * Recommend suitable, safe transportation options.
     * Emergency contact preparation (e.g., ID tags, emergency contact cards/wristbands).
   - When Elderly travellers are present (${elderlyCount} elderly travellers):
     Provide relevant elderly-friendly travel-safety guidance:
     * Suggest comfortable travel schedules with adequate rest breaks.
     * Focus on accessible locations where information, seating, and clean facilities are available.
     * Recommend avoiding excessive walking, steep inclines, or strenuous stairs.
     * Point out nearby medical facilities (108 / 112) and emergency access.
     * Emphasize weather precautions (avoiding severe heat, rain hazards, slippery promenade surfaces).
   - CRITICAL RESTRICTION: Do NOT make medical diagnoses or clinical assertions. Provide only general travel safety and planning recommendations.
3. RESPECT USER AUTONOMY:
   - If the user expresses a desire to visit an affected location (e.g. Marina Beach during rough surf), DO NOT flatly forbid or erase it.
   - Instead, explain the active hazard factually (e.g., wave height, municipal warning), advise on conditions under which it might be visited safely, and offer compelling nearby alternative activities. The final choice remains with the user.
4. STRICT DESTINATION ACCURACY:
   - Base all suggestions, culture, attractions, and advice EXCLUSIVELY on the user's current destination(s).
   - Never retain or blend data from previous destinations (e.g. if destination is Dubai, do not mention Chennai beaches).
5. SUGGESTING REAL PLACES & ATTRACTIONS (ADD TO ITINERARY INTEGRATION):
   - When the user asks for places to visit, famous sights, landmarks, attractions, nature spots, scenic viewpoints, or dining spots:
     * Suggest authentic, real places in the requested destination using verified real-world knowledge.
     * Format EACH suggested place on its own line starting with 📍 and the place name in bold, followed by a short description on the next line:
       📍 **Place Name**
       Short description...
     * Never automatically claim you added them to the itinerary. The chatbox UI will render an interactive '[ + ADD TO ITINERARY ]' option directly below each suggested place for the user to add it.

CURRENT TRIP TELEMETRY & DETERMINISTIC GROUNDING:
- Active Destination: ${destination} (Origin: ${origin})
- Trip Destinations Corridor:
${destinationsList}
- Travel Dates: ${travelDates}
- Travel Party (${travellers.length} travellers: ${adultCount} Adults, ${childCount} Children, ${elderlyCount} Elderly):
${travellersSummary}
- Overall Risk Score: ${riskAssessment.score || 0}/100 (${riskAssessment.level || 'LOW'})
- Active Destination Advisories:
${advisoriesSummary}
- Scheduled Itinerary:
${itinerarySummary}
- DETERMINISTIC AFFECTED ACTIVITIES:
${affectedSummary}
- DETERMINISTIC CLEAR ACTIVITIES:
${clearSummary}
- Current Weather: ${weather?.temperature ? `${weather.temperature}°C, ${weather.condition || ''}` : 'Live weather data unavailable'}
- Emergency Numbers: 112 (Unified Emergency), 108 (Ambulance), 100 (Police)
`;
}

export async function askAI(message, history = [], context = {}) {
  const groqKey = process.env.GROQ_API_KEY || (process.env.GEMINI_API_KEY?.startsWith('gsk_') ? process.env.GEMINI_API_KEY : '');
  const geminiKey = process.env.GEMINI_API_KEY?.startsWith('AIzaSy') ? process.env.GEMINI_API_KEY : '';
  const openAiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = buildSystemInstruction(context);

  // 1. Try Groq if configured
  if (groqKey && groqKey.trim() !== '') {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-8).map(h => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.text
        })),
        { role: 'user', content: message }
      ];

      // Groq candidate models
      const groqModels = ['openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'allam-2-7b'];
      for (const model of groqModels) {
        try {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${groqKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model,
              messages,
              temperature: 0.7,
              max_tokens: 1000
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text && text.trim()) {
              return {
                success: true,
                text: text.trim(),
                source: `Groq AI (${model})`,
                provider: 'groq'
              };
            }
          } else {
            const err = await res.json().catch(() => ({}));
            console.warn(`[Groq Error ${model}]`, err);
          }
        } catch (mErr) {
          console.warn(`[Groq Network Error ${model}]`, mErr.message);
        }
      }
    } catch (err) {
      console.warn('[Groq Provider Failed]', err.message);
    }
  }

  // 2. Try Google Gemini if valid Google key is provided
  if (geminiKey && geminiKey.trim() !== '') {
    const geminiModels = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
    for (const model of geminiModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(geminiKey)}`;
        
        const contents = [
          ...history.slice(-6).map(h => ({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          })),
          {
            role: 'user',
            parts: [{ text: message }]
          }
        ];

        const payload = {
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { temperature: 0.7, maxOutputTokens: 1000 }
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text && text.trim()) {
            return {
              success: true,
              text: text.trim(),
              source: `Google Gemini (${model})`,
              provider: 'gemini'
            };
          }
        } else {
          const err = await res.json().catch(() => ({}));
          console.warn(`[Gemini Error ${model}]`, err);
        }
      } catch (err) {
        console.warn(`[Gemini Network Error ${model}]`, err.message);
      }
    }
  }

  // 3. Try OpenAI if configured
  if (openAiKey && openAiKey.trim() !== '') {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...history.slice(-6).map(h => ({
          role: h.sender === 'user' ? 'user' : 'assistant',
          content: h.text
        })),
        { role: 'user', content: message }
      ];

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim()) {
          return {
            success: true,
            text: text.trim(),
            source: 'OpenAI (gpt-4o-mini)',
            provider: 'openai'
          };
        }
      }
    } catch (err) {
      console.warn('[OpenAI Provider Failed]', err.message);
    }
  }

  // If all live AI APIs are unconfigured or failed, return explicit error
  return {
    success: false,
    error: 'AI Assistant is temporarily unavailable. Please check your API configuration.',
    code: 'AI_CONFIG_ERROR',
    needsKey: true
  };
}
