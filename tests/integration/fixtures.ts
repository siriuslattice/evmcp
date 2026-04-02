export const FIXTURES = {
  avalanche: {
    chain: "avalanche" as const,
    wavax: "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7" as `0x${string}`,
    wavaxName: "Wrapped AVAX",
    wavaxSymbol: "WAVAX",
    wavaxDecimals: 18,
    companionRegistry: "0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055" as `0x${string}`,
    multicall3: "0xcA11bde05977b3631167028862bE2a173976CA11" as `0x${string}`,
    knownBlock: 40_000_000,
  },
  celo: {
    chain: "celo" as const,
    cusd: "0x765DE816845861e75A25fCA122bb6898B8B1282a" as `0x${string}`,
    cusdName: "Mento Dollar",
    cusdSymbol: "USDm",
    cusdDecimals: 18,
    celoToken: "0x471EcE3750Da237f93B8E339c536989b8978a438" as `0x${string}`,
    companionRegistry: "0x62402b65bfb4Fd022285A6FC2F26d8caEEc3D055" as `0x${string}`,
    knownBlock: 20_000_000,
  },
};
