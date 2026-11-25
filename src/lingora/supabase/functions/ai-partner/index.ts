// Lingora AI conversation partner: short role-play replies in the course language,
// with one gentle correction of the learner's last message.
// Needs the secret ANTHROPIC_API_KEY (set it in Supabase → Edge Functions → Secrets).
import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const FREE_PER_DAY = 10;
const PLUS_PER_DAY = 150;
const MODEL = 'claude-opus-5-5';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

type Turn = { role: 'user' | 'assistant'; content: string };
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const replySchema = {
  type: 'object',
  properties: {
    reply: { type: 'string', description: 'Your in-character answer in the target language.' },
    correction: { type: ['string', 'null'], description: 'Corrected version of the learner\'s last message, or null if it was correct.' },
    explanation: { type: ['string', 'null'], description: 'One short explanation of the correction in the explanation language, or null.' },
    translation: { type: 'string', description: 'Translation of your reply into the explanation language.' },
  },
  required: ['reply', 'correction', 'explanation', 'translation'],
  additionalProperties: false,
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'not_configured' }, 503);

  const auth = request.headers.get('Authorization') ?? '';
  const url = Deno.env.get('SUPABASE_URL')!;
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: auth } } });
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return json({ error: 'sign_in' }, 401);
  if (user.is_anonymous) return json({ error: 'account_needed' }, 403);

  let body: { language?: string; level?: string; scenario?: string; uiLanguage?: string; messages?: Turn[] };
  try { body = await request.json(); } catch { return json({ error: 'bad_request' }, 400); }
  const language = String(body.language ?? '').slice(0, 40);
  const level = LEVELS.includes(String(body.level)) ? String(body.level) : 'A2';
  const scenario = String(body.scenario ?? '').slice(0, 300);
  const explainIn = body.uiLanguage === 'de' ? 'German' : 'English';
  const history = (Array.isArray(body.messages) ? body.messages : [])
    .filter((turn) => (turn.role === 'user' || turn.role === 'assistant') && typeof turn.content === 'string')
    .slice(-12)
    .map((turn) => ({ role: turn.role, content: turn.content.slice(0, 1000) }));
  if (!language || !scenario || history.length === 0 || history[history.length - 1].role !== 'user') {
    return json({ error: 'bad_request' }, 400);
  }

  // Daily limit: generous for Plus, a free taste for everyone else.
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: plus } = await admin.from('plus_members').select('expires_at').eq('user_id', user.id).maybeSingle();
  const isPlus = !!plus && (!plus.expires_at || new Date(plus.expires_at).getTime() > Date.now());
  const { data: used, error: usageError } = await admin.rpc('ai_usage_bump', { p_user: user.id, p_limit: isPlus ? PLUS_PER_DAY : FREE_PER_DAY });
  if (usageError) return json({ error: 'server' }, 500);
  if (used === -1) return json({ error: 'limit', plus: isPlus, limit: isPlus ? PLUS_PER_DAY : FREE_PER_DAY }, 429);

  const system = `You are a friendly conversation partner in a language-learning app.
Role-play this situation with the learner: ${scenario}
Speak only ${language} in "reply", at CEFR level ${level}: short sentences and common words for A1–A2, natural speech for B1 and above.
Keep "reply" to at most three sentences and end with a question or prompt so the conversation continues.
Stay in the role. If the learner writes in another language, answer in ${language} and encourage them to try in ${language}.
Look at the learner's last message: if it has mistakes in ${language}, put the corrected sentence in "correction" and one short, kind explanation in ${explainIn} in "explanation"; otherwise set both to null.
Translate your reply into ${explainIn} in "translation".
Keep everything suitable for all ages and never ask for personal data such as addresses or phone numbers.`;

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: history,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: replySchema } },
    });
    if (response.stop_reason === 'refusal') return json({ error: 'refused' }, 422);
    const text = response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('');
    const parsed = JSON.parse(text);
    return json({ ...parsed, remaining: Math.max(0, (isPlus ? PLUS_PER_DAY : FREE_PER_DAY) - used), plus: isPlus });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'busy' }, 503);
    if (error instanceof Anthropic.APIError) return json({ error: 'ai_error' }, 502);
    return json({ error: 'server' }, 500);
  }
});
