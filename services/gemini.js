import { extractJson } from '../lib/parseJson';
import { CATEGORY_KEYS } from '../lib/categories';
import { buildPrompt, SCHEMA_HINT_RETRY } from './ai-prompt';

const GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_API_VERSION = 'v1beta';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/${GEMINI_API_VERSION}/models/${GEMINI_MODEL}:generateContent`;

export async function scheduleTodos({ events, todos, energy }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Missing GEMINI_API_KEY in environment');

  const prompt = buildPrompt({ events, todos, energy });

  const text = await generate(prompt, apiKey);
  try {
    return validate(extractJson(text));
  } catch {
    const retry = await generate(
      `${prompt}\n\n${SCHEMA_HINT_RETRY}\n\nPrevious response:\n${text}`,
      apiKey
    );
    return validate(extractJson(retry));
  }
}

async function generate(prompt, apiKey) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30_000);
  let response;
  try {
    response = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey,
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new Error('Gemini request timed out (30s)');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Gemini ${response.status}: ${detail || response.statusText}`);
  }
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') ?? '';
  if (!text) throw new Error('Gemini returned no text content');
  return text;
}

function validate(parsed) {
  if (!parsed || !Array.isArray(parsed.todos)) {
    throw new Error('Invalid schedule shape: missing todos array');
  }
  for (const t of parsed.todos) {
    if (typeof t.task !== 'string' || typeof t.start_time !== 'string' || typeof t.end_time !== 'string') {
      throw new Error('Invalid schedule item: missing task/start_time/end_time');
    }
    if (t.category && !CATEGORY_KEYS.includes(t.category)) {
      t.category = 'personal';
    }
    if (typeof t.priority !== 'boolean') t.priority = !!t.priority;
  }
  return parsed;
}
