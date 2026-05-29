import React, { useState, useEffect, useCallback } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements, CardNumberElement, CardExpiryElement, CardCvcElement,
  useStripe, useElements,
} from '@stripe/react-stripe-js';
import { Lock, CreditCard, Banknote, CheckCircle, AlertTriangle, Smartphone, FlaskConical, X } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';

// ── Brand logos via Brandfetch CDN ──────────────────────────────────────────
const BF = (domain, w = 200, h = 80) =>
  `https://cdn.brandfetch.io/${domain}/w/${w}/h/${h}/logo?c=1idWm8TWPtdWnIGpbBE`;

const LOGOS = {
  jazzcash:   BF('jazzcash.com.pk', 200, 80),
  easypaisa:  BF('easypaisa.com.pk', 200, 80),
  visa:       BF('visa.com', 120, 48),
  mastercard: BF('mastercard.com', 120, 48),
};

const stripePromise = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  : null;

// ── Stripe element options ───────────────────────────────────────────────────
const stripeOpts = {
  style: {
    base: {
      color: '#0f172a',
      fontSize: '15px',
      fontFamily: '"Inter", system-ui, sans-serif',
      fontSmoothing: 'antialiased',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
};

// ── Stripe Card Form ─────────────────────────────────────────────────────────
const StripeCardForm = ({ amount, onSuccess, onError, processing, setProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState('');
  const [cardError, setCardError] = useState('');
  const [ready, setReady] = useState(false);

  const initIntent = useCallback(async () => {
    try {
      const { data } = await api.post('/payments/create-intent', {
        amount,
        description: 'EventSphere Ticket',
      });
      setClientSecret(data.clientSecret);
      setReady(true);
    } catch (err) {
      onError(err.response?.data?.message || 'Could not initialise card payment.');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]);

  useEffect(() => { if (amount > 0) initIntent(); }, [initIntent, amount]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setProcessing(true);
    setCardError('');
    try {
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: elements.getElement(CardNumberElement) },
      });
      if (error) {
        setCardError(error.message);
        setProcessing(false);
        return;
      }
      if (paymentIntent.status === 'succeeded') onSuccess(paymentIntent.id);
    } catch (err) {
      setCardError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Card brand logos */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        <img src={LOGOS.visa} alt="Visa" style={{ height: 22, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
        <img src={LOGOS.mastercard} alt="Mastercard" style={{ height: 22, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; }} />
        <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, background: '#e2e8f0', padding: '2px 7px', borderRadius: 6 }}>UnionPay</span>
        <span style={{ fontSize: '0.72rem', color: '#475569', fontWeight: 600, background: '#e2e8f0', padding: '2px 7px', borderRadius: 6 }}>Amex</span>
        <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={11}/> 256-bit SSL</span>
      </div>

      <div>
        <label style={lbl}>Card Number</label>
        <div style={sBox}><CardNumberElement options={stripeOpts} /></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
        <div><label style={lbl}>Expiry</label><div style={sBox}><CardExpiryElement options={stripeOpts} /></div></div>
        <div><label style={lbl}>CVV</label><div style={sBox}><CardCvcElement options={stripeOpts} /></div></div>
      </div>

      {cardError && <ErrorBox msg={cardError} />}

      <button type="submit" disabled={processing || !ready}
        style={{ ...btn, background: 'linear-gradient(135deg,#1a56db,#2563eb)', opacity: (processing || !ready) ? 0.65 : 1 }}>
        {processing ? <><Spinner /> Processing…</> : <><CreditCard size={16}/> Pay Rs. {amount.toLocaleString()}</>}
      </button>
      <p style={{ margin: 0, fontSize: '0.71rem', color: '#94a3b8', textAlign: 'center' }}>
        Sandbox — use card <strong>4242 4242 4242 4242</strong> · Any future date · Any CVV
      </p>
    </form>
  );
};
// ── JazzCash / Easypaisa via Safepay (with sandbox simulation) ───────────────
const WalletForm = ({ method, amount, event, onProcessing, onSuccess }) => {
  const [mobile, setMobile] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sandboxStep, setSandboxStep] = useState(null); // null | 'confirming' | 'done'
  const isJazz = method === 'jazzcash';
  const color = isJazz ? '#c41230' : '#3fad2a';
  const name = isJazz ? 'JazzCash' : 'Easypaisa';

  const handleGo = async (e) => {
    e.preventDefault();
    if (!/^03\d{9}$/.test(mobile)) { setError('Enter a valid 11-digit number (03XXXXXXXXX)'); return; }
    setError(''); setLoading(true); onProcessing(true);
    try {
      const origin = window.location.origin;
      const { data } = await api.post('/payments/safepay-init', {
        amount,
        orderId: `ES-${event._id}-${Date.now()}`,
        redirectUrl: `${origin}/payment-callback`,
        webhookUrl: `${origin}/api/payments/webhook`,
      });

      // Production mode: redirect to real Safepay checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      // Sandbox mode: simulate locally with a short confirmation screen
      if (data.sandbox) {
        setSandboxStep('confirming');
        setTimeout(() => {
          setSandboxStep('done');
          setTimeout(() => {
            if (onSuccess) onSuccess({ token: data.token, method });
          }, 1000);
        }, 2500);
        return;
      }

      setError('Could not start payment session. Please try again.');
      setLoading(false); onProcessing(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed to initialise.');
      setLoading(false); onProcessing(false);
    }
  };

  // Sandbox simulation overlay
  if (sandboxStep) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '1rem 0' }}>
        <div style={{ background: isJazz ? '#fff0f3' : '#f0fdf4', border: `2px solid ${color}`, borderRadius: 16, padding: '1.5rem 2rem', textAlign: 'center', maxWidth: 300 }}>
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>
            {sandboxStep === 'done' ? <CheckCircle size={40} color={color}/> : <Smartphone size={40} color={color}/>}
          </div>
          <div style={{ fontWeight: 800, fontSize: '1.1rem', color, marginBottom: 6 }}>
            {sandboxStep === 'done' ? 'Payment Approved!' : `${name} Processing…`}
          </div>
          <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.6 }}>
            {sandboxStep === 'done'
              ? `Rs. ${amount.toLocaleString()} successfully paid via ${name} (Sandbox).`
              : `Sending confirmation request to ${mobile}…`}
          </div>
          {sandboxStep === 'confirming' && (
            <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'center' }}>
              <Spinner />
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <FlaskConical size={12}/> Sandbox Mode — No real charge made
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleGo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ background: isJazz ? '#fff0f3' : '#f0fdf4', border: `1px solid ${color}22`, borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={isJazz ? LOGOS.jazzcash : LOGOS.easypaisa} alt={name}
          style={{ height: 38, maxWidth: 130, objectFit: 'contain' }}
          onError={e => { e.target.replaceWith(Object.assign(document.createElement('span'), { textContent: name, style: `font-weight:800;font-size:1.1rem;color:${color}` })); }} />
        <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={11}/> Secure {loading || sandboxStep ? '' : '· Sandbox'}</span>
      </div>

      <div>
        <label style={lbl}>{name} Mobile Number</label>
        <input type="tel" required maxLength={11} placeholder="03XXXXXXXXX"
          value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 11))}
          style={inp} />
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', fontSize: '0.82rem', color: '#475569', lineHeight: 1.6 }}>
        <Smartphone size={13} style={{marginRight:4, verticalAlign:'middle'}}/> After clicking below, you'll see a <strong>simulated {name} confirmation</strong> for <strong>Rs. {amount.toLocaleString()}</strong>. In production this redirects to the real {name} app.
      </div>

      {error && <ErrorBox msg={error} />}

      <button type="submit" disabled={loading}
        style={{ ...btn, background: `linear-gradient(135deg,${color},${isJazz ? '#9a0f26' : '#2d8a1e'})`, opacity: loading ? 0.7 : 1 }}>
        {loading ? <><Spinner /> Connecting…</> : `Continue to ${name} →`}
      </button>
    </form>
  );
};

