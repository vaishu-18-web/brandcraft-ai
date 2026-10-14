// Offline generators - used when no ANTHROPIC_API_KEY is configured,
// and as a fallback if the AI call fails. Everything here works with zero setup.

const pick = (arr, n = 1) => {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
};

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------- Brand names ----------
const PREFIXES = ['Nova', 'Zen', 'Bright', 'Pure', 'Swift', 'Urban', 'Vita', 'Luma', 'Apex', 'Terra', 'Aero', 'Blue', 'Evo', 'Omni', 'Pixel', 'Spark', 'Sky', 'True', 'Wave', 'Zest'];
const SUFFIX_WORDS = ['Hub', 'Labs', 'Nest', 'Forge', 'Grid', 'Loop', 'Craft', 'Works', 'Verse', 'Bay', 'Mint', 'Wise'];
const SUFFIX_ENDINGS = ['ly', 'io', 'ify', 'ia'];

// Words that describe the kind of business but make poor names.
const STOP = new Set(['shop', 'store', 'business', 'company', 'service', 'services', 'app', 'online', 'small', 'new', 'the', 'and', 'for', 'with', 'my', 'your', 'best', 'startup', 'agency', 'firm', 'inc', 'ltd', 'based', 'that', 'sell', 'selling', 'make', 'making']);

const CATS = [
  { re: /coffee|cafe|café|tea\b|bakery|brew|roast/, roots: ['Brew', 'Bean', 'Roast', 'Crema', 'Steep', 'Mocha', 'Perk', 'Drip', 'Aroma'] },
  { re: /food|restaurant|kitchen|snack|catering|pizza|burger|meal|chef|juice|grocery/, roots: ['Savor', 'Spice', 'Bite', 'Basil', 'Ember', 'Harvest', 'Pantry', 'Zest', 'Relish'] },
  { re: /tech|software|saas|app\b|ai\b|digital|cloud|data|code|platform|cyber|robot/, roots: ['Byte', 'Logic', 'Pixel', 'Cloud', 'Flux', 'Node', 'Vector', 'Sync', 'Quantum'] },
  { re: /fashion|cloth|apparel|wear|boutique|jewel|shoe|style|tailor/, roots: ['Thread', 'Loom', 'Drape', 'Stitch', 'Muse', 'Atelier', 'Velvet', 'Chic', 'Weave'] },
  { re: /fitness|gym|yoga|sport|workout|train|wellness|health|nutrition|medical|clinic/, roots: ['Vital', 'Pulse', 'Flex', 'Core', 'Stride', 'Bloom', 'Thrive', 'Vigor', 'Peak'] },
  { re: /school|educat|tutor|course|learn|academy|training|coaching|teach/, roots: ['Scholar', 'Learn', 'Spark', 'Mentor', 'Lumen', 'Quest', 'Sage', 'Curio', 'Ascend'] },
  { re: /financ|account|invest|bank|loan|insur|tax|crypto|payment|wealth/, roots: ['Ledger', 'Capital', 'Prime', 'Mint', 'Fortune', 'Equity', 'Anchor', 'Crest', 'Vault'] },
  { re: /travel|tour|hotel|trip|hostel|adventure|holiday|resort/, roots: ['Voyage', 'Roam', 'Atlas', 'Wander', 'Compass', 'Drift', 'Trek', 'Horizon', 'Nomad'] },
  { re: /beauty|salon|skin|cosmetic|makeup|spa|hair|perfume|nail/, roots: ['Glow', 'Lush', 'Bloom', 'Aura', 'Silk', 'Radiant', 'Petal', 'Velour', 'Dew'] },
  { re: /eco|organic|green|sustain|plant|garden|farm|natural|recycl/, roots: ['Leaf', 'Root', 'Verdant', 'Sprout', 'Terra', 'Meadow', 'Grove', 'Fern', 'Bloom'] },
  { re: /design|photo|art\b|creative|studio|media|video|film|print|music|marketing/, roots: ['Canvas', 'Hue', 'Frame', 'Muse', 'Pixel', 'Palette', 'Echo', 'Spark', 'Vivid'] },
  { re: /pet|dog|cat\b|animal|vet/, roots: ['Paw', 'Whisker', 'Tail', 'Fetch', 'Purr', 'Wag', 'Fur', 'Buddy', 'Bark'] },
  { re: /real estate|property|home|house|interior|furniture|construction|architect/, roots: ['Haven', 'Hearth', 'Keystone', 'Nest', 'Abode', 'Foundry', 'Oak', 'Lintel', 'Beam'] },
];
const DEFAULT_CAT = { roots: ['Spark', 'Bloom', 'Summit', 'Beacon', 'Ember', 'Atlas', 'Pulse', 'Compass', 'Orbit'] };

const words = (str) => (str || '').toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2 && !STOP.has(w));

