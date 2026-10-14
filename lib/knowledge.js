// Everything the chatbot knows about the project.
// Used as the system prompt when AI is enabled, and for keyword answers when it is not.

const PROJECT_SUMMARY = `
BrandCraft AI is a smart branding system for startups and small businesses.
Pages: Login (Google sign-in or email + password), Home, Features, Dashboard, Chatbot.
The Dashboard is called "AI Brand Studio" and has six tools:
1. Brand Names - inputs: business type and optional keywords. Generates unique brand name ideas. Each result can be copied or sent straight to the logo generator.
2. Logo Generator - inputs: brand name and logo style (Modern and clean, Minimal and simple, Luxury and elegant, Playful and fun, Bold and strong). Shows a suggested colour palette (click a colour to copy it, "Shuffle palette" for another) and generates three SVG logo layouts. Each logo downloads as SVG or PNG.
3. Taglines - input: brand name and idea. Generates catchy taglines that can be copied.
4. Marketing Content - inputs: brand name, what you sell, optional audience. Generates a LinkedIn post, Instagram caption, ad copy variations and a product description, each with a Copy button.
5. Sentiment Analysis - analyses text and shows Positive, Negative and Neutral percentages plus the key words behind the result. Has a "Try an example" button.
6. AI Chatbot - brand building assistant that answers questions about the project and about branding.
Tech: Node.js + Express backend, plain HTML/CSS/JavaScript frontend, JWT login, bcrypt password hashing, optional Google Sign-In, optional Claude API for smarter results (offline generators are used otherwise). Accounts are stored in data/users.json.
Run it: npm install, copy .env.example to .env, npm start, open http://localhost:3000.
`;

