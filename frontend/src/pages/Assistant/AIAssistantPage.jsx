import React, { useState, useRef, useEffect } from 'react';
import { useTrip } from '../../context/TripContext.jsx';
import { askSentinelAI } from '../../services/geminiService.js';
import MarkdownView from '../../components/common/MarkdownView.jsx';
import {
  resolveDestinationForPlace,
  calculateAvailableSlot,
  determineCategory,
  isLocationInItinerary
} from '../../utils/itineraryHelper.js';
import {
  Sparkles,
  Bot,
  Send,
  RotateCcw,
  Shield,
  ShieldAlert,
  MapPin,
  Clock,
  Calendar,
  AlertTriangle,
  HeartPulse,
  Users,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  Download
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  "Check my itinerary",
  "What's my current risk?",
  "Show active alerts",
  "Is my next activity safe?",
  "Why is my trip risk high?",
  "Recommend safe dining & local food",
  "Where is the nearest 24/7 emergency hospital?"
];

export default function AIAssistantPage() {
  const tripContext = useTrip();
  const { trip, travellers, itinerary, advisories, matchingResults, weather, riskAssessment } = tripContext;

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'init_1',
      sender: 'assistant',
      text: `### ✨ SafeVoyage AI Assistant Ready

Hello! I am your personal AI travel & safety companion, loaded with real-time context for your journey to **${trip?.destination || 'your destination'}** (${trip?.startDate || 'Start Date'} – ${trip?.endDate || 'End Date'}).

Feel free to ask me anything about your trip:
- 🗺️ **Itinerary & Safety:** Deterministic threat checks, activity reviews, safe timing
- 🍽️ **Dining & Food:** Best local food, hygienic restaurants, iconic cafes
- 🎒 **Trip Prep:** Weather precautions, clothing advice, packing checklists
- 🛡️ **Medical & Emergency:** Nearest trauma hospitals, police stations, helplines

How can I help you today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      source: 'SafeVoyage AI Sentinel'
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleAddPlaceToItinerary = async (placeInfo) => {
    const targetDest = resolveDestinationForPlace(
      placeInfo.name,
      placeInfo.description,
      placeInfo.contextText,
      tripContext
    );

    // Duplicate check
    if (isLocationInItinerary(placeInfo.name, targetDest.name, tripContext.itinerary)) {
      return { success: false, duplicate: true };
    }

    // If target destination is newly mentioned or not in destinations list, register it
    if (targetDest.isNew || (targetDest.name && !tripContext.destinations?.some(d => d.name?.toLowerCase() === targetDest.name.toLowerCase()))) {
      if (tripContext.addDestination) {
        await tripContext.addDestination({
          name: targetDest.name,
          startDate: targetDest.startDate,
          endDate: targetDest.endDate
        });
      }
    }

    // Set active destination so Dashboard and Upcoming Activities immediately focus on this destination
    if (tripContext.setActiveDestination && targetDest.name) {
      tripContext.setActiveDestination(targetDest.name);
    }

    const slot = calculateAvailableSlot(targetDest, tripContext.itinerary);
    const newActivity = {
      place: placeInfo.name,
      name: placeInfo.name,
      location: placeInfo.name,
      city: targetDest.name,
      destination: targetDest.name,
      category: determineCategory(placeInfo.name, placeInfo.description),
      day: slot.day,
      date: slot.date,
      time: slot.time,
      notes: placeInfo.description ? `Recommended by SafeVoyage AI: ${placeInfo.description}` : 'Recommended by SafeVoyage AI'
    };

    const res = await tripContext.addActivity(newActivity);
    if (res?.success) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_confirm_${Date.now()}`,
          sender: 'assistant',
          text: `✓ Added **${placeInfo.name}** to your itinerary for **${targetDest.name}** (Day ${slot.day} • ${slot.time}).`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          source: 'Multi-Day Itinerary Intelligence'
        }
      ]);
    }
    return res;
  };

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || input;
    if (!textToSend || !textToSend.trim() || loading) return;

    const userMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    if (!customPrompt) setInput('');
    setLoading(true);

    // Check if user explicitly asked to add a location to their itinerary
    const addExplicitMatch = textToSend.match(/^(?:please\s+)?add\s+(?:the\s+)?(.+?)\s+to\s+(?:my\s+)?itinerary/i);
    if (addExplicitMatch) {
      const targetPlace = addExplicitMatch[1].trim();
      const targetDest = resolveDestinationForPlace(targetPlace, '', textToSend, tripContext);
      if (isLocationInItinerary(targetPlace, targetDest.name, tripContext.itinerary)) {
        setMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'assistant',
            text: `📍 **${targetPlace}**\n\nThis place is already in your itinerary for **${targetDest.name}**.`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setLoading(false);
        return;
      } else {
        if (targetDest.isNew || (targetDest.name && !tripContext.destinations?.some(d => d.name?.toLowerCase() === targetDest.name.toLowerCase()))) {
          if (tripContext.addDestination) {
            await tripContext.addDestination({
              name: targetDest.name,
              startDate: targetDest.startDate,
              endDate: targetDest.endDate
            });
          }
        }
        if (tripContext.setActiveDestination && targetDest.name) {
          tripContext.setActiveDestination(targetDest.name);
        }

        const slot = calculateAvailableSlot(targetDest, tripContext.itinerary);
        const newActivity = {
          place: targetPlace,
          name: targetPlace,
          location: targetPlace,
          city: targetDest.name,
          destination: targetDest.name,
          category: determineCategory(targetPlace, ''),
          day: slot.day,
          date: slot.date,
          time: slot.time,
          notes: 'Added from AI Chatbox request'
        };
        await tripContext.addActivity(newActivity);
        setMessages(prev => [
          ...prev,
          {
            id: `ai_${Date.now()}`,
            sender: 'assistant',
            text: `✓ Added **${targetPlace}** to your itinerary for **${targetDest.name}** (Day ${slot.day} • ${slot.time} on ${slot.date}).`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            source: 'Multi-Day Itinerary Intelligence'
          }
        ]);
        setLoading(false);
        return;
      }
    }

    try {
      const activeDest = tripContext.destinations?.find(
        d => d.name?.toLowerCase() === (tripContext.activeDestination || tripContext.trip?.destination)?.toLowerCase()
      );
      const exactAdults = activeDest?.adults !== undefined 
        ? Number(activeDest.adults) 
        : (tripContext.trip?.adults !== undefined ? Number(tripContext.trip.adults) : (tripContext.partyBreakdown?.adult || 1));
      const exactChildren = activeDest?.children !== undefined 
        ? Number(activeDest.children) 
        : (tripContext.trip?.children !== undefined ? Number(tripContext.trip.children) : (tripContext.partyBreakdown?.child || 0));
      const exactElderly = activeDest?.elderly !== undefined 
        ? Number(activeDest.elderly) 
        : (tripContext.trip?.elderly !== undefined ? Number(tripContext.trip.elderly) : (tripContext.partyBreakdown?.elderly || 0));

      const augmentedContext = {
        ...tripContext,
        adults: exactAdults,
        children: exactChildren,
        elderly: exactElderly,
        travelPartners: {
          adults: exactAdults,
          children: exactChildren,
          elderly: exactElderly
        },
        activeDestination: tripContext.activeDestination || tripContext.trip?.destination || '',
        destinations: tripContext.destinations || []
      };

      const response = await askSentinelAI(textToSend, messages, augmentedContext);
      const aiMessage = {
        id: `ai_${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        source: response.source,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: 'assistant',
          text: err.message || 'AI Assistant is temporarily unavailable. Please check your API configuration.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReset = () => {
    setMessages([
      {
        id: `reset_${Date.now()}`,
        sender: 'assistant',
        text: `### 🛡️ Sentinel AI Memory Reset\n\nI am ready with fresh telemetry on your **${trip?.destination || 'Chennai'}** trip. What would you like to examine?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: 'Live Sentinel Engine'
      }
    ]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                backgroundColor: '#167D5A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 14px rgba(22, 125, 90, 0.4)'
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
                Sentinel AI Travel Companion
              </h1>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                Ask anything about your journey, local food, culture, logistics, weather, or safety
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            className="badge badge-safe"
            style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
            Gemini 2.5 Flash Connected
          </span>

          <button onClick={handleReset} className="btn btn-secondary btn-sm" title="Clear conversation">
            <RotateCcw size={15} /> Reset Chat
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Telemetry Context + Chat Console */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem',
          alignItems: 'start'
        }}
      >
        {/* Left Column: Live Grounded Telemetry Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Risk Index Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Trip Risk Score</h3>
              </div>
              <span className="badge badge-caution" style={{ fontSize: '0.75rem' }}>
                {riskAssessment?.level || 'MODERATE'} RISK
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--caution-text)', lineHeight: 1 }}>
                {riskAssessment?.score || 42}
              </span>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>/ 100 Hazard Index</span>
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                borderRadius: '999px',
                backgroundColor: 'var(--bg-subtle)',
                overflow: 'hidden',
                marginBottom: '0.75rem'
              }}
            >
              <div
                style={{
                  width: `${riskAssessment?.score || 42}%`,
                  height: '100%',
                  backgroundColor: '#F59E0B',
                  borderRadius: '999px'
                }}
              />
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Calculated using live weather, shoreline wave advisories, and the health vulnerability profiles of your 4 party members.
            </p>
          </div>

          {/* Active Hazard Banner */}
          <div
            style={{
              backgroundColor: matchingResults?.affected?.length > 0 ? 'var(--danger-bg)' : 'var(--safe-bg)',
              border: `1px solid ${matchingResults?.affected?.length > 0 ? 'var(--danger-border)' : 'var(--safe-border)'}`,
              borderRadius: '12px',
              padding: '1.2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color={matchingResults?.affected?.length > 0 ? '#EF4444' : '#10B981'} />
              <strong style={{ fontSize: '0.95rem', color: matchingResults?.affected?.length > 0 ? 'var(--danger-text)' : 'var(--safe-text)' }}>
                {matchingResults?.affected?.length > 0 ? 'Active Itinerary Alert' : 'Itinerary Status: CLEAR'}
              </strong>
            </div>

            {matchingResults?.affected?.length > 0 ? (
              <>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4, margin: 0 }}>
                  <strong>Day {matchingResults.affected[0].activity.day} • {matchingResults.affected[0].activity.time} • {matchingResults.affected[0].activity.place}</strong> overlaps with <strong>{matchingResults.affected[0].advisory.title}</strong>.
                </p>

                <button
                  onClick={() => handleSend(`Why is my Day ${matchingResults.affected[0].activity.day} visit to ${matchingResults.affected[0].activity.place} affected, and what are safe alternatives?`)}
                  className="btn btn-sm btn-danger"
                  style={{ alignSelf: 'flex-start', fontSize: '0.78rem', marginTop: '4px' }}
                >
                  Ask AI for Safe Alternative →
                </button>
              </>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--safe-text)', lineHeight: 1.4, margin: 0 }}>
                All scheduled itinerary stops in {trip?.destination || 'your destination'} currently evaluate with zero hazard overlaps.
              </p>
            )}
          </div>

          {/* Party Health & Special Needs */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
              <Users size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Monitored Travellers</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {travellers?.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.82rem'
                  }}
                >
                  <div>
                    <strong>{t.name}</strong> <span style={{ color: 'var(--text-muted)' }}>({t.relationship})</span>
                    <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: '2px' }}>
                      {t.specialNeeds?.join(', ') || 'Standard profile'}
                    </div>
                  </div>
                  <span
                    className={`badge badge-${t.safetyStatus === 'SAFE' ? 'safe' : t.safetyStatus === 'CAUTION' ? 'caution' : 'danger'}`}
                    style={{ fontSize: '0.7rem' }}
                  >
                    {t.safetyStatus}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Instant Audit Trigger */}
          <button
            onClick={() => handleSend("Run a full safety audit on my trip and generate an emergency readiness checklist.")}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.9rem', fontSize: '0.95rem' }}
          >
            <Sparkles size={18} /> Run Complete Safety Audit
          </button>
        </div>

        {/* Right Column: Chat Console */}
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '740px',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {/* Chat Window Top Bar */}
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                Sentinel AI Assistant Conversation
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {messages.length} messages in session
            </span>
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: '1.25rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              backgroundColor: 'var(--bg-main)'
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      maxWidth: '85%',
                      flexDirection: isUser ? 'row-reverse' : 'row'
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isUser ? '#FFFFFF' : 'var(--primary)',
                        flexShrink: 0
                      }}
                    >
                      {isUser ? <Users size={16} /> : <Bot size={16} />}
                    </div>

                    <div
                      style={{
                        backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-card)',
                        color: isUser ? '#FFFFFF' : 'var(--text-main)',
                        border: isUser ? 'none' : '1px solid var(--border-color)',
                        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        padding: '12px 16px',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {isUser ? (
                        <div style={{ fontSize: '0.92rem', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {m.text}
                        </div>
                      ) : (
                        <MarkdownView
                          content={m.text}
                          onAddPlace={handleAddPlaceToItinerary}
                          itinerary={tripContext.itinerary}
                          destinations={tripContext.destinations}
                          trip={tripContext.trip}
                          activeDestination={tripContext.activeDestination}
                        />
                      )}

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginTop: '8px',
                          fontSize: '0.7rem',
                          color: isUser ? 'rgba(255, 255, 255, 0.75)' : 'var(--text-muted)'
                        }}
                      >
                        <span>{m.timestamp} {m.source && `• ${m.source}`}</span>
                        {!isUser && (
                          <button
                            onClick={() => handleCopy(m.id, m.text)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {copiedId === m.id ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                            <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}
                >
                  <Bot size={16} />
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px 16px 16px 16px',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.88rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Sparkles size={16} color="#167D5A" className="animate-spin-slow" />
                  <span>Synthesizing real-time safety recommendations...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions Chips */}
          <div
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {SUGGESTED_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSend(prompt)}
                disabled={loading}
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 12px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div
            style={{
              padding: '12px 16px',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything (e.g., 'Best street foods', 'What should I pack?', 'Tamil phrases', 'Is Day 2 safe?')..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '11px 16px',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.92rem',
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                padding: '0.75rem 1.4rem',
                borderRadius: '999px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>Ask AI</span>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
