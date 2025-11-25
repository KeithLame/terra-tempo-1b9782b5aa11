import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("terra-tempo:grant-expert")
  .addParam("contract", "The TerraTempoCore contract address")
  .addParam("expert", "The address to grant expert role")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [signer] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("TerraTempoCore");
    const contract = contractFactory.attach(taskArguments.contract);

    const tx = await contract.connect(signer).grantExpertRole(taskArguments.expert);
    const receipt = await tx.wait();

    console.log(`Expert role granted to ${taskArguments.expert}`);
    console.log(`Transaction hash: ${receipt?.hash}`);
  });

task("terra-tempo:revoke-expert")
  .addParam("contract", "The TerraTempoCore contract address")
  .addParam("expert", "The address to revoke expert role")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [signer] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("TerraTempoCore");
    const contract = contractFactory.attach(taskArguments.contract);

    const tx = await contract.connect(signer).revokeExpertRole(taskArguments.expert);
    const receipt = await tx.wait();

    console.log(`Expert role revoked from ${taskArguments.expert}`);
    console.log(`Transaction hash: ${receipt?.hash}`);
  });

task("terra-tempo:check-expert")
  .addParam("contract", "The TerraTempoCore contract address")
  .addParam("address", "The address to check")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contractFactory = await ethers.getContractFactory("TerraTempoCore");
    const contract = contractFactory.attach(taskArguments.contract);

    const isExpert = await contract.isExpert(taskArguments.address);
    console.log(`Address ${taskArguments.address} is ${isExpert ? "an expert" : "not an expert"}`);
  });

task("terra-tempo:get-stats")
  .addParam("contract", "The TerraTempoCore contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contractFactory = await ethers.getContractFactory("TerraTempoCore");
    const contract = contractFactory.attach(taskArguments.contract);

    const totalRecords = await contract.totalRecords();
    const totalGuidance = await contract.totalGuidance();
    const totalActive = await contract.getTotalActiveRecords();

    console.log("=== Terra Tempo Statistics ===");
    console.log(`Total Records: ${totalRecords}`);
    console.log(`Active Records: ${totalActive}`);
    console.log(`Total Guidance: ${totalGuidance}`);
  });

task("terra-tempo:get-my-records")
  .addParam("contract", "The TerraTempoCore contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const [signer] = await ethers.getSigners();
    const contractFactory = await ethers.getContractFactory("TerraTempoCore");
    const contract = contractFactory.attach(taskArguments.contract);

    const recordIds = await contract.connect(signer).getMyRecordIds();
    console.log(`Farmer ${await signer.getAddress()} has ${recordIds.length} records:`);
    recordIds.forEach((id, index) => {
      console.log(`  ${index + 1}. Record ID: ${id}`);
    });
  });

task("terra-tempo:get-guidance")
  .addParam("contract", "The TerraTempoCore contract address")
  .addParam("id", "The guidance ID")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contractFactory = await ethers.getContractFactory("TerraTempoCore");
    const contract = contractFactory.attach(taskArguments.contract);

    const guidance = await contract.getGuidance(taskArguments.id);

    console.log("=== Guidance Details ===");
    console.log(`ID: ${guidance.id}`);
    console.log(`Title: ${guidance.title}`);
    console.log(`Expert: ${guidance.expert}`);
    console.log(`IPFS Hash: ${guidance.ipfsHash}`);
    console.log(`Category: ${guidance.category}`);
    console.log(`Published At: ${new Date(Number(guidance.publishedAt) * 1000).toISOString()}`);
    console.log(`Helpful Votes: ${guidance.helpfulVotes}`);
  });

task("terra-tempo:list-guidance")
  .addParam("contract", "The TerraTempoCore contract address")
  .setAction(async function (taskArguments: TaskArguments, { ethers }) {
    const contractFactory = await ethers.getContractFactory("TerraTempoCore");
    const contract = contractFactory.attach(taskArguments.contract);

    const guidanceIds = await contract.getAllGuidanceIds();

    console.log(`Total Guidance: ${guidanceIds.length}`);
    console.log("=== Guidance List ===");

    for (const id of guidanceIds) {
      const guidance = await contract.getGuidance(id);
      console.log(`\n[${id}] ${guidance.title}`);
      console.log(`    Expert: ${guidance.expert}`);
      console.log(`    Votes: ${guidance.helpfulVotes}`);
    }
  });


