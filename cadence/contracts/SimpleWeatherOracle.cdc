// SimpleWeatherOracle.cdc
// Simplified, working version of WeatherOracle with Forte Actions
// Cadence 1.0+ compliant and compilation-ready

access(all) contract SimpleWeatherOracle {
    
    // Events
    access(all) event WeatherDataUpdated(stationId: String, rainfall: UFix64, windSpeed: UFix64, timestamp: UFix64)
    access(all) event ActionExecuted(actionId: String, executor: Address, timestamp: UFix64)
    
    // Storage paths
    access(all) let ActionManagerStoragePath: StoragePath
    access(all) let ActionManagerPublicPath: PublicPath
    
    // Weather data structure
    access(all) struct WeatherData {
        access(all) let rainfall: UFix64
        access(all) let windSpeed: UFix64
        access(all) let temperature: UFix64
        access(all) let timestamp: UFix64
        access(all) let source: String
        
        init(rainfall: UFix64, windSpeed: UFix64, temperature: UFix64, source: String) {
            self.rainfall = rainfall
            self.windSpeed = windSpeed
            self.temperature = temperature
            self.timestamp = getCurrentBlock().timestamp
            self.source = source
        }
    }
    
    // Forte Action Interface
    access(all) resource interface WeatherActionInterface {
        access(all) fun executeAction(): Bool
        access(all) fun getActionId(): String
        access(all) fun getExecutor(): Address
    }
    
    // Weather Update Action (Forte Action)
    access(all) resource WeatherUpdateAction: WeatherActionInterface {
        access(all) let actionId: String
        access(all) let stationId: String
        access(all) let rainfall: UFix64
        access(all) let windSpeed: UFix64
        access(all) let temperature: UFix64
        access(all) let source: String
        access(all) let executor: Address
        access(all) var executed: Bool
        
        init(
            actionId: String,
            stationId: String,
            rainfall: UFix64,
            windSpeed: UFix64,
            temperature: UFix64,
            source: String,
            executor: Address
        ) {
            self.actionId = actionId
            self.stationId = stationId
            self.rainfall = rainfall
            self.windSpeed = windSpeed
            self.temperature = temperature
            self.source = source
            self.executor = executor
            self.executed = false
        }
        
        access(all) fun executeAction(): Bool {
            pre {
                !self.executed: "Action already executed"
            }
            
            let weatherData = WeatherData(
                rainfall: self.rainfall,
                windSpeed: self.windSpeed,
                temperature: self.temperature,
                source: self.source
            )
            
            SimpleWeatherOracle.weatherStations[self.stationId] = weatherData
            self.executed = true
            
            emit WeatherDataUpdated(
                stationId: self.stationId,
                rainfall: self.rainfall,
                windSpeed: self.windSpeed,
                timestamp: getCurrentBlock().timestamp
            )
            
            emit ActionExecuted(
                actionId: self.actionId,
                executor: self.executor,
                timestamp: getCurrentBlock().timestamp
            )
            
            return true
        }
        
        access(all) fun getActionId(): String {
            return self.actionId
        }
        
        access(all) fun getExecutor(): Address {
            return self.executor
        }
    }
    
    // Action Manager
    access(all) resource WeatherActionManager {
        access(all) var pendingActions: @{String: WeatherUpdateAction}
        access(all) var executedActions: {String: Bool}
        
        init() {
            self.pendingActions <- {}
            self.executedActions = {}
        }
        
        access(all) fun createWeatherUpdateAction(
            stationId: String,
            rainfall: UFix64,
            windSpeed: UFix64,
            temperature: UFix64,
            source: String
        ): String {
            let actionId = "weather_".concat(stationId).concat("_").concat(getCurrentBlock().timestamp.toString())
            
            let action <- create WeatherUpdateAction(
                actionId: actionId,
                stationId: stationId,
                rainfall: rainfall,
                windSpeed: windSpeed,
                temperature: temperature,
                source: source,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            let oldAction <- self.pendingActions[actionId] <- action
            destroy oldAction
            
            return actionId
        }
        
        access(all) fun executeAction(actionId: String): Bool {
            pre {
                self.pendingActions.containsKey(actionId): "Action does not exist"
                !self.executedActions.containsKey(actionId): "Action already executed"
            }
            
            let actionRef = &self.pendingActions[actionId] as &WeatherUpdateAction?
                ?? panic("Could not get action reference")
            
            let success = actionRef.executeAction()
            
            if success {
                self.executedActions[actionId] = true
                let action <- self.pendingActions.remove(key: actionId)!
                destroy action
            }
            
            return success
        }
        
        access(all) fun getPendingActions(): [String] {
            return self.pendingActions.keys
        }
    }
    
    // Contract state
    access(all) var weatherStations: {String: WeatherData}
    access(all) var authorizedOracles: {Address: Bool}
    
    init() {
        self.ActionManagerStoragePath = /storage/SimpleWeatherOracleActionManager
        self.ActionManagerPublicPath = /public/SimpleWeatherOracleActionManager
        
        self.weatherStations = {}
        self.authorizedOracles = {}
        
        // Create and store action manager
        let actionManager <- create WeatherActionManager()
        self.account.storage.save(<-actionManager, to: self.ActionManagerStoragePath)
    }
    
    // Public functions
    access(all) fun getWeatherData(stationId: String): WeatherData? {
        return self.weatherStations[stationId]
    }
    
    access(all) fun getAllStations(): [String] {
        return self.weatherStations.keys
    }
    
    access(all) fun authorizeOracle(oracle: Address) {
        self.authorizedOracles[oracle] = true
    }
    
    access(all) fun isAuthorizedOracle(oracle: Address): Bool {
        return self.authorizedOracles[oracle] ?? false
    }
    
    // Function to create action manager for users
    access(all) fun createActionManager(): @WeatherActionManager {
        return <- create WeatherActionManager()
    }
}
