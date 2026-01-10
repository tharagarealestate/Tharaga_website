#!/usr/bin/env node
/**
 * Continuous Property Fetching Script
 * Runs fetch-properties-zenrows.mjs multiple times until API quota is exhausted
 * Uses advanced reasoning to maximize property extraction
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let totalPropertiesFetched = 0;
let runCount = 0;
let quotaExhausted = false;
let consecutiveFailures = 0;
const maxConsecutiveFailures = 3;

async function runFetchScript(runNumber) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔄 Run #${runNumber} - Starting property fetch...`);
    console.log(`${'='.repeat(60)}\n`);

    const scriptPath = join(__dirname, 'fetch-properties-zenrows.mjs');
    const child = spawn('node', [scriptPath], {
      cwd: __dirname,
      stdio: 'inherit',
      shell: true
    });

    let output = '';
    
    child.stdout?.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      // Check for quota exhaustion
      if (text.includes('402') || text.includes('Usage limit') || text.includes('quota')) {
        quotaExhausted = true;
      }
      
      // Check for successful sync
      if (text.includes('Synced:') || text.includes('successful')) {
        totalPropertiesFetched++;
      }
    });

    child.stderr?.on('data', (data) => {
      const text = data.toString();
      output += text;
      
      if (text.includes('402') || text.includes('Usage limit') || text.includes('quota')) {
        quotaExhausted = true;
      }
    });

    child.on('close', (code) => {
      console.log(`\n📊 Run #${runNumber} completed with exit code: ${code}`);
      
      if (quotaExhausted) {
        console.log('⚠️  API quota exhausted detected!');
        resolve({ success: false, quotaExhausted: true });
      } else if (code === 0) {
        console.log('✅ Run completed successfully');
        consecutiveFailures = 0;
        resolve({ success: true, quotaExhausted: false });
      } else {
        consecutiveFailures++;
        console.log(`⚠️  Run failed (consecutive failures: ${consecutiveFailures}/${maxConsecutiveFailures})`);
        resolve({ success: false, quotaExhausted: false });
      }
    });
  });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('🚀 Starting Continuous Property Fetching');
  console.log('📊 Goal: Maximize property extraction until API quota exhausted\n');
  
  const startTime = Date.now();
  
  while (!quotaExhausted && consecutiveFailures < maxConsecutiveFailures) {
    runCount++;
    
    const result = await runFetchScript(runCount);
    
    if (result.quotaExhausted) {
      console.log('\n🛑 API Quota Exhausted - Stopping continuous fetching');
      break;
    }
    
    if (!result.success) {
      if (consecutiveFailures >= maxConsecutiveFailures) {
        console.log(`\n🛑 Too many consecutive failures (${consecutiveFailures}) - Stopping`);
        break;
      }
    }
    
    // Wait before next run (3-5 seconds to avoid rate limits)
    if (!quotaExhausted) {
      const delay = 3000 + Math.random() * 2000; // 3-5 seconds
      console.log(`\n⏳ Waiting ${(delay / 1000).toFixed(1)} seconds before next run...`);
      await sleep(delay);
    }
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000 / 60).toFixed(2);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 FINAL SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Runs: ${runCount}`);
  console.log(`Total Properties Fetched: ${totalPropertiesFetched}`);
  console.log(`Duration: ${duration} minutes`);
  console.log(`Status: ${quotaExhausted ? 'Quota Exhausted' : 'Completed'}`);
  console.log(`${'='.repeat(60)}\n`);
}

main().catch(console.error);











