import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("CharityDAO", function () {
  async function deployFixture() {
    const [owner, fan1, fan2, charityWallet1, charityWallet2, treasury] =
      await ethers.getSigners();

    // Deploy CharityDAO
    const CharityDAO = await ethers.getContractFactory("CharityDAO");
    const charityDAO = await CharityDAO.deploy();
    await charityDAO.waitForDeployment();
    const charityDAOAddr = await charityDAO.getAddress();

    // Deploy SeasonLeaderboard
    const SeasonLeaderboard =
      await ethers.getContractFactory("SeasonLeaderboard");
    const leaderboard = await SeasonLeaderboard.deploy();
    await leaderboard.waitForDeployment();
    const leaderboardAddr = await leaderboard.getAddress();

    // Deploy MatchFactory
    const MatchFactory = await ethers.getContractFactory("MatchFactory");
    const factory = await MatchFactory.deploy(treasury.address);
    await factory.waitForDeployment();
    const factoryAddr = await factory.getAddress();

    // Wire up
    await factory.setCharityDAO(charityDAOAddr);
    await factory.setLeaderboard(leaderboardAddr);
    await charityDAO.setMatchFactory(factoryAddr);
    await charityDAO.setLeaderboard(leaderboardAddr);
    await leaderboard.setMatchFactory(factoryAddr);
    await leaderboard.setCharityDAO(charityDAOAddr);

    // Register charities
    await charityDAO.registerCharity(
      ethers.encodeBytes32String("Edhi Foundation"),
      charityWallet1.address,
      ethers.encodeBytes32String("Healthcare")
    );
    await charityDAO.registerCharity(
      ethers.encodeBytes32String("LRBT"),
      charityWallet2.address,
      ethers.encodeBytes32String("Eye care")
    );

    return {
      owner,
      fan1,
      fan2,
      charityWallet1,
      charityWallet2,
      treasury,
      factory,
      charityDAO,
      leaderboard,
      factoryAddr,
      charityDAOAddr,
    };
  }

  // Helper to create a resolved match with stakers
  async function createResolvedMatch(fixture: Awaited<ReturnType<typeof deployFixture>>) {
    const { factory, charityDAO, fan1, fan2, leaderboard } = fixture;

    const deadline = (await time.latest()) + 3600;
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

    // Both fans stake
    await vault
      .connect(fan1)
      .stakeForTeam(1, { value: ethers.parseEther("3.0") });
    await vault
      .connect(fan2)
      .stakeForTeam(2, { value: ethers.parseEther("2.0") });

    // Lock and resolve — team 1 wins
    await factory.lockMatch(1);
    await factory.resolveMatch(1, 1);

    return { vault, vaultAddr };
  }

  describe("Charity Registration", function () {
    it("should register charities", async function () {
      const { charityDAO } = await loadFixture(deployFixture);
      expect(await charityDAO.getCharityCount()).to.equal(2);
    });

    it("should emit CharityRegistered event", async function () {
      const { charityDAO, charityWallet1 } =
        await loadFixture(deployFixture);

      await expect(
        charityDAO.registerCharity(
          ethers.encodeBytes32String("New Charity"),
          charityWallet1.address,
          ethers.encodeBytes32String("Description")
        )
      ).to.emit(charityDAO, "CharityRegistered");
    });

    it("should reject registration from non-owner", async function () {
      const { charityDAO, fan1 } = await loadFixture(deployFixture);
      await expect(
        charityDAO
          .connect(fan1)
          .registerCharity(
            ethers.encodeBytes32String("Test"),
            fan1.address,
            ethers.encodeBytes32String("Test")
          )
      ).to.be.reverted;
    });

    it("should reject registration with zero wallet", async function () {
      const { charityDAO } = await loadFixture(deployFixture);
      await expect(
        charityDAO.registerCharity(
          ethers.encodeBytes32String("Bad"),
          ethers.ZeroAddress,
          ethers.encodeBytes32String("Bad")
        )
      ).to.be.revertedWithCustomError(charityDAO, "ZeroAddress");
    });

    it("should deactivate charity", async function () {
      const { charityDAO } = await loadFixture(deployFixture);
      await charityDAO.deactivateCharity(0);
      const charities = await charityDAO.getCharities();
      expect(charities[0].active).to.equal(false);
    });
  });

  describe("Voting with On-Chain Verification", function () {
    it("should start a vote via factory resolve", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO } = fixture;
      await createResolvedMatch(fixture);

      const result = await charityDAO.getVoteResults(1);
      expect(result.startTime).to.be.gt(0);
      expect(result.charityPool).to.be.gt(0);
      expect(result.executed).to.equal(false);
    });

    it("should allow winning staker to vote", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan1 } = fixture;
      await createResolvedMatch(fixture);

      // fan1 is a winning staker (staked for team 1, team 1 won)
      await charityDAO.connect(fan1).castVote(1, 0);

      expect(await charityDAO.hasUserVoted(1, fan1.address)).to.equal(true);

      // Voting power should be the stake amount (3 WIRE)
      const votes = await charityDAO.getCharityVotes(1, 0);
      expect(votes).to.equal(ethers.parseEther("3.0"));
    });

    it("should reject vote from losing staker", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan2 } = fixture;
      await createResolvedMatch(fixture);

      // fan2 staked for team 2 (losers)
      await expect(
        charityDAO.connect(fan2).castVote(1, 0)
      ).to.be.revertedWithCustomError(charityDAO, "NotWinningStaker");
    });

    it("should reject double voting", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan1 } = fixture;
      await createResolvedMatch(fixture);

      await charityDAO.connect(fan1).castVote(1, 0);
      await expect(
        charityDAO.connect(fan1).castVote(1, 1)
      ).to.be.revertedWithCustomError(charityDAO, "AlreadyVoted");
    });

    it("should reject vote for inactive charity", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan1 } = fixture;
      await createResolvedMatch(fixture);

      await charityDAO.deactivateCharity(0);
      await expect(
        charityDAO.connect(fan1).castVote(1, 0)
      ).to.be.revertedWithCustomError(charityDAO, "CharityInactive");
    });

    it("should execute vote and send funds to winning charity", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan1, charityWallet1 } = fixture;
      await createResolvedMatch(fixture);

      // fan1 votes for charity 0
      await charityDAO.connect(fan1).castVote(1, 0);

      // Advance past voting window
      await time.increase(48 * 3600 + 1);

      const balBefore = await ethers.provider.getBalance(
        charityWallet1.address
      );
      await charityDAO.executeVote(1);
      const balAfter = await ethers.provider.getBalance(
        charityWallet1.address
      );

      // Charity should receive the 15% pool
      expect(balAfter - balBefore).to.be.gt(0);
    });

    it("should reject vote execution before deadline", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan1 } = fixture;
      await createResolvedMatch(fixture);

      await charityDAO.connect(fan1).castVote(1, 0);

      await expect(
        charityDAO.executeVote(1)
      ).to.be.revertedWithCustomError(charityDAO, "VoteStillOpen");
    });

    it("should reject double execution", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan1 } = fixture;
      await createResolvedMatch(fixture);

      await charityDAO.connect(fan1).castVote(1, 0);
      await time.increase(48 * 3600 + 1);
      await charityDAO.executeVote(1);

      await expect(
        charityDAO.executeVote(1)
      ).to.be.revertedWithCustomError(charityDAO, "VoteAlreadyExecuted");
    });
  });

  describe("View Functions", function () {
    it("should return voting power for winning staker", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan1 } = fixture;
      await createResolvedMatch(fixture);

      const power = await charityDAO.getVotingPower(1, fan1.address);
      expect(power).to.equal(ethers.parseEther("3.0"));
    });

    it("should return zero voting power for losing staker", async function () {
      const fixture = await loadFixture(deployFixture);
      const { charityDAO, fan2 } = fixture;
      await createResolvedMatch(fixture);

      const power = await charityDAO.getVotingPower(1, fan2.address);
      expect(power).to.equal(0);
    });

    it("should return charities list", async function () {
      const { charityDAO, charityWallet1 } =
        await loadFixture(deployFixture);

      const charities = await charityDAO.getCharities();
      expect(charities.length).to.equal(2);
      expect(charities[0].wallet).to.equal(charityWallet1.address);
      expect(charities[0].active).to.equal(true);
    });
  });
});
