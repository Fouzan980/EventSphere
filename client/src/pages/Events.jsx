import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Plus, Trash2, Search, X, Loader2, Clock, Users, Edit, Navigation, Mic, Star } from 'lucide-react';
import { toast } from 'react-toastify';
import { PageSkeleton } from '../components/Skeleton';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet Marker Icon issue specific to Vite and React
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// ─── Fly-to helper (re-centers map when pin position is set)
const MapController = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 15, { animate: true, duration: 1.2 });
  }, [position, map]);
  return null;
};

const Events = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    title: '', date: '', endDate: '', time: '10:00', endTime: '', location: '', description: '',
    price: 0, category: 'Expo', capacity: 100, websiteLink: '', dressCode: '',
    poster: '', usePosterLink: false, banner: '', useBannerLink: false,
    isSingleDay: true, hasEndTime: false, discounts: '', sessions: [], speakers: [], isFeatured: false,
    hasMultipleTickets: false, tickets: [],
    coordinates: { lat: null, lng: null }
  });
  const [mapPosition, setMapPosition] = useState(null);
  const [geocoding, setGeocoding] = useState(false);
  const [creating, setCreating] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [locTimeout, setLocTimeout] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Speaker search state
  const [speakerSearch, setSpeakerSearch] = useState('');
  const [speakerResults, setSpeakerResults] = useState([]);
  const [speakerTimeout, setSpeakerTimeout] = useState(null);
  const [showSpeakerModal, setShowSpeakerModal] = useState(false);
  const [newSpeaker, setNewSpeaker] = useState({ name: '', role: 'Speaker', bio: '', genre: '', expertise: '', socialLink: '', photo: '' });
  const [savingSpeaker, setSavingSpeaker] = useState(false);

  // Universal person search state (Wikipedia-powered)
  const [personQuery, setPersonQuery] = useState('');
  const [personResults, setPersonResults] = useState([]);
  const [personLoading, setPersonLoading] = useState(false);
  const [personSearched, setPersonSearched] = useState(false);
  const [personTimeout, setPersonTimeout] = useState(null);
  const [personDropdown, setPersonDropdown] = useState(false);

  // ─── Photon Autocomplete ────────────────────────────────────────────────────
  const handleLocationSearch = (query) => {
    setFormData(prev => ({ ...prev, location: query }));
    if (locTimeout) clearTimeout(locTimeout);
    if (query.length > 2) {
      setLocTimeout(setTimeout(() => {
        api.get(`/events/geocode/autocomplete?q=${encodeURIComponent(query)}`)
          .then(res => {
            const data = res.data;
            if (data.suggestions) {
              setLocationSuggestions(data.suggestions.slice(0, 5));
            } else {
              setLocationSuggestions([]);
            }
          })
          .catch(() => setLocationSuggestions([]));
      }, 200));
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleSelectLocation = (loc) => {
    setFormData(prev => ({
      ...prev,
      location: loc.display_name,
      coordinates: { lat: loc.lat, lng: loc.lon }
    }));
    setLocationSuggestions([]);
    setMapPosition([loc.lat, loc.lon]);
  };

  // ─── Speaker search ─────────────────────────────────────────────────────────
  const handleSpeakerSearch = (q) => {
    setSpeakerSearch(q);
    if (speakerTimeout) clearTimeout(speakerTimeout);
    if (q.length > 1) {
      setSpeakerTimeout(setTimeout(() => {
        api.get(`/speakers?q=${encodeURIComponent(q)}`)
          .then(res => setSpeakerResults(res.data))
          .catch(() => setSpeakerResults([]));
      }, 200));
    } else {
      setSpeakerResults([]);
    }
  };

  const addSpeakerToEvent = (sp) => {
    if (!formData.speakers.find(s => s._id === sp._id)) {
      setFormData(prev => ({ ...prev, speakers: [...prev.speakers, sp] }));
    }
    setSpeakerSearch('');
    setSpeakerResults([]);
  };

  const removeSpeakerFromEvent = (id) => {
    setFormData(prev => ({ ...prev, speakers: prev.speakers.filter(s => s._id !== id) }));
  };

  const handleSaveNewSpeaker = async (e) => {
    e.preventDefault();
    setSavingSpeaker(true);
    try {
      const { data } = await api.post('/speakers', newSpeaker);
      addSpeakerToEvent(data);
      handleCloseSpeakerModal();
      toast.success('Speaker created successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create speaker');
    } finally {
      setSavingSpeaker(false);
    }
  };

  const fetchPersonResults = async (query) => {
    const q = query ?? personQuery;
    if (!q.trim()) return;
    setPersonLoading(true);
    setPersonSearched(true);
    setPersonDropdown(true);
    try {
      const { data } = await api.get(`/person/search?name=${encodeURIComponent(q)}`);
      setPersonResults(data.people || []);
    } catch (err) {
      console.error(err);
      setPersonResults([]);
    } finally {
      setPersonLoading(false);
    }
  };

  const handlePersonInput = (value) => {
    setPersonQuery(value);
    setPersonSearched(false);
    setPersonDropdown(false);
    if (personTimeout) clearTimeout(personTimeout);
    if (value.trim().length >= 2) {
      setPersonTimeout(setTimeout(() => fetchPersonResults(value), 400));
    } else {
      setPersonResults([]);
    }
  };

  const applyPerson = (person) => {
    setNewSpeaker(prev => ({
      ...prev,
      name:       person.name        || prev.name,
      photo:      person.image       || prev.photo,
      role:       person.role        || prev.role,
      genre:      person.genre       || prev.genre,
      expertise:  person.expertise   || prev.expertise,
      bio:        person.bio         || prev.bio,
      socialLink: person.wikiUrl || person.spotifyUrl || prev.socialLink,
    }));
    setPersonResults([]);
    setPersonQuery('');
    setPersonSearched(false);
    setPersonDropdown(false);
  };

  const resetPersonSearch = () => {
    setPersonResults([]);
    setPersonQuery('');
    setPersonSearched(false);
    setPersonDropdown(false);
  };

  const handleCloseSpeakerModal = () => {
    setShowSpeakerModal(false);
    setNewSpeaker({ name: '', role: 'Speaker', bio: '', genre: '', expertise: '', socialLink: '', photo: '' });
    resetPersonSearch();
  };


  const fetchEvents = async () => {
    try {
      const { data } = await api.get('/events');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const payload = {
        ...formData,
        speakers: formData.speakers.map(s => s._id || s),
      };
      if (isEditing) {
        await api.put(`/events/${editingId}`, payload);
        toast.success('Event updated successfully');
      } else {
        await api.post('/events', payload);
        toast.success('Event created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchEvents();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${isEditing ? 'update' : 'create'} event`);
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', date: '', time: '10:00', location: '', description: '',
      price: 0, category: 'Expo', capacity: 100, websiteLink: '', dressCode: '',
      poster: '', usePosterLink: false, banner: '', useBannerLink: false,
      discounts: '', endDate: '', endTime: '', hasEndTime: false, isSingleDay: true, sessions: [], speakers: [], isFeatured: false, hasMultipleTickets: false, tickets: [],
      coordinates: { lat: null, lng: null }
    });
    setMapPosition(null);
    setIsEditing(false);
    setEditingId(null);
    setLocationSuggestions([]);
    setSpeakerSearch('');
    setSpeakerResults([]);
  };

  const handleEdit = (event) => {
    setFormData({
      title: event.title || '',
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      time: event.time || '10:00',
      location: event.location || '',
      description: event.description || '',
      price: event.price || 0,
      category: event.category || 'Expo',
      capacity: event.capacity || 100,
      websiteLink: event.websiteLink || '',
      dressCode: event.dressCode || '',
      poster: event.poster || '',
      banner: event.banner || '',
      useBannerLink: event.banner && event.banner.startsWith('http') ? true : false,
      discounts: event.discounts || '',
      endDate: event.endDate ? new Date(event.endDate).toISOString().split('T')[0] : '',
      endTime: event.endTime || '',
      hasEndTime: !!event.endTime,
      isSingleDay: !event.endDate,
      usePosterLink: event.poster && event.poster.startsWith('http') ? true : false,
      hasMultipleTickets: event.hasMultipleTickets || false,
      tickets: event.tickets?.map(t => ({ name: t.name, price: t.price, soldOut: t.soldOut || false })) || [],
      sessions: event.sessions || [],
      speakers: event.speakers || [],
      isFeatured: event.isFeatured || false,
      coordinates: event.coordinates || { lat: null, lng: null }
    });
    setIsEditing(true);
    setEditingId(event._id);
    if (event.coordinates?.lat && event.coordinates?.lng) {
      setMapPosition([event.coordinates.lat, event.coordinates.lng]);
    } else {
      setMapPosition(null);
    }
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      try {
        await api.delete(`/events/${id}`);
        fetchEvents();
        toast.success('Event deleted successfully');
      } catch (err) {
        console.error(err);
        toast.error('Failed to delete event');
      }
    }
  };

  // ─── Map Click Handler — drops pin & reverse geocodes ─────────────────────
  const LocationPicker = () => {
    useMapEvents({
      click(e) {
        const { lat, lng } = e.latlng;
        setMapPosition([lat, lng]);
        setGeocoding(true);
        setFormData(prev => ({
          ...prev,
          location: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          coordinates: { lat, lng }
        }));
        // Google reverse geocode for proper address
        api.get(`/events/geocode/reverse?lat=${lat}&lng=${lng}`)
          .then(res => {
            if (res.data.status === "OK" && res.data.results[0]) {
              setFormData(prev => ({ ...prev, location: res.data.results[0].formatted_address }));
            }
          })
          .catch(() => {})
          .finally(() => setGeocoding(false));
      },
    });
    return mapPosition ? <Marker position={mapPosition} /> : null;
  };

  const filteredEvents = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.location && e.location.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={styles.container}>
      {/* Header Section */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Event Management</h1>
          <p style={styles.subtitle}>Supervise, update, and deploy new events to the platform.</p>
        </div>
        {user?.role === 'Organizer' && (
          <motion.button
            whileTap={{ scale: 0.95 }}
            style={styles.btnAdd}
            onClick={() => { resetForm(); setShowModal(true); }}
          >
            <Plus size={20} /> New Event
          </motion.button>
        )}
      </div>

      {/* Toolbar */}
      <div style={styles.toolbarRow}>
        <div style={styles.searchBox}>
          <Search size={20} color="var(--text-secondary)" />
          <input
            type="text"
            placeholder="Search events by title or location..."
            style={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <PageSkeleton />
      ) : events.length === 0 ? (
        <div style={styles.emptyState}>
          <h3>No events deployed</h3>
          <p>You haven't active events on the platform yet. Create one to get started!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          <AnimatePresence>
            {filteredEvents.map(event => (
              <motion.div
                key={event._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                style={styles.eventCard}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.cardIconBox}>
                    {event.poster
                      ? <img src={event.poster} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }} />
                      : (event.title ? event.title.charAt(0).toUpperCase() : 'E')
                    }
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {event.isFeatured && (
                      <span style={{ fontSize: '0.72rem', backgroundColor: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                        ⭐ Featured
                      </span>
                    )}
                    {user?.role === 'Organizer' && user._id === event.organizer?._id && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          style={{ ...styles.btnDelete, backgroundColor: 'var(--primary-color)' }}
                          onClick={() => handleEdit(event)}
                          title="Edit Event"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          style={styles.btnDelete}
                          onClick={() => handleDelete(event._id)}
                          title="Delete Event"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 style={styles.cardTitle}>{event.title || 'Untitled'}</h3>

                <div style={styles.cardMetaBlock}>
                  <div style={styles.metaLine}>
                    <Calendar size={16} color="var(--primary-color)" />
                    <span>{event.date ? new Date(event.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }) : 'TBA'}</span>
                  </div>
                  <div style={styles.metaLine}>
                    <MapPin size={16} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <span style={styles.locationText} title={event.location}>{event.location || 'Location Pending'}</span>
                  </div>
                  {event.time && (
                    <div style={styles.metaLine}>
                      <Clock size={16} color="var(--primary-color)" />
                      <span>{event.time}</span>
                    </div>
                  )}
                  <div style={styles.metaLine}>
                    <span style={{ fontSize: '0.8rem', backgroundColor: 'var(--primary-light)', color: '#fff', padding: '2px 8px', borderRadius: '4px' }}>
                      {event.category || 'Event'}
                    </span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>
                      {event.hasMultipleTickets && event.tickets?.length > 0 
                        ? (Math.min(...event.tickets.map(t => t.price)) === 0 ? 'Free' : `From Rs. ${Math.min(...event.tickets.map(t => t.price))}`)
                        : (event.price === 0 ? 'Free' : `Rs. ${event.price}`)}
                    </span>
                    {event.capacity && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} /> {event.capacity} seats
                      </span>
                    )}
                  </div>
                  {event.speakers && event.speakers.length > 0 && (
                    <div style={styles.metaLine}>
                      <Mic size={14} color="var(--primary-color)" />
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {event.speakers.map(s => s.name).join(', ')}
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.cardFooter}>
                  <span style={styles.footerLabel}>Organizer</span>
                  <span style={styles.footerValue}>{event.organizer?.name || 'Unknown User'}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create/Edit Event Modal */}
      <AnimatePresence>
        {showModal && (
          <div style={styles.modalBackdrop} onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); resetForm(); } }}>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              style={styles.modalContent}
            >
              <div style={styles.modalHeader}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 'clamp(1.1rem, 3vw, 1.5rem)' }}>
                  {isEditing ? '✏️ Update Event' : '🚀 Create New Event'}
                </h2>
                <button style={styles.btnClose} onClick={() => { setShowModal(false); resetForm(); }}>
                  <X size={24} />
                </button>
              </div>

              <style>{`
                .ev-modal-body::-webkit-scrollbar { width: 7px; }
                .ev-modal-body::-webkit-scrollbar-track { background: var(--bg-color); border-radius: 10px; margin: 4px 0; }
                .ev-modal-body::-webkit-scrollbar-thumb { background: linear-gradient(180deg, var(--primary-color) 0%, #7c3aed 100%); border-radius: 10px; border: 1px solid var(--bg-color); }
                .ev-modal-body::-webkit-scrollbar-thumb:hover { background: var(--primary-color); }
                .ev-modal-body { scrollbar-width: thin; scrollbar-color: var(--primary-color) var(--bg-color); }
              `}</style>
              <form onSubmit={handleSubmit} style={styles.modalBody} className="ev-modal-body">
                <div style={styles.splitLayout}>

                  {/* Left Column: Form Details */}
                  <div style={styles.leftCol}>
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Event Title</label>
                      <input
                        type="text"
                        style={styles.input}
                        placeholder="E.g., Global Tech Summit 2026"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ ...styles.inputGroup, flex: '1 1 140px' }}>
                        <label style={styles.label}>Start Date</label>
                        <input
                          type="date"
                          style={styles.input}
                          value={formData.date}
                          onChange={e => setFormData({ ...formData, date: e.target.value })}
                          required
                        />
                      </div>
                      {!formData.isSingleDay && (
                        <div style={{ ...styles.inputGroup, flex: '1 1 140px' }}>
                          <label style={styles.label}>End Date</label>
                          <input
                            type="date"
                            style={styles.input}
                            value={formData.endDate}
                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                          />
                        </div>
                      )}
                      <div style={{ ...styles.inputGroup, flex: '1 1 120px' }}>
                        <label style={styles.label}>Start Time</label>
                        <input
                          type="time"
                          style={styles.input}
                          value={formData.time}
                          onChange={e => setFormData({ ...formData, time: e.target.value })}
                        />
                      </div>
                      {formData.hasEndTime && (
                        <div style={{ ...styles.inputGroup, flex: '1 1 120px' }}>
                          <label style={styles.label}>End Time</label>
                          <input
                            type="time"
                            style={styles.input}
                            value={formData.endTime}
                            onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                          />
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.5rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={formData.isSingleDay} onChange={e => setFormData({ ...formData, isSingleDay: e.target.checked, endDate: e.target.checked ? '' : formData.endDate })} />
                        1 Day Event
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <input type="checkbox" checked={formData.hasEndTime} onChange={e => setFormData({ ...formData, hasEndTime: e.target.checked, endTime: e.target.checked ? formData.endTime : '' })} />
                        Add End Time
                      </label>
                    </div>

                    {/* Location Field */}
                    <div style={styles.inputGroup}>
                      <label style={styles.label}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} color="var(--primary-color)" />
                          Location
                          {geocoding && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: 'var(--primary-color)', fontWeight: 'normal' }}>
                              <Loader2 size={12} style={{ animation: 'ev-spin 0.8s linear infinite' }} /> Locating…
                            </span>
                          )}
                        </span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          style={{
                            ...styles.input,
                            paddingRight: '2.5rem',
                            borderColor: mapPosition ? 'var(--primary-color)' : undefined,
                            boxShadow: mapPosition ? '0 0 0 2px rgba(109,40,217,0.15)' : undefined,
                          }}
                          placeholder="Type address or 📍 drop a pin on the map →"
                          value={formData.location}
                          onChange={e => handleLocationSearch(e.target.value)}
                          onBlur={() => setTimeout(() => setLocationSuggestions([]), 200)}
                          required
                        />
                        {locationSuggestions.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', overflow: 'hidden' }}>
                            {locationSuggestions.map((loc, i) => (
                              <div
                                key={i}
                                onMouseDown={() => handleSelectLocation(loc)}
                                style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(109,40,217,0.08)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                <MapPin size={14} color="var(--primary-color)" style={{ flexShrink: 0 }} />
                                {loc.display_name}
                              </div>
                            ))}
                          </div>
                        )}
                        {mapPosition && (
                          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--primary-color)' }}>
                            <Navigation size={16} />
                          </span>
                        )}
                      </div>
                      {mapPosition && !geocoding && (
                        <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckmarkInline /> Location pinned from map
                        </p>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ ...styles.inputGroup, flex: '1 1 140px' }}>
                        <label style={styles.label}>Category</label>
                        <select style={styles.input} value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })}>
                          <option value="Expo">Expo</option>
                          <option value="Concert">Concert</option>
                          <option value="Recruitment Drive">Recruitment Drive</option>
                          <option value="Workshop">Workshop</option>
                          <option value="Conference">Conference</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1 1 100px', alignSelf: 'flex-end', marginBottom: '10px' }}>
                        <input type="checkbox" checked={formData.hasMultipleTickets} onChange={e => setFormData({ ...formData, hasMultipleTickets: e.target.checked })} style={{ cursor: 'pointer' }} />
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }} onClick={() => setFormData({ ...formData, hasMultipleTickets: !formData.hasMultipleTickets })}>Multiple Ticket Tiers</label>
                      </div>
                      {!formData.hasMultipleTickets && (
                        <div style={{ ...styles.inputGroup, flex: '1 1 100px' }}>
                          <label style={styles.label}>Price (Rs.)</label>
                          <input type="number" style={styles.input} min="0" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      {!formData.hasMultipleTickets && (
                        <div style={{ ...styles.inputGroup, flex: '1 1 140px' }}>
                          <label style={styles.label}>Capacity (seats)</label>
                          <input type="number" style={styles.input} min="1" value={formData.capacity} onChange={e => setFormData({ ...formData, capacity: Number(e.target.value) })} />
                        </div>
                      )}
                      <div style={{ ...styles.inputGroup, flex: '1 1 140px' }}>
                        <label style={styles.label}>Dress Code</label>
                        <select style={styles.input} value={formData.dressCode} onChange={e => setFormData({ ...formData, dressCode: e.target.value })}>
                          <option value="">None / Casual</option>
                          <option value="Business Formal">Business Formal</option>
                          <option value="Business Casual">Business Casual</option>
                          <option value="Smart Casual">Smart Casual</option>
                          <option value="Black Tie">Black Tie</option>
                        </select>
                      </div>
                    </div>

                    {formData.hasMultipleTickets && (
                      <div style={{ ...styles.inputGroup, borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <label style={{ ...styles.label, margin: 0 }}>Ticket Tiers</label>
                          <button type="button" onClick={() => setFormData({ ...formData, tickets: [...formData.tickets, { name: '', price: 0 }] })} style={{ ...styles.btnAdd, padding: '6px 12px', fontSize: '0.8rem' }}>+ Add Tier</button>
                        </div>
                        {formData.tickets.map((tkt, i) => (
                          <div key={i} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: 'var(--bg-color)', padding: '0.8rem', borderRadius: '8px', marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                            <select style={{ ...styles.input, flex: '1 1 120px', padding: '6px' }} value={tkt.name} onChange={e => { const nT = [...formData.tickets]; nT[i].name = e.target.value; setFormData({ ...formData, tickets: nT }); }}>
                              <option value="">Select Tier...</option>
                              <option value="Standard">Standard</option>
                              <option value="VIP">VIP</option>
                              <option value="Backstage">Backstage Pass</option>
                              <option value="Early Bird">Early Bird</option>
                              <option value="Student">Student</option>
                            </select>
                            <input type="number" style={{ ...styles.input, flex: '1 1 80px', padding: '6px' }} value={tkt.price} min="0" placeholder="Price (Rs.)" onChange={e => { const nT = [...formData.tickets]; nT[i].price = Number(e.target.value); setFormData({ ...formData, tickets: nT }); }} required />
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: '0.8rem', color: tkt.soldOut ? '#ef4444' : 'var(--text-secondary)', padding: '0 4px', userSelect: 'none' }}>
                              <input type="checkbox" checked={tkt.soldOut || false} onChange={e => { const nT = [...formData.tickets]; nT[i].soldOut = e.target.checked; setFormData({ ...formData, tickets: nT }); }} style={{ cursor: 'pointer' }} />
                              Sold Out
                            </label>
                            <button type="button" onClick={() => { const nT = [...formData.tickets]; nT.splice(i, 1); setFormData({ ...formData, tickets: nT }); }} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={styles.inputGroup}>
                      <label style={styles.label}>Event Website / Registration Link</label>
                      <input type="url" style={styles.input} placeholder="https://your-event-site.com" value={formData.websiteLink} onChange={e => setFormData({ ...formData, websiteLink: e.target.value })} />
                    </div>

                    {/* ── Image Uploads ── */}
                    <div style={{ ...styles.inputGroup, borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                      <label style={{ ...styles.label, fontSize: '0.9rem', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: 6 }}>🖼️ Event Images</label>
                      <p style={{ margin: '0 0 0.75rem', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Upload separate images for the event card thumbnail and the wide hero banner carousel.</p>

                      {/* Card Poster */}
                      <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1rem', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>📌 Card Poster <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(square/portrait · shown on event cards)</span></div>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.usePosterLink} onChange={e => setFormData({ ...formData, usePosterLink: e.target.checked, poster: '' })} /> Use URL
                          </label>
                        </div>
                        {formData.usePosterLink ? (
                          <input type="url" style={styles.input} placeholder="https://example.com/poster.jpg" value={formData.poster} onChange={e => setFormData({ ...formData, poster: e.target.value })} />
                        ) : (
                          <input type="file" accept="image/*" style={{ ...styles.input, padding: '8px' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) return toast.error('File too large (Max 5MB)');
                              const reader = new FileReader();
                              reader.onloadend = () => setFormData({ ...formData, poster: reader.result });
                              reader.readAsDataURL(file);
                            }}
                          />
                        )}
                        {formData.poster && (
                          <div style={{ marginTop: '0.6rem', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                            <div style={{ width: 80, height: 80, borderRadius: 10, backgroundImage: `url(${formData.poster})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '2px solid var(--border-color)', flexShrink: 0 }} />
                            <div style={{ flex: 1, fontSize: '0.75rem', color: 'var(--text-secondary)', paddingTop: 4 }}>✅ Card poster set — shows as thumbnail in the event grid.</div>
                            <button type="button" onClick={() => setFormData({ ...formData, poster: '' })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: 0, fontSize: '0.75rem', flexShrink: 0 }}>✕ Remove</button>
                          </div>
                        )}
                      </div>

                      {/* Hero Banner */}
                      <div style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: 12, padding: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <div>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>🎬 Hero Banner <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>(wide 16:9 · shown in home carousel)</span></div>
                          </div>
                          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <input type="checkbox" checked={formData.useBannerLink} onChange={e => setFormData({ ...formData, useBannerLink: e.target.checked, banner: '' })} /> Use URL
                          </label>
                        </div>
                        {formData.useBannerLink ? (
                          <input type="url" style={styles.input} placeholder="https://example.com/banner.jpg (1280×720 recommended)" value={formData.banner} onChange={e => setFormData({ ...formData, banner: e.target.value })} />
                        ) : (
                          <input type="file" accept="image/*" style={{ ...styles.input, padding: '8px' }}
                            onChange={e => {
                              const file = e.target.files[0];
                              if (!file) return;
                              if (file.size > 8 * 1024 * 1024) return toast.error('File too large (Max 8MB for banners)');
                              const reader = new FileReader();
                              reader.onloadend = () => setFormData({ ...formData, banner: reader.result });
                              reader.readAsDataURL(file);
                            }}
                          />
                        )}
                        {formData.banner && (
                          <div style={{ marginTop: '0.6rem' }}>
                            <div style={{ width: '100%', height: 110, borderRadius: 10, backgroundImage: `url(${formData.banner})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '2px solid var(--border-color)' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>✅ Banner set — appears in home page sliding carousel.</span>
                              <button type="button" onClick={() => setFormData({ ...formData, banner: '' })} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.75rem' }}>✕ Remove</button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ ...styles.inputGroup, flex: '1 1 140px' }}>
                      <label style={styles.label}>Discounts</label>
                      <input type="text" style={styles.input} placeholder="e.g. 20% off for Early Birds" value={formData.discounts} onChange={e => setFormData({ ...formData, discounts: e.target.value })} />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
                      <input type="checkbox" id="isFeaturedChk" checked={formData.isFeatured} onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      <label htmlFor="isFeaturedChk" style={{ ...styles.label, margin: 0, cursor: 'pointer', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Star size={15} color="#f59e0b" fill="#f59e0b" /> Mark as Featured Event (shows in home banner)
                      </label>
                    </div>

                    <div style={{ ...styles.inputGroup, flexGrow: 1 }}>
                      <label style={styles.label}>Event Description</label>
                      <textarea
                        style={{ ...styles.input, minHeight: '100px', resize: 'vertical' }}
                        placeholder="Describe what attendees can expect..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>

                    {/* ─── Speakers / Performers ─── */}
                    <div style={{ ...styles.inputGroup, borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label style={{ ...styles.label, margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mic size={15} color="var(--primary-color)" /> Speakers / Performers
                        </label>
                        <button type="button" onClick={() => setShowSpeakerModal(true)} style={{ ...styles.btnAdd, padding: '5px 12px', fontSize: '0.78rem' }}>
                          + Add New
                        </button>
                      </div>

                      {/* Speaker search */}
                      <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                        <input
                          type="text"
                          style={{ ...styles.input, paddingLeft: '2.2rem' }}
                          placeholder="Search speakers / musicians..."
                          value={speakerSearch}
                          onChange={e => handleSpeakerSearch(e.target.value)}
                          onBlur={() => setTimeout(() => setSpeakerResults([]), 250)}
                        />
                        <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
                        {speakerResults.length > 0 && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden' }}>
                            {speakerResults.map(sp => (
                              <div
                                key={sp._id}
                                onMouseDown={() => addSpeakerToEvent(sp)}
                                style={{ padding: '0.7rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}
                                onMouseOver={e => e.currentTarget.style.backgroundColor = 'rgba(109,40,217,0.08)'}
                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                              >
                                {sp.photo
                                  ? <img src={sp.photo} alt="" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                                  : <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>{sp.name[0]}</div>
                                }
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{sp.name}</div>
                                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{sp.role} {sp.genre ? `· ${sp.genre}` : ''}{sp.expertise ? `· ${sp.expertise}` : ''}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Added speakers chips */}
                      {formData.speakers.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {formData.speakers.map(sp => (
                            <div key={sp._id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.3)', borderRadius: '20px', padding: '4px 10px', fontSize: '0.85rem' }}>
                              {sp.photo && <img src={sp.photo} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />}
                              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{sp.name}</span>
                              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>{sp.role}</span>
                              <button type="button" onClick={() => removeSpeakerFromEvent(sp._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0, display: 'flex', alignItems: 'center' }}>
                                <X size={13} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>


                  </div>

                  {/* Right Column: Interactive Map */}
                  <div style={styles.rightCol}>
                    <p style={{ ...styles.label, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <MapPin size={14} color="var(--primary-color)" /> Pinpoint Event Location
                    </p>
                    <p style={{ margin: '0 0 0.8rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Click anywhere on the map to drop a pin and auto-fill the address above.
                    </p>
                    <style>{`@keyframes ev-spin { to { transform: rotate(360deg); } }`}</style>
                    <div style={styles.mapWrapper}>
                      <MapContainer
                        center={[30.3753, 69.3451]}
                        zoom={5}
                        scrollWheelZoom={true}
                        style={{ height: '100%', width: '100%', zIndex: 1 }}
                      >
                        <TileLayer
                          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                          attribution="&copy; Google Maps"
                        />
                        <LocationPicker />
                        <MapController position={mapPosition} />
                      </MapContainer>
                      {geocoding && (
                        <div style={styles.mapGeocoding}>
                          <Loader2 size={16} style={{ animation: 'ev-spin 0.8s linear infinite' }} />
                          Reverse geocoding…
                        </div>
                      )}
                      {!geocoding && mapPosition && (
                        <div style={{ ...styles.mapTip, background: 'rgba(109,40,217,0.85)' }}>
                          📍 Pin dropped — address filled above!
                        </div>
                      )}
                      {!geocoding && !mapPosition && (
                        <div style={styles.mapTip}>
                          👆 Click the map to set the precise location
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                <div style={styles.modalFooter}>
                  <button type="button" style={styles.btnCancel} onClick={() => { setShowModal(false); resetForm(); }}>
                    Cancel
                  </button>
                  <button type="submit" style={styles.btnSubmit} disabled={creating}>
                    {creating ? <Loader2 className="animate-spin" size={20} /> : (isEditing ? 'Update Event' : 'Publish Event')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSpeakerModal && (
          <div style={{ ...styles.modalBackdrop, zIndex: 10001 }} onClick={e => { if (e.target === e.currentTarget) handleCloseSpeakerModal(); }}>
            <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} style={{ ...styles.modalContent, maxWidth: '540px' }}>
              <div style={styles.modalHeader}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>🎤 Add Speaker / Performer</h2>
                <button style={styles.btnClose} onClick={handleCloseSpeakerModal}><X size={22} /></button>
              </div>

              {/* ── Universal Person Search Panel ── */}
              <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-color)', background: 'linear-gradient(135deg, rgba(109,40,217,0.06) 0%, rgba(30,58,138,0.04) 100%)' }}>

                <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <input
                      type="text"
                      style={{ ...styles.input, fontSize: '0.88rem', width: '100%' }}
                      placeholder="Search any person (e.g. Imran Khan, Talha Anjum...)"
                      value={personQuery}
                      onChange={e => handlePersonInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), fetchPersonResults())}
                      onFocus={() => personResults.length > 0 && setPersonDropdown(true)}
                      onBlur={() => setTimeout(() => setPersonDropdown(false), 200)}
                    />

                    {/* Live suggestion dropdown */}
                    {personDropdown && personResults.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,0.18)', overflow: 'hidden', marginTop: '4px' }}>
                        {personResults.map(person => {
                          const isSpotify = person.source === 'spotify';
                          const isWiki    = person.source === 'wikipedia';
                          const accentColor = isSpotify ? '#1DB954' : 'var(--primary-color)';
                          const hoverBg    = isSpotify ? 'rgba(29,185,84,0.07)' : 'rgba(109,40,217,0.07)';
                          return (
                            <div
                              key={person.id}
                              onMouseDown={() => applyPerson(person)}
                              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid var(--border-color)', transition: '0.15s' }}
                              onMouseOver={e => e.currentTarget.style.backgroundColor = hoverBg}
                              onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              {/* Avatar with source badge */}
                              <div style={{ position: 'relative', flexShrink: 0 }}>
                                {person.image
                                  ? <img src={person.image} alt={person.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${accentColor}` }} />
                                  : <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: `linear-gradient(135deg,${accentColor},${isWiki ? '#7c3aed' : '#17a84a'})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: '1rem' }}>{person.name[0]}</div>
                                }
                                {/* Source badge */}
                                {isSpotify && (
                                  <div title="From Spotify" style={{ position: 'absolute', bottom: '-2px', right: '-3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#1DB954', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid var(--bg-surface)' }}>
                                    <svg viewBox="0 0 24 24" width="9" height="9" fill="#000"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>
                                  </div>
                                )}
                                {isWiki && (
                                  <div title="From Wikipedia" style={{ position: 'absolute', bottom: '-2px', right: '-3px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #a2a9b1' }}>
                                    <span style={{ color: '#202122', fontWeight: 900, fontSize: '8px', lineHeight: 1 }}>W</span>
                                  </div>
                                )}
                              </div>
                              {/* Text info */}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{person.name}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', display: 'flex', gap: '5px', alignItems: 'center', marginTop: '2px', overflow: 'hidden' }}>
                                  <span style={{ backgroundColor: `${accentColor}18`, color: accentColor, padding: '1px 7px', borderRadius: '20px', fontWeight: 600, fontSize: '0.67rem', whiteSpace: 'nowrap', flexShrink: 0 }}>{person.role}</span>
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{person.description}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      </div>
                    )}
                    {personDropdown && personSearched && !personLoading && personResults.length === 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99999, backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        No results found for "{personQuery}" — fill manually below
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fetchPersonResults()}
                    disabled={personLoading || !personQuery.trim()}
                    style={{ padding: '0 14px', borderRadius: '10px', border: 'none', backgroundColor: 'var(--primary-color)', color: '#fff', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap', opacity: (!personQuery.trim() || personLoading) ? 0.5 : 1, flexShrink: 0 }}
                  >
                    {personLoading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Search
                  </button>
                </div>

                {personLoading && (
                  <div style={{ padding: '0.5rem 0', textAlign: 'center' }}>
                    <Loader2 size={18} className="animate-spin" style={{ color: 'var(--primary-color)' }} />
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveNewSpeaker} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto', maxHeight: '52vh' }}>
                {/* Photo + name preview after selection */}
                {newSpeaker.photo && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', backgroundColor: 'rgba(109,40,217,0.06)', borderRadius: '12px', border: '1px solid rgba(109,40,217,0.2)' }}>
                    <img src={newSpeaker.photo} alt="" style={{ width: '54px', height: '54px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)', flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{newSpeaker.name || 'Person'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600 }}>✓ Profile fetched — edit any field below</div>
                    </div>
                  </div>
                )}

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Full Name *</label>
                  <input type="text" style={styles.input} placeholder="e.g. Imran Khan" value={newSpeaker.name} onChange={e => setNewSpeaker({ ...newSpeaker, name: e.target.value })} required />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Role</label>
                    <select style={styles.input} value={newSpeaker.role} onChange={e => setNewSpeaker({ ...newSpeaker, role: e.target.value })}>
                      <option>Speaker</option>
                      <option>Musician</option>
                      <option>DJ</option>
                      <option>Performer</option>
                      <option>MC</option>
                      <option>Keynote</option>
                    </select>
                  </div>
                  <div style={{ ...styles.inputGroup, flex: 1 }}>
                    <label style={styles.label}>Genre (if Musician)</label>
                    <input type="text" style={styles.input} placeholder="e.g. Hip-Hop, Pop" value={newSpeaker.genre} onChange={e => setNewSpeaker({ ...newSpeaker, genre: e.target.value })} />
                  </div>
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Expertise / Topic</label>
                  <input type="text" style={styles.input} placeholder="e.g. Leadership, AI, Motivational Speaking" value={newSpeaker.expertise} onChange={e => setNewSpeaker({ ...newSpeaker, expertise: e.target.value })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Bio</label>
                  <textarea style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }} placeholder="Short biography..." value={newSpeaker.bio} onChange={e => setNewSpeaker({ ...newSpeaker, bio: e.target.value })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Social / Website Link</label>
                  <input type="url" style={styles.input} placeholder="https://..." value={newSpeaker.socialLink} onChange={e => setNewSpeaker({ ...newSpeaker, socialLink: e.target.value })} />
                </div>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Photo {newSpeaker.photo ? '(already filled — or replace)' : '(upload manually if not found)'}</label>
                  <input type="file" accept="image/*" style={{ ...styles.input, padding: '8px' }} onChange={e => {
                    const file = e.target.files[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setNewSpeaker({ ...newSpeaker, photo: reader.result });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                  <button type="button" style={styles.btnCancel} onClick={handleCloseSpeakerModal}>Cancel</button>
                  <button type="submit" style={styles.btnSubmit} disabled={savingSpeaker}>
                    {savingSpeaker ? <Loader2 size={18} className="animate-spin" /> : 'Save & Add to Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    
    </div>
  );
};

// Tiny inline checkmark icon
const CheckmarkInline = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <circle cx="6" cy="6" r="6" fill="rgba(109,40,217,0.2)" />
    <path d="M3 6l2.5 2.5L9 4" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const styles = {
  container: { padding: '1rem' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' },
  title: { fontSize: 'clamp(1.4rem, 4vw, 2rem)', color: 'var(--text-primary)', fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: 'clamp(0.8rem, 2vw, 1rem)' },
  btnAdd: { display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--primary-color)', color: '#fff', border: 'none', padding: '0.8rem 1.4rem', borderRadius: '10px', cursor: 'pointer', fontWeight: 600, fontSize: '1rem', boxShadow: '0 4px 6px rgba(30, 58, 138, 0.2)', whiteSpace: 'nowrap' },
  toolbarRow: { marginBottom: '2rem' },
  searchBox: { display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '0 1rem', maxWidth: '400px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  searchInput: { border: 'none', backgroundColor: 'transparent', padding: '1rem', width: '100%', color: 'var(--text-primary)', outline: 'none', fontSize: '0.95rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' },
  eventCard: { backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', padding: '1.5rem', boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)', display: 'flex', flexDirection: 'column' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' },
  cardIconBox: { width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--primary-light)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', overflow: 'hidden', flexShrink: 0 },
  btnDelete: { backgroundColor: 'var(--danger)', color: '#fff', border: 'none', width: '32px', height: '32px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0.8, transition: '0.2s' },
  cardTitle: { fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' },
  cardMetaBlock: { display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem', flexGrow: 1 },
  metaLine: { display: 'flex', alignItems: 'flex-start', gap: '0.6rem', color: 'var(--text-secondary)', fontSize: '0.88rem', fontWeight: 500 },
  locationText: { overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' },
  cardFooter: { paddingTop: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerLabel: { fontSize: '0.8rem', color: 'var(--text-secondary)' },
  footerValue: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', backgroundColor: 'var(--border-color)', padding: '4px 8px', borderRadius: '6px' },
  loadingBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4rem', color: 'var(--text-secondary)' },
  emptyState: { textAlign: 'center', padding: '4rem', backgroundColor: 'var(--bg-surface)', borderRadius: '16px', border: '1px dashed var(--border-color)', color: 'var(--text-secondary)' },
  modalBackdrop: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 'clamp(0.5rem, 3vw, 2rem)', overflow: 'hidden' },
  modalContent: { backgroundColor: 'var(--bg-surface)', borderRadius: '20px', width: '100%', maxWidth: '1050px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', maxHeight: '95vh', margin: 'auto' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border-color)' },
  btnClose: { background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' },
  modalBody: { padding: 'clamp(1rem, 3vw, 2rem)', overflowY: 'auto', flex: 1, scrollBehavior: 'smooth' },
  splitLayout: { display: 'flex', gap: '2rem', flexWrap: 'wrap' },
  leftCol: { flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: '1rem' },
  rightCol: { flex: '1 1 300px', display: 'flex', flexDirection: 'column', minHeight: '380px' },
  mapWrapper: { flex: 1, borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--border-color)', position: 'relative', minHeight: '280px' },
  mapGeocoding: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.82)', color: '#fff', fontSize: '0.85rem', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1000, backdropFilter: 'blur(4px)' },
  mapTip: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.8)', color: '#fff', fontSize: '0.82rem', padding: '8px 12px', textAlign: 'center', zIndex: 1000 },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' },
  input: { padding: '11px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)', fontSize: '0.93rem', outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' },
  modalFooter: { padding: '1.2rem 1.5rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', backgroundColor: 'var(--bg-color)', flexWrap: 'wrap' },
  btnCancel: { padding: '11px 22px', borderRadius: '10px', backgroundColor: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontWeight: 600, cursor: 'pointer' },
  btnSubmit: { padding: '11px 22px', borderRadius: '10px', backgroundColor: 'var(--primary-color)', border: 'none', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' },
};

export default Events;
