import { runScraper } from '../src/lib/scraper';

runScraper()
  .then((res) => {
    console.log("SUCCESS:", res);
    process.exit(0);
  })
  .catch((err) => {
    console.error("FAILED:", err);
    process.exit(1);
  });