// ── Cash on Arrival ──────────────────────────────────────────────────────────
const CashForm = ({ amount, onConfirm, processing }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <div style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fbbf24', borderRadius: 12, padding: '1.25rem', lineHeight: 1.75, fontSize: '0.9rem', color: '#78350f' }}>
      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 6, color: '#92400e', display: 'flex', alignItems: 'center', gap: 6 }}><Banknote size={18}/> Cash on Arrival</div>
      Your seat will be <strong>reserved immediately</strong>. Bring <strong>Rs. {amount.toLocaleString()}</strong> cash to the venue. Show your confirmation email at the entrance gate.
    </div>
    <button onClick={onConfirm} disabled={processing}
      style={{ ...btn, background: 'linear-gradient(135deg,#d97706,#b45309)', opacity: processing ? 0.7 : 1 }}>
      {processing ? <><Spinner /> Reserving…</> : <><CheckCircle size={16}/> Reserve My Seat (Pay at Venue)</>}
    </button>
  </div>
);

// ── Helper mini-components ───────────────────────────────────────────────────
const ErrorBox = ({ msg }) => (
  <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', color: '#dc2626', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }}><AlertTriangle size={14}/> {msg}</div>
);
const Spinner = () => (
  <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.35)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

// ── Payment method tab data ──────────────────────────────────────────────────
const METHODS = [
  { id: 'jazzcash',  label: 'JazzCash',        logo: LOGOS.jazzcash,  color: '#c41230', bg: '#fff0f3' },
  { id: 'easypaisa', label: 'Easypaisa',        logo: LOGOS.easypaisa, color: '#3fad2a', bg: '#f0fdf4' },
  { id: 'card',      label: 'Debit / Credit',   iconEl: <CreditCard size={20} color="#2563eb"/>, color: '#2563eb', bg: '#eff6ff' },
  { id: 'cash',      label: 'Cash on Arrival',  iconEl: <Banknote size={20} color="#d97706"/>,   color: '#d97706', bg: '#fffbeb' },
];

