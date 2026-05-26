import React, { useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { MessageSquare, Send, Search, Check, CheckCheck, Wifi, WifiOff, Shield, ShieldCheck, ArrowLeft, Image, X, Lock, Smile, Trash2, PanelLeft } from 'lucide-react';

const api = axios.create({ baseURL: '/projects/eventsphere/api' });
api.interceptors.request.use(c => {
  const u = JSON.parse(localStorage.getItem('userInfo') || '{}');
  if (u.token) c.headers.Authorization = `Bearer ${u.token}`;
  return c;
});

const pal = ['#7c3aed','#2563eb','#059669','#d97706','#dc2626','#0891b2'];
const Av = ({ u, size=36 }) => {
  const init = u?.name?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)||'?';
  const bg = pal[(u?.name?.charCodeAt(0)||0)%pal.length];
  if (u?.avatar) return <img src={u.avatar} alt="" style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:'50%',background:bg,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*.36,fontWeight:700,flexShrink:0}}>{init}</div>;
};
const fmtTime = d => new Date(d).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
const fmtDate = d => { const dt=new Date(d); return dt.toDateString()===new Date().toDateString()?'Today':dt.toLocaleDateString([],{weekday:'short',month:'short',day:'numeric'}); };


export default function Chat() {
  const { user } = useContext(AuthContext);
  const [searchParams, setSearchParams] = useSearchParams();
  const sockRef   = useRef(null);
  const endRef    = useRef(null);
  const typRef    = useRef(null);
  const fileRef   = useRef(null);
  const inRef     = useRef(null);
  const queueRef  = useRef([]);             // offline message queue
  const contactRef= useRef(null);           // stable ref to current contact

  const [contacts,    setContacts]    = useState([]);
  const [contact,     setContact]     = useState(null);
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState('');
  const [unread,      setUnread]      = useState({});
  const [typing,      setTyping]      = useState({});
  const [search,      setSearch]      = useState('');
  const [online,      setOnline]      = useState(false);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [modalImg,    setModalImg]    = useState(null);
  const [loadC,       setLoadC]       = useState(true);
  const [loadM,       setLoadM]       = useState(false);
  const [contactsErr, setContactsErr] = useState('');
  const [imgPrev,     setImgPrev]     = useState(null);
  const [gifPicker,   setGifPicker]   = useState(false);
  const [gifSearch,   setGifSearch]   = useState('');
  const [gifs,        setGifs]        = useState([]);
  const [gifLoading,  setGifLoading]  = useState(false);
  const [gifError,    setGifError]    = useState('');
  const [gifMode,     setGifMode]     = useState('trending');
  const [activeDeleteMenu, setActiveDeleteMenu] = useState(null); // msgId with active delete popup
  const [pressTimer,  setPressTimer]  = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile,    setIsMobile]    = useState(window.innerWidth<640);
  const showList = isMobile ? !contact : sidebarOpen;
  const showChat = isMobile ? !!contact : true;

  useEffect(() => { const fn=()=>setIsMobile(window.innerWidth<640); window.addEventListener('resize',fn); return()=>window.removeEventListener('resize',fn); },[]);
  useEffect(() => { contactRef.current = contact; }, [contact]);

  const selectContact = (c) => {
    setContact(c);
    if (c) {
      setSearchParams({ uid: c._id });
    } else {
      setSearchParams({});
    }
  };

  // ── Load contacts ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    setContactsErr('');
    setLoadC(true);
    api.get('/chat/contacts')
      .then(r => {
        setContacts(r.data);
        const uid = searchParams.get('uid');
        if (uid) {
          const c = r.data.find(x => String(x._id) === uid);
          if (c) setContact(c);
        }
        // If socket is already connected, check online status for these new contacts
        if (sockRef.current?.connected) {
          sockRef.current.emit('get_online', r.data.map(c => c._id), res => setOnlineUsers(res || {}));
        }
      })
      .catch(e => setContactsErr(e?.response?.data?.message || 'Failed to load contacts.'))
      .finally(() => setLoadC(false));
      
    api.get('/chat/unread').then(r => setUnread(r.data)).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Socket ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.token) return;
    const sock = io(window.location.origin, {
      path: '/projects/eventsphere/socket.io',
      auth: { token: user.token },
      transports: ['websocket','polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });
    sockRef.current = sock;

    sock.on('connect', () => {
      setOnline(true);
      // flush offline queue
      const q = [...queueRef.current];
      queueRef.current = [];
      q.forEach(payload => sock.emit('send_message', payload));
      // refresh presence
      if (contacts.length) {
        sock.emit('get_online', contacts.map(c => c._id), res => setOnlineUsers(res || {}));
      }
    });
    sock.on('disconnect', () => setOnline(false));

    sock.on('new_message', msg => {
      setMessages(prev => {
        // Remove any optimistic placeholder with the same imageData (GIF) or queued text
        const filtered = prev.filter(m =>
          !(m.optimistic && m.imageData && m.imageData === msg.imageData) &&
          !(m.queued && m.message === msg.message && String(m.senderId) === String(msg.senderId))
        );
        // Dedup by real _id
        return filtered.find(m => m._id === msg._id) ? filtered : [...filtered, msg];
      });
      setContact(sc => {
        const fromOther = String(msg.senderId) !== String(user._id);
        if (fromOther && (!sc || String(sc._id) !== String(msg.senderId))) {
          setUnread(u => ({ ...u, [msg.senderId]: (u[msg.senderId]||0)+1 }));
        } else if (fromOther && sc && String(sc._id) === String(msg.senderId)) {
          // If we are currently chatting with the sender, mark it as read immediately
          sockRef.current?.emit('mark_read', { senderId: sc._id });
        }
        return sc;
      });
    });
    sock.on('message_deleted', ({ _id }) => setMessages(prev => prev.map(m => m._id === _id ? { ...m, isDeleted: true } : m)));
    sock.on('typing', ({senderId,isTyping}) => setTyping(t => ({...t,[senderId]:isTyping})));
    sock.on('messages_read', ({readBy}) => setMessages(prev => prev.map(m => String(m.receiverId)===String(readBy)?{...m,read:true}:m)));
    sock.on('presence', ({ userId, isOnline: ol }) => setOnlineUsers(p => ({ ...p, [userId]: ol })));

    return () => sock.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.token, user?._id]); // Removed 'contacts' dependency to prevent socket restart

  // ── Load history ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!contact) return;
    setMessages([]); setLoadM(true);
    const cid = contact._id;
    api.get(`/chat/messages/${cid}`)
      .then(r => {
        setMessages(r.data);
        setUnread(u => { const n={...u}; delete n[cid]; return n; });
        sockRef.current?.emit('mark_read', { senderId: cid });
        sockRef.current?.emit('get_online', [cid], res => setOnlineUsers(p => ({...p, ...res})));
      })
      .catch(() => {})
      .finally(() => setLoadM(false));
  }, [contact]);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[messages,typing]);

  // ── Giphy via backend proxy ────────────────────────────────────────────────
  const loadTrending = useCallback(async () => {
    setGifLoading(true); setGifError('');
    try {
      const { data } = await api.get('/chat/giphy?type=trending&limit=24');
      setGifs(data.data || []); setGifMode('trending');
    } catch(err) { setGifError(err?.response?.data?.message || 'Failed to load GIFs'); setGifs([]); }
    finally { setGifLoading(false); }
  }, []);

  const searchGifs = useCallback(async (q) => {
    if (!q.trim()) { loadTrending(); return; }
    setGifLoading(true); setGifError('');
    try {
      const { data } = await api.get(`/chat/giphy?type=search&q=${encodeURIComponent(q)}&limit=24`);
      setGifs(data.data || []); setGifMode('search');
    } catch(err) { setGifError(err?.response?.data?.message || 'Failed to load GIFs'); setGifs([]); }
    finally { setGifLoading(false); }
  }, [loadTrending]);

  useEffect(() => {
    const t = setTimeout(() => searchGifs(gifSearch), 400);
    return () => clearTimeout(t);
  }, [gifSearch, searchGifs]);

  useEffect(() => {
    if (gifPicker) { setGifSearch(''); loadTrending(); }
    else { setGifs([]); setGifError(''); }
  }, [gifPicker, loadTrending]);

  const sendGif = useCallback(async (gifUrl) => {
    if (!contact || !sockRef.current?.connected) return;
    // Optimistic update so GIF appears immediately
    setMessages(prev => [...prev, {
      _id: `gif-${Date.now()}`, senderId: user?._id,
      message: '', imageData: gifUrl, imageType: 'gif',
      createdAt: new Date().toISOString(), optimistic: true,
    }]);
    sockRef.current.emit('send_message', { receiverId: contact._id, message: '', imageData: gifUrl, imageType: 'gif' });
    setGifPicker(false); setGifSearch(''); setGifs([]);
  }, [contact, user?._id]);

  // ── Delete message ──────────────────────────────────────────────────────────
  const deleteMsg = useCallback((msgId) => {
    if (!contact || !sockRef.current?.connected) return;
    sockRef.current.emit('delete_message', { messageId: msgId, receiverId: contact._id });
  }, [contact]);

  const handleTouchStart = (msgId) => {
    const t = setTimeout(() => {
      setActiveDeleteMenu(msgId);
    }, 1000);
    setPressTimer(t);
  };

  const handleTouchEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  const handleContextMenu = (e, msgId) => {
    e.preventDefault();
    setActiveDeleteMenu(msgId);
  };

  // ── Send (plaintext, with offline queue) ─────────────────────────────────
  const send = useCallback(async e => {
    e?.preventDefault();
    if ((!input.trim() && !imgPrev) || !contact) return;
    setGifPicker(false);
    const payload = {
      receiverId: contact._id,
      message:   input.trim(),
      imageData: imgPrev?.data || '',
      imageType: imgPrev?.type || '',
    };
    if (sockRef.current?.connected) {
      sockRef.current.emit('send_message', payload);
    } else {
      queueRef.current.push(payload);
      setMessages(prev => [...prev, {
        _id: `q-${Date.now()}`, senderId: user?._id,
        message: input.trim(), createdAt: new Date().toISOString(), queued: true
      }]);
    }
    setInput(''); setImgPrev(null);
    sockRef.current?.emit('typing', { receiverId: contact._id, isTyping: false });
    inRef.current?.focus();
  }, [input, imgPrev, contact, user?._id]);

  const handleKey = e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();} };
  const handleInput = e => {
    setInput(e.target.value);
    if (!contact) return;
    sockRef.current?.emit('typing',{receiverId:contact._id,isTyping:true});
    clearTimeout(typRef.current);
    typRef.current=setTimeout(()=>sockRef.current?.emit('typing',{receiverId:contact._id,isTyping:false}),1500);
  };
  const handleFile = e => {
    const f=e.target.files?.[0]; if(!f) return;
    if(f.size>5*1024*1024){alert('Max 5 MB');return;}
    const r=new FileReader(); r.onload=ev=>setImgPrev({data:ev.target.result,type:f.type}); r.readAsDataURL(f);
    e.target.value='';
  };

  const isMe     = msg => String(msg.senderId)===String(user?._id);
  const isOnline  = id  => !!(onlineUsers[String(id)]);
  const total     = Object.values(unread).reduce((a,b)=>a+b,0);
  const fil       = contacts.filter(c=>c.name.toLowerCase().includes(search.toLowerCase())||(c.companyName||'').toLowerCase().includes(search.toLowerCase()));

  // ── Render helpers ─────────────────────────────────────────────────────────
  const msgText = msg => ({ text: msg.message || '', img: msg.imageData || '' });
  const isGif = url => typeof url === 'string' && (url.includes('giphy.com') || url.endsWith('.gif'));

  return (
    <div style={S.page}>

      {/* ── Image lightbox modal ─────────────────────────── */}
      {modalImg && (
        <div
          onClick={() => setModalImg(null)}
          style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.92)',zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',padding:'1rem'}}
        >
          <div onClick={e=>e.stopPropagation()} style={{position:'relative',maxWidth:'92vw',maxHeight:'92vh',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <img src={modalImg} alt="preview"
              style={{maxWidth:'100%',maxHeight:'80vh',borderRadius:12,objectFit:'contain',boxShadow:'0 8px 40px rgba(0,0,0,.6)'}}
            />
            <div style={{display:'flex',gap:12}}>
              <a href={modalImg} download
                onClick={e=>e.stopPropagation()}
                style={{display:'flex',alignItems:'center',gap:6,padding:'9px 20px',background:'#7c3aed',color:'#fff',borderRadius:10,fontWeight:700,fontSize:'0.85rem',textDecoration:'none'}}>
                ⬇ Download
              </a>
              <button onClick={()=>setModalImg(null)}
                style={{display:'flex',alignItems:'center',gap:6,padding:'9px 20px',background:'rgba(255,255,255,0.12)',color:'#fff',border:'none',borderRadius:10,fontWeight:700,fontSize:'0.85rem',cursor:'pointer'}}>
                ✕ Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Contact list ─────────────────────────────────── */}
      {showList && (
        <div style={{...S.sidebar, width:isMobile?'100%':300}}>
          <div style={S.sHead}>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <MessageSquare size={16} color="#7c3aed"/>
              <span style={S.sTitle}>Messages</span>
              {total>0&&<span style={S.badge}>{total}</span>}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <span style={{fontSize:'0.68rem',display:'flex',alignItems:'center',gap:3,color:online?'#10b981':'#94a3b8'}}>
                {online?<><Wifi size={11}/>Live</>:<><WifiOff size={11}/>Off</>}
              </span>
            </div>
          </div>
          <div style={{padding:'0 10px 8px',position:'relative'}}>
            <Search size={12} style={{position:'absolute',left:20,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none'}}/>
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder={`Search ${user?.role==='Organizer'?'exhibitors':'organizers'}…`} style={S.srch}/>
          </div>
          <div style={S.list}>
            {loadC ? <p style={S.hint}>Loading…</p>
              : contactsErr ? <p style={{...S.hint,color:'#ef4444'}}>⚠️ {contactsErr}</p>
              : fil.length===0 ? <p style={S.hint}>No {user?.role==='Organizer'?'exhibitors':'organizers'} found.</p>
              : fil.map(c => {
                const cnt=unread[c._id]||0, act=contact?._id===c._id;
                return (
                  <button key={c._id} onClick={()=>selectContact(c)}
                    style={{...S.cBtn,
                      background: act ? 'rgba(124,58,237,0.10)' : 'var(--bg-surface)',
                      borderLeft: `3px solid ${act?'#7c3aed':'transparent'}`,
                    }}>
                    <div style={{position:'relative',flexShrink:0}}>
                      <Av u={c} size={42}/>
                      {cnt>0&&<span style={S.udot}>{cnt>9?'9+':cnt}</span>}
                      {/* Online dot */}
                      <span style={{position:'absolute',bottom:1,right:1,width:10,height:10,borderRadius:'50%',background:isOnline(c._id)?'#10b981':'#cbd5e1',border:'2px solid var(--bg-surface)',boxSizing:'border-box'}}/>
                    </div>
                    <div style={{flex:1,minWidth:0,textAlign:'left'}}>
                      <div style={{display:'flex',alignItems:'center',gap:4}}>
                        <span style={S.cName}>{c.name}</span>
                        {c.role==='Exhibitor'&&(c.verificationStatus==='Verified'?<ShieldCheck size={11} color="#10b981"/>:<Shield size={11} color="#f59e0b"/>)}
                      </div>
                      <div style={S.cSub}>{c.companyName||c.role}</div>
                      <div style={{fontSize:'0.65rem',color:isOnline(c._id)?'#10b981':'#94a3b8',fontWeight:600}}>{isOnline(c._id)?'● Online':'○ Offline'}</div>
                      {typing[c._id]&&<div style={{fontSize:'0.67rem',color:'#7c3aed',fontStyle:'italic'}}>typing…</div>}
                    </div>
                    {cnt>0&&<div style={S.unum}>{cnt}</div>}
                  </button>
                );
              })
            }
          </div>
        </div>
      )}

      {/* ── Chat panel ───────────────────────────────────── */}
      {showChat && (
        <div style={{...S.chatWrap, width:isMobile?'100%':'auto'}}>
          {!contact ? (
            <div style={S.empty}>
              <div style={{fontSize:52,marginBottom:12}}>💬</div>
              <h3 style={{margin:'0 0 8px',color:'var(--text-primary)',fontWeight:800}}>Pick a conversation</h3>
              <p style={{color:'#64748b',fontSize:'0.86rem',margin:0}}>{user?.role==='Organizer'?'Select an exhibitor to message.':'Select an organizer to reach out.'}</p>

            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',flex:1,height:'100%',overflow:'hidden'}}>
              {/* Header */}
              <div style={S.cHead}>
                {isMobile&&<button onClick={()=>selectContact(null)} style={S.back}><ArrowLeft size={20}/></button>}
                {!isMobile&&<button onClick={()=>setSidebarOpen(p=>!p)} style={S.back} title="Toggle Sidebar"><PanelLeft size={20}/></button>}
                <Av u={contact} size={38}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontWeight:800,color:'var(--text-primary)',fontSize:'0.92rem'}}>{contact.name}</span>
                    {contact.role==='Exhibitor'&&(contact.verificationStatus==='Verified'
                      ?<span style={S.chip.v}><ShieldCheck size={10}/> Verified</span>
                      :<span style={S.chip.p}><Shield size={10}/> Unverified</span>)}
                  </div>
                  <div style={{fontSize:'0.72rem',display:'flex',alignItems:'center',gap:5}}>
                    <span style={{width:7,height:7,borderRadius:'50%',background:isOnline(contact._id)?'#10b981':'#94a3b8',display:'inline-block'}}/>
                    <span style={{color:isOnline(contact._id)?'#10b981':'#94a3b8',fontWeight:600}}>{isOnline(contact._id)?'Online':'Offline'}</span>
                    {contact.companyName&&<span style={{color:'#94a3b8'}}>&middot; {contact.companyName}</span>}
                  </div>
                </div>
                {/* Close Button */}
                <button onClick={()=>selectContact(null)} style={{background:'transparent',border:'none',cursor:'pointer',color:'#94a3b8',padding:4,display:'flex'}} title="Close chat">
                  <X size={20}/>
                </button>
              </div>

              {/* Messages — WhatsApp style: spacer pushes msgs to bottom */}
              <div style={S.msgs} onClick={() => setActiveDeleteMenu(null)}>
                <div style={{flex:1}}/>
                {loadM&&<p style={S.hint}>Loading…</p>}
                {!loadM&&messages.length===0&&<p style={{...S.hint}}>No messages yet. Say hi! 👋</p>}
                {messages.map((msg,i) => {
                  const mine=isMe(msg);
                  const {text,img}=msgText(msg);
                  const newDay=i===0||new Date(msg.createdAt).toDateString()!==new Date(messages[i-1].createdAt).toDateString();
                  return (
                    <React.Fragment key={msg._id||i}>
                      {newDay&&<div style={S.dayLbl}>{fmtDate(msg.createdAt)}</div>}
                      <div
                        style={{display:'flex',justifyContent:mine?'flex-end':'flex-start',marginBottom:3,alignItems:'flex-end',gap:6,position:'relative'}}
                        onContextMenu={mine && !msg.queued && !msg.isDeleted ? (e) => handleContextMenu(e, msg._id) : undefined}
                        onTouchStart={mine && !msg.queued && !msg.isDeleted ? () => handleTouchStart(msg._id) : undefined}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                        onTouchCancel={handleTouchEnd}
                      >
                        {!mine&&<Av u={contact} size={24}/>}
                        <div style={{maxWidth:isMobile?'82%':'65%', userSelect: mine ? 'none' : 'auto'}}>
                          {msg.isDeleted ? (
                            <div style={{padding:'7px 12px',fontSize:'0.82rem',fontStyle:'italic',borderRadius:mine?'16px 16px 4px 16px':'16px 16px 16px 4px',background:mine?'rgba(124,58,237,0.1)':'var(--bg-surface)',color:'#94a3b8',border:mine?'1px solid rgba(124,58,237,0.2)':'1px solid var(--border-color)', display:'flex', alignItems:'center', gap:6}}>
                              🚫 This message was deleted
                            </div>
                          ) : (
                            <>
                              {img&&<img src={img} alt="img"
                                style={{maxWidth:'100%',maxHeight:isGif(img)?180:220,borderRadius:isGif(img)?8:12,display:'block',marginBottom:text?4:0,objectFit:isGif(img)?'contain':'cover',cursor:'pointer',background:isGif(img)?'transparent':'#f1f5f9',WebkitTapHighlightColor:'transparent'}}
                                onClick={()=>setModalImg(img)}
                              />}
                              {text&&<div style={{padding:'9px 13px',fontSize:'0.875rem',lineHeight:1.55,wordBreak:'break-word',
                                borderRadius:mine?'16px 16px 4px 16px':'16px 16px 16px 4px',
                                background:mine?'linear-gradient(135deg,#7c3aed,#a855f7)':'var(--bg-surface)',
                                color:mine?'#fff':'var(--text-primary)',
                                boxShadow:mine?'0 3px 12px rgba(124,58,237,.22)':'0 1px 4px rgba(0,0,0,.07)',
                                border:mine?'none':'1px solid var(--border-color)'}}>
                                {text}
                              </div>}
                            </>
                          )}
                          <div style={{display:'flex',alignItems:'center',gap:3,justifyContent:mine?'flex-end':'flex-start',marginTop:2}}>
                            <span style={{fontSize:'0.68rem',color:mine?'rgba(255,255,255,0.65)':'#94a3b8',fontWeight:500}}>{fmtTime(msg.createdAt)}</span>
                            {mine&&(msg.queued||msg.optimistic)&&<span title="Sending…" style={{fontSize:'0.6rem',color:'#f59e0b'}}>⏱</span>}
                            {mine&&!msg.queued&&!msg.optimistic&&(msg.read?<CheckCheck size={15} color="#38bdf8" style={{filter:'drop-shadow(0 1px 1px rgba(0,0,0,0.2))'}}/>:<Check size={14} color="rgba(255,255,255,0.7)"/>)}
                          </div>
                        </div>
                        {/* Delete menu popup */}
                        {activeDeleteMenu === msg._id && !msg.queued && !msg.isDeleted && (
                          <div style={{position:'absolute', bottom:'100%', right:isMobile?'10px':'20px', marginBottom:6, zIndex:50}}>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteMsg(msg._id); setActiveDeleteMenu(null); }}
                              style={{background:'var(--bg-surface)', border:'1px solid var(--border-color)', borderRadius:8, padding:'8px 14px', display:'flex', alignItems:'center', gap:6, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,0,0,0.15)', color:'#ef4444', fontSize:'0.85rem', fontWeight:600}}
                            >
                              <Trash2 size={15}/> Delete message
                            </button>
                          </div>
                        )}
                      </div>
                    </React.Fragment>
                  );
                })}
                {typing[contact._id]&&(
                  <div style={{display:'flex',alignItems:'flex-end',gap:6,marginBottom:4}}>
                    <Av u={contact} size={24}/>
                    <div style={{background:'var(--bg-surface)',border:'1px solid var(--border-color)',borderRadius:'16px 16px 16px 4px',padding:'10px 14px'}}>
                      <div style={{display:'flex',gap:4}}>
                        {[0,1,2].map(i=><div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#c4b5fd',animation:`bop 1s ${i*.15}s infinite`}}/>)}
                      </div>
                    </div>
                  </div>
                )}
                <div ref={endRef}/>
              </div>

              {/* Image preview */}
              {imgPrev&&(
                <div style={{display:'flex',alignItems:'center',padding:'8px 16px',borderTop:'1px solid var(--border-color)',background:'var(--bg-surface)'}}>
                  <div style={{position:'relative',display:'inline-block'}}>
                    <img src={imgPrev.data} alt="" style={{height:70,borderRadius:8,objectFit:'cover'}}/>
                    <button onClick={()=>setImgPrev(null)} style={{position:'absolute',top:-5,right:-5,background:'#ef4444',border:'none',borderRadius:'50%',color:'#fff',width:18,height:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={12}/></button>
                  </div>
                  <span style={{fontSize:'0.78rem',color:'#64748b',marginLeft:10}}>Image ready to send</span>
                </div>
              )}

              {/* GIF Picker — Instagram style */}
              {gifPicker&&(
                <div style={{background:'var(--bg-surface)',borderTop:'1px solid var(--border-color)',display:'flex',flexDirection:'column',height:isMobile?280:340,flexShrink:0}}>
                  {/* Search bar */}
                  <div style={{display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderBottom:'1px solid var(--border-color)',flexShrink:0}}>
                    <div style={{position:'relative',flex:1}}>
                      <Search size={13} style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',color:'#94a3b8',pointerEvents:'none'}}/>
                      <input autoFocus value={gifSearch} onChange={e=>setGifSearch(e.target.value)}
                        placeholder="Search GIFs…"
                        style={{width:'100%',padding:'7px 10px 7px 28px',borderRadius:20,border:'1.5px solid var(--border-color)',fontSize:'0.82rem',background:'var(--bg-color)',outline:'none',color:'var(--text-primary)',boxSizing:'border-box'}}/>
                    </div>
                    <button onClick={()=>setGifPicker(false)} style={{background:'rgba(100,116,139,0.12)',border:'none',borderRadius:'50%',cursor:'pointer',color:'#94a3b8',width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><X size={14}/></button>
                  </div>
                  {/* Section label */}
                  {!gifLoading&&!gifError&&gifs.length>0&&(
                    <div style={{padding:'4px 10px 2px',fontSize:'0.62rem',fontWeight:700,color:'#94a3b8',letterSpacing:'0.06em',flexShrink:0,textTransform:'uppercase'}}>
                      {gifMode==='trending'?'🔥 Trending':'🔍 Results'}
                    </div>
                  )}
                  {/* Grid */}
                  <div style={{flex:1,overflowY:'auto',padding:'4px 8px 4px'}}>
                    {gifLoading&&(
                      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
                        {[...Array(9)].map((_,i)=>(
                          <div key={i} style={{aspectRatio:'1',borderRadius:8,background:'var(--border-color)',animation:'pulse 1.4s ease-in-out infinite',animationDelay:`${i*0.07}s`}}/>
                        ))}
                      </div>
                    )}
                    {!gifLoading&&gifError&&(
                      <div style={{textAlign:'center',color:'#ef4444',fontSize:'0.8rem',padding:'2rem 1rem'}}>
                        <div style={{fontSize:'1.5rem',marginBottom:6}}>⚠️</div>
                        <div style={{fontWeight:600,marginBottom:4}}>GIF load failed</div>
                        <div style={{color:'#94a3b8',fontSize:'0.72rem',marginBottom:12}}>{gifError}</div>
                        <button onClick={()=>gifSearch?searchGifs(gifSearch):loadTrending()}
                          style={{padding:'6px 16px',borderRadius:20,background:'#7c3aed',color:'#fff',border:'none',cursor:'pointer',fontSize:'0.78rem',fontWeight:700}}>Retry</button>
                      </div>
                    )}
                    {!gifLoading&&!gifError&&gifSearch&&gifs.length===0&&(
                      <div style={{textAlign:'center',color:'#94a3b8',fontSize:'0.82rem',padding:'2rem 1rem'}}>No GIFs found for "{gifSearch}"</div>
                    )}
                    {!gifLoading&&!gifError&&gifs.length>0&&(
                      <div style={{display:'grid',gridTemplateColumns:`repeat(3,1fr)`,gap:4}}>
                        {gifs.map(g=>{
                          const src=g.images?.fixed_height?.url||g.images?.fixed_height_small?.url||g.images?.downsized?.url;
                          const full=g.images?.original?.url||g.images?.downsized?.url;
                          return(
                            <div key={g.id} onClick={()=>sendGif(full)}
                              style={{aspectRatio:'1',borderRadius:8,overflow:'hidden',cursor:'pointer',background:'#0f172a',position:'relative'}}>
                              <img src={src} alt={g.title||'gif'}
                                loading="lazy"
                                style={{width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform .15s,opacity .2s',opacity:1}}
                                onLoad={e=>e.currentTarget.style.opacity='1'}
                                onMouseOver={e=>e.currentTarget.style.transform='scale(1.06)'}
                                onMouseOut={e=>e.currentTarget.style.transform='scale(1)'}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div style={{textAlign:'center',fontSize:'0.55rem',color:'#64748b',padding:'3px 0',flexShrink:0,letterSpacing:'0.5px'}}>POWERED BY GIPHY</div>
                </div>
              )}

              {/* Input bar */}
              <form onSubmit={send} style={S.bar}>
                <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleFile}/>
                <button type="button" onClick={()=>fileRef.current?.click()} disabled={!online}
                  style={{...S.circBtn,background:imgPrev?'#ede9fe':'transparent'}} title="Send image">
                  <Image size={18} color={imgPrev?'#7c3aed':'#94a3b8'}/>
                </button>
                <button type="button" onClick={()=>setGifPicker(p=>!p)} disabled={!online}
                  style={{...S.circBtn,background:gifPicker?'#ede9fe':'transparent'}} title="Send GIF">
                  <Smile size={18} color={gifPicker?'#7c3aed':'#94a3b8'}/>
                </button>
                <input ref={inRef} value={input} onChange={handleInput} onKeyDown={handleKey}
                  placeholder={`Message ${contact.name}…`} style={S.txtIn} maxLength={4000} disabled={!online}/>
                <button type="submit" disabled={(!input.trim()&&!imgPrev)||!online}
                  style={{...S.sendBtn,opacity:(input.trim()||imgPrev)&&online?1:.35}}>
                  <Send size={17}/>
                </button>
              </form>
            </div>
          )}
        </div>
      )}
      <style>{`
        @keyframes bop{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-5px);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
      `}</style>
    </div>
  );
}

const S = {
  page:    {display:'flex',height:'calc(100dvh - 65px)',margin:'-clamp(0.75rem, 3vw, 2rem) -clamp(0.75rem, 4vw, 2rem)',background:'var(--bg-color)',fontFamily:'Inter,system-ui,sans-serif',overflow:'hidden'},
  sidebar: {background:'var(--bg-surface)',borderRight:'1px solid var(--border-color)',display:'flex',flexDirection:'column',overflow:'hidden',flexShrink:0},
  sHead:   {display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 12px 8px',borderBottom:'1px solid var(--border-color)',marginBottom:6},
  sTitle:  {fontWeight:800,fontSize:'0.88rem',color:'var(--text-primary)'},
  badge:   {background:'#7c3aed',color:'#fff',borderRadius:20,padding:'1px 7px',fontSize:'0.65rem',fontWeight:700},
  e2eBadge:{display:'inline-flex',alignItems:'center',gap:4,background:'rgba(16,185,129,0.12)',color:'#10b981',borderRadius:20,padding:'2px 8px',fontSize:'0.65rem',fontWeight:700},
  srch:    {width:'100%',padding:'7px 10px 7px 28px',borderRadius:10,border:'1px solid var(--border-color)',fontSize:'0.82rem',background:'var(--bg-color)',outline:'none',color:'var(--text-primary)',boxSizing:'border-box'},
  list:    {flex:1,overflowY:'auto',padding:'0 6px 6px'},
  hint:    {textAlign:'center',color:'#94a3b8',fontSize:'0.82rem',padding:'2rem 1rem'},
  cBtn:    {width:'100%',display:'flex',alignItems:'center',gap:10,padding:'8px 8px',borderRadius:12,cursor:'pointer',border:'none',marginBottom:2,transition:'background .15s',position:'relative'},
  udot:    {position:'absolute',top:-2,right:-2,background:'#ef4444',color:'#fff',borderRadius:20,padding:'1px 4px',fontSize:'0.55rem',fontWeight:700},
  unum:    {background:'#7c3aed',color:'#fff',borderRadius:20,padding:'2px 7px',fontSize:'0.65rem',fontWeight:700,flexShrink:0},
  cName:   {fontWeight:700,fontSize:'0.85rem',color:'var(--text-primary)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  cSub:    {fontSize:'0.72rem',color:'#94a3b8',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'},
  chatWrap:{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'},
  empty:   {flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'2rem'},
  cHead:   {display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'var(--bg-surface)',borderBottom:'1px solid var(--border-color)',flexShrink:0},
  back:    {background:'transparent',border:'none',cursor:'pointer',color:'#7c3aed',display:'flex',padding:4,flexShrink:0},
  msgs:    {flex:1,overflowY:'auto',padding:'12px 14px',display:'flex',flexDirection:'column'},
  dayLbl:  {textAlign:'center',margin:'8px 0 4px',fontSize:'0.68rem',color:'#94a3b8',background:'var(--bg-color)',padding:'2px 10px',borderRadius:20,alignSelf:'center'},
  bar:     {display:'flex',alignItems:'center',gap:8,padding:'10px 12px',background:'var(--bg-surface)',borderTop:'1px solid var(--border-color)',flexShrink:0},
  circBtn: {width:36,height:36,borderRadius:'50%',border:'1px solid var(--border-color)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0},
  txtIn:   {flex:1,padding:'9px 14px',borderRadius:22,border:'1.5px solid var(--border-color)',fontSize:'0.875rem',outline:'none',background:'var(--bg-color)',color:'var(--text-primary)'},
  sendBtn: {width:40,height:40,borderRadius:'50%',background:'linear-gradient(135deg,#7c3aed,#a855f7)',color:'#fff',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,boxShadow:'0 3px 10px rgba(124,58,237,.3)',transition:'opacity .15s'},
  chip:    {v:{display:'inline-flex',alignItems:'center',gap:3,background:'#dcfce7',color:'#15803d',fontSize:'0.65rem',fontWeight:700,padding:'2px 6px',borderRadius:20},
            p:{display:'inline-flex',alignItems:'center',gap:3,background:'#fef9c3',color:'#92400e',fontSize:'0.65rem',fontWeight:700,padding:'2px 6px',borderRadius:20}},
};
