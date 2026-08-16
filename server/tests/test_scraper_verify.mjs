import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

import { enrichFromBio } from '../sdk/bioParser.js';
import { generateSyntheticCreators } from '../database/seedCreatorDatabase.js';

console.log('=== VERIFYING SCRAPER UPGRADES ===\n');

// Test 1: Curated creator email via bioParser
const curatedBio = 'Biggest BGMI channel in India | Pune, Maharashtra | business@dynamogaming.in | linktr.ee/dynamo_official';
const r1 = enrichFromBio({ bio: curatedBio, name: 'Dynamo Gaming', handle: '@dynamo_gaming' });
console.log('1️⃣  Curated creator (Dynamo Gaming):');
console.log(`   Email   : ${r1.email} [source: ${r1.emailSource}]`);
console.log(`   Niche   : ${r1.niche}`);
console.log(`   Location: ${r1.location}`);

// Test 2: Creator with no email in bio
const noemailBio = 'Just vibing from Mumbai. Fashion, lifestyle and fun.';
const r2 = enrichFromBio({ bio: noemailBio, name: 'Kritika Khurana', handle: '@thatbohogirl' });
console.log('\n2️⃣  Creator with no email in bio (Kritika Khurana):');
console.log(`   Email   : ${r2.email} [source: ${r2.emailSource}]`);
console.log(`   Niche   : ${r2.niche}`);
console.log(`   Location: ${r2.location}`);

// Test 3: Synthetic creators
console.log('\n3️⃣  Synthetic creator sample (5):');
const synth = generateSyntheticCreators(5, 0);
let allGood = true;
for (const c of synth) {
  const hasRealEmail = c.email && c.email.includes('@') && !c.email.includes('@handle.') && !c.email.startsWith('collabs@') && !c.email.startsWith('contact@');
  const hasNoUnsplash = !c.avatar.includes('unsplash');
  const hasUiAvatar = c.avatar.includes('ui-avatars.com');
  const ok = hasRealEmail && hasNoUnsplash && hasUiAvatar;
  if (!ok) allGood = false;
  const icon = ok ? 'OK' : 'FAIL';
  console.log(`   [${icon}] ${c.name}`);
  console.log(`         email  : ${c.email}`);
  console.log(`         niche  : ${c.niche}`);
  console.log(`         avatar : ${c.avatar.substring(0, 70)}...`);
}

console.log('\n=== RESULTS ===');
const noUnsplash = synth.every(c => !c.avatar.includes('unsplash'));
const allUiAvatars = synth.every(c => c.avatar.includes('ui-avatars.com'));
const allEmails = synth.every(c => c.email && c.email.includes('@'));
console.log(`${noUnsplash ? 'PASS' : 'FAIL'} - No Unsplash stock photos`);
console.log(`${allUiAvatars ? 'PASS' : 'FAIL'} - All avatars use ui-avatars.com`);
console.log(`${allEmails ? 'PASS' : 'FAIL'} - All creators have valid emails`);
console.log(`${allGood ? 'PASS' : 'FAIL'} - All 5 synthetic creators passed checks`);
console.log(allGood ? '\nAll checks passed! Ready to commit.' : '\nSome checks failed — review above.');
