import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { TerraTempoCore, TerraTempoCore__factory } from "../types";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  owner: HardhatEthersSigner;
  farmer1: HardhatEthersSigner;
  farmer2: HardhatEthersSigner;
  expert: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("TerraTempoCore")) as TerraTempoCore__factory;
  const contract = (await factory.deploy()) as TerraTempoCore;
  const contractAddress = await contract.getAddress();

  return { contract, contractAddress };
}

describe("TerraTempoCore (FHEVM v0.9)", function () {
  let signers: Signers;
  let contract: TerraTempoCore;
  let contractAddress: string;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      owner: ethSigners[0],
      farmer1: ethSigners[1],
      farmer2: ethSigners[2],
      expert: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ contract, contractAddress } = await deployFixture());
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await contract.owner()).to.equal(signers.owner.address);
    });

    it("Should grant owner expert role by default", async function () {
      expect(await contract.isExpert(signers.owner.address)).to.be.true;
    });

    it("Should initialize with zero records", async function () {
      expect(await contract.totalRecords()).to.equal(0);
    });

    it("Should initialize with zero guidance", async function () {
      expect(await contract.totalGuidance()).to.equal(0);
    });
  });

  describe("Crop Record Submission (3 fields)", function () {
    it("Should allow farmer to submit encrypted crop record", async function () {
      // Encrypt inputs using fhevm v0.9 API
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0)   // cropType: Wheat
        .add32(500) // landArea: 5.00 hectares (scaled by 100)
        .add32(5000) // actualYield: 5000 kg
        .encrypt();

      const tx = await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0],
        encryptedData.inputProof,
        encryptedData.handles[1],
        encryptedData.inputProof,
        encryptedData.handles[2],
        encryptedData.inputProof
      );

      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      const recordId = await contract.totalRecords();
      expect(recordId).to.equal(1n);
    });

    it("Should emit CropRecordSubmitted event", async function () {
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer2.address)
        .add32(1)   // cropType: Corn
        .add32(300) // landArea: 3.00 hectares
        .add32(4000) // actualYield: 4000 kg
        .encrypt();

      await expect(
        contract.connect(signers.farmer2).submitCropRecord(
          encryptedData.handles[0],
          encryptedData.inputProof,
          encryptedData.handles[1],
          encryptedData.inputProof,
          encryptedData.handles[2],
          encryptedData.inputProof
        )
      )
        .to.emit(contract, "CropRecordSubmitted")
        .withArgs(1n, signers.farmer2.address, (value: bigint) => value > 0n);
    });

    it("Should return farmer's record IDs", async function () {
      // Submit a record first
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      const recordIds = await contract.connect(signers.farmer1).getMyRecordIds();
      expect(recordIds.length).to.equal(1);
      expect(recordIds[0]).to.equal(1n);
    });

    it("Should allow farmer to get their own record data", async function () {
      // Submit a record first
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      const data = await contract.connect(signers.farmer1).getRecordData(1);
      expect(data.submittedAt).to.be.greaterThan(0);

      // Decrypt the encrypted values
      const decryptedCropType = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        data.cropType,
        contractAddress,
        signers.farmer1
      );
      expect(decryptedCropType).to.equal(0); // Wheat

      const decryptedLandArea = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        data.landArea,
        contractAddress,
        signers.farmer1
      );
      expect(decryptedLandArea).to.equal(500); // 5.00 hectares * 100

      const decryptedYield = await fhevm.userDecryptEuint(
        FhevmType.euint32,
        data.actualYield,
        contractAddress,
        signers.farmer1
      );
      expect(decryptedYield).to.equal(5000); // 5000 kg
    });

    it("Should not allow other farmers to access record", async function () {
      // farmer1 submits a record
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      // farmer2 tries to access farmer1's record
      await expect(contract.connect(signers.farmer2).getRecordData(1))
        .to.be.revertedWith("Not record owner");
    });
  });

  describe("Personal Statistics", function () {
    it("Should calculate personal stats for farmer", async function () {
      // Submit a record first
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      // Just verify the function can be called successfully
      const result = await contract.connect(signers.farmer1).getPersonalStats();
      expect(result).to.not.be.undefined;
    });

    it("Should return stats for farmer with no records", async function () {
      // Just verify the function can be called successfully
      const result = await contract.connect(signers.farmer2).getPersonalStats();
      expect(result).to.not.be.undefined;
    });
  });

  describe("Record Deletion", function () {
    it("Should allow farmer to delete their record", async function () {
      // Submit a record first
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      // Delete the record
      await contract.connect(signers.farmer1).deleteRecord(1);
      
      // Check that active record count decreased
      const activeCount = await contract.getTotalActiveRecords();
      expect(activeCount).to.equal(0n);
    });

    it("Should not allow deleting others' records", async function () {
      // farmer1 submits a record
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      // farmer2 tries to delete farmer1's record
      await expect(contract.connect(signers.farmer2).deleteRecord(1))
        .to.be.revertedWith("Not record owner");
    });
  });

  describe("Expert Role Management", function () {
    it("Should allow owner to grant expert role", async function () {
      await expect(contract.connect(signers.owner).grantExpertRole(signers.expert.address))
        .to.emit(contract, "ExpertGranted")
        .withArgs(signers.expert.address, (value: bigint) => value > 0n);

      expect(await contract.isExpert(signers.expert.address)).to.be.true;
    });

    it("Should not allow non-owner to grant expert role", async function () {
      await expect(
        contract.connect(signers.farmer1).grantExpertRole(signers.expert.address)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should allow owner to revoke expert role", async function () {
      // Grant first
      await contract.connect(signers.owner).grantExpertRole(signers.expert.address);
      
      // Then revoke
      await contract.connect(signers.owner).revokeExpertRole(signers.expert.address);
      expect(await contract.isExpert(signers.expert.address)).to.be.false;
    });
  });

  describe("Aggregated Statistics", function () {
    it("Should return aggregated stats for experts", async function () {
      // Grant expert role
      await contract.connect(signers.owner).grantExpertRole(signers.expert.address);

      // Submit a record
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      // Just verify the function can be called successfully
      const result = await contract.connect(signers.expert).getAggregatedStats();
      expect(result).to.not.be.undefined;
    });

    it("Should not allow non-experts to access aggregated stats", async function () {
      await expect(contract.connect(signers.farmer1).getAggregatedStats())
        .to.be.revertedWith("Not an expert");
    });
  });

  describe("Knowledge Base - Guidance", function () {
    it("Should allow expert to submit guidance", async function () {
      // Grant expert role
      await contract.connect(signers.owner).grantExpertRole(signers.expert.address);

      await expect(
        contract.connect(signers.expert).submitGuidance(
          "Best Practices for Wheat Farming",
          "QmXxxx...ipfsHash",
          0 // Wheat category
        )
      )
        .to.emit(contract, "GuidanceSubmitted")
        .withArgs(1n, signers.expert.address, "Best Practices for Wheat Farming", (value: bigint) => value > 0n);

      const guidanceId = await contract.totalGuidance();
      expect(guidanceId).to.equal(1n);
    });

    it("Should not allow non-experts to submit guidance", async function () {
      await expect(
        contract.connect(signers.farmer1).submitGuidance("Fake Guidance", "QmYyyy", 1)
      ).to.be.revertedWith("Not an expert");
    });

    it("Should allow anyone to view guidance", async function () {
      // Grant expert role and submit guidance
      await contract.connect(signers.owner).grantExpertRole(signers.expert.address);
      await contract.connect(signers.expert).submitGuidance(
        "Best Practices for Wheat Farming",
        "QmXxxx...ipfsHash",
        0
      );

      const guidance = await contract.connect(signers.farmer1).getGuidance(1);
      expect(guidance.title).to.equal("Best Practices for Wheat Farming");
      expect(guidance.ipfsHash).to.equal("QmXxxx...ipfsHash");
      expect(guidance.category).to.equal(0n);
      expect(guidance.helpfulVotes).to.equal(0n);
    });

    it("Should allow voting on guidance", async function () {
      // Grant expert role and submit guidance
      await contract.connect(signers.owner).grantExpertRole(signers.expert.address);
      await contract.connect(signers.expert).submitGuidance(
        "Best Practices",
        "QmXxxx",
        0
      );

      await expect(contract.connect(signers.farmer1).voteHelpful(1))
        .to.emit(contract, "GuidanceVoted")
        .withArgs(1n, signers.farmer1.address, 1n);

      const guidance = await contract.getGuidance(1);
      expect(guidance.helpfulVotes).to.equal(1n);
    });

    it("Should not allow double voting", async function () {
      // Grant expert role and submit guidance
      await contract.connect(signers.owner).grantExpertRole(signers.expert.address);
      await contract.connect(signers.expert).submitGuidance("Best Practices", "QmXxxx", 0);

      // Vote once
      await contract.connect(signers.farmer1).voteHelpful(1);

      // Try to vote again
      await expect(contract.connect(signers.farmer1).voteHelpful(1))
        .to.be.revertedWith("Already voted");
    });

    it("Should return all guidance IDs", async function () {
      // Grant expert role and submit guidance
      await contract.connect(signers.owner).grantExpertRole(signers.expert.address);
      await contract.connect(signers.expert).submitGuidance("Best Practices", "QmXxxx", 0);

      const ids = await contract.getAllGuidanceIds();
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(1n);
    });
  });

  describe("Public View Functions", function () {
    it("Should return total active records count", async function () {
      // Submit a record
      const encryptedData = await fhevm
        .createEncryptedInput(contractAddress, signers.farmer1.address)
        .add32(0).add32(500).add32(5000)
        .encrypt();

      await contract.connect(signers.farmer1).submitCropRecord(
        encryptedData.handles[0], encryptedData.inputProof,
        encryptedData.handles[1], encryptedData.inputProof,
        encryptedData.handles[2], encryptedData.inputProof
      );

      const count = await contract.getTotalActiveRecords();
      expect(count).to.equal(1n);
    });
  });
});
