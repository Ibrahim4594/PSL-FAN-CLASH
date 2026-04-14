/**
 * Deployed contract addresses on WireFluid Testnet (Chain ID: 92533)
 * Redeployed: 2026-04-14 — Owner: 0x8bbdd626ce513c69286c499D3684dd610aFe9d82
 */

export const CONTRACTS = {
  /** MatchFactory - deploys per-match vaults, admin controls */
  matchFactory: "0x5bedf00C875b77C743115eE2056Fd4cEfD3Df6E1",

  /** CharityDAO - winning fans vote on charity recipient (48hr, stake-weighted) */
  charityDAO: "0x695f4375495255973258676A4Eb9ff9c1C65055D",

  /** SeasonLeaderboard - tracks fan engagement and team charity impact */
  seasonLeaderboard: "0x2630E8B789488FcE3400404A54C9aC09C39e5509",

  /** FanID - soulbound ERC-721 fan identity NFT */
  fanID: "0xEBFB5cce6549Ef3A5287cfA62f3C795b4A04eC3d",

  /** PulseToken - ERC-20 loyalty token earned through participation */
  pulseToken: "0x2f4C1EC2E0CC7AFaF320657b0cebcFC95679358a",
} as const;

/** Pre-deployed match vaults — Real PSL 11 matchups, Rawalpindi Pindiz first */
export const MATCH_VAULTS: Record<
  number,
  { address: string; teamA: string; teamB: string }
> = {
  1: {
    address: "0x42530A9D0AB774A7AEeA61B6D3Ef0A97f2b3d356",
    teamA: "RWP",
    teamB: "PSH",
  },
  2: {
    address: "0xf50a83C24f6Fa00dc2eF9Cf6086DEB880b3886b5",
    teamA: "RWP",
    teamB: "KAR",
  },
  3: {
    address: "0x3E412C0792c2D9A3862583efa4cc0D9A69cF31F2",
    teamA: "RWP",
    teamB: "ISL",
  },
  4: {
    address: "0x1b64708c850cb1abF28Ab82586dC1f4196f7D38C",
    teamA: "LHR",
    teamB: "HYD",
  },
  5: {
    address: "0x9f47FE928323E8179CaDfcdedD558F1D27567B89",
    teamA: "MUL",
    teamB: "ISL",
  },
  6: {
    address: "0xbb2aF034660E5F3D439E07033232B58fD900D398",
    teamA: "QUE",
    teamB: "KAR",
  },
};

/** WireFluid Testnet configuration */
export const WIREFLUID_CHAIN = {
  id: 92533,
  name: "WireFluid Testnet",
  rpcUrl: "https://evm.wirefluid.com",
  explorer: "https://wirefluidscan.com",
  nativeCurrency: {
    name: "WIRE",
    symbol: "WIRE",
    decimals: 18,
  },
} as const;

/** ABI imports -- use these in frontend hooks */
export { default as MatchFactoryABI } from "../src/abi/MatchFactory.json";
export { default as MatchVaultABI } from "../src/abi/MatchVault.json";
export { default as CharityDAOABI } from "../src/abi/CharityDAO.json";
export { default as SeasonLeaderboardABI } from "../src/abi/SeasonLeaderboard.json";
export { default as FanIDABI } from "../src/abi/FanID.json";
export { default as PulseTokenABI } from "../src/abi/PulseToken.json";
