# BrandCraft AI

Smart branding system for startups and small businesses.

**Pages:** Login (Google or email + password) · Home · Features · Dashboard · Chatbot
**AI Brand Studio tools:** Brand Names · Logo Generator · Taglines · Marketing Content · Sentiment Analysis · AI Chatbot

## Run it in VS Code

1. Install Node.js 18 or newer from https://nodejs.org
2. Open this folder in VS Code (File > Open Folder).
3. Open the terminal (Ctrl + `) and run:

   ```bash
   npm install
   ```

4. Make your settings file. Copy `.env.example` to `.env`:

   ```bash
   cp .env.example .env        # Mac / Linux
   copy .env.example .env      # Windows
   ```

   Then open `.env` and change `JWT_SECRET` to any long random text.

5. Start the app:

   ```bash
   npm start
   ```

6. Open http://localhost:3000 and create an account.

Everything works right away with the built-in generators. The two options below are optional.

## Optional: smarter AI results

Put your Anthropic API key in `.env`:

```
ANTHROPIC_API_KEY=your-key-here
```

Restart the server. Brand names, taglines, marketing content, sentiment and the chatbot will then use Claude. If a call fails, the app falls back to the built-in generators automatically.

## Optional: "Continue with Google"

1. Go to https://console.cloud.google.com/apis/credentials
2. Create credentials > OAuth client ID > Web application.
3. Add `http://localhost:3000` under **Authorised JavaScript origins**.
4. Copy the client ID into `.env` as `GOOGLE_CLIENT_ID=...` and restart.

## What every button does

| Where | Buttons |
|---|---|
| Login | Continue with Google, Sign in / Create account, switch between the two |
| Navbar | Home, Features, Dashboard, Chatbot, your name (menu) > Sign out |
| Dashboard / Features | six cards, each opens its tool; every tool has Back to dashboard |
| Brand Names | Generate names, Copy, Make logo (opens Logo Generator with the name filled in) |
| Logo Generator | 5 style buttons, colour swatches (copy hex), Shuffle palette, Generate logo, SVG / PNG download, Generate new variation |
| Taglines | Generate taglines, Copy |
| Marketing Content | Generate content, Copy on each of LinkedIn / Instagram / Ad copy / Product description |
| Sentiment Analysis | Analyze sentiment, Try an example |
| Chatbot | Send (or Enter), four suggestion chips |

## Folder structure

```
brandcraft-ai/
├── server.js            Express server + all API routes
├── lib/
│   ├── ai.js            Claude API helper
│   ├── generators.js    Offline names, taglines, marketing, sentiment
│   └── knowledge.js     What the chatbot knows about the project
├── public/
│   ├── index.html       Redirects to login or app
│   ├── login.html       Google + email/password login
│   ├── app.html         Main app shell (navbar + page area)
│   ├── css/style.css
│   └── js/
│       ├── auth.js      Login page logic
│       └── app.js       Home, Features, Dashboard, all six tools
└── data/users.json      Created automatically (user accounts)
```

## Notes

- Accounts are stored in `data/users.json` with bcrypt-hashed passwords. That is fine for learning and demos; use a real database (PostgreSQL, MongoDB) before going to production.
- Logos are generated as SVG in the browser and can be downloaded as SVG or PNG.
- Press F5 in VS Code to start the server with the debugger (uses `.vscode/launch.json`).
- `npm run dev` restarts the server automatically when you edit a file.
- Troubleshooting: "Cannot find module" means run `npm install`; "port in use" means change `PORT` in `.env`; restart the server after every `.env` change.