// short stem of a word for invented names: "organic" -> "organ", "coffee" -> "coff"
const stem = (w) => (w.length > 6 ? w.slice(0, 5) : w).replace(/[aeiou]+$/, '') || w;

function generateBrandNames(businessType, keywords = '') {
  const text = `${businessType || ''} ${keywords || ''}`.toLowerCase();
  const cat = CATS.find((c) => c.re.test(text)) || DEFAULT_CAT;
  const seeds = [...new Set([...words(keywords), ...words(businessType)])].slice(0, 6);
  if (!seeds.length) seeds.push(cat.roots[0].toLowerCase());

  const cands = [];
  const add = (name, type, reason) => cands.push({ name, type, reason });

  for (const k of seeds) {
    const K = cap(k);
    pick(PREFIXES, 2).forEach((p) => add(p + K, 'prefix', `Pairs "${p}" with "${k}" - bold, clear and easy to remember.`));
    pick(SUFFIX_WORDS, 2).forEach((s) => add(K + s, 'suffix', `"${K}" plus "${s}" sounds like an established, modern brand.`));
    pick(cat.roots, 2).forEach((r) => {
      if (Math.random() < 0.5) add(K + r, 'root', `Joins "${k}" and "${r.toLowerCase()}" so people instantly know what you do.`);
      else add(r + K, 'root', `Joins "${r.toLowerCase()}" and "${k}" - descriptive yet distinctive.`);
    });
    pick(SUFFIX_ENDINGS, 2).forEach((e) => add(cap(stem(k)) + e, 'invented', `A short invented twist on "${k}" - distinctive and easy to trademark.`));
  }
  pick(cat.roots, 4).forEach((r) => {
    const p = pick(PREFIXES)[0];
    add(p + r, 'prefix', `"${p}" + "${r.toLowerCase()}" fits this kind of business and sticks in the mind.`);
    add(r + pick(SUFFIX_ENDINGS)[0], 'invented', `Built on the industry word "${r.toLowerCase()}" with a modern ending.`);
  });

  // clean up, remove duplicates, keep a mix of types
  const seen = new Set();
  const byType = {};
  pick(cands, cands.length).forEach((c) => {
    c.name = c.name.replace(/[^a-z0-9]/gi, '');
    const key = c.name.toLowerCase();
    if (c.name.length < 4 || c.name.length > 14 || seen.has(key)) return;
    seen.add(key);
    (byType[c.type] = byType[c.type] || []).push(c);
  });
  const out = [];
  const buckets = Object.values(byType);
  while (out.length < 12 && buckets.some((b) => b.length)) {
    for (const bk of buckets) if (bk.length && out.length < 12) out.push(bk.shift());
  }
  return out.map(({ name, reason }) => ({ name, reason }));
}

// ---------- Taglines ----------
const TRAIL = new Set(['to', 'for', 'the', 'a', 'an', 'and', 'of', 'in', 'with', 'your', 'that', 'which', 'who', 'is', 'are', 'on', 'at', 'by', 'from']);

function generateTaglines(brandAndIdea) {
  const text = (brandAndIdea || '').trim() || 'Your brand';
  const m = text.match(/^(.+?)\s*(?:[-\u2013\u2014:|,]|\bis\b|\bsells?\b|\boffers?\b)\s*(.+)$/i);
  const brand = (m ? m[1] : text.split(/\s+/).slice(0, 2).join(' ')).trim().replace(/[.!?]+$/, '') || 'We';
  const full = (m ? m[2] : text.split(/\s+/).slice(2).join(' ')).trim().replace(/[.!?]+$/, '');
  const B = brand;
  const joy = () => pick(['joy', 'craft', 'confidence', 'clarity'])[0];

  // templates that work without knowing the idea
  const generic = [
    `${B}: Built for what's next.`,
    `Simple. Honest. ${B}.`,
    `Meet ${B}. Meet better.`,
    `${B} - made with ${joy()}.`,
    `Small steps. Big impact. ${B}.`,
    `Choose ${B}. Choose better.`,
    `${B}: Because you deserve more.`,
    `Start bold. Stay ${B}.`,
    `Where ${joy()} meets ${joy()}.`,
    `${B}. Made for you.`,
  ];
  if (!full) return pick(generic, 8).map((tagline) => ({ tagline }));

  const kw = full.split(/\s+/).slice(0, 3);
  while (kw.length > 1 && TRAIL.has(kw[kw.length - 1].toLowerCase())) kw.pop();
  // keep acronyms like "AI" in capitals, lowercase everything else
  const k = kw.map((w) => (w.length <= 4 && w === w.toUpperCase() && /[A-Z]/.test(w) ? w : w.toLowerCase())).join(' ');
  const K = cap(k);
  const withIdea = [
    `${B}: ${cap(full)}.`,
    `Better ${k}, every day.`,
    `${B}. Where ${k} feels effortless.`,
    `Discover ${k} the ${B} way.`,
    `Your ${k}, reimagined.`,
    `Made for people who love ${k}.`,
    `${K} done right.`,
    `Think ${k}. Think ${B}.`,
    `${B} - ${k} with heart.`,
    `Bring ${k} to life.`,
    `Where ${k} meets ${joy()}.`,
    `The ${B} difference: ${k} you can trust.`,
    `Start with ${k}. Stay for ${B}.`,
    `Small steps. Big ${k}.`,
  ];
  return pick([...withIdea, ...pick(generic, 2)], 8).map((tagline) => ({ tagline }));
}

