import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../../context/TripContext.jsx';
import { askSentinelAI } from '../../services/geminiService.js';
import MarkdownView from '../common/MarkdownView.jsx';
import {
  resolveDestinationForPlace,
  calculateAvailableSlot,
  determineCategory,
  isLocationInItinerary
} from '../../utils/itineraryHelper.js';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  Bot,
  User,
  ShieldAlert,
  HelpCircle,
  Copy,
  Check,
  ChevronDown
} from 'lucide-react';

const INITIAL_MESSAGES = [
  {
    id: 'msg_welcome',
    sender: 'assistant',
    text: `### ✨ Welcome to Sentinel AI!

I am your personal AI travel companion, ready to answer **anything** you want to know! 

Ask me freely about:
- 🗺️ **Your Journey:** Itinerary advice, alternate routes, best visiting times
- 🍛 **Food & Dining:** Best local cuisine, authentic eateries, iconic cafes
- 🏛️ **Culture & Sightseeing:** Historic temples, museums, local gems, arts
- 🎒 **Trip Logistics:** Packing checklists, weather forecasts, shopping spots
- 🛡️ **Safety & Health:** Shoreline wave advisories, nearby hospitals, family precautions
- 🗣️ **Local Talk:** Helpful everyday local phrases with phonetic guides

What would you like to explore or plan today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    source: 'Google Gemini Powered'
  }
];

const SUGGESTED_PROMPTS = [
  "Check my itinerary",
  "What's my current risk?",
  "Show active alerts",
  "Is my next activity safe?",
  "Why is my trip risk high?",
  "Recommend safe dining & local food",
  "Where is the nearest 24/7 hospital?"
];

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Draggable FAB Position state (Requirement 4)
  const [fabPos, setFabPos] = useState(() => {
    try {
      const saved = localStorage.getItem('safevoyage_sentinel_fab_pos');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragInfoRef = useRef({ startX: 0, startY: 0, origX: 0, origY: 0, moved: false });
  const fabBtnRef = useRef(null);

  const handlePointerDown = (e) => {
    if (e.button !== 0) return;
    const btn = fabBtnRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    dragInfoRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origX: rect.left,
      origY: rect.top,
      moved: false
    };

    const handlePointerMove = (moveEvt) => {
      const dx = moveEvt.clientX - dragInfoRef.current.startX;
      const dy = moveEvt.clientY - dragInfoRef.current.startY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        dragInfoRef.current.moved = true;
        setIsDragging(true);
      }
      const newX = Math.max(10, Math.min(window.innerWidth - rect.width - 10, dragInfoRef.current.origX + dx));
      const newY = Math.max(10, Math.min(window.innerHeight - rect.height - 10, dragInfoRef.current.origY + dy));
      setFabPos({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setIsDragging(false);
      if (dragInfoRef.current.moved) {
        const btnNow = fabBtnRef.current;
        if (btnNow) {
          const r = btnNow.getBoundingClientRect();
          const finalPos = { x: r.left, y: r.top };
          try {
            localStorage.setItem('safevoyage_sentinel_fab_pos', JSON.stringify(finalPos));
          } catch (err) {}
        }
      } else {
        setIsOpen(true);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const tripContext = useTrip();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

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
    setMessages(INITIAL_MESSAGES);
  };

  const handleOpenFullPage = () => {
    setIsOpen(false);
    navigate('/assistant');
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          ref={fabBtnRef}
          onPointerDown={handlePointerDown}
          style={{
            position: 'fixed',
            left: fabPos ? `${fabPos.x}px` : 'auto',
            top: fabPos ? `${fabPos.y}px` : 'auto',
            bottom: fabPos ? 'auto' : '24px',
            right: fabPos ? 'auto' : '24px',
            zIndex: 995,
            backgroundColor: '#167D5A',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '999px',
            padding: '8px 14px 8px 10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(22, 125, 90, 0.4)',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.2s ease',
            fontWeight: 600,
            fontSize: '0.85rem'
          }}
          onMouseEnter={(e) => { if (!isDragging) e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)'; }}
          onMouseLeave={(e) => { if (!isDragging) e.currentTarget.style.transform = 'none'; }}
          aria-label="Open AI Safety Assistant"
          id="sentinel-ai-fab-btn"
          title="Drag to reposition Sentinel AI"
        >
          <div
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Sparkles size={14} color="#FFFFFF" className="animate-spin-slow" />
          </div>
          <span>Sentinel AI</span>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#A8E6CF',
              boxShadow: '0 0 6px #A8E6CF'
            }}
          />
        </button>
      )}

      {/* Floating Chat Modal / Drawer */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '420px',
            maxWidth: 'calc(100vw - 32px)',
            height: '620px',
            maxHeight: 'calc(100vh - 40px)',
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 999,
            overflow: 'hidden',
            animation: 'fadeIn 0.2s ease-out'
          }}
          id="sentinel-ai-chat-window"
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              backgroundColor: 'var(--bg-sidebar)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  backgroundColor: '#167D5A',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(22, 125, 90, 0.4)'
                }}
              >
                <Bot size={20} color="#FFFFFF" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <strong style={{ fontSize: '0.95rem' }}>Sentinel AI</strong>
                  <span
                    style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      backgroundColor: 'rgba(16, 185, 129, 0.2)',
                      color: '#A8E6CF',
                      padding: '1px 6px',
                      borderRadius: '4px'
                    }}
                  >
                    GEMINI LIVE
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94A3B8' }}>
                  Travel Companion • Ask anything about your journey
                </div>
              </div>
            </div>

            {/* Top Window Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                onClick={handleReset}
                title="Restart Chat"
                className="btn btn-sm"
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '6px' }}
              >
                <RotateCcw size={16} />
              </button>
              <button
                onClick={handleOpenFullPage}
                title="Open Fullscreen Page"
                className="btn btn-sm"
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '6px' }}
              >
                <Maximize2 size={16} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="Close Assistant"
                className="btn btn-sm"
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Live Context Banner */}
          <div
            style={{
              padding: '6px 14px',
              backgroundColor: 'var(--caution-bg)',
              borderBottom: '1px solid var(--caution-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--caution-text)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldAlert size={14} color={tripContext.matchingResults.affectedCount > 0 ? '#EF4444' : '#10B981'} />
              <span>
                <strong>{tripContext.matchingResults.affectedCount} Alert{tripContext.matchingResults.affectedCount === 1 ? '' : 's'}:</strong> {tripContext.matchingResults.affectedCount > 0 ? (tripContext.matchingResults.affected[0]?.alertTitle || 'Active Hazard') : 'Itinerary Verified Clear'}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Risk: {tripContext.riskAssessment.score || 0}/100</span>
          </div>

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
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
                      gap: '8px',
                      maxWidth: '88%',
                      flexDirection: isUser ? 'row-reverse' : 'row'
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isUser ? '#FFFFFF' : 'var(--primary)',
                        flexShrink: 0,
                        marginTop: '2px'
                      }}
                    >
                      {isUser ? <User size={15} /> : <Bot size={15} />}
                    </div>

                    {/* Bubble */}
                    <div
                      style={{
                        backgroundColor: isUser ? 'var(--primary)' : 'var(--bg-card)',
                        color: isUser ? '#FFFFFF' : 'var(--text-main)',
                        border: isUser ? 'none' : '1px solid var(--border-color)',
                        borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                        padding: '10px 14px',
                        boxShadow: 'var(--shadow-sm)',
                        position: 'relative'
                      }}
                    >
                      {isUser ? (
                        <div style={{ fontSize: '0.9rem', lineHeight: 1.45, whiteSpace: 'pre-wrap' }}>
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

                      {/* Message Footer */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          marginTop: '6px',
                          fontSize: '0.68rem',
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
                              gap: '3px'
                            }}
                            title="Copy response"
                          >
                            {copiedId === m.id ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live Typing indicator */}
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary)'
                  }}
                >
                  <Bot size={15} />
                </div>
                <div
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px 16px 16px 16px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <Sparkles size={14} color="#167D5A" className="animate-spin-slow" />
                  <span>SafeVoyage AI is thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestion Pills */}
          <div
            style={{
              padding: '6px 12px',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none'
            }}
          >
            {SUGGESTED_PROMPTS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                disabled={loading}
                style={{
                  fontSize: '0.72rem',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-color)')}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div
            style={{
              padding: '10px 12px',
              backgroundColor: 'var(--bg-card)',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your journey, food, culture, packing, safety..."
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 14px',
                borderRadius: '999px',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-subtle)',
                color: 'var(--text-main)',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                borderRadius: '50%',
                flexShrink: 0
              }}
              title="Send to Sentinel AI"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