// ── Main Modal ───────────────────────────────────────────────────────────────
const PaymentCheckout = ({ paymentModal, setPaymentModal, onBookingSuccess }) => {
  const [method, setMethod] = useState('jazzcash');
  const [processing, setProcessing] = useState(false);

  useEffect(() => { if (paymentModal) setMethod('jazzcash'); }, [paymentModal]);

  if (!paymentModal) return null;
  const { event, ticketType, price } = paymentModal;
  const isFree = price === 0;

  const close = () => { if (!processing) setPaymentModal(null); };

  const finish = async (providerInfo) => {
    setProcessing(true);
    try {
      await onBookingSuccess(event, ticketType, providerInfo);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Booking failed. Please try again.');
    } finally {
      setProcessing(false);
      setPaymentModal(null);
    }
  };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && close()}>
      <div style={modalStyle}>

        {/* ── Header ── */}
        <div style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)', padding: '1.5rem 1.75rem', borderRadius: '22px 22px 0 0', position: 'relative', flexShrink: 0 }}>
          <button onClick={close} disabled={processing}
            style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={16}/></button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.8px', color: '#a78bfa', background: 'rgba(167,139,250,0.15)', padding: '3px 10px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}><Lock size={10}/> Secure Checkout</span>
          </div>

          <div style={{ fontWeight: 800, color: '#fff', fontSize: 'clamp(1rem,3vw,1.2rem)', marginBottom: 8, lineHeight: 1.3 }}>{event.title}</div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,42,95,0.25)', color: '#fda4af', padding: '3px 12px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700 }}>{ticketType}</span>
            <span style={{ fontWeight: 900, fontSize: '1.3rem', color: isFree ? '#4ade80' : '#fff', letterSpacing: '-0.5px' }}>
              {isFree ? 'FREE' : `Rs. ${price.toLocaleString()}`}
            </span>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '1.5rem 1.75rem', overflowY: 'auto', flex: 1 }}>
          {isFree ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ background: 'linear-gradient(135deg,#ecfdf5,#d1fae5)', border: '1px solid #6ee7b7', borderRadius: 14, padding: '1.25rem', textAlign: 'center', color: '#065f46', fontWeight: 600, lineHeight: 1.7 }}>
                <strong>Free ticket!</strong> No payment needed. Click below to confirm your booking instantly.
              </div>
              <button onClick={() => finish({ provider: 'free' })} disabled={processing}
                style={{ ...btn, background: 'linear-gradient(135deg,#10b981,#059669)', opacity: processing ? 0.7 : 1 }}>
                {processing ? <><Spinner /> Confirming…</> : <><CheckCircle size={16}/> Confirm Free Ticket</>}
              </button>
            </div>
          ) : (
            <>
              {/* Method grid */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#94a3b8', marginBottom: '0.75rem' }}>Select Payment Method</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {METHODS.map(m => {
                    const active = method === m.id;
                    return (
                      <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                        style={{ padding: '10px 12px', borderRadius: 13, cursor: 'pointer', textAlign: 'left', border: active ? `2px solid ${m.color}` : '1.5px solid #e2e8f0', background: active ? m.bg : '#fff', transition: 'all 0.18s', display: 'flex', alignItems: 'center', gap: 8, position: 'relative', overflow: 'hidden', boxShadow: active ? `0 0 0 3px ${m.color}18` : 'none' }}>
                        {m.logo
                          ? <img src={m.logo} alt={m.label} style={{ height: 22, maxWidth: 72, objectFit: 'contain', display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                          : m.iconEl}
                        <span style={{ fontWeight: 700, fontSize: '0.76rem', color: active ? m.color : '#475569', flex: 1 }}>{m.logo ? '' : m.label}</span>
                        {active && <span style={{ color: m.color, fontWeight: 800, fontSize: '0.85rem' }}>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: '#f1f5f9', marginBottom: '1.25rem' }} />

              {/* Panels */}
              {(method === 'jazzcash' || method === 'easypaisa') && (
                <WalletForm method={method} amount={price} event={event} onProcessing={setProcessing}
                  onSuccess={info => finish({ provider: 'safepay', token: info.token })} />
              )}

              {method === 'card' && (
                stripePromise
                  ? <Elements stripe={stripePromise}>
                      <StripeCardForm amount={price}
                        onSuccess={id => finish({ provider: 'stripe', paymentIntentId: id })}
                        onError={msg => toast.error(msg)}
                        processing={processing} setProcessing={setProcessing} />
                    </Elements>
                  : <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '1rem', color: '#b91c1c', fontSize: '0.87rem', lineHeight: 1.6 }}>
                      ⚠ Card payments not configured.<br/>
                      Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> to <code>client/.env</code> and restart the dev server.
                    </div>
              )}

              {method === 'cash' && (
                <CashForm amount={price}
                  onConfirm={() => finish({ provider: 'cash' })}
                  processing={processing} />
              )}
            </>
          )}
        </div>

        {/* ── Footer trust bar ── */}
        <div style={{ padding: '0.85rem 1.75rem', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 8, background: '#fafafa', borderRadius: '0 0 22px 22px', flexShrink: 0 }}>
          <Lock size={14} color="#94a3b8"/>
          <span style={{ fontSize: '0.71rem', color: '#94a3b8', lineHeight: 1.5 }}>
            Your payment information is encrypted with 256-bit SSL. EventSphere never stores your card details.
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const overlayStyle = {
  position: 'fixed', inset: 0,
  background: 'rgba(15,23,42,0.72)',
  backdropFilter: 'blur(10px) saturate(1.4)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: '1rem',
};
const modalStyle = {
  background: '#fff',
  borderRadius: 22,
  width: '100%', maxWidth: 490,
  maxHeight: '92vh',
  display: 'flex', flexDirection: 'column',
  boxShadow: '0 40px 100px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.05)',
  overflow: 'hidden',
};
const sBox = {
  padding: '12px 14px', borderRadius: 10,
  border: '1px solid #e2e8f0',
  background: '#f8fafc',
};
const lbl = {
  display: 'block', marginBottom: 6,
  fontSize: '0.72rem', fontWeight: 700,
  textTransform: 'uppercase', letterSpacing: '0.8px', color: '#64748b',
};
const inp = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1px solid #e2e8f0', background: '#f8fafc',
  color: '#0f172a', fontSize: '0.95rem',
  outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
};
const btn = {
  width: '100%', padding: '13px 16px', borderRadius: 12, border: 'none',
  color: '#fff', fontWeight: 700, fontSize: '0.95rem',
  cursor: 'pointer', transition: 'all 0.2s',
  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  letterSpacing: '0.2px',
};

export default PaymentCheckout;
