import { ethers } from "hardhat";

/**
 * Register charities and create demo matches on already-deployed contracts.
 *
 * Prerequisites: Run scripts/deploy.ts first. Update the addresses below
 * with the actual deployed addresses from the deployment output.
 *
 * Run: npx hardhat run scripts/setup-demo.ts --network wirefluid
 */

// ── UPDATE THESE AFTER DEPLOYMENT ──────────────────────────────────────────
// These will be replaced after deploy.ts runs
const MATCH_FACTORY_ADDRESS = process.env.MATCH_FACTORY_ADDRESS || "0xCa9B17553032b03D968C20477520287A82Be14A7";
const CHARITY_DAO_ADDRESS = process.env.CHARITY_DAO_ADDRESS || "0x6975E69Af5B1849B96b8674993e549E3337cD085";
// ────────────────────────────────────────────────────────────────────────────

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting up demo with account:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "WIRE");

  if (!MATCH_FACTORY_ADDRESS || !CHARITY_DAO_ADDRESS) {
    throw new Error(
      "Set MATCH_FACTORY_ADDRESS and CHARITY_DAO_ADDRESS env vars (or edit this file) before running."
    );
  }

  // Get contract instances
  const charityDAO = await ethers.getContractAt("CharityDAO", CHARITY_DAO_ADDRESS);
  const matchFactory = await ethers.getContractAt("MatchFactory", MATCH_FACTORY_ADDRESS);

  // ─── 1. Register Charities ──────────────────────────────────────────────
  console.log("\n--- Registering Charities ---");

  const charities = [
    {
      name: "Edhi Foundation",
      wallet: deployer.address, // In production, use charity wallet
      description: "Largest welfare org Pakistan",
    },
    {
      name: "Shaukat Khanum",
      wallet: deployer.address,
      description: "Free cancer treatment",
    },
    {
      name: "The Citizens Foundation",
      wallet: deployer.address,
      description: "Quality education 1800 schools",
    },
  ];

  const charityTxs: Array<{ name: string; hash: string; gas: string }> = [];

  for (const c of charities) {
    const tx = await charityDAO.registerCharity(
      ethers.encodeBytes32String(c.name),
      c.wallet,
      ethers.encodeBytes32String(c.description)
    );
    const receipt = await tx.wait();
    console.log(`  Registered: ${c.name}`);
    console.log(`    Tx: ${tx.hash}`);
    console.log(`    Gas: ${receipt?.gasUsed?.toString()}`);
    charityTxs.push({
      name: c.name,
      hash: tx.hash,
      gas: receipt?.gasUsed?.toString() || "0",
    });
  }

  // Verify
  const charityCount = await charityDAO.getCharityCount();
  console.log(`\n  Total charities registered: ${charityCount}`);

  // ─── 2. Create Demo Matches ─────────────────────────────────────────────
  console.log("\n--- Creating Demo Matches ---");

  // PSL Team IDs from architecture:
  // 0=ISL, 1=KAR, 2=LHR, 3=MUL, 4=PSH, 5=QUE, 6=HYD, 7=RWP
  const now = Math.floor(Date.now() / 1000);
  const HOUR = 3600;

  const matches = [
    {
      id: 1,
      teamAId: 2,   // LHR
      teamAName: "LHR",
      teamBId: 6,    // HYD
      teamBName: "HYD",
      deadline: now + 24 * HOUR, // 24 hours from now
    },
    {
      id: 2,
      teamAId: 0,   // ISL
      teamAName: "ISL",
      teamBId: 1,    // KAR
      teamBName: "KAR",
      deadline: now + 48 * HOUR, // 48 hours from now
    },
    {
      id: 3,
      teamAId: 4,   // PSH
      teamAName: "PSH",
      teamBId: 3,    // MUL
      teamBName: "MUL",
      deadline: now + 72 * HOUR, // 72 hours from now
    },
  ];

  const matchTxs: Array<{
    id: number;
    teamA: string;
    teamB: string;
    vault: string;
    hash: string;
    gas: string;
  }> = [];

  for (const m of matches) {
    const tx = await matchFactory.createMatch(
      m.id,
      m.teamAId,
      ethers.encodeBytes32String(m.teamAName),
      m.teamBId,
      ethers.encodeBytes32String(m.teamBName),
      m.deadline
    );
    const receipt = await tx.wait();
    const vaultAddress = await matchFactory.getMatch(m.id);

    console.log(`  Match ${m.id}: ${m.teamAName} vs ${m.teamBName}`);
    console.log(`    Vault: ${vaultAddress}`);
    console.log(`    Deadline: ${new Date(m.deadline * 1000).toISOString()}`);
    console.log(`    Tx: ${tx.hash}`);
    console.log(`    Gas: ${receipt?.gasUsed?.toString()}`);

    matchTxs.push({
      id: m.id,
      teamA: m.teamAName,
      teamB: m.teamBName,
      vault: vaultAddress,
      hash: tx.hash,
      gas: receipt?.gasUsed?.toString() || "0",
    });
  }

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log("\n======================================================");
  console.log("  DEMO SETUP COMPLETE");
  console.log("======================================================");
  console.log("  Charities:");
  for (const c of charityTxs) {
    console.log(`    ${c.name}: ${c.hash}`);
  }
  console.log("  Matches:");
  for (const m of matchTxs) {
    console.log(`    Match ${m.id} (${m.teamA} vs ${m.teamB}): vault=${m.vault}`);
  }
  console.log("======================================================");

  // Output JSON for downstream scripts
  const output = { charityTxs, matchTxs };
  console.log("\nSETUP_JSON=" + JSON.stringify(output));

  const finalBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\nFinal balance:", ethers.formatEther(finalBalance), "WIRE");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