// ---------- Marketing content ----------
function generateMarketing(brand, product, audience = '') {
  const b = brand || 'Our brand';
  const p = product || 'our product';
  const a = audience || 'growing businesses';
  return {
    linkedin:
      `Excited to introduce ${b}! 🚀\n\n` +
      `We built ${p} to help ${a} move faster and look sharper.\n\n` +
      `Why it matters:\n• Save time on everyday work\n• Stand out with a consistent identity\n• Grow with confidence\n\n` +
      `Curious? Drop a comment or send us a message - we'd love to hear what you think.\n\n#startup #branding #smallbusiness #growth`,
    instagram:
      `✨ Meet ${b} ✨\n${cap(p)} made simple - for ${a}.\n\n` +
      `Tap the link in bio to get started 👆\n\n#${b.replace(/[^a-z0-9]/gi, '')} #newlaunch #smallbusiness #branding #startuplife`,
    adCopy: [
      { headline: `${b} - Built For ${cap(a)}`, body: `Discover ${p} that works as hard as you do. Try it today.` },
      { headline: `Ready To Grow? Meet ${b}`, body: `Join the people who switched to ${p}. Start free.` },
      { headline: `Say Hello To ${b}`, body: `${cap(p)} designed to save you time and win customers.` },
    ],
    product:
      `${b} is ${p} designed for ${a}. It's simple to start, easy to love and built to scale as you grow. ` +
      `Whether you're launching your first product or refining an established brand, ${b} gives you the tools to look professional and connect with customers.`,
  };
}

// ---------- Sentiment ----------
const POSITIVE = ['good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'loved', 'like', 'fantastic', 'wonderful', 'best', 'happy', 'perfect', 'nice', 'beautiful', 'brilliant', 'recommend', 'impressive', 'easy', 'fast', 'helpful', 'smooth', 'enjoy', 'enjoyed', 'superb', 'outstanding', 'delighted', 'satisfied', 'reliable', 'friendly', 'incredible', 'cool', 'clean', 'valuable', 'thanks', 'thank'];
const NEGATIVE = ['bad', 'terrible', 'awful', 'hate', 'hated', 'worst', 'poor', 'horrible', 'disappointing', 'disappointed', 'slow', 'broken', 'useless', 'waste', 'ugly', 'annoying', 'difficult', 'confusing', 'buggy', 'expensive', 'angry', 'sad', 'unhappy', 'rude', 'failed', 'fail', 'problem', 'issue', 'crash', 'refund', 'scam', 'never', 'boring', 'cheap', 'unreliable', 'dirty'];
const NEGATORS = ['not', "n't", 'no', 'never', 'hardly', 'without'];

function analyzeSentiment(text) {
  const tokens = (text || '').toLowerCase().replace(/n't/g, " n't").match(/[a-z']+/g) || [];
  let pos = 0;
  let neg = 0;
  const positiveWords = [];
  const negativeWords = [];
  tokens.forEach((t, i) => {
    const negated = NEGATORS.includes(tokens[i - 1]) || NEGATORS.includes(tokens[i - 2]);
    if (POSITIVE.includes(t)) {
      if (negated) { neg++; negativeWords.push('not ' + t); } else { pos++; positiveWords.push(t); }
    } else if (NEGATIVE.includes(t)) {
      if (negated) { pos++; positiveWords.push('not ' + t); } else { neg++; negativeWords.push(t); }
    }
  });
  const total = pos + neg;
  let positive, negative, neutral;
  if (total === 0) {
    positive = 0; negative = 0; neutral = 100;
  } else {
    const neutralShare = Math.max(5, Math.round((1 / (1 + total)) * 60));
    const remaining = 100 - neutralShare;
    positive = Math.round((pos / total) * remaining);
    negative = remaining - positive;
    neutral = neutralShare;
  }
  let label = 'Neutral';
  if (positive > negative && positive > neutral) label = 'Positive';
  else if (negative > positive && negative > neutral) label = 'Negative';
  else if (positive > negative + 10) label = 'Positive';
  else if (negative > positive + 10) label = 'Negative';
  return {
    label,
    positive,
    negative,
    neutral,
    positiveWords: [...new Set(positiveWords)],
    negativeWords: [...new Set(negativeWords)],
  };
}

module.exports = { generateBrandNames, generateTaglines, generateMarketing, analyzeSentiment };
