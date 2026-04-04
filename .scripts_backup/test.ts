import { runScraper } from '../src/lib/scraper';

async function main() {
  try {
    const res = await runScraper();
    console.log("Scraper result:", res);
  } catch (error) {
    console.error("Scraper error:", error);
  }
}

main();
