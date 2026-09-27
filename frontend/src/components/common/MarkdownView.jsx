import React, { useState } from 'react';
import { Plus, Check, Loader2 } from 'lucide-react';
import { isLocationInItinerary, resolveDestinationForPlace } from '../../utils/itineraryHelper.js';

/**
 * Lightweight, safe Markdown renderer for chat messages.
 * Automatically detects real place recommendations (e.g. 📍 Place Name)
 * and provides the '+ ADD TO ITINERARY' action directly below each place.
 */
export default function MarkdownView({
  content,
  onAddPlace = null,
  itinerary = [],
  destinations = [],
  trip = null,
  activeDestination = ''
}) {
  const [localAdded, setLocalAdded] = useState({});
  const [loadingPlace, setLoadingPlace] = useState(null);

  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${elements.length}`} style={{ paddingLeft: '1.25rem', margin: '0.4rem 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {listItems.map((item, idx) => (
            <li key={idx} style={{ lineHeight: 1.45, fontSize: '0.88rem' }}>
              {formatInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const formatInline = (text) => {
    if (!text) return '';
    const parts = [];
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const token = match[0];
      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`b-${lastIndex}`} style={{ color: 'var(--text-main)', fontWeight: 700 }}>
            {token.slice(2, -2)}
          </strong>
        );
      } else if (token.startsWith('`') && token.endsWith('`')) {
        parts.push(
          <code
            key={`c-${lastIndex}`}
            style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              padding: '1px 5px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '0.85em',
              color: 'var(--primary)'
            }}
          >
            {token.slice(1, -1)}
          </code>
        );
      }
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  const handleAddClick = async (placeName, description) => {
    if (!onAddPlace || loadingPlace) return;
    setLoadingPlace(placeName);
    try {
      const targetDest = resolveDestinationForPlace(placeName, description, content, {
        destinations,
        trip,
        activeDestination
      });
      await onAddPlace({
        name: placeName,
        description,
        city: targetDest.name,
        contextText: content
      });
      setLocalAdded(prev => ({ ...prev, [placeName.toLowerCase().trim()]: true }));
    } catch (err) {
      console.warn('[Add place error]', err);
    } finally {
      setLoadingPlace(null);
    }
  };

  // Helper to extract place name and inline description from a line
  const parsePlaceLine = (rawLine) => {
    const trimmed = rawLine.trim();
    // Pattern 1: Lines containing 📍 (e.g., "📍 **Place Name**", "📍 Place Name", "- 📍 Place Name: description")
    const pinMatch = trimmed.match(/(?:^|[-*•]|\d+\.)\s*📍\s*(?:\*\*(.*?)\*\*|([^\n\r]+))/);
    if (pinMatch) {
      let rawName = (pinMatch[1] || pinMatch[2] || '').trim();
      let inlineDesc = '';
      const sepMatch = rawName.match(/^(.*?)\s*[-–:]\s*(.+)$/);
      if (sepMatch) {
        rawName = sepMatch[1].trim();
        inlineDesc = sepMatch[2].trim();
      }
      const cleanName = rawName.replace(/\*\*/g, '').trim();
      if (cleanName && cleanName.length > 1 && cleanName.length < 80) {
        return { name: cleanName, inlineDesc };
      }
    }
    return null;
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if current line represents a suggested place
    const placeInfo = parsePlaceLine(trimmed);
    if (placeInfo && onAddPlace) {
      flushList();

      const placeName = placeInfo.name;
      let placeDesc = placeInfo.inlineDesc || '';

      // Collect multi-line description if following lines are not empty and not another place/heading
      let j = i + 1;
      while (j < lines.length) {
        const nextLine = lines[j].trim();
        if (
          !nextLine ||
          parsePlaceLine(nextLine) ||
          nextLine.startsWith('#') ||
          nextLine.startsWith('📍') ||
          nextLine.startsWith('- 📍')
        ) {
          break;
        }
        placeDesc = placeDesc ? `${placeDesc} ${nextLine}` : nextLine;
        j++;
      }
      i = j;

      const targetDest = resolveDestinationForPlace(placeName, placeDesc, content, {
        destinations,
        trip,
        activeDestination
      });

      const placeKey = placeName.toLowerCase().trim();
      const inItinerary = isLocationInItinerary(placeName, targetDest.name, itinerary);
      const isJustAdded = localAdded[placeKey];
      const isLoading = loadingPlace === placeName;

      elements.push(
        <div
          key={`place-block-${i}-${placeName}`}
          style={{
            margin: '0.65rem 0',
            padding: '10px 12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          {/* Place Heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
            <span>📍</span>
            <span>{placeName}</span>
          </div>

          {/* Place Description */}
          {placeDesc && (
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              {formatInline(placeDesc)}
            </p>
          )}

          {/* Action Button & Confirmation */}
          <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '3px' }}>
            {inItinerary ? (
              <>
                <button
                  type="button"
                  disabled
                  className="btn btn-sm btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    gap: '5px',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    cursor: 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  <Check size={12} color="#10B981" /> ALREADY IN ITINERARY
                </button>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  This place is already in your itinerary.
                </span>
              </>
            ) : isJustAdded ? (
              <>
                <button
                  type="button"
                  disabled
                  className="btn btn-sm btn-secondary"
                  style={{
                    fontSize: '0.75rem',
                    padding: '4px 10px',
                    gap: '5px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    cursor: 'default',
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontWeight: 600
                  }}
                >
                  <Check size={12} color="#10B981" /> ADDED TO ITINERARY
                </button>
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 500 }}>
                  Added to your itinerary.
                </span>
              </>
            ) : (
              <button
                type="button"
                onClick={() => handleAddClick(placeName, placeDesc)}
                disabled={isLoading}
                className="btn btn-sm btn-primary"
                style={{
                  fontSize: '0.75rem',
                  padding: '5px 12px',
                  gap: '5px',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#167D5A',
                  borderColor: '#167D5A',
                  color: '#FFFFFF',
                  cursor: 'pointer'
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={12} className="spin" /> Adding...
                  </>
                ) : (
                  <>
                    <Plus size={12} /> ADD TO ITINERARY
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4 key={`h4-${i}`} style={{ margin: '0.75rem 0 0.35rem 0', fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {formatInline(trimmed.substring(4))}
        </h4>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} style={{ margin: '0.85rem 0 0.4rem 0', fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {formatInline(trimmed.substring(3))}
        </h3>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(trimmed.substring(2));
    } else if (/^\d+\.\s/.test(trimmed)) {
      inList = true;
      listItems.push(trimmed.replace(/^\d+\.\s/, ''));
    } else if (trimmed === '') {
      flushList();
      elements.push(<div key={`sp-${i}`} style={{ height: '6px' }} />);
    } else {
      flushList();
      elements.push(
        <p key={`p-${i}`} style={{ margin: '0.3rem 0', lineHeight: 1.5, fontSize: '0.88rem', color: 'var(--text-main)' }}>
          {formatInline(line)}
        </p>
      );
    }

    i++;
  }

  flushList();

  return <div className="markdown-content">{elements}</div>;
}
