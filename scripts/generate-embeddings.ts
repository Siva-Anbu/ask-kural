/**
 * One-time embedding generation script.
 *
 * Usage:
 *   npm run generate-embeddings
 *   # or: npx tsx scripts/generate-embeddings.ts
 *
 * Required env vars (set in .env.local or export before running):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local from the project root (one level up from scripts/)
config({ path: resolve(__dirname, '..', '.env.local') });
config({ path: resolve(__dirname, '..', '.env') }); // fallback
import { createClient } from '@supabase/supabase-js';
import { pipeline, env } from '@xenova/transformers';

// Cache models in project-local directory to avoid repeated downloads
env.cacheDir = './.cache/transformers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface KuralRow {
  Number: number;
  Line1: string | null;
  Line2: string | null;
  Translation: string | null;
  mv: string | null;
  sp: string | null;
  mk: string | null;
  explanation: string | null;
  couplet: string | null;
  embedding: number[] | null;
}

interface QuestionareRow {
  id: number;
  Situation: string | null;
  embedding: number[] | null;
}

// ---------------------------------------------------------------------------
// Pipeline (cached)
// ---------------------------------------------------------------------------

type EmbeddingPipeline = Awaited<ReturnType<typeof pipeline>>;
let _pipe: EmbeddingPipeline | null = null;

async function getPipeline(): Promise<EmbeddingPipeline> {
  if (!_pipe) {
    console.log('Loading Supabase/gte-small model (first run downloads ~30 MB)…');
    _pipe = await pipeline('feature-extraction', 'Supabase/gte-small');
    console.log('Model ready.\n');
  }
  return _pipe;
}

async function embed(text: string): Promise<number[]> {
  const pipe = await getPipeline();
  const output = await pipe(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data as Float32Array);
}

// ---------------------------------------------------------------------------
// Kural embeddings
// ---------------------------------------------------------------------------

function kuralToText(row: KuralRow): string {
  return [row.Translation, row.explanation, row.mv, row.sp, row.mk, row.couplet]
    .filter(Boolean)
    .join(' ')
    .trim();
}

async function fetchAllKurals(): Promise<KuralRow[]> {
  const PAGE = 500;
  const all: KuralRow[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('Kurals-new')
      .select('Number, Line1, Line2, Translation, mv, sp, mk, explanation, couplet, embedding')
      .order('Number')
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`Fetch failed at range ${from}: ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...(data as KuralRow[]));
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function generateKuralEmbeddings(batchSize = 50): Promise<void> {
  console.log('=== Kural embeddings ===');

  const data = await fetchAllKurals();
  const pending = data.filter(r => !r.embedding);
  console.log(`Rows: ${data.length} total, ${pending.length} need embedding.\n`);

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const batchTotal = Math.ceil(pending.length / batchSize);
    process.stdout.write(`Batch ${batchNum}/${batchTotal}: `);

    for (const row of batch) {
      const text = kuralToText(row);
      if (!text) {
        process.stdout.write('_');
        continue;
      }
      try {
        const embedding = await embed(text);
        const { error: upErr } = await supabase
          .from('Kurals-new')
          .update({ embedding })
          .eq('Number', row.Number);
        process.stdout.write(upErr ? 'E' : '.');
        if (upErr) console.error(`\n  Kural ${row.Number}: ${upErr.message}`);
      } catch (err) {
        process.stdout.write('E');
        console.error(`\n  Kural ${row.Number}:`, err);
      }
    }
    console.log(' done');
  }

  console.log('Kural embeddings complete.\n');
}

// ---------------------------------------------------------------------------
// Questionare embeddings
// ---------------------------------------------------------------------------

async function generateQuestionareEmbeddings(batchSize = 20): Promise<void> {
  console.log('=== Questionare embeddings ===');

  const { data, error } = await supabase
    .from('Questionare')
    .select('id, Situation, embedding')
    .order('id');

  if (error || !data) {
    console.error('Failed to fetch Questionare:', error?.message);
    return;
  }

  const pending = (data as QuestionareRow[]).filter(r => !r.embedding);
  console.log(`Rows: ${data.length} total, ${pending.length} need embedding.\n`);

  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const batchTotal = Math.ceil(pending.length / batchSize);
    process.stdout.write(`Batch ${batchNum}/${batchTotal}: `);

    for (const row of batch) {
      const text = (row.Situation ?? '').trim();
      if (!text) {
        process.stdout.write('_');
        continue;
      }
      try {
        const embedding = await embed(text);
        const { error: upErr } = await supabase
          .from('Questionare')
          .update({ embedding })
          .eq('id', row.id);
        process.stdout.write(upErr ? 'E' : '.');
        if (upErr) console.error(`\n  Questionare id ${row.id}: ${upErr.message}`);
      } catch (err) {
        process.stdout.write('E');
        console.error(`\n  Questionare id ${row.id}:`, err);
      }
    }
    console.log(' done');
  }

  console.log('Questionare embeddings complete.\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      'Missing env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Tip: copy .env.local values before running, or prefix the command:\n' +
      '  env $(cat .env.local | grep -v ^#) npx tsx scripts/generate-embeddings.ts'
    );
    process.exit(1);
  }

  await generateKuralEmbeddings();
  await generateQuestionareEmbeddings();
  console.log('All done!');
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
