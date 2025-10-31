// WeatherDerivatives.cdc
// Flow Cadence contract for weather derivatives trading

access(all) contract WeatherDerivatives {
    
    // Events
    access(all) event ContractCreated(id: UInt64, creator: Address, strikePrice: UFix64, premium: UFix64)
    access(all) event ContractPurchased(id: UInt64, buyer: Address, quantity: UInt32)
    access(all) event ContractSettled(id: UInt64, actualValue: UFix64, payout: UFix64)
    
    // Contract structure
    access(all) struct WeatherContract {
        access(all) let id: UInt64
        access(all) let creator: Address
        access(all) let contractType: String // "rainfall_put", "rainfall_call", "wind_futures"
        access(all) let strikePrice: UFix64 // Strike price in appropriate units
        access(all) let premium: UFix64 // Premium per contract
        access(all) let expiryDate: UFix64 // Unix timestamp
        access(all) let location: String // Weather station location
        access(contract) var totalSupply: UInt32
        access(contract) var purchased: UInt32
        access(contract) var settled: Bool
        access(contract) var settlementValue: UFix64
        
        init(
            id: UInt64,
            creator: Address,
            contractType: String,
            strikePrice: UFix64,
            premium: UFix64,
            expiryDate: UFix64,
            location: String,
            totalSupply: UInt32
        ) {
            self.id = id
            self.creator = creator
            self.contractType = contractType
            self.strikePrice = strikePrice
            self.premium = premium
            self.expiryDate = expiryDate
            self.location = location
            self.totalSupply = totalSupply
            self.purchased = 0
            self.settled = false
            self.settlementValue = 0.0
        }
        
        access(contract) fun setPurchased(_ newPurchased: UInt32) {
            self.purchased = newPurchased
        }
        
        access(contract) fun setSettled(_ isSettled: Bool) {
            self.settled = isSettled
        }
        
        access(contract) fun setSettlementValue(_ value: UFix64) {
            self.settlementValue = value
        }
    }
    
    // Position structure
    access(all) struct Position {
        access(all) let contractId: UInt64
        access(all) let holder: Address
        access(all) let quantity: UInt32
        access(all) let entryPrice: UFix64
        access(all) let timestamp: UFix64
        
        init(contractId: UInt64, holder: Address, quantity: UInt32, entryPrice: UFix64) {
            self.contractId = contractId
            self.holder = holder
            self.quantity = quantity
            self.entryPrice = entryPrice
            self.timestamp = getCurrentBlock().timestamp
        }
    }
    
    // Storage
    access(all) var nextContractId: UInt64
    access(all) var contracts: {UInt64: WeatherContract}
    access(all) var positions: {Address: [Position]}
    access(all) var weatherOracle: Address?
    
    // Oracle interface
    access(all) resource interface WeatherOracleInterface {
        access(all) fun updateWeatherData(location: String, value: UFix64, timestamp: UFix64)
        access(all) fun getWeatherData(location: String): UFix64?
    }
    
    // Admin resource
    access(all) resource Admin {
        access(all) fun setWeatherOracle(oracle: Address) {
            WeatherDerivatives.weatherOracle = oracle
        }
        
        access(all) fun settleContract(contractId: UInt64, actualValue: UFix64) {
            pre {
                WeatherDerivatives.contracts.containsKey(contractId): "Contract does not exist"
                !WeatherDerivatives.contracts[contractId]!.settled: "Contract already settled"
            }
            
            let weatherContract = &WeatherDerivatives.contracts[contractId]! as auth(Mutate) &WeatherContract
            weatherContract.setSettled(true)
            weatherContract.setSettlementValue(actualValue)
            
            emit ContractSettled(id: contractId, actualValue: actualValue, payout: actualValue)
        }
    }
    
    // Public functions
    access(all) fun createContract(
        contractType: String,
        strikePrice: UFix64,
        premium: UFix64,
        expiryDate: UFix64,
        location: String,
        totalSupply: UInt32
    ): UInt64 {
        let contractId = self.nextContractId
        let weatherContract = WeatherContract(
            id: contractId,
            creator: self.account.address,
            contractType: contractType,
            strikePrice: strikePrice,
            premium: premium,
            expiryDate: expiryDate,
            location: location,
            totalSupply: totalSupply
        )
        
        self.contracts[contractId] = weatherContract
        self.nextContractId = contractId + 1
        
        emit ContractCreated(
            id: contractId,
            creator: self.account.address,
            strikePrice: strikePrice,
            premium: premium
        )
        
        return contractId
    }
    
    access(all) fun purchaseContract(contractId: UInt64, quantity: UInt32) {
        pre {
            self.contracts.containsKey(contractId): "Contract does not exist"
            !self.contracts[contractId]!.settled: "Contract already settled"
            self.contracts[contractId]!.purchased + quantity <= self.contracts[contractId]!.totalSupply: "Insufficient supply"
        }
        
        let weatherContract = &self.contracts[contractId]! as auth(Mutate) &WeatherContract
        let totalCost = weatherContract.premium * UFix64(quantity)
        
        // Update contract state
        weatherContract.setPurchased(weatherContract.purchased + quantity)
        
        // Create position
        let position = Position(
            contractId: contractId,
            holder: self.account.address,
            quantity: quantity,
            entryPrice: weatherContract.premium
        )
        
        if self.positions[self.account.address] == nil {
            self.positions[self.account.address] = []
        }
        self.positions[self.account.address]!.append(position)
        
        emit ContractPurchased(id: contractId, buyer: self.account.address, quantity: quantity)
    }
    
    access(all) fun getContract(contractId: UInt64): WeatherContract? {
        return self.contracts[contractId]
    }
    
    access(all) fun getUserPositions(user: Address): [Position]? {
        return self.positions[user]
    }
    
    access(all) fun getAllContracts(): {UInt64: WeatherContract} {
        return self.contracts
    }
    
    init() {
        self.nextContractId = 1
        self.contracts = {}
        self.positions = {}
        self.weatherOracle = nil
        
        // Create admin resource
        let admin <- create Admin()
        self.account.storage.save(<-admin, to: /storage/WeatherDerivativesAdmin)
    }
}
