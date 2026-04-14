import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

describe("SeasonLeaderboard", function () {
  async function deployFixture() {
    const [owner, factory, charityDAO, fan1, fan2, fan3] =
      await ethers.getSigners();

    const SeasonLeaderboard =
      await ethers.getContractFactory("SeasonLeaderboard");
    const leaderboard = await SeasonLeaderboard.deploy();
    await leaderboard.waitForDeployment();

    await leaderboard.setMatchFactory(factory.address);
    await leaderboard.setCharityDAO(charityDAO.address);

    return { owner, factory, charityDAO, fan1, fan2, fan3, leaderboard };
  }

  describe("Deployment", function () {
    it("should set owner correctly", async function () {
      const { leaderboard, owner } = await loadFixture(deployFixture);
      expect(await leaderboard.owner()).to.equal(owner.address);
    });
  });

  describe("Access Control", function () {
    it("should authorize and revoke callers", async function () {
      const { leaderboard, owner, fan1 } = await loadFixture(deployFixture);

      await leaderboard.authorizeCaller(fan1.address);
      expect(await leaderboard.authorizedCallers(fan1.address)).to.equal(
        true
      );

      await leaderboard.revokeCaller(fan1.address);
      expect(await leaderboard.authorizedCallers(fan1.address)).to.equal(
        false
      );
    });

    it("should allow authorized caller to record data", async function () {
      const { leaderboard, fan1, fan2 } = await loadFixture(deployFixture);

      await leaderboard.authorizeCaller(fan1.address);
      await leaderboard
        .connect(fan1)
        .recordStake(fan2.address, 1, ethers.parseEther("1.0"));

      const profile = await leaderboard.getFanProfile(fan2.address);
      expect(profile.totalStaked).to.equal(ethers.parseEther("1.0"));
    });

    it("should reject recording from unauthorized caller", async function () {
      const { leaderboard, fan1 } = await loadFixture(deployFixture);

      await expect(
        leaderboard
          .connect(fan1)
          .recordStake(fan1.address, 1, ethers.parseEther("1.0"))
      ).to.be.revertedWithCustomError(leaderboard, "Unauthorized");
    });
  });

  describe("Recording Stakes", function () {
    it("should record a fan stake", async function () {
      const { leaderboard, factory, fan1 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("2.0"));

      const profile = await leaderboard.getFanProfile(fan1.address);
      expect(profile.totalStaked).to.equal(ethers.parseEther("2.0"));
      expect(profile.matchesParticipated).to.equal(1);
      expect(profile.primaryTeam).to.equal(1);
      expect(profile.exists).to.equal(true);
    });

    it("should accumulate multiple stakes", async function () {
      const { leaderboard, factory, fan1 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("2.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("3.0"));

      const profile = await leaderboard.getFanProfile(fan1.address);
      expect(profile.totalStaked).to.equal(ethers.parseEther("5.0"));
      expect(profile.matchesParticipated).to.equal(2);
    });

    it("should track unique fans per team", async function () {
      const { leaderboard, factory, fan1, fan2 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("1.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan2.address, 1, ethers.parseEther("2.0"));

      const stats = await leaderboard.getTeamStats(1);
      expect(stats.uniqueFans).to.equal(2);
      expect(stats.totalStakedByFans).to.equal(ethers.parseEther("3.0"));
    });

    it("should not double-count a fan for the same team", async function () {
      const { leaderboard, factory, fan1 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("1.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("0.5"));

      const stats = await leaderboard.getTeamStats(1);
      expect(stats.uniqueFans).to.equal(1);
    });
  });

  describe("Recording Wins", function () {
    it("should record a win", async function () {
      const { leaderboard, factory, fan1 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("1.0"));
      await leaderboard
        .connect(factory)
        .recordWin(fan1.address, ethers.parseEther("1.8"));

      const profile = await leaderboard.getFanProfile(fan1.address);
      expect(profile.totalWon).to.equal(ethers.parseEther("1.8"));
    });
  });

  describe("Charity Contributions", function () {
    it("should record charity contributions", async function () {
      const { leaderboard, factory } = await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordCharityContribution(1, ethers.parseEther("0.75"));

      const stats = await leaderboard.getTeamStats(1);
      expect(stats.totalCharityGenerated).to.equal(
        ethers.parseEther("0.75")
      );
      expect(stats.wins).to.equal(1);
      expect(await leaderboard.seasonTotalCharity()).to.equal(
        ethers.parseEther("0.75")
      );
    });

    it("should record charity votes", async function () {
      const { leaderboard, factory, fan1 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("1.0"));
      await leaderboard.connect(factory).recordCharityVote(fan1.address);

      const profile = await leaderboard.getFanProfile(fan1.address);
      expect(profile.charityVotesCast).to.equal(1);
    });
  });

  describe("Season Stats", function () {
    it("should track season-wide totals", async function () {
      const { leaderboard, factory, fan1, fan2 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("5.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan2.address, 2, ethers.parseEther("3.0"));

      const [totalStaked, , totalFans] = await leaderboard.getSeasonStats();
      expect(totalStaked).to.equal(ethers.parseEther("8.0"));
      expect(totalFans).to.equal(2);
    });
  });

  describe("Top Fans", function () {
    it("should return top fans sorted by total staked", async function () {
      const { leaderboard, factory, fan1, fan2, fan3 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("5.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan2.address, 2, ethers.parseEther("10.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan3.address, 1, ethers.parseEther("3.0"));

      const [addresses, stakes] = await leaderboard.getTopFans(2);

      expect(addresses.length).to.equal(2);
      expect(addresses[0]).to.equal(fan2.address); // highest staker
      expect(stakes[0]).to.equal(ethers.parseEther("10.0"));
      expect(addresses[1]).to.equal(fan1.address);
      expect(stakes[1]).to.equal(ethers.parseEther("5.0"));
    });

    it("should handle count larger than total fans", async function () {
      const { leaderboard, factory, fan1 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("1.0"));

      const [addresses, stakes] = await leaderboard.getTopFans(100);
      expect(addresses.length).to.equal(1);
      expect(addresses[0]).to.equal(fan1.address);
    });
  });

  describe("Pagination", function () {
    it("should return paginated fan addresses", async function () {
      const { leaderboard, factory, fan1, fan2, fan3 } =
        await loadFixture(deployFixture);

      await leaderboard
        .connect(factory)
        .recordStake(fan1.address, 1, ethers.parseEther("1.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan2.address, 2, ethers.parseEther("1.0"));
      await leaderboard
        .connect(factory)
        .recordStake(fan3.address, 1, ethers.parseEther("1.0"));

      const page1 = await leaderboard.getFansPaginated(0, 2);
      expect(page1.length).to.equal(2);
      expect(page1[0]).to.equal(fan1.address);
      expect(page1[1]).to.equal(fan2.address);

      const page2 = await leaderboard.getFansPaginated(2, 2);
      expect(page2.length).to.equal(1);
      expect(page2[0]).to.equal(fan3.address);
    });

    it("should return empty for out-of-range offset", async function () {
      const { leaderboard } = await loadFixture(deployFixture);
      const result = await leaderboard.getFansPaginated(100, 10);
      expect(result.length).to.equal(0);
    });
  });
});
