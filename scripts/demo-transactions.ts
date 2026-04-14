import { ethers } from "hardhat";

/**
 * Execute demo transactions on Match 1 (LHR vs HYD) to demonstrate the full flow:
 *   a. Stake 0.5 WIRE for team 0 (LHR, teamAId=2) on Match 1
 *   b. Stake 0.3 WIRE for team 1 (HYD, teamBId=6) on Match 1
 *   c. Lock Match 1
 *   d. Resolve Match 1 -- LHR (teamAId=2) wins
 *   e. Claim reward
 *
 * Uses small amounts to preserve WIRE tokens.
 *
 * Prerequisites: Run deploy.ts and setup-demo.ts first.
 *
 * Run: npx hardhat run scripts/demo-transactions.ts --network wirefluid
 */

// ── UPDATE THESE AFTER SETUP ──────────────────────────────────────────────
const MATCH_FACTORY_ADDRESS = process.env.MATCH_FACTORY_ADDRESS || "0xCa9B17553032b03D968C20477520287A82Be14A7";
const MATCH_1_VAULT_ADDRESS = process.env.MATCH_1_VAULT_ADDRESS || "0x868F48Eb49165fC533f8D9e1f37D322CB12bBc56";
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Running demo transactions with:", deployer.address);
  const startBalance = await ethers.provider.getBalance(deployer.address);
  console.log("Starting balance:", ethers.formatEther(startBalance), "WIRE");

  if (!MATCH_FACTORY_ADDRESS || !MATCH_1_VAULT_ADDRESS) {
    throw new Error(
      "Set MATCH_FACTORY_ADDRESS and MATCH_1_VAULT_ADDRESS env vars before running."
    );
  }

  const factory = await ethers.getContractAt("MatchFactory", MATCH_FACTORY_ADDRESS);
  const vault = await ethers.getContractAt("MatchVault", MATCH_1_VAULT_ADDRESS);

  // PSL Team IDs: LHR = 2, HYD = 6
  const LHR_TEAM_ID = 2;
  const HYD_TEAM_ID = 6;

  const txLog: Array<{ action: string; hash: string; gas: string }> = [];

  // ─── a. Stake 0.5 WIRE for LHR on Match 1 ──────────────────────────────
  console.log("\n--- a. Stake 0.5 WIRE for LHR ---");
  const stakeA = await vault.stakeForTeam(LHR_TEAM_ID, {
    value: ethers.parseEther("0.5"),
  });
  const rA = await stakeA.wait();
  console.log(`  Tx: ${stakeA.hash}`);
  console.log(`  Gas: ${rA?.gasUsed?.toString()}`);
  txLog.push({
    action: "Stake 0.5 WIRE for LHR (Match 1)",
    hash: stakeA.hash,
    gas: rA?.gasUsed?.toString() || "0",
  });

  // ─── b. Stake 0.3 WIRE for HYD on Match 1 ──────────────────────────────
  // NOTE: Single wallet cannot stake for both teams on the same vault.
  // We'll skip this step and note it in the log.
  console.log("\n--- b. Stake 0.3 WIRE for HYD ---");
  console.log("  SKIPPED: Same wallet cannot stake for both teams (CannotStakeBothTeams error).");
  console.log("  In a real scenario, a second user wallet would stake for HYD.");

  // Instead, stake an additional 0.3 for LHR to increase the pool
  console.log("\n--- b (alt). Stake additional 0.3 WIRE for LHR ---");
  const stakeB = await vault.stakeForTeam(LHR_TEAM_ID, {
    value: ethers.parseEther("0.3"),
  });
  const rB = await stakeB.wait();
  console.log(`  Tx: ${stakeB.hash}`);
  console.log(`  Gas: ${rB?.gasUsed?.toString()}`);
  txLog.push({
    action: "Stake additional 0.3 WIRE for LHR (Match 1)",
    hash: stakeB.hash,
    gas: rB?.gasUsed?.toString() || "0",
  });

  // ─── c. Lock Match 1 ────────────────────────────────────────────────────
  console.log("\n--- c. Lock Match 1 ---");
  const lockTx = await factory.lockMatch(1);
  const rLock = await lockTx.wait();
  console.log(`  Tx: ${lockTx.hash}`);
  console.log(`  Gas: ${rLock?.gasUsed?.toString()}`);
  txLog.push({
    action: "Lock Match 1",
    hash: lockTx.hash,
    gas: rLock?.gasUsed?.toString() || "0",
  });

  // ─── d. Resolve Match 1 -- LHR wins ─────────────────────────────────────
  console.log("\n--- d. Resolve Match 1 (LHR wins) ---");
  const resolveTx = await factory.resolveMatch(1, LHR_TEAM_ID);
  const rResolve = await resolveTx.wait();
  console.log(`  Tx: ${resolveTx.hash}`);
  console.log(`  Gas: ${rResolve?.gasUsed?.toString()}`);
  txLog.push({
    action: "Resolve Match 1 (LHR wins)",
    hash: resolveTx.hash,
    gas: rResolve?.gasUsed?.toString() || "0",
  });

  // Check match state
  const matchInfo = await vault.getMatchInfo();
  console.log(`  Match state: ${matchInfo.state} (3 = RESOLVED)`);
  console.log(`  Winning team: ${matchInfo.winningTeam}`);
  console.log(`  Total pool: ${ethers.formatEther(matchInfo.totalPool)} WIRE`);

  // ─── e. Claim reward ────────────────────────────────────────────────────
  console.log("\n--- e. Claim reward ---");
  const balanceBefore = await ethers.provider.getBalance(deployer.address);
  const claimTx = await vault.claimReward();
  const rClaim = await claimTx.wait();
  const balanceAfter = await ethers.provider.getBalance(deployer.address);
  const reward = balanceAfter - balanceBefore;
  console.log(`  Tx: ${claimTx.hash}`);
  console.log(`  Gas: ${rClaim?.gasUsed?.toString()}`);
  console.log(`  Balance change: ~${ethers.formatEther(reward)} WIRE (includes gas cost)`);
  txLog.push({
    action: "Claim reward (Match 1)",
    hash: claimTx.hash,
    gas: rClaim?.gasUsed?.toString() || "0",
  });

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log("\n======================================================");
  console.log("  DEMO TRANSACTIONS COMPLETE");
  console.log("======================================================");
  for (const t of txLog) {
    console.log(`  ${t.action}`);
    console.log(`    Tx: ${t.hash}`);
    console.log(`    Gas: ${t.gas}`);
  }
  console.log("======================================================");

  const endBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\nFinal balance:", ethers.formatEther(endBalance), "WIRE");
  console.log("Total WIRE spent:", ethers.formatEther(startBalance - endBalance), "WIRE");

  console.log("\nDEMO_JSON=" + JSON.stringify(txLog));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