const FAQ = [
  // ----- about the project -----
  { k: ['what is brandcraft', 'what is this', 'about the project', 'overview', 'what can brandcraft', 'what does brandcraft', 'what can you do', 'about brandcraft', 'project'], a: 'BrandCraft AI is a smart branding system for startups and small businesses. In one dashboard (the AI Brand Studio) you can generate brand names, create logos, write taglines, produce marketing content, analyse sentiment and chat with me for branding help.' },
  { k: ['feature', 'tools', 'studio', 'dashboard', 'what can i do'], a: 'The AI Brand Studio has six tools: Brand Names, Logo Generator, Taglines, Marketing Content, Sentiment Analysis and the AI Chatbot. Open the Dashboard and click any card to start. Every tool has a "Back to dashboard" button.' },
  { k: ['brand name', 'name generator', 'generate name', 'business type', 'keywords'], a: 'Brand Names: enter your business type (for example "organic coffee shop") and optional keywords, then click Generate names. You get 12 ideas with a short reason for each. Use Copy to save a name, or "Make logo" to jump straight to the Logo Generator with that name filled in.' },
  { k: ['logo generator', 'make a logo', 'generate a logo', 'generate logo', 'create a logo', 'logo style', 'download logo', 'svg', 'png'], a: 'Logo Generator: enter your brand name, pick a style (Modern and clean, Minimal and simple, Luxury and elegant, Playful and fun or Bold and strong) and click Generate logo. You get three layouts with a matching colour palette. Press SVG or PNG under a logo to download it, or "Generate new variation" for fresh colours.' },
  { k: ['palette', 'colour palette', 'color palette', 'swatch', 'hex'], a: 'The Suggested color palette updates when you change the logo style. Click any colour to copy its hex code, or press "Shuffle palette" to try another set. The logos use whichever palette is showing.' },
  { k: ['tagline generator', 'taglines', 'tagline', 'slogan'], a: 'Taglines: type your brand name and idea (for example "Brewly - fresh organic coffee delivered"), click Generate taglines and copy your favourites. Click again for a new set.' },
  { k: ['marketing content', 'marketing', 'linkedin', 'instagram', 'ad copy', 'product description', 'social media'], a: 'Marketing Content: enter your brand, what you sell and (optionally) your audience. You get a LinkedIn post, an Instagram caption, three ad copy variations and a product description. Each block has its own Copy button.' },
  { k: ['sentiment', 'positive', 'negative', 'neutral', 'analyze', 'analyse', 'review'], a: 'Sentiment Analysis: paste any text (like a customer review) and click Analyze sentiment. You see Positive, Negative and Neutral percentages plus the words that drove the result. Not sure what to type? Press "Try an example".' },
  { k: ['chatbot', 'chat bot', 'assistant', 'who are you', 'what are you'], a: 'I am the BrandCraft assistant. Ask me how any tool works, how to set up the project, or for practical branding advice for a startup or small business.' },

  // ----- accounts -----
  { k: ['google login', 'google sign', 'sign in with google', 'continue with google', 'client id', 'google client'], a: 'Google sign-in needs a GOOGLE_CLIENT_ID in your .env file. Create an OAuth client ID (Web application) at console.cloud.google.com/apis/credentials, add http://localhost:3000 as an Authorised JavaScript origin, paste the ID into .env and restart. Until then, use email and password.' },
  { k: ['login', 'log in', 'sign in', 'signin', 'sign up', 'signup', 'register', 'create account', 'account', 'password', 'logout', 'log out', 'sign out'], a: 'On the login page you can continue with Google or use email and password. New here? Click "Create account". To leave, open your name in the top-right corner and choose Sign out.' },
  { k: ['secure', 'security', 'safe', 'privacy', 'data stored', 'where is my data', 'database'], a: 'Passwords are hashed with bcrypt and sessions use signed JWT tokens. Accounts are saved in data/users.json on your own computer. For a real production launch, move to a proper database such as PostgreSQL or MongoDB.' },

  // ----- setup / running -----
  { k: ['install', 'run this', 'run it', 'setup', 'set up', 'vs code', 'vscode', 'npm install', 'npm start', 'start the', 'localhost'], a: 'In VS Code: open the project folder, open the terminal (Ctrl + `), run "npm install", copy .env.example to .env, run "npm start", then open http://localhost:3000. You need Node.js 18 or newer.' },
  { k: ['api key', 'anthropic', 'claude', 'smarter', 'ai powered', 'real ai', 'offline'], a: 'Add ANTHROPIC_API_KEY to your .env file (and restart) to get smarter AI results for names, taglines, marketing, sentiment and chat. Without it the app uses built-in offline generators, so every button still works.' },
  { k: ['tech stack', 'technology', 'built with', 'what language', 'node', 'express', 'framework', 'html', 'javascript'], a: 'Backend: Node.js + Express with JWT login and bcrypt. Frontend: plain HTML, CSS and JavaScript (no build step). Optional: Google Sign-In and the Claude API.' },
  { k: ['error', 'not working', 'doesnt work', "doesn't work", 'fix', 'problem', 'port', 'eaddrinuse', 'cannot find module', 'broken'], a: 'Common fixes: (1) "Cannot find module" - run "npm install". (2) "Port already in use" - change PORT in .env or stop the other program. (3) Signed out suddenly - JWT_SECRET changed, just sign in again. (4) Google button says not set up - add GOOGLE_CLIENT_ID to .env. Restart the server after editing .env.' },
  { k: ['deploy', 'host', 'publish', 'go live', 'production', 'online'], a: 'To put it online, deploy the folder to a Node host (Render, Railway, Fly.io). Set JWT_SECRET, optionally ANTHROPIC_API_KEY and GOOGLE_CLIENT_ID as environment variables, and add your live URL to the Google "Authorised JavaScript origins". Switch users.json to a real database first.' },
  { k: ['price', 'pricing', 'cost', 'free', 'how much'], a: 'BrandCraft AI runs on your own computer and is free to use. The only optional cost is the Anthropic API if you add a key for smarter results.' },

  // ----- branding advice -----
  { k: ['choose a name', 'good brand name', 'pick a name', 'good name', 'name my', 'naming', 'how to name', 'choose a brand', 'brand name tips', 'name tips'], a: 'A good brand name is short (ideally 2 syllables), easy to spell and say, distinctive, and not tied to one product. Check that the domain and social handles are free and that it has no bad meaning in other languages. Try the Brand Names tool, shortlist 3, and test them on 5 people without explaining them.' },
  { k: ['colour psychology', 'color psychology', 'what colour', 'what color', 'which color', 'which colour', 'color meaning', 'colour meaning', 'brand color', 'brand colour'], a: 'Blue feels trustworthy (finance, tech), green suggests growth and health, red is energetic and urgent, yellow is optimistic, black and gold feel premium, purple feels creative. Pick one main colour, one accent and one neutral, and use them everywhere.' },
  { k: ['logo tip', 'good logo', 'logo advice', 'design a logo', 'logo design', 'logo mistakes'], a: 'A strong logo is simple, readable at small sizes (like a phone app icon), works in one colour and is not trendy for its own sake. Use at most two colours and one typeface. Download both SVG (for print/web) and PNG (for social media).' },
  { k: ['good tagline', 'tagline tip', 'write a tagline', 'slogan tip', 'tagline advice'], a: 'A good tagline is under 8 words, promises one clear benefit, and sounds like a real person. Avoid buzzwords like "innovative" or "world-class". Read it aloud - if it is hard to say, shorten it.' },
  { k: ['brand voice', 'tone of voice', 'tone', 'voice'], a: 'Define your brand voice with three adjectives (for example "friendly, clear, confident") and write a "we say / we never say" list. Use the same voice in your website, posts and ads so people recognise you.' },
  { k: ['what is branding', 'what is a brand', 'why branding', 'why is branding', 'branding mean', 'brand identity', 'brand strategy'], a: 'Your brand is the promise people associate with your business: your name, logo, colours, voice and the experience you deliver. Strong branding makes you easy to remember, builds trust and lets you charge more than a generic competitor.' },
  { k: ['startup', 'small business', 'branding tips', 'branding advice', 'branding checklist', 'how to build a brand', 'build my brand', 'tip', 'advice', 'checklist'], a: 'Startup branding checklist: 1) pick a short, available name; 2) write a one-line promise (your tagline); 3) choose 2-3 consistent colours and one font; 4) make a simple logo in SVG and PNG; 5) set your voice; 6) post consistently on 1-2 channels. All of this is doable in the BrandCraft dashboard.' },
  { k: ['social media', 'post often', 'content plan', 'content ideas', 'instagram tip', 'linkedin tip', 'grow audience', 'get customers', 'marketing tip', 'marketing advice'], a: 'Pick one or two channels where your customers already are (LinkedIn for B2B, Instagram for consumer brands). Post 3 times a week: one story about your customers, one tip, one product moment. Use the Marketing Content tool to draft posts, then add your own details.' },
  { k: ['competitor', 'stand out', 'differentiate', 'unique', 'usp'], a: 'To stand out, finish this sentence: "We are the only ___ that ___." Focus on one specific audience and one clear advantage, then repeat it in your tagline, website headline and posts.' },
  { k: ['target audience', 'customer persona', 'who is my customer', 'ideal customer', 'audience'], a: 'Describe one real person: their age, job, problem and where they spend time online. Write your marketing to that one person. In the Marketing Content tool, put that description into the "Target audience" box.' },

  // ----- small talk -----
  { k: ['thank', 'thanks', 'thx'], a: "You're welcome! Anything else you'd like to know about BrandCraft or building your brand?" },
  { k: ['bye', 'goodbye', 'see you'], a: 'Goodbye! Come back any time you need a name, a logo or a tagline.' },
  { k: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon'], a: 'Hi! I am the BrandCraft assistant. Ask me about any tool, how to set up the project, or for branding tips.' },
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function scoreEntry(q, item) {
  let score = 0;
  for (const k of item.k) {
    // short keys must match a whole word ("hi" must not match "high"); longer keys match as a word prefix
    const re = new RegExp('\\b' + esc(k) + (k.length <= 3 ? '\\b' : ''), 'i');
    if (re.test(q)) score += k.length;
  }
  return score;
}

function offlineAnswer(question) {
  const q = ' ' + (question || '').toLowerCase().replace(/[^a-z0-9'\s]/g, ' ') + ' ';
  let best = null;
  let bestScore = 0;
  for (const item of FAQ) {
    const score = scoreEntry(q, item);
    if (score > bestScore) { best = item; bestScore = score; }
  }
  if (best) return best.a;
  return 'I can help with anything about BrandCraft AI (the Brand Names, Logo, Tagline, Marketing and Sentiment tools, login, setup) and with branding advice for startups. Try asking "How do I choose a good brand name?", "What can the logo generator do?" or "How do I run this in VS Code?"';
}

module.exports = { PROJECT_SUMMARY, offlineAnswer };
