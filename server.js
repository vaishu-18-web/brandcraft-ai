require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const { aiEnabled, askClaude, askClaudeJSON } = require('./lib/ai');
const gen = require('./lib/generators');
const { PROJECT_SUMMARY, offlineAnswer } = require('./lib/knowledge');

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

// ---------- tiny JSON "database" ----------
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);
if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, '[]');

const readUsers = () => JSON.parse(fs.readFileSync(USERS_FILE, 'utf8') || '[]');
const writeUsers = (u) => fs.writeFileSync(USERS_FILE, JSON.stringify(u, null, 2));

const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, picture: u.picture || null });
const makeToken = (u) => jwt.sign({ id: u.id }, JWT_SECRET, { expiresIn: '7d' });

// ---------- app ----------
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in.' });
  try {
    const { id } = jwt.verify(token, JWT_SECRET);
    const user = readUsers().find((u) => u.id === id);
    if (!user) return res.status(401).json({ error: 'Account not found.' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
}

// Very small in-memory rate limiter for login/signup (max 20 tries per minute per IP).
const hits = new Map();
function authLimiter(req, res, next) {
  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || 'x';
  const list = (hits.get(key) || []).filter((t) => now - t < 60000);
  if (list.length >= 20) return res.status(429).json({ error: 'Too many attempts. Please wait a minute and try again.' });
  list.push(now);
  hits.set(key, list);
  next();
}
const str = (v) => (typeof v === 'string' ? v : '');

const wrap = (fn) => (req, res) =>
  fn(req, res).catch((e) => {
    console.error(e);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  });

// ---------- config ----------
app.get('/api/config', (req, res) => {
  res.json({ googleClientId: GOOGLE_CLIENT_ID, aiEnabled: aiEnabled() });
});

// ---------- auth ----------
app.post('/api/auth/signup', authLimiter, wrap(async (req, res) => {
  const body = req.body || {};
  const name = str(body.name).trim(), email = str(body.email).trim(), password = str(body.password);
  if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password are required.' });
  if (!/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  const users = readUsers();
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'An account with this email already exists. Try signing in.' });
  }
  const user = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name,
    email: email.toLowerCase(),
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  writeUsers(users);
  res.json({ token: makeToken(user), user: publicUser(user) });
}));

app.post('/api/auth/login', authLimiter, wrap(async (req, res) => {
  const body = req.body || {};
  const email = str(body.email).trim(), password = str(body.password);
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });
  const user = readUsers().find((u) => u.email === email.toLowerCase());
  if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'Incorrect email or password.' });
  }
  res.json({ token: makeToken(user), user: publicUser(user) });
}));

app.post('/api/auth/google', authLimiter, wrap(async (req, res) => {
  if (!googleClient) return res.status(400).json({ error: 'Google sign-in is not configured. Add GOOGLE_CLIENT_ID to .env.' });
  let p;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: str((req.body || {}).credential), audience: GOOGLE_CLIENT_ID });
    p = ticket.getPayload();
  } catch (e) {
    console.error('Google token check failed:', e.message);
    return res.status(401).json({ error: 'Google sign-in failed. Please try again.' });
  }
  if (!p || !p.email || p.email_verified === false) return res.status(401).json({ error: 'Your Google email is not verified.' });
  const users = readUsers();
  let user = users.find((u) => u.email === p.email.toLowerCase());
  if (!user) {
    user = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: p.name || p.email,
      email: p.email.toLowerCase(),
      picture: p.picture,
      createdAt: new Date().toISOString(),
    };
    users.push(user);
  } else {
    user.picture = p.picture || user.picture;
    if (!user.name) user.name = p.name;
  }
  writeUsers(users);
  res.json({ token: makeToken(user), user: publicUser(user) });
}));

app.get('/api/me', auth, (req, res) => res.json({ user: publicUser(req.user) }));

// ---------- tools ----------
const SYS = 'You are a senior brand strategist helping startups and small businesses.';

app.post('/api/names', auth, wrap(async (req, res) => {
  const businessType = str((req.body || {}).businessType), keywords = str((req.body || {}).keywords);
  if (!businessType || !businessType.trim()) return res.status(400).json({ error: 'Please enter a business type.' });
  if (aiEnabled()) {
    try {
      const names = await askClaudeJSON(
        SYS,
        `Generate 10 unique, memorable brand names for this business type: "${businessType}". Keywords: "${keywords || 'none'}". ` +
          'Return a JSON array of objects: [{"name": "...", "reason": "one short sentence"}].'
      );
      if (Array.isArray(names) && names.length) return res.json({ names, source: 'ai' });
    } catch (e) { console.error('AI names failed, using offline:', e.message); }
  }
  res.json({ names: gen.generateBrandNames(businessType, keywords), source: 'offline' });
}));

