import { ethers } from "hardhat";
import hre from "hardhat";

async function main() {
  try {
    // Get deployer's account
    const [deployer] = await ethers.getSigners();
    console.log(`\nDeploying contracts with account: ${deployer.address}`);

    // Log account balance
    const balance = await deployer.provider?.getBalance(deployer.address);
    console.log(`Account balance: ${balance ? ethers.formatEther(balance) : 0} ETH\n`);

    // Deploy Contract
    console.log("Deploying Crowdfunding contract...");
    const Crowdfunding = await ethers.getContractFactory("Crowdfunding");
    const crowdfunding = await Crowdfunding.deploy();

    console.log("Waiting for deployment...");
    await crowdfunding.waitForDeployment();
    const crowdfundingAddress = await crowdfunding.getAddress();

    console.log(`\nCrowdfunding deployed to: ${crowdfundingAddress}`);
    
    // Wait for a few block confirmations
    const CONFIRMATIONS = 5;
    console.log(`\nWaiting for ${CONFIRMATIONS} confirmations...`);
    await crowdfunding.deploymentTransaction()?.wait(CONFIRMATIONS);

    // Verify the contract
    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      console.log("\nVerifying contract on Etherscan...");
      try {
        await hre.run("verify:verify", {
          address: crowdfundingAddress,
          constructorArguments: [],
        });
        console.log("Contract verified successfully");
      } catch (error: any) {
        if (error.message.includes("already verified")) {
          console.log("Contract is already verified!");
        } else {
          console.error("Error verifying contract:", error);
        }
      }
    }

    // Print deployment summary
    console.log("\n=== Deployment Summary ===");
    console.log(`Network: ${hre.network.name}`);
    console.log(`Contract address: ${crowdfundingAddress}`);
    console.log(`Transaction hash: ${crowdfunding.deploymentTransaction()?.hash}`);
    console.log("======================\n");

  } catch (error) {
    console.error("Deployment failed:", error);
    process.exitCode = 1;
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });