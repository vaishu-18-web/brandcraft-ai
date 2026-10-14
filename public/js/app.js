(function () {
  const token = localStorage.getItem('bc_token');
  if (!token) { location.href = '/login.html'; return; }

  const $ = (id) => document.getElementById(id);
  const view = $('view');
  let user = null;
  try { user = JSON.parse(localStorage.getItem('bc_user') || 'null'); } catch { user = null; }

  // ---------- helpers ----------
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 1800);
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); }
    catch {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    toast('Copied to clipboard');
  }

  function logout() {
    localStorage.removeItem('bc_token');
    localStorage.removeItem('bc_user');
    location.href = '/login.html';
  }

  async function api(url, body) {
    const res = await fetch(url, {
      method: body ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) { logout(); throw new Error(data.error || 'Signed out'); }
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }

  // Run an async action on a button with a spinner; show errors in `errEl`.
  async function withButton(btn, errEl, fn) {
    const label = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Working...';
    errEl.classList.add('hidden');
    try { await fn(); }
    catch (e) { errEl.textContent = e.message; errEl.classList.remove('hidden'); }
    finally { btn.disabled = false; btn.innerHTML = label; }
  }

  // ---------- icons ----------
  const I = {
    T: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 5V4h14v1M12 4v16M9 20h6"/></svg>',
    image: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>',
    spark: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    mega: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11v2a1 1 0 001 1h2l5 4V6L6 10H4a1 1 0 00-1 1z"/><path d="M15 9a4 4 0 010 6M18 6a8 8 0 010 12"/></svg>',
    chart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 17v-5M12 17V8M16 17v-3"/></svg>',
    chat: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>',
    back: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  };

  const TOOLS = [
    { id: 'names', title: 'Brand Names', desc: 'Generate unique brand names', icon: I.T, grad: 'g-purple' },
    { id: 'logo', title: 'Logo Generator', desc: 'Create AI-powered logos', icon: I.image, grad: 'g-blue' },
    { id: 'taglines', title: 'Taglines', desc: 'Craft catchy taglines', icon: I.spark, grad: 'g-orange' },
    { id: 'marketing', title: 'Marketing Content', desc: 'Generate social media content', icon: I.mega, grad: 'g-pink' },
    { id: 'sentiment', title: 'Sentiment Analysis', desc: 'Analyze text sentiment', icon: I.chart, grad: 'g-green' },
    { id: 'chatbot', title: 'AI Chatbot', desc: 'Brand building assistant', icon: I.chat, grad: 'g-violet' },
  ];

  const backBtn = '<button class="back" data-go="dashboard">' + I.back + ' Back to dashboard</button>';

  // ---------- views ----------
  const views = {};

  views.home = () => {
    view.innerHTML = `
      <section class="hero">
        <span class="badge">AI branding for startups</span>
        <h1 style="margin-top:14px">Build a brand people <span class="grad">remember</span></h1>
        <p>Names, logos, taglines and marketing content - everything a startup or small business needs, in one place.</p>
        <div class="row" style="justify-content:center">
          <button class="btn" data-go="dashboard">Open dashboard</button>
          <button class="btn secondary" data-go="features">See features</button>
        </div>
      </section>
      <div class="steps">
        <div class="step"><b>1</b><h3 style="margin:0 0 4px;font-size:15px">Name it</h3><p class="subtitle" style="margin:0">Generate brand names from your business type and keywords.</p></div>
        <div class="step"><b>2</b><h3 style="margin:0 0 4px;font-size:15px">Design it</h3><p class="subtitle" style="margin:0">Pick a style and get logos with a matching colour palette.</p></div>
        <div class="step"><b>3</b><h3 style="margin:0 0 4px;font-size:15px">Say it</h3><p class="subtitle" style="margin:0">Taglines and ready-to-post marketing content in seconds.</p></div>
        <div class="step"><b>4</b><h3 style="margin:0 0 4px;font-size:15px">Check it</h3><p class="subtitle" style="margin:0">Analyse sentiment of reviews and copy before you publish.</p></div>
      </div>`;
  };

  views.features = () => {
    view.innerHTML = `
      <h1>Features</h1>
      <p class="subtitle">Everything inside the AI Brand Studio. Click a feature to try it.</p>
      <div class="grid">
        ${TOOLS.map((t) => `
          <button class="tool-card" data-go="${t.id}">
            <div class="tool-icon ${t.grad}">${t.icon}</div>
            <h3>${t.title}</h3>
            <p>${t.desc}</p>
          </button>`).join('')}
      </div>`;
  };

  views.dashboard = () => {
    view.innerHTML = `
      <h1>AI Brand Studio</h1>
      <p class="subtitle">Choose a tool to start building your brand identity.</p>
      <div class="grid">
        ${TOOLS.map((t) => `
          <button class="tool-card" data-go="${t.id}">
            <div class="tool-icon ${t.grad}">${t.icon}</div>
            <h3>${t.title}</h3>
            <p>${t.desc}</p>
          </button>`).join('')}
      </div>`;
  };

  // ----- Brand names -----
  views.names = () => {
    view.innerHTML = `
      ${backBtn}
      <h1>Brand Name Generator</h1>
      <p class="subtitle">Tell us about your business and get unique name ideas.</p>
      <div class="panel">
        <div class="field"><label for="bt">Business type</label><input type="text" id="bt" placeholder="e.g. Organic coffee shop" /></div>
        <div class="field"><label for="kw">Keywords <span style="font-weight:400;color:var(--muted)">(optional)</span></label><input type="text" id="kw" placeholder="e.g. fresh, local, green" /></div>
        <div class="error hidden" id="err"></div>
        <button class="btn" id="go">Generate names</button>
      </div>
      <div id="out"></div>`;
    const run = () => withButton($('go'), $('err'), async () => {
      const data = await api('/api/names', { businessType: $('bt').value, keywords: $('kw').value });
      $('out').innerHTML = `
        <div class="panel">
          <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">Your brand names</h2><span class="badge">${data.source === 'ai' ? 'AI generated' : 'Smart generator'}</span></div>
          <div class="result-list">
            ${data.names.map((n) => `
              <div class="result-item">
                <div><strong>${esc(n.name)}</strong><span class="sub">${esc(n.reason || '')}</span></div>
                <div class="row">
                  <button class="btn secondary small" data-copy="${esc(n.name)}">Copy</button>
                  <button class="btn secondary small" data-logo="${esc(n.name)}">Make logo</button>
                </div>
              </div>`).join('')}
          </div>
        </div>`;
    });
    $('go').addEventListener('click', run);
    ['bt', 'kw'].forEach((id) => $(id).addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); }));
  };

  // ----- Logo generator -----
  const LOGO_STYLES = {
    modern: { label: 'Modern and clean', font: "'Inter','Segoe UI',Arial,sans-serif", weight: 700, shape: 'rounded', palettes: [
      ['#2563eb', '#06b6d4', '#0f172a', '#e0f2fe', '#ffffff'], ['#4f46e5', '#22d3ee', '#111827', '#eef2ff', '#ffffff'], ['#0ea5e9', '#14b8a6', '#0b1220', '#ecfeff', '#ffffff']] },
    minimal: { label: 'Minimal and simple', font: "'Helvetica Neue',Arial,sans-serif", weight: 300, shape: 'circle', palettes: [
      ['#111111', '#555555', '#999999', '#e5e5e5', '#ffffff'], ['#1f2937', '#6b7280', '#9ca3af', '#f3f4f6', '#ffffff'], ['#0f766e', '#334155', '#94a3b8', '#f1f5f9', '#ffffff']] },
    luxury: { label: 'Luxury and elegant', font: "Georgia,'Times New Roman',serif", weight: 400, shape: 'diamond', palettes: [
      ['#c9a227', '#111111', '#f5e6b3', '#2b2b2b', '#faf7ef'], ['#b8860b', '#1c1917', '#e7d7a0', '#44403c', '#fbf8f1'], ['#d4af37', '#3b0a45', '#f3e5ab', '#1e1b4b', '#fffdf5']] },
    playful: { label: 'Playful and fun', font: "'Trebuchet MS','Comic Sans MS',sans-serif", weight: 800, shape: 'star', palettes: [
      ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#fff8e7'], ['#f472b6', '#facc15', '#34d399', '#60a5fa', '#fff7ed'], ['#fb923c', '#a78bfa', '#2dd4bf', '#f43f5e', '#fffbeb']] },
    bold: { label: 'Bold and strong', font: "'Arial Black',Impact,sans-serif", weight: 900, shape: 'hexagon', palettes: [
      ['#e11d48', '#111111', '#f59e0b', '#ffffff', '#f3f4f6'], ['#dc2626', '#0a0a0a', '#facc15', '#ffffff', '#f5f5f5'], ['#ea580c', '#18181b', '#fde047', '#ffffff', '#fafafa']] },
  };

  function iconPath(shape, cx, cy, r, fill, stroke) {
    const common = `fill="${fill}" ${stroke ? `stroke="${stroke}" stroke-width="3"` : ''}`;
    if (shape === 'rounded') return `<rect x="${cx - r}" y="${cy - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.35}" ${common}/>`;
    if (shape === 'circle') return `<circle cx="${cx}" cy="${cy}" r="${r}" ${common}/>`;
    if (shape === 'diamond') return `<polygon points="${cx},${cy - r * 1.15} ${cx + r * 0.95},${cy} ${cx},${cy + r * 1.15} ${cx - r * 0.95},${cy}" ${common}/>`;
    if (shape === 'star') {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const rad = i % 2 === 0 ? r * 1.1 : r * 0.55;
        const a = (Math.PI / 5) * i - Math.PI / 2;
        pts.push((cx + rad * Math.cos(a)).toFixed(1) + ',' + (cy + rad * Math.sin(a)).toFixed(1));
      }
      return `<polygon points="${pts.join(' ')}" stroke-linejoin="round" ${common}/>`;
    }
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push((cx + r * 1.1 * Math.cos(a)).toFixed(1) + ',' + (cy + r * 1.1 * Math.sin(a)).toFixed(1));
    }
    return `<polygon points="${pts.join(' ')}" stroke-linejoin="round" ${common}/>`;
  }

  // ----- colour helpers so text is always readable -----
  const lum = (hex) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const darkest = (cols) => cols.reduce((a, b) => (lum(b) < lum(a) ? b : a));
  const lightest = (cols) => cols.reduce((a, b) => (lum(b) > lum(a) ? b : a));
  // pick a font size so `len` characters fit into `maxW` SVG units
  const fit = (len, maxW, maxFs, minFs, factor) => Math.max(minFs, Math.min(maxFs, Math.floor(maxW / (Math.max(len, 1) * factor))));

  function buildLogo(name, styleKey, palette, layout) {
    const s = LOGO_STYLES[styleKey];
    const [c1, c2] = palette;
    const ink = darkest(palette);          // text colour on light backgrounds
    const paper = lightest(palette);       // light background / text on dark
    const raw = name.trim() || 'Brand';
    const letter = esc((raw[0] || 'B').toUpperCase());
    const text = esc(raw);
    const ls = styleKey === 'luxury' ? 4 : 0;
    // average glyph width relative to font size (wider for serif + letter-spacing)
    const factor = (styleKey === 'luxury' ? 0.62 : styleKey === 'bold' ? 0.66 : 0.58) + ls / 30;
    const badgeText = contrast(c1, '#ffffff') >= 2.2 ? '#ffffff' : ink;
    let bgFill = paper;
    let body = '';
    if (layout === 0) {
      // icon on top, centred wordmark below
      const fs = fit(raw.length, 270, 36, 10, factor);
      body = iconPath(s.shape, 150, 66, 36, c1) +
        `<text x="150" y="77" text-anchor="middle" font-family="${s.font}" font-weight="900" font-size="34" fill="${badgeText}">${letter}</text>` +
        `<text x="150" y="146" text-anchor="middle" font-family="${s.font}" font-weight="${s.weight}" font-size="${fs}" fill="${ink}" letter-spacing="${ls}">${text}</text>` +
        `<rect x="110" y="162" width="80" height="4" rx="2" fill="${c2}"/>`;
    } else if (layout === 1) {
      // icon on the left, wordmark on the right
      const fs = fit(raw.length, 178, 30, 9, factor);
      body = iconPath(s.shape, 58, 100, 34, c1) +
        `<text x="58" y="111" text-anchor="middle" font-family="${s.font}" font-weight="900" font-size="32" fill="${badgeText}">${letter}</text>` +
        `<text x="106" y="${100 + Math.round(fs * 0.3)}" font-family="${s.font}" font-weight="${s.weight}" font-size="${fs}" fill="${ink}" letter-spacing="${ls}">${text}</text>` +
        `<rect x="106" y="${112 + Math.round(fs * 0.3)}" width="48" height="4" rx="2" fill="${c2}"/>`;
    } else {
      // dark badge version: light text on the darkest colour
      bgFill = ink;
      const fs = fit(raw.length, 270, 36, 10, factor);
      const stroke = contrast(c1, ink) >= 3 ? c1 : paper;
      body = iconPath(s.shape, 150, 66, 36, 'none', stroke) +
        `<text x="150" y="78" text-anchor="middle" font-family="${s.font}" font-weight="${Math.max(s.weight, 600)}" font-size="38" fill="${paper}">${letter}</text>` +
        `<text x="150" y="146" text-anchor="middle" font-family="${s.font}" font-weight="${s.weight}" font-size="${fs}" fill="${paper}" letter-spacing="${ls}">${text}</text>` +
        `<rect x="110" y="162" width="80" height="4" rx="2" fill="${stroke}"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 200" width="600" height="400"><rect width="300" height="200" rx="14" fill="${bgFill}"/>${body}</svg>`;
  }

  function downloadBlob(blob, filename) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function svgToPng(svg, filename) {
    const img = new Image();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = 1200; c.height = 800;
      c.getContext('2d').drawImage(img, 0, 0, 1200, 800);
      c.toBlob((b) => { downloadBlob(b, filename); URL.revokeObjectURL(url); }, 'image/png');
    };
    img.src = url;
  }

  views.logo = (prefill) => {
    let styleKey = 'modern';
    let palIdx = 0;
    let logos = [];
    view.innerHTML = `
      ${backBtn}
      <h1>Logo Generator</h1>
      <p class="subtitle">Pick a style and generate logos with a matching colour palette.</p>
      <div class="panel">
        <div class="field"><label for="bn">Brand name</label><input type="text" id="bn" placeholder="e.g. Brewly" value="${esc(prefill || '')}" /></div>
        <div class="field"><label>Logo style</label>
          <div class="style-grid" id="styles">
            ${Object.entries(LOGO_STYLES).map(([k, v]) => `<button type="button" class="style-opt ${k === styleKey ? 'selected' : ''}" data-style="${k}">${v.label}</button>`).join('')}
          </div>
        </div>
        <div class="field"><label>Suggested color palette <span style="font-weight:400;color:var(--muted)">(click a colour to copy)</span></label>
          <div class="swatches" id="swatches"></div>
          <div style="margin-top:10px"><button type="button" class="btn secondary small" id="shuffle">Shuffle palette</button></div>
        </div>
        <div class="error hidden" id="err"></div>
        <button class="btn" id="go">Generate logo</button>
      </div>
      <div id="out"></div>`;

    const palette = () => LOGO_STYLES[styleKey].palettes[palIdx % 3];
    const drawSwatches = () => {
      $('swatches').innerHTML = palette().map((c) => `<button type="button" class="swatch" data-copy="${c}"><i style="background:${c}"></i>${c}</button>`).join('');
    };
    drawSwatches();

    $('styles').addEventListener('click', (e) => {
      const b = e.target.closest('[data-style]');
      if (!b) return;
      styleKey = b.dataset.style; palIdx = 0;
      document.querySelectorAll('.style-opt').forEach((x) => x.classList.toggle('selected', x === b));
      drawSwatches();
    });
    $('shuffle').addEventListener('click', () => { palIdx++; drawSwatches(); });

    const render = () => {
      const name = $('bn').value;
      logos = [0, 1, 2].map((l) => buildLogo(name, styleKey, palette(), l));
      $('out').innerHTML = `
        <div class="panel">
          <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">Your logos</h2><span class="badge">${esc(LOGO_STYLES[styleKey].label)}</span></div>
          <div class="logo-stage">
            ${logos.map((svg, i) => `
              <div class="logo-card">
                ${svg}
                <div class="row" style="justify-content:center">
                  <button class="btn secondary small" data-dl-svg="${i}">SVG</button>
                  <button class="btn secondary small" data-dl-png="${i}">PNG</button>
                </div>
              </div>`).join('')}
          </div>
          <div style="margin-top:14px"><button class="btn secondary small" id="again">Generate new variation</button></div>
        </div>`;
      $('again').addEventListener('click', () => { palIdx++; drawSwatches(); render(); });
      $('out').querySelectorAll('[data-dl-svg]').forEach((b) => b.addEventListener('click', () => {
        downloadBlob(new Blob([logos[b.dataset.dlSvg]], { type: 'image/svg+xml' }), (name.trim() || 'logo').replace(/\s+/g, '-').toLowerCase() + '-logo.svg');
      }));
      $('out').querySelectorAll('[data-dl-png]').forEach((b) => b.addEventListener('click', () => {
        svgToPng(logos[b.dataset.dlPng], (name.trim() || 'logo').replace(/\s+/g, '-').toLowerCase() + '-logo.png');
      }));
    };

    const run = () => {
      if (!$('bn').value.trim()) { $('err').textContent = 'Please enter a brand name.'; $('err').classList.remove('hidden'); return; }
      $('err').classList.add('hidden');
      render();
      $('out').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    $('go').addEventListener('click', run);
    $('bn').addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    if (prefill) run();
  };

  // ----- Taglines -----
  views.taglines = () => {
    view.innerHTML = `
      ${backBtn}
      <h1>Tagline Generator</h1>
      <p class="subtitle">Craft a catchy line that sticks.</p>
      <div class="panel">
        <div class="field"><label for="bi">Brand name and idea</label><textarea id="bi" placeholder="e.g. Brewly - fresh organic coffee delivered to your door"></textarea></div>
        <div class="error hidden" id="err"></div>
        <button class="btn" id="go">Generate taglines</button>
      </div>
      <div id="out"></div>`;
    $('go').addEventListener('click', () => withButton($('go'), $('err'), async () => {
      const data = await api('/api/taglines', { brandAndIdea: $('bi').value });
      $('out').innerHTML = `
        <div class="panel">
          <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">Your taglines</h2><span class="badge">${data.source === 'ai' ? 'AI generated' : 'Smart generator'}</span></div>
          <div class="result-list">
            ${data.taglines.map((t) => `
              <div class="result-item"><strong style="font-weight:600">${esc(t.tagline)}</strong>
              <button class="btn secondary small" data-copy="${esc(t.tagline)}">Copy</button></div>`).join('')}
          </div>
        </div>`;
    }));
  };

  // ----- Marketing -----
  views.marketing = () => {
    view.innerHTML = `
      ${backBtn}
      <h1>Marketing Content</h1>
      <p class="subtitle">Get a LinkedIn post, Instagram caption, ad copy and product description.</p>
      <div class="panel">
        <div class="field"><label for="mb">Brand name</label><input type="text" id="mb" placeholder="e.g. Brewly" /></div>
        <div class="field"><label for="mp">What do you sell?</label><input type="text" id="mp" placeholder="e.g. organic coffee subscriptions" /></div>
        <div class="field"><label for="ma">Target audience <span style="font-weight:400;color:var(--muted)">(optional)</span></label><input type="text" id="ma" placeholder="e.g. busy young professionals" /></div>
        <div class="error hidden" id="err"></div>
        <button class="btn" id="go">Generate content</button>
      </div>
      <div id="out"></div>`;
    $('go').addEventListener('click', () => withButton($('go'), $('err'), async () => {
      const { content: c, source } = await api('/api/marketing', { brand: $('mb').value, product: $('mp').value, audience: $('ma').value });
      const ads = (c.adCopy || []).map((a, i) => `Ad ${i + 1}\nHeadline: ${a.headline}\n${a.body}`).join('\n\n');
      const block = (title, text) => `
        <div class="content-block">
          <h3>${title}<button class="btn secondary small" data-copy="${esc(text)}">Copy</button></h3>
          <pre>${esc(text)}</pre>
        </div>`;
      $('out').innerHTML = `
        <div class="panel">
          <div class="row" style="justify-content:space-between;margin-bottom:12px"><h2 style="margin:0">Your content</h2><span class="badge">${source === 'ai' ? 'AI generated' : 'Smart generator'}</span></div>
          ${block('LinkedIn post', c.linkedin)}
          ${block('Instagram caption', c.instagram)}
          ${block('Ad copy', ads)}
          ${block('Product description', c.product)}
        </div>`;
    }));
  };

  // ----- Sentiment -----
  views.sentiment = () => {
    view.innerHTML = `
      ${backBtn}
      <h1>Sentiment Analysis</h1>
      <p class="subtitle">Paste a review, comment or any text to see how it feels.</p>
      <div class="panel">
        <div class="field"><label for="st">Text to analyze</label><textarea id="st" placeholder="e.g. I love this product, the quality is amazing but delivery was slow."></textarea></div>
        <div class="error hidden" id="err"></div>
        <div class="row">
          <button class="btn" id="go">Analyze sentiment</button>
          <button class="btn secondary" id="sample" type="button">Try an example</button>
        </div>
      </div>
      <div id="out"></div>`;
    $('sample').addEventListener('click', () => {
      $('st').value = 'I absolutely love this brand! The packaging is beautiful and the team was very helpful. Delivery was a bit slow, but overall a fantastic experience.';
    });
    $('go').addEventListener('click', () => withButton($('go'), $('err'), async () => {
      const { result: r, source } = await api('/api/sentiment', { text: $('st').value });
      const cls = r.label === 'Positive' ? 'sent-pos' : r.label === 'Negative' ? 'sent-neg' : 'sent-neu';
      const bar = (name, pct, color) => `
        <div class="bar-row"><div class="name">${name}</div><div class="track"><div class="fill" style="width:${pct}%;background:${color}"></div></div><div class="pct">${pct}%</div></div>`;
      $('out').innerHTML = `
        <div class="panel">
          <div class="row" style="justify-content:space-between"><div class="sent-label ${cls}">Overall: ${esc(r.label)}</div><span class="badge">${source === 'ai' ? 'AI analysis' : 'Instant analysis'}</span></div>
          ${bar('Positive', r.positive, '#10b981')}
          ${bar('Negative', r.negative, '#ef4444')}
          ${bar('Neutral', r.neutral, '#9ca3af')}
          ${(r.positiveWords || []).length ? `<div style="margin-top:14px"><label>Positive signals</label><div class="chips">${r.positiveWords.map((w) => `<span class="chip pos">${esc(w)}</span>`).join('')}</div></div>` : ''}
          ${(r.negativeWords || []).length ? `<div style="margin-top:14px"><label>Negative signals</label><div class="chips">${r.negativeWords.map((w) => `<span class="chip neg">${esc(w)}</span>`).join('')}</div></div>` : ''}
        </div>`;
    }));
  };

  // ----- Chatbot -----
  const chat = [];
  views.chatbot = () => {
    view.innerHTML = `
      <h1>AI Chatbot</h1>
      <p class="subtitle">Ask anything about BrandCraft AI or building your brand.</p>
      <div class="panel chat-wrap" style="padding:12px 12px 16px">
        <div class="chat-log" id="log"></div>
        <div class="suggestions" id="sugg">
          ${['What can BrandCraft do?', 'How do I generate a logo?', 'How do I run this in VS Code?', 'Give me branding tips'].map((q) => `<button type="button" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>
        <div class="chat-input">
          <input type="text" id="msg" placeholder="Type your question..." autocomplete="off" />
          <button class="btn" id="send">Send</button>
        </div>
      </div>`;
    const log = $('log');
    const add = (role, text) => {
      const d = document.createElement('div');
      d.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
      d.textContent = text;
      log.appendChild(d); log.scrollTop = log.scrollHeight;
      return d;
    };
    if (!chat.length) chat.push({ role: 'assistant', content: "Hi! I'm the BrandCraft assistant. Ask me about any tool, how to set up the project, or for branding tips." });
    chat.forEach((m) => add(m.role, m.content));

    let busy = false;
    const send = async (text) => {
      text = (text || '').trim();
      if (!text || busy) return;
      busy = true;
      $('msg').value = '';
      add('user', text);
      const history = chat.slice();
      chat.push({ role: 'user', content: text });
      const typing = add('bot', 'Typing...');
      try {
        const { reply } = await api('/api/chat', { message: text, history });
        typing.textContent = reply;
        chat.push({ role: 'assistant', content: reply });
      } catch (e) {
        typing.textContent = 'Sorry, something went wrong: ' + e.message;
      }
      log.scrollTop = log.scrollHeight;
      busy = false;
    };
    $('send').addEventListener('click', () => send($('msg').value));
    $('msg').addEventListener('keydown', (e) => { if (e.key === 'Enter') send($('msg').value); });
    $('sugg').addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) send(b.dataset.q); });
    $('msg').focus();
  };

  // ---------- router ----------
  const NAV_FOR = { home: 'home', features: 'features', chatbot: 'chatbot' };
  function route() {
    const hash = (location.hash || '#home').slice(1);
    const [name, arg] = hash.split('?');
    const fn = views[name] || views.home;
    const key = views[name] ? name : 'home';
    const navKey = NAV_FOR[key] || (key === 'home' ? 'home' : 'dashboard');
    document.querySelectorAll('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === navKey));
    fn(arg ? decodeURIComponent(arg) : undefined);
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);

  // ---------- global click handling (buttons that work everywhere) ----------
  document.addEventListener('click', (e) => {
    const go = e.target.closest('[data-go]');
    if (go) { location.hash = '#' + go.dataset.go; return; }
    const cp = e.target.closest('[data-copy]');
    if (cp) { copy(cp.dataset.copy); return; }
    const lg = e.target.closest('[data-logo]');
    if (lg) { location.hash = '#logo?' + encodeURIComponent(lg.dataset.logo); return; }
    if (!e.target.closest('.user-menu')) $('userDropdown').classList.add('hidden');
  });

  // ---------- user menu ----------
  function paintUser() {
    if (!user) return;
    const initials = (user.name || user.email || 'U').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
    $('userName').textContent = user.name || user.email;
    $('userEmail').textContent = user.email || '';
    $('userAvatar').innerHTML = user.picture ? `<img src="${esc(user.picture)}" alt="" referrerpolicy="no-referrer" />` : esc(initials);
  }
  $('userBtn').addEventListener('click', (e) => { e.stopPropagation(); $('userDropdown').classList.toggle('hidden'); });
  $('logoutBtn').addEventListener('click', logout);

  paintUser();
  route();
  api('/api/me').then((d) => { user = d.user; localStorage.setItem('bc_user', JSON.stringify(user)); paintUser(); }).catch(() => {});
})();
