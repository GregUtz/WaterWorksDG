import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const SPREADSHEET_ID = '1oCMTdCbgs93lBp6-4-KCucyrlVXxTCQIg5Da-u1cg9s';
const SHEET = 'WW2026';
const syncedAt = process.argv[2];

if (!/^\d{4}-\d{2}-\d{2}$/.test(syncedAt || '')) {
  throw new Error('Usage: node tools/sync-2026-leaderboard.mjs YYYY-MM-DD');
}

const csvUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(SHEET)}`;
const response = await fetch(csvUrl);

if (!response.ok) {
  throw new Error(`Google Sheets export failed: ${response.status} ${response.statusText}`);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];

    if (quoted) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      row.push(cell);
      cell = '';
    } else if (char === '\n') {
      row.push(cell.replace(/\r$/, ''));
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell.replace(/\r$/, ''));
    rows.push(row);
  }

  return rows;
}

function parseScore(value) {
  const normalized = value.trim();
  if (!normalized || normalized === '*') return null;
  if (normalized.toUpperCase() === 'DNF') return 'DNF';

  const score = Number(normalized);
  return Number.isFinite(score) ? score : null;
}

const csv = parseCsv(await response.text());
const dates = csv[0].slice(3);
const players = [];

for (const row of csv.slice(1)) {
  const name = (row[0] || '').trim();
  if (!name) break;

  const scores = dates.map((_, index) => parseScore(row[index + 3] || ''));
  const scoredRounds = scores.filter((score) => typeof score === 'number');
  const weeks = scores.filter((score) => score !== null).length;
  const average = scoredRounds.length
    ? Math.round((scoredRounds.reduce((sum, score) => sum + score, 0) / scoredRounds.length) * 10) / 10
    : null;

  players.push({ name, weeks, average, scores });
}

const snapshot = {
  spreadsheetId: SPREADSHEET_ID,
  sheet: SHEET,
  syncedAt,
  dates,
  players,
};

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.resolve(scriptDirectory, '..', 'scripts', 'leaderboard-2026-data.js');
await writeFile(outputPath, `window.WW_LEADERBOARD_2026 = ${JSON.stringify(snapshot)};\n`, 'utf8');

console.log(`Wrote ${players.length} players across ${dates.length} dates to ${outputPath}`);
