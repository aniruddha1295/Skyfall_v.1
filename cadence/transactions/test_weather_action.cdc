// test_weather_action.cdc
// Transaction to create and execute a weather update action (Forte Action)

import SimpleWeatherOracle from 0xf8d6e0586b0a20c7

transaction(
    stationId: String,
    rainfall: UFix64,
    windSpeed: UFix64,
    temperature: UFix64,
    source: String
) {
    
    let actionManager: &SimpleWeatherOracle.WeatherActionManager
    
    prepare(signer: auth(Storage, SaveValue) &Account) {
        // Get or create action manager
        if signer.storage.borrow<&SimpleWeatherOracle.WeatherActionManager>(from: SimpleWeatherOracle.ActionManagerStoragePath) == nil {
            let actionManager <- SimpleWeatherOracle.createActionManager()
            signer.storage.save(<-actionManager, to: SimpleWeatherOracle.ActionManagerStoragePath)
        }
        
        self.actionManager = signer.storage.borrow<&SimpleWeatherOracle.WeatherActionManager>(
            from: SimpleWeatherOracle.ActionManagerStoragePath
        ) ?? panic("Could not borrow action manager")
    }
    
    execute {
        // Create weather update action (Forte Action)
        let actionId = self.actionManager.createWeatherUpdateAction(
            stationId: stationId,
            rainfall: rainfall,
            windSpeed: windSpeed,
            temperature: temperature,
            source: source
        )
        
        log("Created weather action with ID: ".concat(actionId))
        
        // Execute the action immediately
        let success = self.actionManager.executeAction(actionId: actionId)
        
        if success {
            log("✅ Weather action executed successfully!")
        } else {
            log("❌ Weather action execution failed!")
        }
    }
}
