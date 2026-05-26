const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// ── Stripe: create payment intent ────────────────────────────────────────────
router.post('/create-intent', protect, async (req, res) => {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return res.status(503).json({ message: 'Card payments not configured (STRIPE_SECRET_KEY missing).' });

  try {
    const stripe = require('stripe')(key);
    const { amount, currency = 'pkr', description = 'EventSphere Ticket', metadata = {} } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount.' });

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // PKR → paisa (or cents for USD)
      currency,
      description,
      metadata: { ...metadata, userId: String(req.user.id || req.user._id || '') },
      automatic_payment_methods: { enabled: true },
    });

    res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (err) {
    console.error('[Stripe]', err.message, err.raw?.message);
    res.status(500).json({ message: err.raw?.message || err.message });
  }
});

// ── Safepay: init session (JazzCash / Easypaisa) ─────────────────────────────
router.post('/safepay-init', protect, async (req, res) => {
  const secret = process.env.SAFEPAY_SECRET_KEY;
  const pubKey = process.env.SAFEPAY_PUBLIC_KEY;
  const env    = process.env.SAFEPAY_ENV || 'sandbox';

  if (!secret || !pubKey) {
    return res.status(503).json({ message: 'Safepay not configured (SAFEPAY_SECRET_KEY / SAFEPAY_PUBLIC_KEY missing).' });
  }

  try {
    const { amount, orderId, redirectUrl, webhookUrl } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Invalid amount.' });

    // ── SANDBOX: Simulate locally — Safepay sandbox site is unreliable ───────
    if (env !== 'production') {
      const simulatedToken = `SIM-${orderId || 'ES'}-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      console.log('[Safepay-Sandbox] Simulating session:', simulatedToken, 'Amount:', amount);
      return res.json({
        token: simulatedToken,
        checkoutUrl: null,    // null = frontend handles locally (sandbox simulation)
        sandbox: true,
        message: 'Sandbox mode — payment will be simulated locally.',
      });
    }

    // ── PRODUCTION: call the real Safepay API ────────────────────────────────
    const apiBase      = process.env.SAFEPAY_API_URL      || 'https://api.getsafepay.com';
    const checkoutBase = process.env.SAFEPAY_CHECKOUT_URL  || 'https://checkout.getsafepay.com';

    const payload = {
      client:       pubKey,
      environment:  env,
      currency:     'PKR',
      amount:       Math.round(amount * 100),  // paisa
      order_id:     orderId || `ES-${Date.now()}`,
    };
    if (redirectUrl) payload.redirect_url = redirectUrl;
    if (webhookUrl)  payload.webhook_url  = webhookUrl;

    console.log('[Safepay] Sending payload:', JSON.stringify(payload));

    const response = await fetch(`${apiBase}/order/v1/init`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SFPY-MERCHANT-SECRET': secret,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log('[Safepay] Response:', JSON.stringify(data));

    if (!response.ok) {
      const errMsg = data?.status?.errors?.join(', ') || data?.status?.message || 'Safepay init failed.';
      return res.status(response.status).json({ message: errMsg });
    }

    const token = data.data?.token;
    if (!token) return res.status(502).json({ message: 'No token returned by Safepay.' });

    res.json({
      token,
      checkoutUrl: `${checkoutBase}/checkout?tbt=${token}&source=custom`,
    });
  } catch (err) {
    console.error('[Safepay] Exception:', err.message);
    res.status(500).json({ message: err.message });
  }
});


// ── Stripe: verify payment status ────────────────────────────────────────────
router.post('/verify', protect, async (req, res) => {
  const { provider, paymentIntentId, token } = req.body;

  if (provider === 'stripe') {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) return res.status(503).json({ message: 'Stripe not configured.' });
    try {
      const stripe = require('stripe')(key);
      const intent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return res.json({ success: intent.status === 'succeeded', status: intent.status });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  if (provider === 'safepay') {
    const secret = process.env.SAFEPAY_SECRET_KEY;
    const env    = process.env.SAFEPAY_ENV || 'sandbox';
    // Sandbox tokens are simulated — always return success
    if (env !== 'production' || (token && token.startsWith('SIM-'))) {
      return res.json({ success: true, status: 'PAID (simulated)' });
    }
    const base   = process.env.SAFEPAY_API_URL || 'https://api.getsafepay.com';
    try {
      const r = await fetch(`${base}/order/v1/retrieve?token=${token}`, {
        headers: { 'X-SFPY-MERCHANT-SECRET': secret },
      });
      const data = await r.json();
      const isPaid = data.data?.tracker?.state === 'PAID';
      return res.json({ success: isPaid, status: data.data?.tracker?.state });
    } catch (err) {
      return res.status(500).json({ message: err.message });
    }
  }

  res.status(400).json({ message: 'Unknown provider.' });
});

module.exports = router;
