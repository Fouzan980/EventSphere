import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-toastify';

const Schedule = () => {
  const { user } = useContext(AuthContext);
  const [bookmarks, setBookmarks] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBookmarks = async () => {
    try {
      const [bmRes, evRes] = await Promise.all([
        api.get('/bookmarks'),
        api.get('/events')
      ]);
      setBookmarks(bmRes.data);
      setEvents(evRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookmarks();
  }, [user]);

  const handleAddBookmark = async (eventId) => {
    try {
      await api.post('/bookmarks', { eventId });
      toast.success('Bookmark added');
      fetchBookmarks();
    } catch {
      toast.error('Failed to add bookmark');
    }
  };

  const handleRemoveBookmark = async (id) => {
    try {
      await api.delete(`/bookmarks/${id}`);
      toast.success('Bookmark removed');
      fetchBookmarks();
    } catch {
      toast.error('Failed to remove bookmark');
    }
  };

  if (!user) return <div>Please login.</div>;

  // Filter out events that are already bookmarked
  const bookmarkedEventIds = bookmarks.map(b => b.eventId?._id);
  const availableEvents = events.filter(e => !bookmarkedEventIds.includes(e._id));

  return (
    <div>
      <h2 style={{color: 'var(--primary-color)', marginBottom: '1rem'}}>My Schedule</h2>
      
      <div style={styles.card}>
        <h3 style={{marginBottom: '1rem'}}>Bookmarked Sessions</h3>
        {loading ? <p>Loading...</p> : (
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', marginBottom: '2rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem 0' }}>Event Name</th>
                <th>Date</th>
                <th>Location</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {bookmarks.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '2rem 0', textAlign: 'center', color: 'var(--text-secondary)' }}>You haven't bookmarked any events yet.</td>
                </tr>
              ) : (
                bookmarks.map(bm => (
                  <tr key={bm._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem 0', fontWeight: 500 }}>{bm.eventId?.title}</td>
                    <td>{bm.eventId?.date ? new Date(bm.eventId.date).toLocaleDateString() : 'N/A'}</td>
                    <td>{bm.eventId?.location}</td>
                    <td>
                      <button style={{color: 'var(--danger)', background: 'transparent', border:'none', cursor: 'pointer', fontWeight: 'bold'}} onClick={() => handleRemoveBookmark(bm._id)}>Remove</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        <h3 style={{marginBottom: '1rem', marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem'}}>Available Events to Bookmark</h3>
        {availableEvents.length === 0 ? (
          <p style={{color: 'var(--text-secondary)'}}>No more events available to bookmark.</p>
        ) : (
          <div style={styles.grid}>
            {availableEvents.map(ev => (
              <div key={ev._id} style={styles.eventCard}>
                <h4>{ev.title}</h4>
                <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '0.5rem 0'}}>{new Date(ev.date).toLocaleDateString()} - {ev.location}</p>
                <button className="btn-primary" style={{marginTop: '0.5rem', width: '100%'}} onClick={() => handleAddBookmark(ev._id)}>Bookmark Event</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  card: { padding: '2rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '12px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' },
  eventCard: { padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: 'var(--bg-color)'}
};

export default Schedule;
