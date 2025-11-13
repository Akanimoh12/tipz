// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TipzProfile} from "../src/TipzProfile.sol";
import {TipzCore} from "../src/TipzCore.sol";

/**
 * @title DeployScript
 * @notice Deployment script for Tipz platform contracts on Somnia Network
 * @dev Run with: forge script script/Deploy.s.sol:DeployScript --rpc-url $SOMNIA_TESTNET_RPC_URL --broadcast --verify -vvvv
 */
contract DeployScript is Script {
    function run() external {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address platformWallet = vm.envAddress("PLATFORM_WALLET_ADDRESS");
        
        // Validate platform wallet
        require(platformWallet != address(0), "Invalid platform wallet address");
        
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("==========================================");
        console.log("DEPLOYING TO SOMNIA TESTNET (DREAM)");
        console.log("==========================================");
        console.log("Deployer:", deployer);
        console.log("Platform Wallet:", platformWallet);
        console.log("Chain ID:", block.chainid);
        console.log("==========================================\n");
        
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // 1. Deploy TipzProfile
        console.log("[1/3] Deploying TipzProfile...");
        TipzProfile tipzProfile = new TipzProfile();
        console.log("      TipzProfile deployed at:", address(tipzProfile));
        console.log("      Owner:", tipzProfile.owner());
        
        // 2. Deploy TipzCore
        console.log("\n[2/3] Deploying TipzCore...");
        TipzCore tipzCore = new TipzCore(address(tipzProfile), payable(platformWallet));
        console.log("      TipzCore deployed at:", address(tipzCore));
        console.log("      Owner:", tipzCore.owner());
        console.log("      Platform Wallet:", tipzCore.platformWallet());
        console.log("      Platform Fee Rate:", tipzCore.PLATFORM_FEE_RATE(), "basis points (2%)");
        
        // 3. Transfer ownership of TipzProfile to TipzCore
        console.log("\n[3/3] Transferring TipzProfile ownership to TipzCore...");
        tipzProfile.transferOwnership(address(tipzCore));
        console.log("      Ownership transferred successfully!");
        console.log("      New owner:", tipzProfile.owner());
        
        vm.stopBroadcast();
        
        // Output deployment summary
        console.log("\n==========================================");
        console.log("DEPLOYMENT SUCCESSFUL!");
        console.log("==========================================");
        console.log("TipzProfile: %s", address(tipzProfile));
        console.log("TipzCore:    %s", address(tipzCore));
        console.log("==========================================");
        console.log("\nVerify contracts with:");
        console.log("forge verify-contract %s TipzProfile --chain-id 50311 --watch", address(tipzProfile));
        console.log("forge verify-contract %s TipzCore --chain-id 50311 --watch --constructor-args $(cast abi-encode \"constructor(address,address)\" %s %s)", address(tipzCore), address(tipzProfile), platformWallet);
        console.log("\n==========================================");
        console.log("Add these to your frontend/.env:");
        console.log("==========================================");
        console.log("VITE_TIPZ_PROFILE_ADDRESS=%s", address(tipzProfile));
        console.log("VITE_TIPZ_CORE_ADDRESS=%s", address(tipzCore));
        console.log("==========================================\n");
    }
}
