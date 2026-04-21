/**
 * One-time script to recompress all existing images in Supabase storage.
 * Re-uploads to the same filename (upsert) so all existing URLs stay valid.
 * No images are deleted.
 *
 * Usage:
 *   node --env-file=.env.local scripts/compress-images.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const BUCKET = 'graffiti-images';
const MAX_DIMENSION = 800;
const WEBP_QUALITY = 65;
const PAGE_SIZE = 100;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
  console.error('Run with: node --env-file=.env.local scripts/compress-images.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function listAllFiles() {
  const files = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: PAGE_SIZE, offset });
    if (error) throw new Error(`Failed to list files: ${error.message}`);
    if (!data || data.length === 0) break;
    files.push(...data.filter(f => f.name)); // exclude folder placeholders
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return files;
}

async function processFile(file) {
  const { data: blob, error: dlError } = await supabase.storage
    .from(BUCKET)
    .download(file.name);
  if (dlError) throw new Error(`Download failed: ${dlError.message}`);

  const originalBuffer = Buffer.from(await blob.arrayBuffer());
  const originalBytes = originalBuffer.length;

  const compressed = await sharp(originalBuffer)
    .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  const compressedBytes = compressed.length;

  // Only re-upload if we actually made it smaller
  if (compressedBytes >= originalBytes) {
    console.log(`  skipped  ${file.name} — already small enough (${fmt(originalBytes)})`);
    return { skipped: true, saved: 0 };
  }

  const { error: upError } = await supabase.storage
    .from(BUCKET)
    .upload(file.name, compressed, { contentType: 'image/webp', upsert: true });
  if (upError) throw new Error(`Upload failed: ${upError.message}`);

  const saved = originalBytes - compressedBytes;
  console.log(`  compressed ${file.name}: ${fmt(originalBytes)} → ${fmt(compressedBytes)} (saved ${fmt(saved)})`);
  return { skipped: false, saved };
}

function fmt(bytes) {
  return bytes > 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`;
}

async function main() {
  console.log(`Listing files in bucket "${BUCKET}"...`);
  const files = await listAllFiles();
  console.log(`Found ${files.length} file(s).\n`);

  if (files.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let totalSaved = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    try {
      const result = await processFile(file);
      if (result.skipped) skipped++;
      else totalSaved += result.saved;
    } catch (err) {
      console.error(`  ERROR ${file.name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone.`);
  console.log(`  Compressed: ${files.length - skipped - failed} file(s), saved ${fmt(totalSaved)}`);
  if (skipped) console.log(`  Skipped (already small): ${skipped}`);
  if (failed) console.log(`  Failed: ${failed}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
