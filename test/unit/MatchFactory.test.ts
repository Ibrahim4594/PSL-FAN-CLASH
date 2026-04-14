import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("MatchFactory", function () {
  async function deployFixture() {
    const [owner, treasury, other] = await ethers.getSigners();

    const CharityDAO = await ethers.getContractFactory("CharityDAO");
    const charityDAO = await CharityDAO.deploy();
    await charityDAO.waitForDeployment();
    const charityDAOAddr = await charityDAO.getAddress();

    const SeasonLeaderboard =
      await ethers.getContractFactory("SeasonLeaderboard");
    const leaderboard = await SeasonLeaderboard.deploy();
    await leaderboard.waitForDeployment();
    const leaderboardAddr = await leaderboard.getAddress();

    const MatchFactory = await ethers.getContractFactory("MatchFactory");
    const factory = await MatchFactory.deploy(treasury.address);
    await factory.waitForDeployment();

    const factoryAddr = await factory.getAddress();
    await factory.setCharityDAO(charityDAOAddr);
    await factory.setLeaderboard(leaderboardAddr);
    await charityDAO.setMatchFactory(factoryAddr);
    await leaderboard.setMatchFactory(factoryAddr);
    await leaderboard.setCharityDAO(charityDAOAddr);

    return {
      owner,
      treasury,
      other,
      factory,
      charityDAO,
      leaderboard,
      charityDAOAddr,
      leaderboardAddr,
    };
  }

  describe("Deployment", function () {
    it("should set owner correctly", async function () {
      const { factory, owner } = await loadFixture(deployFixture);
      expect(await factory.owner()).to.equal(owner.address);
    });

    it("should set platform treasury", async function () {
      const { factory, treasury } = await loadFixture(deployFixture);
      expect(await factory.platformTreasury()).to.equal(treasury.address);
    });

    it("should reject zero treasury address", async function () {
      const MatchFactory = await ethers.getContractFactory("MatchFactory");
      await expect(
        MatchFactory.deploy(ethers.ZeroAddress)
      ).to.be.revertedWithCustomError(MatchFactory, "ZeroAddress");
    });
  });

  describe("Match Creation", function () {
    it("should create a match and return vault address", async function () {
      const { factory } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

      const tx = await factory.createMatch(
        1,
        1,
        ethers.encodeBytes32String("LHR"),
        2,
        ethers.encodeBytes32String("HYD"),
        deadline
      );
      await tx.wait();

      const vaultAddr = await factory.getMatch(1);
      expect(vaultAddr).to.not.equal(ethers.ZeroAddress);
    });

    it("should emit MatchCreated event", async function () {
      const { factory } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

      await expect(
        factory.createMatch(
          1,
          1,
          ethers.encodeBytes32String("LHR"),
          2,
          ethers.encodeBytes32String("HYD"),
          deadline
        )
      ).to.emit(factory, "MatchCreated");
    });

    it("should reject duplicate match ID", async function () {
      const { factory } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

      await factory.createMatch(
        1,
        1,
        ethers.encodeBytes32String("LHR"),
        2,
        ethers.encodeBytes32String("HYD"),
        deadline
      );
      await expect(
        factory.createMatch(
          1,
          3,
          ethers.encodeBytes32String("ISL"),
          4,
          ethers.encodeBytes32String("KAR"),
          deadline
        )
      ).to.be.revertedWithCustomError(factory, "MatchAlreadyExists");
    });

    it("should reject creation from non-owner", async function () {
      const { factory, other } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

      await expect(
        factory
          .connect(other)
          .createMatch(
            1,
            1,
            ethers.encodeBytes32String("LHR"),
            2,
            ethers.encodeBytes32String("HYD"),
            deadline
          )
      ).to.be.reverted;
    });

    it("should track match IDs correctly", async function () {
      const { factory } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

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

      expect(await factory.getMatchCount()).to.equal(2);
      const ids = await factory.getAllMatchIds();
      expect(ids[0]).to.equal(1);
      expect(ids[1]).to.equal(2);
    });

    it("should reject creation when CharityDAO not set", async function () {
      const [, treasury] = await ethers.getSigners();
      const MatchFactory = await ethers.getContractFactory("MatchFactory");
      const factory2 = await MatchFactory.deploy(treasury.address);
      await factory2.waitForDeployment();

      const deadline = (await time.latest()) + 3600;
      await expect(
        factory2.createMatch(
          1,
          1,
          ethers.encodeBytes32String("LHR"),
          2,
          ethers.encodeBytes32String("HYD"),
          deadline
        )
      ).to.be.revertedWithCustomError(factory2, "CharityDAONotSet");
    });
  });

  describe("Season Configuration", function () {
    it("should configure season dates", async function () {
      const { factory } = await loadFixture(deployFixture);
      const start = (await time.latest()) + 100;
      const end = start + 86400 * 40; // 40 days

      await expect(factory.configureSeason(start, end))
        .to.emit(factory, "SeasonConfigured")
        .withArgs(start, end);

      expect(await factory.seasonStart()).to.equal(start);
      expect(await factory.seasonEnd()).to.equal(end);
    });

    it("should reject invalid season dates", async function () {
      const { factory } = await loadFixture(deployFixture);
      const now = await time.latest();

      await expect(
        factory.configureSeason(now + 100, now + 50)
      ).to.be.revertedWithCustomError(factory, "InvalidSeasonDates");
    });
  });

  describe("Match Pagination", function () {
    it("should return paginated match IDs", async function () {
      const { factory } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;

      for (let i = 1; i <= 5; i++) {
        await factory.createMatch(
          i,
          1,
          ethers.encodeBytes32String("LHR"),
          2,
          ethers.encodeBytes32String("HYD"),
          deadline
        );
      }

      const page1 = await factory.getMatchIdsPaginated(0, 3);
      expect(page1.length).to.equal(3);
      expect(page1[0]).to.equal(1);
      expect(page1[2]).to.equal(3);

      const page2 = await factory.getMatchIdsPaginated(3, 3);
      expect(page2.length).to.equal(2);
      expect(page2[0]).to.equal(4);
      expect(page2[1]).to.equal(5);
    });

    it("should return empty array for out-of-range offset", async function () {
      const { factory } = await loadFixture(deployFixture);
      const result = await factory.getMatchIdsPaginated(100, 10);
      expect(result.length).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("should reject lockMatch from non-owner", async function () {
      const { factory, other } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await factory.createMatch(
        1,
        1,
        ethers.encodeBytes32String("LHR"),
        2,
        ethers.encodeBytes32String("HYD"),
        deadline
      );

      await expect(factory.connect(other).lockMatch(1)).to.be.reverted;
    });

    it("should reject resolveMatch from non-owner", async function () {
      const { factory, other } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await factory.createMatch(
        1,
        1,
        ethers.encodeBytes32String("LHR"),
        2,
        ethers.encodeBytes32String("HYD"),
        deadline
      );

      await expect(factory.connect(other).resolveMatch(1, 1)).to.be.reverted;
    });

    it("should reject setCharityDAO from non-owner", async function () {
      const { factory, other } = await loadFixture(deployFixture);
      await expect(
        factory.connect(other).setCharityDAO(other.address)
      ).to.be.reverted;
    });

    it("should reject lockMatch for non-existent match", async function () {
      const { factory } = await loadFixture(deployFixture);
      await expect(factory.lockMatch(999)).to.be.revertedWithCustomError(
        factory,
        "MatchNotFound"
      );
    });

    it("should reject cancelMatch for non-existent match", async function () {
      const { factory } = await loadFixture(deployFixture);
      await expect(factory.cancelMatch(999)).to.be.revertedWithCustomError(
        factory,
        "MatchNotFound"
      );
    });
  });
});
