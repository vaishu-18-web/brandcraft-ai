// Thin wrapper around the Anthropic Messages API (no SDK needed, Node 18+).
// If ANTHROPIC_API_KEY is not set, aiEnabled() is false and callers use offline generators.

const aiEnabled = () => Boolean(process.env.ANTHROPIC_API_KEY);

async function askClaude(system, messages, maxTokens = 1200) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
      max_tokens: maxTokens,
      system,
      messages,
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${t.slice(0, 200)}`);
  }
  const data = await res.json();
  return (data.content || []).map((b) => b.text || '').join('').trim();
}

// Ask for JSON and parse it safely.
async function askClaudeJSON(system, prompt, maxTokens = 1200) {
  const text = await askClaude(
    system + '\nRespond with valid JSON only. No markdown fences, no commentary.',
    [{ role: 'user', content: prompt }],
    maxTokens
  );
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const start = cleaned.search(/[\[{]/);
  const end = Math.max(cleaned.lastIndexOf(']'), cleaned.lastIndexOf('}'));
  return JSON.parse(cleaned.slice(start, end + 1));
}

module.exports = { aiEnabled, askClaude, askClaudeJSON };
