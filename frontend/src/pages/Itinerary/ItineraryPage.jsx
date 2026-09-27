import React, { useState } from 'react';
import { useTrip } from '../../context/TripContext.jsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import ItineraryCard from '../../components/itinerary/ItineraryCard.jsx';
import AddActivityModal from '../../components/itinerary/AddActivityModal.jsx';
import {
  Luggage,
  Plus,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Filter,
  Calendar,
  Sparkles,
  Smartphone,
  ArrowRight,
  Info
} from 'lucide-react';

export default function ItineraryPage() {
  const {
    trip,
    itinerary,
    advisories,
    matchingResults,
    addActivity,
    updateActivity,
    deleteActivity,
    duplicateActivity
  } = useTrip();

  const { triggerSmsToast } = useNotifications();
  const { user } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ALL'); // ALL, AFFECTED, CLEAR

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (act) => {
    setEditingActivity(act);
    setModalOpen(true);
  };

  const handleSaveActivity = async (data) => {
    if (editingActivity) {
      await updateActivity(editingActivity.id, data);
    } else {
      await addActivity(data);
    }
  };

  const handleSimulateSmsForAffected = (act, adv) => {
    triggerSmsToast(
      `SafeVoyage Alert: Day ${act.day} • ${act.time} • ${act.place} is affected by ${adv?.type || 'High-Surf Advisory'}. Please review your itinerary.`,
      user?.phone || '+91 98765 43210',
      'DEMO SMS'
    );
  };

  // Filter items based on activeFilter
  const displayedActivities = itinerary.filter((item) => {
    const isAff = matchingResults.affected.some((a) => a.id === item.id);
    if (activeFilter === 'AFFECTED') return isAff;
    if (activeFilter === 'CLEAR') return !isAff;
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, fontSize: '0.88rem', marginBottom: '4px' }}>
            <Luggage size={18} /> MULTI-DAY ITINERARY INTELLIGENCE
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>
            {trip?.destination || 'Your Destination'} Trip Schedule & Safety Map
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Every itinerary activity is continually correlated against active safety bulletins across 4 factors: Location, Category, Date, and Time.
          </p>
        </div>

        <button onClick={handleOpenAdd} className="btn btn-primary btn-lg" style={{ gap: '6px' }}>
          <Plus size={18} /> Add Activity
        </button>
      </div>

      {/* Differentiator Showcase Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 125, 90, 0.12), rgba(168, 230, 207, 0.25))',
          border: '1.5px solid var(--primary-light)',
          padding: '1.25rem'
        }}
      >
        <div className="flex-between" style={{ flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={20} color="#167D5A" />
            <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)' }}>
              4-FACTOR ITINERARY-AWARE THREAT DETECTION
            </strong>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <span className="badge badge-danger">
              🔴 {matchingResults.affectedCount} Affected Activity
            </span>
            <span className="badge badge-safe">
              🟢 {matchingResults.clearCount} Clear Activities
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
          Unlike generic city-wide warnings, SafeVoyage isolates the exact day, place, and hour at risk.
          All unaffected activities remain verified as <strong>CLEAR</strong>.
        </p>

        {/* Affected Item Direct Action Box */}
        {matchingResults.affected.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid var(--danger-border)',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--danger-text)', fontWeight: 800, fontSize: '0.9rem' }}>
                <ShieldAlert size={16} />
                CRITICAL ITINERARY CONFLICT DETECTED:
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--danger-text)', marginTop: '2px' }}>
                <strong>Day {matchingResults.affected[0].day} • {matchingResults.affected[0].time} • {matchingResults.affected[0].place}</strong> matches active {matchingResults.affected[0].alertTitle || 'Safety Advisory'}.
              </div>
            </div>

            <button
              onClick={() => handleSimulateSmsForAffected(matchingResults.affected[0], matchingResults.affected[0].advisory)}
              className="btn btn-danger btn-sm"
              style={{ gap: '6px' }}
            >
              <Smartphone size={14} /> Dispatch SMS Alert to Head Phone
            </button>
          </div>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveFilter('ALL')}
            className={`btn btn-sm ${activeFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Activities ({itinerary.length})
          </button>
          <button
            onClick={() => setActiveFilter('AFFECTED')}
            className={`btn btn-sm ${activeFilter === 'AFFECTED' ? 'btn-danger' : 'btn-secondary'}`}
          >
            🔴 Affected Only ({matchingResults.affectedCount})
          </button>
          <button
            onClick={() => setActiveFilter('CLEAR')}
            className={`btn btn-sm ${activeFilter === 'CLEAR' ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              backgroundColor: activeFilter === 'CLEAR' ? '#10B981' : undefined,
              borderColor: activeFilter === 'CLEAR' ? '#10B981' : undefined
            }}
          >
            🟢 Clear Activities ({matchingResults.clearCount})
          </button>
        </div>

        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing {displayedActivities.length} of {itinerary.length} items
        </div>
      </div>

      {/* Itinerary Activities Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {displayedActivities.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', color: 'var(--text-muted)' }}>
            <Calendar size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {itinerary.length === 0 ? 'No itinerary added yet.' : 'No activities found in this filter.'}
            </h3>
            <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
              {itinerary.length === 0 ? 'Add your first scheduled stop or accept suggested activities.' : 'Try switching the filter above.'}
            </p>
            {itinerary.length === 0 && (
              <button onClick={handleOpenAdd} className="btn btn-primary btn-sm" style={{ marginTop: '1rem', gap: '6px' }}>
                <Plus size={15} /> Add First Activity
              </button>
            )}
          </div>
        ) : (
          displayedActivities.map((activity) => {
            const affectedMatch = matchingResults.affected.find((a) => a.id === activity.id);
            return (
              <ItineraryCard
                key={activity.id}
                activity={activity}
                isAffected={Boolean(affectedMatch)}
                advisoryDetails={affectedMatch?.advisory}
                onEdit={handleOpenEdit}
                onDuplicate={duplicateActivity}
                onDelete={deleteActivity}
              />
            );
          })
        )}
      </div>

      {/* Add / Edit Activity Modal */}
      <AddActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveActivity}
        editData={editingActivity}
        defaultCity={trip?.destination || 'Chennai'}
      />
    </div>
  );
}
