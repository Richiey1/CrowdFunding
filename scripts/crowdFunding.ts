import { ethers } from "hardhat";
import { Contract } from "ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import * as hre from "hardhat";

async function main() {
  try {
    // Get deployer's account
    const [deployer]: SignerWithAddress[] = await ethers.getSigners();
    console.log("\n====== Deployment Started ======");
    console.log(`Deploying from: ${deployer.address}`);

    // Log account balance
    const balance = await deployer.provider?.getBalance(deployer.address);
    console.log(`Account balance: ${balance ? ethers.formatEther(balance) : 0} ETH\n`);

    // Deploy Crowdfunding
    console.log("Deploying Crowdfunding contract...");
    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    const crowdfunding = await Crowdfunding.deploy();

    console.log("Waiting for deployment...");
    await crowdfunding.waitForDeployment();
    const crowdfundingAddress = await crowdfunding.getAddress();

    // Wait for confirmations
    const CONFIRMATIONS = 5;
    console.log(`Waiting for ${CONFIRMATIONS} confirmations...`);
    await crowdfunding.deploymentTransaction()?.wait(CONFIRMATIONS);

    // Print initial deployment info
    console.log("\n====== Deployment Info ======");
    console.log(`Network: ${hre.network.name}`);
    console.log(`Contract address: ${crowdfundingAddress}`);
    console.log(`Transaction hash: ${crowdfunding.deploymentTransaction()?.hash}`);

    // Verify contract
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("\nVerifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: crowdfundingAddress,
          constructorArguments: [],
        });
        console.log("Contract verified successfully!");
      } catch (error: any) {
        if (error.message.toLowerCase().includes("already verified")) {
          console.log("Contract is already verified!");
        } else {
          console.error("Error during verification:", error);
        }
      }
    }

    // Final deployment summary
    console.log("\n====== Deployment Summary ======");
    console.log(`Network: ${hre.network.name}`);
    console.log(`Contract address: ${crowdfundingAddress}`);
    console.log(`Deploy transaction: ${crowdfunding.deploymentTransaction()?.hash}`);
    console.log(`Gas used: ${crowdfunding.deploymentTransaction()?.gasLimit.toString()}`);
    console.log("=============================\n");

  } catch (error) {
    console.error("\nDeployment failed:", error);
    process.exitCode = 1;
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Deployment error:", error);
    process.exit(1);
  });