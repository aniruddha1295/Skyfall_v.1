const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting Flow EVM deployment of RainfallIndex contract...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Use a dedicated oracle address from environment variables, or default to the deployer for testing
  const weatherOracle = process.env.WEATHER_ORACLE_ADDRESS || deployer.address;
  
  console.log("📡 Deploying RainfallIndex contract...");
  const RainfallIndexFactory = await ethers.getContractFactory("RainfallIndex");
  const rainfallIndex = await RainfallIndexFactory.deploy(weatherOracle);
  
  await rainfallIndex.waitForDeployment();
  const contractAddress = await rainfallIndex.getAddress();
  
  console.log("✅ RainfallIndex deployed to:", contractAddress);
  console.log("📊 Weather Oracle set to:", weatherOracle);
  
  // Verify contract deployment
  console.log("🔍 Verifying deployment...");
  const deployedOracle = await rainfallIndex.weatherOracle();
  console.log("Contract oracle address:", deployedOracle);
  
  // Get initial weather stations
  const stations = await rainfallIndex.getWeatherStations();
  console.log("🌧️ Initial weather stations:", stations);
  
  // Test initial rainfall data update (simulated)
  console.log("📈 Setting initial rainfall data...");
  try {
    const tx = await rainfallIndex.updateRainfallData(
      "wxm_dallas_001",
      ethers.parseUnits("12.5", 6), // 12.5mm rainfall
      "WeatherXM-Chainlink"
    );
    await tx.wait();
    console.log("✅ Initial rainfall data set successfully");
    
    // Verify data was set
    const rainfallData = await rainfallIndex.getRainfallData("wxm_dallas_001");
    console.log("Stored rainfall data:", {
      value: ethers.formatUnits(rainfallData.value, 6),
      timestamp: new Date(Number(rainfallData.timestamp) * 1000).toISOString(),
      verified: rainfallData.verified,
      source: rainfallData.source
    });
  } catch (error) {
    console.error("Failed to set initial rainfall data:", error);
  }
  
  // Create a sample option for testing
  console.log("🎯 Creating sample rainfall option...");
  try {
    const currentTime = Math.floor(Date.now() / 1000);
    const expiry = currentTime + (7 * 24 * 60 * 60); // 1 week from now
    
    const tx = await rainfallIndex.createOption(
      "wxm_dallas_001",                    // stationId
      15,                                  // strike: 15mm
      ethers.parseEther("0.1"),           // premium: 0.1 FLOW per option
      expiry,                             // expiry: 1 week
      100,                                // totalSupply: 100 options
      true,                               // isCall: true (call option)
      { value: ethers.parseEther("1.5") } // collateral: 1.5 FLOW
    );
    
    const receipt = await tx.wait();
    console.log("✅ Sample option created successfully");
    console.log("Transaction hash:", receipt?.hash);
    
    // Get active options
    const activeOptions = await rainfallIndex.getActiveOptions();
    console.log("Active options:", activeOptions.length);
    
    if (activeOptions.length > 0) {
      const optionDetails = await rainfallIndex.getOptionDetails(activeOptions[0]);
      console.log("Sample option details:", {
        optionId: optionDetails.optionId,
        stationId: optionDetails.stationId,
        strike: optionDetails.strike.toString(),
        premium: ethers.formatEther(optionDetails.premium),
        expiry: new Date(Number(optionDetails.expiry) * 1000).toISOString(),
        totalSupply: optionDetails.totalSupply.toString(),
        isCall: optionDetails.isCall
      });
    }
  } catch (error) {
    console.error("Failed to create sample option:", error);
  }
  
  console.log("\n🎉 Flow EVM deployment completed!");
  console.log("📋 Summary:");
  console.log(`Contract Address: ${contractAddress}`);
  console.log(`Network: ${(await ethers.provider.getNetwork()).name}`);
  console.log(`Chain ID: ${(await ethers.provider.getNetwork()).chainId}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Weather Oracle: ${weatherOracle}`);
  
  // Save deployment info
  const deploymentInfo = {
    contractAddress,
    deployer: deployer.address,
    weatherOracle,
    chainId: (await ethers.provider.getNetwork()).chainId,
    deploymentTime: new Date().toISOString(),
    transactionHash: rainfallIndex.deploymentTransaction()?.hash
  };
  
  console.log("\n📄 Deployment Info (save this for integration):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
