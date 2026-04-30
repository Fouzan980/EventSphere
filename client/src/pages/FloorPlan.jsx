import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, Grid, Loader2, ChevronDown, ZoomIn } from 'lucide-react';
import { toast } from 'react-toastify';

const GRID_COLS = 20; // columns
const GRID_ROWS = 15; // rows
const CELL_SIZE = 38; // px per cell

// colour palette per status
const statusColors = {
  Available: { bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8' },
  Assigned:  { bg: '#dcfce7', border: '#86efac', text: '#15803d' },
  pending:   { bg: '#fef3c7', border: '#fcd34d', text: '#b45309' },
};

const FloorPlan = () => {
  const { user } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [booths, setBooths] = useState([]);
  const [eventApplications, setEventApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Grid selection state
  const [selection, setSelection] = useState(null);   // { startCol, startRow, endCol, endRow }
  const [isSelecting, setIsSelecting] = useState(false);

  // New booth form
  const [showForm, setShowForm] = useState(false);
  const [newBooth, setNewBooth] = useState({
    boothNumber: '',
    label: '',
    widthM: 3,    // metres width
    depthM: 3,    // metres depth
    areaM2: 9,    // auto-calculated
    notes: '',
    assignedTo: ''
  });

  // Hover cell for grid tooltip
  const [hoverCell, setHoverCell] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const { data } = await api.get('/events');
        setEvents(data);
        if (data.length > 0) setSelectedEventId(data[0]._id);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    if (user) fetchEvents();
  }, [user]);

  useEffect(() => {
    if (selectedEventId) fetchDataForEvent(selectedEventId);
  }, [selectedEventId]);

  const fetchDataForEvent = async (eventId) => {
    try {
      const { data: bData } = await api.get(`/events/${eventId}/booths`);
      setBooths(bData);
      
      const { data: aData } = await api.get('/applications');
      setEventApplications(aData.filter(app => app.eventId?._id === eventId && app.status === 'Approved'));
    } catch (err) { console.error('Failed to fetch event data', err); }
  };

  // --- Grid interaction helpers ---
  const cellKey = (c, r) => `${c}-${r}`;

  // Check if a cell is covered by any booth
  const getCellBooth = (col, row) =>
    booths.find(b => {
      if (!b.gridArea) return false;
      const { startCol, startRow, endCol, endRow } = b.gridArea;
      return col >= startCol && col <= endCol && row >= startRow && row <= endRow;
    });

  const isInSelection = (col, row) => {
    if (!selection) return false;
    const minC = Math.min(selection.startCol, selection.endCol);
    const maxC = Math.max(selection.startCol, selection.endCol);
    const minR = Math.min(selection.startRow, selection.endRow);
    const maxR = Math.max(selection.startRow, selection.endRow);
    return col >= minC && col <= maxC && row >= minR && row <= maxR;
  };

  const onMouseDown = (col, row) => {
    if (user?.role !== 'Organizer') return;
    setIsSelecting(true);
    setSelection({ startCol: col, startRow: row, endCol: col, endRow: row });
    setShowForm(false);
  };

  const onMouseEnter = (col, row) => {
    setHoverCell({ col, row });
    if (isSelecting) {
      setSelection(prev => prev ? { ...prev, endCol: col, endRow: row } : prev);
    }
  };

  const onMouseUp = () => {
    if (isSelecting && selection) {
      setIsSelecting(false);
      // Auto-calc dimensions from selected cells
      const cols = Math.abs(selection.endCol - selection.startCol) + 1;
      const rows = Math.abs(selection.endRow - selection.startRow) + 1;
      // 1 cell ≈ 1 metre
      setNewBooth(prev => ({
        ...prev,
        widthM: cols,
        depthM: rows,
        areaM2: cols * rows,
        boothNumber: `B${booths.length + 1}`
      }));
      setShowForm(true);
    }
  };

  const handleCreateBooth = async (e) => {
    e.preventDefault();
    if (!selection) return;
    const gridArea = {
      startCol: Math.min(selection.startCol, selection.endCol),
      startRow: Math.min(selection.startRow, selection.endRow),
      endCol: Math.max(selection.startCol, selection.endCol),
      endRow: Math.max(selection.startRow, selection.endRow),
    };
    try {
      await api.post(`/events/${selectedEventId}/booths`, {
        boothNumber: newBooth.boothNumber,
        label: newBooth.label,
        widthM: newBooth.widthM,
        depthM: newBooth.depthM,
        areaM2: newBooth.areaM2,
        notes: newBooth.notes,
        assignedTo: newBooth.assignedTo,
        gridArea,
        coordinates: { x: gridArea.startCol * CELL_SIZE, y: gridArea.startRow * CELL_SIZE }
      });
      setShowForm(false);
      setSelection(null);
      setNewBooth({ boothNumber: '', label: '', widthM: 3, depthM: 3, areaM2: 9, notes: '', assignedTo: '' });
      toast.success('Booth created successfully');
      fetchDataForEvent(selectedEventId);
    } catch {
      toast.error('Failed to create booth');
    }
  };

  const handleDeleteBooth = async (boothId) => {
    if (!window.confirm('Delete this booth? This cannot be undone.')) return;
    try {
      await api.delete(`/events/${selectedEventId}/booths/${boothId}`);
      toast.success('Booth deleted');
      fetchDataForEvent(selectedEventId);
    } catch {
      toast.error('Failed to delete');
    }
  };

  if (!user || user.role === 'Attendee') {
    return <div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Access restricted.</div>;
  }

  const gridAreaStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
    gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`,
    gap: '1px',
    backgroundColor: '#e2e8f0',
    border: '2px solid var(--border-color)',
    borderRadius: '12px',
    overflow: 'hidden',
    userSelect: 'none',
    cursor: user?.role === 'Organizer' ? 'crosshair' : 'default',
    width: 'fit-content',
    position: 'relative'
  };

  return (
    <div style={styles.container} onMouseUp={onMouseUp}>
      {/* Header */}
      <div style={styles.headerRow}>
        <div>
          <h1 style={styles.title}>Floor Plan Builder</h1>
          <p style={styles.subtitle}>
            {user?.role === 'Organizer'
              ? 'Click and drag on the grid to visually define booth spaces. Each cell ≈ 1m².'
              : 'View the current floor plan and available booth positions.'}
          </p>
        </div>
        {/* Event Selector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '250px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Viewing Event</label>
          <div style={{ position: 'relative' }}>
            <select
              style={styles.select}
              value={selectedEventId}
              onChange={e => setSelectedEventId(e.target.value)}
            >
              {events.map(ev => <option key={ev._id} value={ev._id}>{ev.title}</option>)}
            </select>
            <ChevronDown size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#64748b' }} />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Grid Area */}
          <div style={{ overflowX: 'auto', flex: 1 }}>
            {/* Legend */}
            <div style={styles.legendRow}>
              {Object.entries(statusColors).map(([key, val]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: val.bg, border: `1px solid ${val.border}` }} />
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <div style={{ width: '14px', height: '14px', borderRadius: '3px', backgroundColor: '#818cf8' }} />
                Selected
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <ZoomIn size={14} style={{ marginRight: '4px' }} />{booths.length} booths placed
              </div>
            </div>

            {/* GRID */}
            <div
              style={gridAreaStyle}
              onMouseLeave={() => { setHoverCell(null); if(isSelecting) setIsSelecting(false); }}
            >
              {Array.from({ length: GRID_ROWS }, (_, row) =>
                Array.from({ length: GRID_COLS }, (_, col) => {
                  const booth = getCellBooth(col, row);
                  const inSel = isInSelection(col, row);
                  const isFirstCell = booth && booth.gridArea?.startCol === col && booth.gridArea?.startRow === row;
                  const statusCfg = booth ? (statusColors[booth.status] || statusColors.Available) : null;

                  return (
                    <div
                      key={cellKey(col, row)}
                      onMouseDown={() => !booth && onMouseDown(col, row)}
                      onMouseEnter={() => onMouseEnter(col, row)}
                      style={{
                        width: `${CELL_SIZE}px`,
                        height: `${CELL_SIZE}px`,
                        backgroundColor: inSel
                          ? '#818cf8'
                          : booth ? statusCfg.bg : (hoverCell?.col === col && hoverCell?.row === row ? '#f0f9ff' : '#fff'),
                        border: `1px solid ${booth ? statusCfg.border : '#e2e8f0'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: booth ? statusCfg.text : '#cbd5e1',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'background-color 0.1s',
                        cursor: booth ? 'default' : (user?.role === 'Organizer' ? 'crosshair' : 'default')
                      }}
                    >
                      {isFirstCell && (
                        <div style={{ textAlign: 'center', padding: '2px', lineHeight: 1.2, zIndex: 2 }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 800 }}>{booth.boothNumber}</div>
                          {booth.areaM2 && <div style={{ fontSize: '0.55rem', opacity: 0.8 }}>{booth.areaM2}m²</div>}
                          {user?.role === 'Organizer' && (
                            <button
                              onClick={() => handleDeleteBooth(booth._id)}
                              style={{
                                position: 'absolute', top: '2px', right: '2px',
                                background: '#ef4444', border: 'none', borderRadius: '3px',
                                color: '#fff', cursor: 'pointer', padding: '1px 3px',
                                lineHeight: 1, fontSize: '0.55rem'
                              }}
                            >✕</button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Row/Col ruler */}
            <div style={{ display: 'flex', gap: '1px', marginTop: '4px', paddingLeft: '0' }}>
              {Array.from({ length: GRID_COLS }, (_, i) => (
                <div key={i} style={{ width: `${CELL_SIZE}px`, textAlign: 'center', fontSize: '0.6rem', color: '#94a3b8' }}>{i+1}</div>
              ))}
            </div>
          </div>

          {/* Right Panel: Booth List */}
          <div style={styles.boothList}>
            <h3 style={styles.panelTitle}>Placed Booths ({booths.length})</h3>
            {booths.length === 0 ? (
              <div style={styles.emptyPanel}>
                <Grid size={32} color="#cbd5e1" />
                <p>{user?.role === 'Organizer' ? 'Click & drag on the grid to create a booth.' : 'No booths placed yet.'}</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {booths.map(b => {
                  const sc = statusColors[b.status] || statusColors.Available;
                  return (
                    <div key={b._id} style={{ ...styles.boothCard, borderLeft: `3px solid ${sc.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                          {b.boothNumber} {b.label && `— ${b.label}`}
                        </span>
                        <span style={{ ...styles.statusPill, backgroundColor: sc.bg, color: sc.text }}>{b.status}</span>
                      </div>
                      {b.areaM2 && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {b.widthM}m × {b.depthM}m = <strong>{b.areaM2}m²</strong>
                        </div>
                      )}
                      {b.assignedTo?.name && (
                        <div style={{ fontSize: '0.8rem', color: '#059669', marginTop: '4px' }}>
                          👤 Assigned: {b.assignedTo.name}
                        </div>
                      )}
                      {b.notes && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{b.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Booth Slide-in Form */}
      <AnimatePresence>
        {showForm && selection && (
          <div style={styles.formOverlay}>
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={styles.formPanel}
            >
              <div style={styles.formHeader}>
                <h3 style={{ margin: 0 }}>Configure Booth</h3>
                <button style={styles.closeBtn} onClick={() => { setShowForm(false); setSelection(null); }}>
                  <X size={22} />
                </button>
              </div>

              {/* Visual preview of selection */}
              <div style={styles.selectionPreview}>
                <div style={styles.previewBox}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{newBooth.widthM}m × {newBooth.depthM}m</div>
                  <div style={{ fontSize: '1rem', color: '#64748b' }}>{newBooth.areaM2} m² total area</div>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0.5rem 0 0 0' }}>
                  Grid cells: col {Math.min(selection.startCol, selection.endCol)+1}–{Math.max(selection.startCol, selection.endCol)+1},
                  row {Math.min(selection.startRow, selection.endRow)+1}–{Math.max(selection.startRow, selection.endRow)+1}
                </p>
              </div>

              <form onSubmit={handleCreateBooth} style={styles.innerForm}>
                <div style={styles.fg}>
                  <label style={styles.label}>Booth Number / ID *</label>
                  <input
                    style={styles.input} required
                    placeholder="e.g. B01, Hall-A3"
                    value={newBooth.boothNumber}
                    onChange={e => setNewBooth(p => ({ ...p, boothNumber: e.target.value }))}
                  />
                </div>
                <div style={styles.fg}>
                  <label style={styles.label}>Booth Label / Name</label>
                  <input
                    style={styles.input}
                    placeholder="e.g. Tech Corner, Premium Stand"
                    value={newBooth.label}
                    onChange={e => setNewBooth(p => ({ ...p, label: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ ...styles.fg, flex: 1 }}>
                    <label style={styles.label}>Width (m)</label>
                    <input
                      type="number" min="1" style={styles.input}
                      value={newBooth.widthM}
                      onChange={e => setNewBooth(p => ({ ...p, widthM: +e.target.value, areaM2: +e.target.value * p.depthM }))}
                    />
                  </div>
                  <div style={{ ...styles.fg, flex: 1 }}>
                    <label style={styles.label}>Depth (m)</label>
                    <input
                      type="number" min="1" style={styles.input}
                      value={newBooth.depthM}
                      onChange={e => setNewBooth(p => ({ ...p, depthM: +e.target.value, areaM2: p.widthM * +e.target.value }))}
                    />
                  </div>
                  <div style={{ ...styles.fg, flex: 1 }}>
                    <label style={styles.label}>Area (m²)</label>
                    <input
                      type="number" style={{ ...styles.input, backgroundColor: '#f1f5f9' }}
                      value={newBooth.areaM2} readOnly
                    />
                  </div>
                </div>
                <div style={styles.fg}>
                  <label style={styles.label}>Notes / Instructions</label>
                  <textarea
                    style={{ ...styles.input, resize: 'vertical', minHeight: '70px' }}
                    placeholder="Electricity available, corner spot, etc."
                    value={newBooth.notes}
                    onChange={e => setNewBooth(p => ({ ...p, notes: e.target.value }))}
                  />
                </div>
                {user?.role === 'Organizer' && (
                  <div style={styles.fg}>
                    <label style={styles.label}>Assign to Approved Exhibitor</label>
                    <select
                      style={styles.input}
                      value={newBooth.assignedTo}
                      onChange={e => setNewBooth(p => ({ ...p, assignedTo: e.target.value }))}
                    >
                      <option value="">Leave Available</option>
                      {eventApplications.map(app => (
                        <option key={app._id} value={app.exhibitorId._id}>
                          {app.exhibitorId.companyName || app.exhibitorId.name} (Req: {app.boothSizePreference})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="submit" style={styles.submitBtn}>
                  <Plus size={18} /> Place Booth
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const styles = {
  container: { padding: '1rem', userSelect: 'none' },
  headerRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem'
  },
  title: { fontSize: '2rem', color: 'var(--text-primary)', fontWeight: 800, margin: 0 },
  subtitle: { color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '500px' },
  select: {
    width: '100%', padding: '10px 36px 10px 12px',
    border: '1px solid var(--border-color)', borderRadius: '10px',
    backgroundColor: 'var(--bg-surface)', color: 'var(--text-primary)',
    fontSize: '0.95rem', outline: 'none', appearance: 'none', cursor: 'pointer'
  },
  legendRow: {
    display: 'flex', gap: '1.5rem', alignItems: 'center',
    marginBottom: '0.75rem', flexWrap: 'wrap'
  },
  boothList: {
    width: '260px', flexShrink: 0,
    backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)',
    borderRadius: '16px', padding: '1.2rem', maxHeight: '600px', overflowY: 'auto'
  },
  panelTitle: { margin: '0 0 1rem 0', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700 },
  emptyPanel: { textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' },
  boothCard: {
    backgroundColor: 'var(--bg-color)', borderRadius: '10px',
    padding: '0.8rem 1rem', borderLeft: '3px solid #93c5fd'
  },
  statusPill: {
    padding: '2px 8px', borderRadius: '20px',
    fontSize: '0.7rem', fontWeight: 700
  },
  // Form
  formOverlay: {
    position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 200,
    display: 'flex', alignItems: 'stretch', pointerEvents: 'none'
  },
  formPanel: {
    width: '380px', backgroundColor: 'var(--bg-surface)',
    borderLeft: '1px solid var(--border-color)',
    boxShadow: '-10px 0 40px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column', pointerEvents: 'all',
    overflowY: 'auto'
  },
  formHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '1.5rem', borderBottom: '1px solid var(--border-color)',
    color: 'var(--text-primary)', fontWeight: 700
  },
  closeBtn: {
    background: 'transparent', border: 'none',
    color: 'var(--text-secondary)', cursor: 'pointer'
  },
  selectionPreview: {
    padding: '1.2rem 1.5rem',
    backgroundColor: 'var(--primary-color)',
    color: '#fff'
  },
  previewBox: { display: 'flex', flexDirection: 'column', gap: '4px' },
  innerForm: { padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' },
  fg: { display: 'flex', flexDirection: 'column', gap: '5px' },
  label: { fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' },
  input: {
    padding: '10px 12px', borderRadius: '8px',
    border: '1px solid var(--border-color)',
    backgroundColor: 'var(--bg-color)', color: 'var(--text-primary)',
    fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit'
  },
  submitBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
    backgroundColor: 'var(--primary-color)', color: '#fff',
    border: 'none', borderRadius: '10px', padding: '12px',
    fontWeight: 700, fontSize: '1rem', cursor: 'pointer'
  }
};

export default FloorPlan;
