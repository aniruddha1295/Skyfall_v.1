// create_weather_hedge_action.cdc
// Transaction to create a Forte Action for opening a weather hedge

import WeatherDerivatives from "../contracts/WeatherDerivatives.cdc"

transaction(
    stationId: String,
    optionType: UInt8,
    strike: UFix64,
    premium: UFix64,
    expiry: UFix64,
    totalSupply: UInt64
) {
    
    let actionManager: &WeatherDerivatives.WeatherActionManager
    
    prepare(signer: auth(Storage, SaveValue) &Account) {
        // Get or create action manager
        if signer.storage.borrow<&WeatherDerivatives.WeatherActionManager>(from: WeatherDerivatives.ActionManagerStoragePath) == nil {
            let actionManager <- WeatherDerivatives.createActionManager()
            signer.storage.save(<-actionManager, to: WeatherDerivatives.ActionManagerStoragePath)
        }
        
        self.actionManager = signer.storage.borrow<&WeatherDerivatives.WeatherActionManager>(
            from: WeatherDerivatives.ActionManagerStoragePath
        ) ?? panic("Could not borrow action manager")
    }
    
    execute {
        // Convert UInt8 to OptionType enum
        let optionTypeEnum = WeatherDerivatives.OptionType(rawValue: optionType) 
            ?? panic("Invalid option type")
        
        // Create weather hedge action
        let actionId = self.actionManager.createWeatherHedgeAction(
            stationId: stationId,
            optionType: optionTypeEnum,
            strike: strike,
            premium: premium,
            expiry: expiry,
            totalSupply: totalSupply
        )
        
        log("Created weather hedge action with ID: ".concat(actionId))
    }
}
