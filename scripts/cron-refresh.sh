#!/bin/bash
export PATH="/home/risingsun/.nvm/versions/node/v20.19.6/bin:/home/risingsun/.foundry/bin:$PATH"
cd /home/risingsun/projects/evmcp
npx tsx scripts/refresh-cache.ts
npx tsx scripts/refresh-celo.ts
