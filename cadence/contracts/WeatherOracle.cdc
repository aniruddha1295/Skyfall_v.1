// WeatherOracle.cdc
// Flow Cadence contract for weather data oracle

access(all) contract WeatherOracle {
    
    // Events
    access(all) event WeatherDataUpdated(location: String, value: UFix64, timestamp: UFix64)
    access(all) event OracleAuthorized(oracle: Address)
    access(all) event OracleRevoked(oracle: Address)
    
    // Weather data structure
    access(all) struct WeatherData {
        access(all) let location: String
        access(all) let value: UFix64 // Weather value (rainfall in mm, wind speed in mph, etc.)
        access(all) let timestamp: UFix64
        access(all) let dataType: String // "rainfall", "wind_speed", "temperature"
        access(all) let source: String // Data source identifier
        access(all) let verified: Bool
        
        init(location: String, value: UFix64, dataType: String, source: String) {
            self.location = location
            self.value = value
            self.timestamp = getCurrentBlock().timestamp
            self.dataType = dataType
            self.source = source
            self.verified = true
        }
    }
    
    // Storage
    access(all) var weatherData: {String: WeatherData}
    access(all) var authorizedOracles: {Address: Bool}
    access(all) var admin: Address
    
    // Admin resource
    access(all) resource Admin {
        access(all) fun authorizeOracle(oracle: Address) {
            WeatherOracle.authorizedOracles[oracle] = true
            emit OracleAuthorized(oracle: oracle)
        }
        
        access(all) fun revokeOracle(oracle: Address) {
            let _ = WeatherOracle.authorizedOracles.remove(key: oracle)
            emit OracleRevoked(oracle: oracle)
        }
    }
    
    // Oracle resource
    access(all) resource Oracle {
        access(all) fun updateWeatherData(
            location: String,
            value: UFix64,
            dataType: String,
            source: String
        ) {
            pre {
                WeatherOracle.authorizedOracles.containsKey(self.owner!.address): "Oracle not authorized"
            }
            
            let data = WeatherData(
                location: location,
                value: value,
                dataType: dataType,
                source: source
            )
            
            WeatherOracle.weatherData[location] = data
            emit WeatherDataUpdated(location: location, value: value, timestamp: data.timestamp)
        }
    }
    
    // Public functions
    access(all) fun getWeatherData(location: String): WeatherData? {
        return self.weatherData[location]
    }
    
    access(all) fun getAllWeatherData(): {String: WeatherData} {
        return self.weatherData
    }
    
    access(all) fun isOracleAuthorized(oracle: Address): Bool {
        return self.authorizedOracles.containsKey(oracle)
    }
    
    access(all) fun createOracle(): @Oracle {
        return <- create Oracle()
    }
    
    init() {
        self.weatherData = {}
        self.authorizedOracles = {}
        self.admin = self.account.address
        
        // Create admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: /storage/WeatherOracleAdmin)
        
        // Authorize the deployer as an oracle
        self.authorizedOracles[self.account.address] = true
    }
}
