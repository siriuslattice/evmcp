import { formatEther, formatUnits, getAddress, type Address } from "viem";

/** Format wei to ether string with full precision */
export function weiToEther(wei: bigint): string {
  return formatEther(wei);
}

/** Format raw token amount using token's decimals */
export function formatTokenAmount(amount: bigint, decimals: number): string {
  return formatUnits(amount, decimals);
}

/** Checksum an address — throws if invalid */
export function checksumAddress(address: string): Address {
  return getAddress(address);
}

/** Convert hex string to decimal string */
export function hexToDecimal(hex: string): string {
  return BigInt(hex).toString(10);
}

/** Get native token symbol for a chain */
export function nativeSymbol(chain: string): string {
  switch (chain) {
    case "avalanche":
      return "AVAX";
    case "celo":
      return "CELO";
    default:
      return "ETH";
  }
}

/** Truncate an address for display: 0x1234...5678 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
