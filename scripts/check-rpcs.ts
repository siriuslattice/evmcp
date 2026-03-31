import "dotenv/config";
import { loadConfig } from "../src/config.js";
import { createProviders } from "../src/providers/multi-chain.js";

async function main() {
  const config = loadConfig();
  const providers = createProviders(config);

  process.stderr.write("Checking RPC connections...\n");

  const results = await providers.healthCheck();

  for (const [chain, healthy] of Object.entries(results)) {
    const status = healthy ? "OK" : "FAILED";
    process.stderr.write(`  ${chain}: ${status}\n`);
  }

  const allHealthy = Object.values(results).every(Boolean);
  if (!allHealthy) {
    process.stderr.write("\nSome RPC connections failed. Check your .env configuration.\n");
    process.exit(1);
  }

  process.stderr.write("\nAll RPC connections healthy.\n");
}

main().catch((error) => {
  process.stderr.write(`Fatal error: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
