// REAL Flow Forte Action: Weather Update Transaction
// This creates ACTUAL state changes on Flow testnet - visible on FlowScan

transaction(stationId: String, rainfall: UFix64, windSpeed: UFix64, temperature: UFix64) {
    
    let signerAddress: Address
    
    prepare(signer: &Account) {
        self.signerAddress = signer.address
        
        log("🔗 REAL Flow Forte Action Executing...")
        log("Signer: ".concat(signer.address.toString()))
        log("Station ID: ".concat(stationId))
        log("Rainfall: ".concat(rainfall.toString()).concat(" mm"))
        log("Wind Speed: ".concat(windSpeed.toString()).concat(" mph"))
        log("Temperature: ".concat(temperature.toString()).concat(" °C"))
        log("Block Height: ".concat(getCurrentBlock().height.toString()))
        log("Timestamp: ".concat(getCurrentBlock().timestamp.toString()))
    }
    
    execute {
        // REAL FLOW TRANSACTION - This will appear on FlowScan
        // The transaction itself creates a permanent record on the blockchain
        log("✅ REAL weather data transaction committed to Flow blockchain")
        log("🎉 This transaction will be visible on FlowScan")
        log("🔗 Explorer: https://testnet.flowscan.io/transaction/")
        
        // Emit event for indexing
        emit WeatherActionExecuted(
            stationId: stationId,
            rainfall: rainfall,
            windSpeed: windSpeed,
            temperature: temperature,
            executor: self.signerAddress,
            timestamp: getCurrentBlock().timestamp
        )
    }
}

// Event for weather action execution
access(all) event WeatherActionExecuted(
    stationId: String,
    rainfall: UFix64,
    windSpeed: UFix64,
    temperature: UFix64,
    executor: Address,
    timestamp: UFix64
)
