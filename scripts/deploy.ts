import { ethers } from "hardhat";

/**
 * Deploy all PSL Fan Clash contracts to WireFluid Testnet.
 *
 * Order:
 *   1. SeasonLeaderboard
 *   2. CharityDAO
 *   3. MatchFactory (passes leaderboard, charityDAO, deployer as platform wallet)
 *   4. Wire up cross-contract references (authorize MatchFactory on Leaderboard + CharityDAO,
 *      set leaderboard on CharityDAO)
 *
 * Run: npx hardhat run scripts/deploy.ts --network wirefluid
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Balance:", ethers.formatEther(balance), "WIRE");

  // ─── 1. Deploy SeasonLeaderboard ─────────────────────────────────────────
  console.log("\n--- 1. Deploying SeasonLeaderboard ---");
  const SeasonLeaderboard = await ethers.getContractFactory("SeasonLeaderboard");
  const leaderboard = await SeasonLeaderboard.deploy();
  const leaderboardReceipt = await leaderboard.deploymentTransaction()?.wait();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("  Address:", leaderboardAddress);
  console.log("  Tx Hash:", leaderboardReceipt?.hash);
  console.log("  Gas Used:", leaderboardReceipt?.gasUsed?.toString());

  // ─── 2. Deploy CharityDAO ────────────────────────────────────────────────
  console.log("\n--- 2. Deploying CharityDAO ---");
  const CharityDAO = await ethers.getContractFactory("CharityDAO");
  const charityDAO = await CharityDAO.deploy();
  const charityDAOReceipt = await charityDAO.deploymentTransaction()?.wait();
  const charityDAOAddress = await charityDAO.getAddress();
  console.log("  Address:", charityDAOAddress);
  console.log("  Tx Hash:", charityDAOReceipt?.hash);
  console.log("  Gas Used:", charityDAOReceipt?.gasUsed?.toString());

  // ─── 3. Deploy MatchFactory ──────────────────────────────────────────────
  console.log("\n--- 3. Deploying MatchFactory ---");
  const MatchFactory = await ethers.getContractFactory("MatchFactory");
  const factory = await MatchFactory.deploy(deployer.address);
  const factoryReceipt = await factory.deploymentTransaction()?.wait();
  const factoryAddress = await factory.getAddress();
  console.log("  Address:", factoryAddress);
  console.log("  Tx Hash:", factoryReceipt?.hash);
  console.log("  Gas Used:", factoryReceipt?.gasUsed?.toString());

  // ─── 4. Wire up cross-contract references ────────────────────────────────
  console.log("\n--- 4. Wiring contracts ---");

  // 4a. MatchFactory -> set CharityDAO
  const tx1 = await factory.setCharityDAO(charityDAOAddress);
  const r1 = await tx1.wait();
  console.log("  MatchFactory.setCharityDAO:", tx1.hash, "gas:", r1?.gasUsed?.toString());

  // 4b. MatchFactory -> set Leaderboard
  const tx2 = await factory.setLeaderboard(leaderboardAddress);
  const r2 = await tx2.wait();
  console.log("  MatchFactory.setLeaderboard:", tx2.hash, "gas:", r2?.gasUsed?.toString());

  // 4c. CharityDAO -> set MatchFactory
  const tx3 = await charityDAO.setMatchFactory(factoryAddress);
  const r3 = await tx3.wait();
  console.log("  CharityDAO.setMatchFactory:", tx3.hash, "gas:", r3?.gasUsed?.toString());

  // 4d. CharityDAO -> set Leaderboard
  const tx4 = await charityDAO.setLeaderboard(leaderboardAddress);
  const r4 = await tx4.wait();
  console.log("  CharityDAO.setLeaderboard:", tx4.hash, "gas:", r4?.gasUsed?.toString());

  // 4e. SeasonLeaderboard -> set MatchFactory
  const tx5 = await leaderboard.setMatchFactory(factoryAddress);
  const r5 = await tx5.wait();
  console.log("  SeasonLeaderboard.setMatchFactory:", tx5.hash, "gas:", r5?.gasUsed?.toString());

  // 4f. SeasonLeaderboard -> set CharityDAO
  const tx6 = await leaderboard.setCharityDAO(charityDAOAddress);
  const r6 = await tx6.wait();
  console.log("  SeasonLeaderboard.setCharityDAO:", tx6.hash, "gas:", r6?.gasUsed?.toString());

  // ─── Summary ─────────────────────────────────────────────────────────────
  console.log("\n======================================================");
  console.log("  DEPLOYMENT COMPLETE");
  console.log("======================================================");
  console.log(`  SeasonLeaderboard: ${leaderboardAddress}`);
  console.log(`  CharityDAO:        ${charityDAOAddress}`);
  console.log(`  MatchFactory:      ${factoryAddress}`);
  console.log(`  Platform Treasury: ${deployer.address}`);
  console.log("======================================================");

  // Output JSON for downstream scripts
  const deployment = {
    deployer: deployer.address,
    seasonLeaderboard: leaderboardAddress,
    charityDAO: charityDAOAddress,
    matchFactory: factoryAddress,
    txHashes: {
      seasonLeaderboard: leaderboardReceipt?.hash,
      charityDAO: charityDAOReceipt?.hash,
      matchFactory: factoryReceipt?.hash,
      setCharityDAO: tx1.hash,
      setLeaderboard: tx2.hash,
      setMatchFactory_CharityDAO: tx3.hash,
      setLeaderboard_CharityDAO: tx4.hash,
      setMatchFactory_Leaderboard: tx5.hash,
      setCharityDAO_Leaderboard: tx6.hash,
    },
    gasUsed: {
      seasonLeaderboard: leaderboardReceipt?.gasUsed?.toString(),
      charityDAO: charityDAOReceipt?.gasUsed?.toString(),
      matchFactory: factoryReceipt?.gasUsed?.toString(),
      setCharityDAO: r1?.gasUsed?.toString(),
      setLeaderboard: r2?.gasUsed?.toString(),
      setMatchFactory_CharityDAO: r3?.gasUsed?.toString(),
      setLeaderboard_CharityDAO: r4?.gasUsed?.toString(),
      setMatchFactory_Leaderboard: r5?.gasUsed?.toString(),
      setCharityDAO_Leaderboard: r6?.gasUsed?.toString(),
    },
  };

  console.log("\nDEPLOYMENT_JSON=" + JSON.stringify(deployment));

  const finalBalance = await ethers.provider.getBalance(deployer.address);
  console.log("\nFinal balance:", ethers.formatEther(finalBalance), "WIRE");
  console.log("Gas spent:", ethers.formatEther(balance - finalBalance), "WIRE");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
