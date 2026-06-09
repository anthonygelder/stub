import '../config'; // loads dotenv
import { enrichEvents } from '../services/enrichment.service';

async function main() {
  console.log('Starting catalog enrichment...');
  const result = await enrichEvents();
  console.log(`Enrichment complete: ${result.attempted} attempted, ${result.enriched} promoted, ${result.merged} merged`);
  process.exit(0);
}

main().catch(err => { console.error('Enrichment failed:', err); process.exit(1); });
