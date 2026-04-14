import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("Integration: Full Match Flow", function () {
  async function deployFixture() {
    const [owner, treasury, fan1, fan2, fan3, charityWallet] =
      await ethers.getSigners();

    // Deploy all contracts
    const CharityDAO = await ethers.getContractFactory("CharityDAO");
    const charityDAO = await CharityDAO.deploy();
    await charityDAO.waitForDeployment();

    const SeasonLeaderboard =
      await ethers.getContractFactory("SeasonLeaderboard");
    const leaderboard = await SeasonLeaderboard.deploy();
    await leaderboard.waitForDeployment();

    const MatchFactory = await ethers.getContractFactory("MatchFactory");
    const factory = await MatchFactory.deploy(treasury.address);
    await factory.waitForDeployment();

    // Wire everything together
    const factoryAddr = await factory.getAddress();
    const charityDAOAddr = await charityDAO.getAddress();
    const leaderboardAddr = await leaderboard.getAddress();

    await factory.setCharityDAO(charityDAOAddr);
    await factory.setLeaderboard(leaderboardAddr);
    await charityDAO.setMatchFactory(factoryAddr);
    await charityDAO.setLeaderboard(leaderboardAddr);
    await leaderboard.setMatchFactory(factoryAddr);
    await leaderboard.setCharityDAO(charityDAOAddr);

    // Register a charity
    await charityDAO.registerCharity(
      ethers.encodeBytes32String("Edhi Foundation"),
      charityWallet.address,
      ethers.encodeBytes32String("Healthcare")
    );

    return {
      owner,
      treasury,
      fan1,
      fan2,
      fan3,
      charityWallet,
      factory,
      charityDAO,
      leaderboard,
    };
  }

  it("should complete a full match lifecycle: create -> stake -> lock -> resolve -> claim -> vote -> execute", async function () {
    const {
      factory,
      charityDAO,
      leaderboard,
      fan1,
      fan2,
      fan3,
      treasury,
      charityWallet,
    } = await loadFixture(deployFixture);

    // 1. Create a match
    const deadline = (await time.latest()) + 7200;
    await factory.createMatch(
      1,
      1,
      ethers.encodeBytes32String("LHR"),
      2,
      ethers.encodeBytes32String("HYD"),
      deadline
    );

    const vaultAddr = await factory.getMatch(1);
    const vault = await ethers.getContractAt("MatchVault", vaultAddr);

    // Authorize vault on leaderboard
    await leaderboard.authorizeCaller(vaultAddr);

    // 2. Fans stake
    await vault
      .connect(fan1)
      .stakeForTeam(1, { value: ethers.parseEther("5.0") });
    await vault
      .connect(fan2)
      .stakeForTeam(2, { value: ethers.parseEther("3.0") });
    await vault
      .connect(fan3)
      .stakeForTeam(1, { value: ethers.parseEther("2.0") });

    expect(await vault.totalPool()).to.equal(ethers.parseEther("10.0"));

    // 3. Lock match
    await factory.lockMatch(1);
    expect(await vault.state()).to.equal(1); // LOCKED

    // 4. Resolve match (team 1 wins)
    const treasuryBefore = await ethers.provider.getBalance(treasury.address);
    await factory.resolveMatch(1, 1);

    expect(await vault.state()).to.equal(2); // RESOLVED
    expect(await vault.winningTeam()).to.equal(1);

    // Verify platform fee (3% of 10 WIRE = 0.3 WIRE)
    const treasuryAfter = await ethers.provider.getBalance(treasury.address);
    expect(treasuryAfter - treasuryBefore).to.equal(
      ethers.parseEther("0.3")
    );

    // 5. Winners claim
    const fan1Before = await ethers.provider.getBalance(fan1.address);
    const claimTx = await vault.connect(fan1).claimReward();
    const claimReceipt = await claimTx.wait();
    const gasUsed = claimReceipt!.gasUsed * claimReceipt!.gasPrice;
    const fan1After = await ethers.provider.getBalance(fan1.address);

    // fan1 staked 5 out of 7 WIRE on winning team. winnersPool = 8.2 WIRE
    const winnersPool = await vault.winnersPool();
    const expectedReward =
      (ethers.parseEther("5.0") * winnersPool) / ethers.parseEther("7.0");
    expect(fan1After - fan1Before + gasUsed).to.equal(expectedReward);

    // fan3 also claims
    await vault.connect(fan3).claimReward();

    // 6. Losers cannot claim
    await expect(
      vault.connect(fan2).claimReward()
    ).to.be.revertedWithCustomError(vault, "NotWinner");

    // 7. Charity voting — fan1 votes for Edhi Foundation
    await charityDAO.connect(fan1).castVote(1, 0);
    expect(await charityDAO.hasUserVoted(1, fan1.address)).to.equal(true);

    // fan2 (loser) cannot vote
    await expect(
      charityDAO.connect(fan2).castVote(1, 0)
    ).to.be.revertedWithCustomError(charityDAO, "NotWinningStaker");

    // fan3 (winner) also votes
    await charityDAO.connect(fan3).castVote(1, 0);

    // 8. Execute vote after 48 hours
    await time.increase(48 * 3600 + 1);

    const charityBefore = await ethers.provider.getBalance(
      charityWallet.address
    );
    await charityDAO.executeVote(1);
    const charityAfter = await ethers.provider.getBalance(
      charityWallet.address
    );

    // Charity should receive the 15% pool
    expect(charityAfter - charityBefore).to.be.gt(0);
    expect(charityAfter - charityBefore).to.equal(
      ethers.parseEther("1.5")
    ); // 15% of 10 WIRE
  });

  it("should handle match cancellation with refunds", async function () {
    const { factory, fan1, fan2, leaderboard } =
      await loadFixture(deployFixture);
    const deadline = (await time.latest()) + 7200;

    await factory.createMatch(
      1,
      1,
      ethers.encodeBytes32String("LHR"),
      2,
      ethers.encodeBytes32String("HYD"),
      deadline
    );

    const vaultAddr = await factory.getMatch(1);
    const vault = await ethers.getContractAt("MatchVault", vaultAddr);
    await leaderboard.authorizeCaller(vaultAddr);

    // Fans stake
    await vault
      .connect(fan1)
      .stakeForTeam(1, { value: ethers.parseEther("5.0") });
    await vault
      .connect(fan2)
      .stakeForTeam(2, { value: ethers.parseEther("3.0") });

    // Cancel the match
    await factory.cancelMatch(1);
    expect(await vault.state()).to.equal(3); // CANCELLED

    // Both fans should get full refunds
    const fan1Before = await ethers.provider.getBalance(fan1.address);
    const tx1 = await vault.connect(fan1).claimRefund();
    const receipt1 = await tx1.wait();
    const gas1 = receipt1!.gasUsed * receipt1!.gasPrice;
    const fan1After = await ethers.provider.getBalance(fan1.address);
    expect(fan1After - fan1Before + gas1).to.equal(
      ethers.parseEther("5.0")
    );

    const fan2Before = await ethers.provider.getBalance(fan2.address);
    const tx2 = await vault.connect(fan2).claimRefund();
    const receipt2 = await tx2.wait();
    const gas2 = receipt2!.gasUsed * receipt2!.gasPrice;
    const fan2After = await ethers.provider.getBalance(fan2.address);
    expect(fan2After - fan2Before + gas2).to.equal(
      ethers.parseEther("3.0")
    );
  });

  it("should handle multiple matches in a season", async function () {
    const { factory, fan1, fan2, leaderboard } =
      await loadFixture(deployFixture);
    const deadline = (await time.latest()) + 7200;

    // Create 3 matches
    await factory.createMatch(
      1,
      1,
      ethers.encodeBytes32String("LHR"),
      2,
      ethers.encodeBytes32String("HYD"),
      deadline
    );
    await factory.createMatch(
      2,
      3,
      ethers.encodeBytes32String("ISL"),
      4,
      ethers.encodeBytes32String("KAR"),
      deadline
    );
    await factory.createMatch(
      3,
      5,
      ethers.encodeBytes32String("PSH"),
      6,
      ethers.encodeBytes32String("MUL"),
      deadline
    );

    expect(await factory.getMatchCount()).to.equal(3);

    // Stake on all matches
    const vault1 = await ethers.getContractAt(
      "MatchVault",
      await factory.getMatch(1)
    );
    const vault2 = await ethers.getContractAt(
      "MatchVault",
      await factory.getMatch(2)
    );
    const vault3 = await ethers.getContractAt(
      "MatchVault",
      await factory.getMatch(3)
    );

    // Authorize all vaults
    await leaderboard.authorizeCaller(await factory.getMatch(1));
    await leaderboard.authorizeCaller(await factory.getMatch(2));
    await leaderboard.authorizeCaller(await factory.getMatch(3));

    await vault1
      .connect(fan1)
      .stakeForTeam(1, { value: ethers.parseEther("1.0") });
    await vault2
      .connect(fan1)
      .stakeForTeam(3, { value: ethers.parseEther("1.0") });
    await vault3
      .connect(fan1)
      .stakeForTeam(5, { value: ethers.parseEther("1.0") });

    await vault1
      .connect(fan2)
      .stakeForTeam(2, { value: ethers.parseEther("1.0") });
    await vault2
      .connect(fan2)
      .stakeForTeam(4, { value: ethers.parseEther("1.0") });
    await vault3
      .connect(fan2)
      .stakeForTeam(6, { value: ethers.parseEther("1.0") });

    // Each vault has 2 WIRE total
    expect(await vault1.totalPool()).to.equal(ethers.parseEther("2.0"));
    expect(await vault2.totalPool()).to.equal(ethers.parseEther("2.0"));
    expect(await vault3.totalPool()).to.equal(ethers.parseEther("2.0"));

    // Verify leaderboard tracking
    const fan1Profile = await leaderboard.getFanProfile(fan1.address);
    expect(fan1Profile.totalStaked).to.equal(ethers.parseEther("3.0"));
    expect(fan1Profile.matchesParticipated).to.equal(3);
  });

  it("should track season stats across matches", async function () {
    const { factory, fan1, fan2, fan3, leaderboard } =
      await loadFixture(deployFixture);
    const deadline = (await time.latest()) + 7200;

    // Create two matches
    await factory.createMatch(
      1,
      1,
      ethers.encodeBytes32String("LHR"),
      2,
      ethers.encodeBytes32String("HYD"),
      deadline
    );
    await factory.createMatch(
      2,
      3,
      ethers.encodeBytes32String("ISL"),
      4,
      ethers.encodeBytes32String("KAR"),
      deadline
    );

    const vault1 = await ethers.getContractAt(
      "MatchVault",
      await factory.getMatch(1)
    );
    const vault2 = await ethers.getContractAt(
      "MatchVault",
      await factory.getMatch(2)
    );

    await leaderboard.authorizeCaller(await factory.getMatch(1));
    await leaderboard.authorizeCaller(await factory.getMatch(2));

    // Fan1 and fan2 stake on match 1
    await vault1
      .connect(fan1)
      .stakeForTeam(1, { value: ethers.parseEther("5.0") });
    await vault1
      .connect(fan2)
      .stakeForTeam(2, { value: ethers.parseEther("3.0") });

    // Fan1 and fan3 stake on match 2
    await vault2
      .connect(fan1)
      .stakeForTeam(3, { value: ethers.parseEther("2.0") });
    await vault2
      .connect(fan3)
      .stakeForTeam(4, { value: ethers.parseEther("4.0") });

    // Check season stats
    const [totalStaked, , totalFans] = await leaderboard.getSeasonStats();
    expect(totalStaked).to.equal(ethers.parseEther("14.0"));
    expect(totalFans).to.equal(3);

    // Check top fans
    const [addresses, stakes] = await leaderboard.getTopFans(3);
    expect(addresses[0]).to.equal(fan1.address); // 7 WIRE total
    expect(stakes[0]).to.equal(ethers.parseEther("7.0"));
  });
});