app.post('/api/taglines', auth, wrap(async (req, res) => {
  const brandAndIdea = str((req.body || {}).brandAndIdea);
  if (!brandAndIdea || !brandAndIdea.trim()) return res.status(400).json({ error: 'Please enter your brand name and idea.' });
  if (aiEnabled()) {
    try {
      const taglines = await askClaudeJSON(
        SYS,
        `Write 8 catchy, short taglines for: "${brandAndIdea}". Return a JSON array: [{"tagline": "..."}].`
      );
      if (Array.isArray(taglines) && taglines.length) return res.json({ taglines, source: 'ai' });
    } catch (e) { console.error('AI taglines failed, using offline:', e.message); }
  }
  res.json({ taglines: gen.generateTaglines(brandAndIdea), source: 'offline' });
}));

app.post('/api/marketing', auth, wrap(async (req, res) => {
  const brand = str((req.body || {}).brand), product = str((req.body || {}).product), audience = str((req.body || {}).audience);
  if (!brand || !brand.trim() || !product || !product.trim()) {
    return res.status(400).json({ error: 'Please enter a brand name and what you sell.' });
  }
  if (aiEnabled()) {
    try {
      const content = await askClaudeJSON(
        SYS,
        `Create marketing content for brand "${brand}" selling "${product}" to "${audience || 'general audience'}". ` +
          'Return JSON: {"linkedin": "post text", "instagram": "caption with hashtags", ' +
          '"adCopy": [{"headline": "...", "body": "..."}, {"headline": "...", "body": "..."}, {"headline": "...", "body": "..."}], ' +
          '"product": "product description paragraph"}.',
        1800
      );
      if (content && content.linkedin) return res.json({ content, source: 'ai' });
    } catch (e) { console.error('AI marketing failed, using offline:', e.message); }
  }
  res.json({ content: gen.generateMarketing(brand, product, audience), source: 'offline' });
}));

app.post('/api/sentiment', auth, wrap(async (req, res) => {
  const text = str((req.body || {}).text);
  if (!text || !text.trim()) return res.status(400).json({ error: 'Please paste some text to analyze.' });
  // The offline analyser is deterministic and instant, so it is always the base result.
  let result = gen.analyzeSentiment(text);
  let source = 'offline';
  if (aiEnabled()) {
    try {
      const ai = await askClaudeJSON(
        'You are a sentiment analysis engine.',
        `Analyze the sentiment of this text: """${text.slice(0, 4000)}""". ` +
          'Return JSON: {"positive": number, "negative": number, "neutral": number (integers summing to 100), ' +
          '"label": "Positive"|"Negative"|"Neutral", "positiveWords": [strings], "negativeWords": [strings]}.'
      );
      if (ai && typeof ai.positive === 'number') { result = ai; source = 'ai'; }
    } catch (e) { console.error('AI sentiment failed, using offline:', e.message); }
  }
  res.json({ result, source });
}));

app.post('/api/chat', auth, wrap(async (req, res) => {
  const message = str((req.body || {}).message), history = (req.body || {}).history;
  if (!message || !message.trim()) return res.status(400).json({ error: 'Please type a message.' });
  if (aiEnabled()) {
    try {
      const msgs = (Array.isArray(history) ? history : [])
        .slice(-10)
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content }));
      msgs.push({ role: 'user', content: message });
      while (msgs.length && msgs[0].role !== 'user') msgs.shift();
      const reply = await askClaude(
        'You are the BrandCraft AI assistant. Answer questions about the BrandCraft AI project using the facts below, ' +
          'and also give practical branding advice for startups and small businesses. Be friendly and concise.\n\n' + PROJECT_SUMMARY,
        msgs,
        700
      );
      return res.json({ reply, source: 'ai' });
    } catch (e) { console.error('AI chat failed, using offline:', e.message); }
  }
  res.json({ reply: offlineAnswer(message), source: 'offline' });
}));

app.listen(PORT, () => {
  console.log(`BrandCraft AI running at http://localhost:${PORT}`);
  console.log(`AI mode: ${aiEnabled() ? 'Claude API enabled' : 'offline generators (add ANTHROPIC_API_KEY for AI)'}`);
  console.log(`Google sign-in: ${GOOGLE_CLIENT_ID ? 'enabled' : 'not configured'}`);
});
