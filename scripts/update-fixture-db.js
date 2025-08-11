#!/usr/bin/env node

// Script to fetch all English football fixtures and write to public/fixtures-database.json
import { writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use ESM imports for your code
(async () => {
  try {
    const { fetchAllEnglishFixtures } = await import('../src/utils/fixtureApi.js');
    const { processFixtures } = await import('../src/services/fixtureDatabase.js');

    console.log('Fetching all English football fixtures from API...');
    const apiData = await fetchAllEnglishFixtures();
    console.log(`Fetched ${apiData.allFixtures.length} fixtures.`);

    console.log('Processing fixtures and matching with stadium database...');
    const processed = processFixtures(apiData);

    const output = {
      lastUpdated: new Date().toISOString(),
      fixtures: processed.fixtures,
      metadata: processed.stats
    };

    const outPath = path.join(__dirname, '../public/fixtures-database.json');
    await writeFile(outPath, JSON.stringify(output, null, 2));
    console.log(`✅ Fixture database written to ${outPath}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating fixture database:', error);
    process.exit(1);
  }
})(); 