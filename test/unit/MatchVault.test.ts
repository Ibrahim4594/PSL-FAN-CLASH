import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, time } from "@nomicfoundation/hardhat-network-helpers";

describe("MatchVault", function () {
  async function deployFixture() {
    const [owner, treasury, charityWallet, fan1, fan2, fan3] =
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
    await leaderboard.setMatchFactory(factoryAddr);
    await leaderboard.setCharityDAO(charityDAOAddr);

    // Create a match: team 1 vs team 2, deadline in 1 hour
    const deadline = (await time.latest()) + 3600;
    const teamAName = ethers.encodeBytes32String("LHR");
    const teamBName = ethers.encodeBytes32String("HYD");

    const tx = await factory.createMatch(
      1,
      1,
      teamAName,
      2,
      teamBName,
      deadline
    );
    await tx.wait();

    const vaultAddr = await factory.getMatch(1);
    const vault = await ethers.getContractAt("MatchVault", vaultAddr);

    // Authorize vault on leaderboard
    await leaderboard.authorizeCaller(vaultAddr);

    return {
      owner,
      treasury,
      charityWallet,
      fan1,
      fan2,
      fan3,
      factory,
      charityDAO,
      leaderboard,
      vault,
      vaultAddr,
      deadline,
    };
  }

  describe("Staking", function () {
    it("should allow staking for team A", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);
      const stakeAmount = ethers.parseEther("1.0");

      await expect(
        vault.connect(fan1).stakeForTeam(1, { value: stakeAmount })
      )
        .to.emit(vault, "Staked")
        .withArgs(fan1.address, 1, stakeAmount, stakeAmount);

      const [amount, teamId, claimed] = await vault.getUserStake(fan1.address);
      expect(amount).to.equal(stakeAmount);
      expect(teamId).to.equal(1);
      expect(claimed).to.equal(false);
    });

    it("should allow staking for team B", async function () {
      const { vault, fan2 } = await loadFixture(deployFixture);
      const stakeAmount = ethers.parseEther("2.0");

      await vault.connect(fan2).stakeForTeam(2, { value: stakeAmount });

      const [amount, teamId] = await vault.getUserStake(fan2.address);
      expect(amount).to.equal(stakeAmount);
      expect(teamId).to.equal(2);
    });

    it("should allow multiple stakes for the same team", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("0.5") });

      const [amount] = await vault.getUserStake(fan1.address);
      expect(amount).to.equal(ethers.parseEther("1.5"));
    });

    it("should reject staking for both teams", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await expect(
        vault
          .connect(fan1)
          .stakeForTeam(2, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(vault, "CannotStakeBothTeams");
    });

    it("should reject stake below minimum", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await expect(
        vault
          .connect(fan1)
          .stakeForTeam(1, { value: ethers.parseEther("0.001") })
      ).to.be.revertedWithCustomError(vault, "BelowMinimumStake");
    });

    it("should reject staking for invalid team", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await expect(
        vault
          .connect(fan1)
          .stakeForTeam(3, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(vault, "InvalidTeam");
    });

    it("should reject staking after deadline", async function () {
      const { vault, fan1, deadline } = await loadFixture(deployFixture);

      await time.increaseTo(deadline + 1);
      await expect(
        vault
          .connect(fan1)
          .stakeForTeam(1, { value: ethers.parseEther("1.0") })
      ).to.be.revertedWithCustomError(vault, "StakingDeadlinePassed");
    });

    it("should update team pools and total pool correctly", async function () {
      const { vault, fan1, fan2 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("3.0") });
      await vault
        .connect(fan2)
        .stakeForTeam(2, { value: ethers.parseEther("2.0") });

      expect(await vault.teamPools(1)).to.equal(ethers.parseEther("3.0"));
      expect(await vault.teamPools(2)).to.equal(ethers.parseEther("2.0"));
      expect(await vault.totalPool()).to.equal(ethers.parseEther("5.0"));
    });
  });

  describe("Match Lifecycle", function () {
    it("should lock match (factory only)", async function () {
      const { vault, factory, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await factory.lockMatch(1);

      expect(await vault.state()).to.equal(1); // LOCKED
    });

    it("should reject staking when locked", async function () {
      const { vault, factory, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await factory.lockMatch(1);

      await expect(
        vault
          .connect(fan1)
          .stakeForTeam(1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWithCustomError(vault, "MatchNotOpen");
    });

    it("should reject lock from non-factory", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await expect(
        vault.connect(fan1).lockMatch()
      ).to.be.revertedWithCustomError(vault, "OnlyFactory");
    });

    it("should resolve match and distribute funds", async function () {
      const { vault, factory, treasury, charityDAO, fan1, fan2 } =
        await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("3.0") });
      await vault
        .connect(fan2)
        .stakeForTeam(2, { value: ethers.parseEther("2.0") });

      await factory.lockMatch(1);

      const totalPool = ethers.parseEther("5.0");
      const expectedCharity = (totalPool * 1500n) / 10000n;
      const expectedPlatform = (totalPool * 300n) / 10000n;

      const charityDAOAddr = await charityDAO.getAddress();
      const treasuryBalBefore = await ethers.provider.getBalance(
        treasury.address
      );
      const charityBalBefore =
        await ethers.provider.getBalance(charityDAOAddr);

      await factory.resolveMatch(1, 1);

      const treasuryBalAfter = await ethers.provider.getBalance(
        treasury.address
      );
      const charityBalAfter =
        await ethers.provider.getBalance(charityDAOAddr);

      expect(treasuryBalAfter - treasuryBalBefore).to.equal(expectedPlatform);
      expect(charityBalAfter - charityBalBefore).to.equal(expectedCharity);
      expect(await vault.state()).to.equal(2); // RESOLVED
      expect(await vault.winningTeam()).to.equal(1);
    });
  });

  describe("Claims", function () {
    it("should allow winners to claim proportional rewards", async function () {
      const { vault, factory, fan1, fan2, fan3 } =
        await loadFixture(deployFixture);

      // fan1 & fan3 stake for team 1 (winners), fan2 stakes for team 2
      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("3.0") });
      await vault
        .connect(fan3)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await vault
        .connect(fan2)
        .stakeForTeam(2, { value: ethers.parseEther("2.0") });

      await factory.lockMatch(1);
      await factory.resolveMatch(1, 1);

      const winnersPool = await vault.winnersPool();
      const winningTeamPool = await vault.teamPools(1);

      // fan1 should get 3/4 of winners pool
      const expectedFan1 =
        (ethers.parseEther("3.0") * winnersPool) / winningTeamPool;
      const balBefore = await ethers.provider.getBalance(fan1.address);

      const tx = await vault.connect(fan1).claimReward();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

      const balAfter = await ethers.provider.getBalance(fan1.address);
      expect(balAfter - balBefore + gasUsed).to.equal(expectedFan1);
    });

    it("should reject claim from losers", async function () {
      const { vault, factory, fan1, fan2 } =
        await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await vault
        .connect(fan2)
        .stakeForTeam(2, { value: ethers.parseEther("1.0") });

      await factory.lockMatch(1);
      await factory.resolveMatch(1, 1);

      await expect(
        vault.connect(fan2).claimReward()
      ).to.be.revertedWithCustomError(vault, "NotWinner");
    });

    it("should reject double claim", async function () {
      const { vault, factory, fan1, fan2 } =
        await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await vault
        .connect(fan2)
        .stakeForTeam(2, { value: ethers.parseEther("1.0") });

      await factory.lockMatch(1);
      await factory.resolveMatch(1, 1);

      await vault.connect(fan1).claimReward();
      await expect(
        vault.connect(fan1).claimReward()
      ).to.be.revertedWithCustomError(vault, "AlreadyClaimed");
    });

    it("should reject claim before resolution", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });

      await expect(
        vault.connect(fan1).claimReward()
      ).to.be.revertedWithCustomError(vault, "MatchNotResolved");
    });
  });

  describe("Match Cancellation", function () {
    it("should cancel match from OPEN state and allow refunds", async function () {
      const { vault, factory, fan1 } = await loadFixture(deployFixture);
      const stakeAmount = ethers.parseEther("1.0");

      await vault.connect(fan1).stakeForTeam(1, { value: stakeAmount });

      await factory.cancelMatch(1);
      expect(await vault.state()).to.equal(3); // CANCELLED

      const balBefore = await ethers.provider.getBalance(fan1.address);
      const tx = await vault.connect(fan1).claimRefund();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(fan1.address);

      expect(balAfter - balBefore + gasUsed).to.equal(stakeAmount);
    });

    it("should cancel match from LOCKED state and allow refunds", async function () {
      const { vault, factory, fan1 } = await loadFixture(deployFixture);
      const stakeAmount = ethers.parseEther("2.5");

      await vault.connect(fan1).stakeForTeam(1, { value: stakeAmount });
      await factory.lockMatch(1);

      await factory.cancelMatch(1);
      expect(await vault.state()).to.equal(3); // CANCELLED

      const balBefore = await ethers.provider.getBalance(fan1.address);
      const tx = await vault.connect(fan1).claimRefund();
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balAfter = await ethers.provider.getBalance(fan1.address);

      expect(balAfter - balBefore + gasUsed).to.equal(stakeAmount);
    });

    it("should reject double refund claim", async function () {
      const { vault, factory, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });
      await factory.cancelMatch(1);

      await vault.connect(fan1).claimRefund();
      await expect(
        vault.connect(fan1).claimRefund()
      ).to.be.revertedWithCustomError(vault, "AlreadyClaimed");
    });

    it("should reject refund if match is not cancelled", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.0") });

      await expect(
        vault.connect(fan1).claimRefund()
      ).to.be.revertedWithCustomError(vault, "MatchNotCancellable");
    });
  });

  describe("View Functions", function () {
    it("should return correct match info", async function () {
      const { vault, fan1, fan2 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("2.0") });
      await vault
        .connect(fan2)
        .stakeForTeam(2, { value: ethers.parseEther("1.0") });

      const info = await vault.getMatchInfo();
      expect(info.totalPool).to.equal(ethers.parseEther("3.0"));
      expect(info.teamAPool).to.equal(ethers.parseEther("2.0"));
      expect(info.teamBPool).to.equal(ethers.parseEther("1.0"));
      expect(info.state).to.equal(0); // OPEN
    });

    it("should return correct user stake info", async function () {
      const { vault, fan1 } = await loadFixture(deployFixture);

      await vault
        .connect(fan1)
        .stakeForTeam(1, { value: ethers.parseEther("1.5") });

      const [amount, teamId, claimed] = await vault.getUserStake(
        fan1.address
      );
      expect(amount).to.equal(ethers.parseEther("1.5"));
      expect(teamId).to.equal(1);
      expect(claimed).to.equal(false);
    });
  });
});
