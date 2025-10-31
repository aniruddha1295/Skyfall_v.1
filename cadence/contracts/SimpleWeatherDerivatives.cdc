// SimpleWeatherDerivatives.cdc
// Simplified, working version of WeatherDerivatives with Forte Actions
// Cadence 1.0+ compliant and compilation-ready

access(all) contract SimpleWeatherDerivatives {
    
    // Events
    access(all) event OptionCreated(optionId: String, creator: Address, strike: UFix64, premium: UFix64, expiry: UFix64)
    access(all) event OptionPurchased(optionId: String, buyer: Address, quantity: UInt64, totalCost: UFix64)
    access(all) event OptionSettled(optionId: String, actualValue: UFix64, payout: UFix64)
    access(all) event WeatherHedgeActionCreated(actionId: String, optionType: String, executor: Address)
    
    // Storage paths
    access(all) let ActionManagerStoragePath: StoragePath
    access(all) let TradingStoragePath: StoragePath
    access(all) let ActionManagerPublicPath: PublicPath
    
    // Option types
    access(all) enum OptionType: UInt8 {
        access(all) case RainfallCall
        access(all) case RainfallPut
        access(all) case WindCall
        access(all) case WindPut
    }
    
    // Weather option structure
    access(all) struct WeatherOption {
        access(all) let optionId: String
        access(all) let stationId: String
        access(all) let optionType: OptionType
        access(all) let strike: UFix64
        access(all) let premium: UFix64
        access(all) let expiry: UFix64
        access(all) let totalSupply: UInt64
        access(all) let creator: Address
        access(all) let createdAt: UFix64
        
        init(
            optionId: String,
            stationId: String,
            optionType: OptionType,
            strike: UFix64,
            premium: UFix64,
            expiry: UFix64,
            totalSupply: UInt64,
            creator: Address
        ) {
            self.optionId = optionId
            self.stationId = stationId
            self.optionType = optionType
            self.strike = strike
            self.premium = premium
            self.expiry = expiry
            self.totalSupply = totalSupply
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
        }
    }
    
    // User position structure
    access(all) struct Position {
        access(all) let optionId: String
        access(all) let quantity: UInt64
        access(all) let entryPrice: UFix64
        access(all) let isLong: Bool
        access(all) let timestamp: UFix64
        
        init(optionId: String, quantity: UInt64, entryPrice: UFix64, isLong: Bool) {
            self.optionId = optionId
            self.quantity = quantity
            self.entryPrice = entryPrice
            self.isLong = isLong
            self.timestamp = getCurrentBlock().timestamp
        }
    }
    
    // Forte Action Interface
    access(all) resource interface WeatherHedgeActionInterface {
        access(all) fun executeAction(): Bool
        access(all) fun getActionId(): String
        access(all) fun getExecutor(): Address
        access(all) fun getOptionType(): OptionType
    }
    
    // Weather Hedge Action Resource (Forte Action)
    access(all) resource WeatherHedgeAction: WeatherHedgeActionInterface {
        access(all) let actionId: String
        access(all) let stationId: String
        access(all) let optionType: OptionType
        access(all) let strike: UFix64
        access(all) let premium: UFix64
        access(all) let expiry: UFix64
        access(all) let totalSupply: UInt64
        access(all) let executor: Address
        access(all) var executed: Bool
        
        init(
            actionId: String,
            stationId: String,
            optionType: OptionType,
            strike: UFix64,
            premium: UFix64,
            expiry: UFix64,
            totalSupply: UInt64,
            executor: Address
        ) {
            self.actionId = actionId
            self.stationId = stationId
            self.optionType = optionType
            self.strike = strike
            self.premium = premium
            self.expiry = expiry
            self.totalSupply = totalSupply
            self.executor = executor
            self.executed = false
        }
        
        access(all) fun executeAction(): Bool {
            pre {
                !self.executed: "Action already executed"
                self.expiry > getCurrentBlock().timestamp: "Expiry must be in future"
                self.strike > 0.0: "Strike must be positive"
                self.premium > 0.0: "Premium must be positive"
                self.totalSupply > 0: "Total supply must be positive"
            }
            
            let optionId = self.actionId.concat("_option")
            
            let option = WeatherOption(
                optionId: optionId,
                stationId: self.stationId,
                optionType: self.optionType,
                strike: self.strike,
                premium: self.premium,
                expiry: self.expiry,
                totalSupply: self.totalSupply,
                creator: self.executor
            )
            
            SimpleWeatherDerivatives.options[optionId] = option
            SimpleWeatherDerivatives.activeOptions.append(optionId)
            self.executed = true
            
            emit OptionCreated(
                optionId: optionId,
                creator: self.executor,
                strike: self.strike,
                premium: self.premium,
                expiry: self.expiry
            )
            
            return true
        }
        
        access(all) fun getActionId(): String {
            return self.actionId
        }
        
        access(all) fun getExecutor(): Address {
            return self.executor
        }
        
        access(all) fun getOptionType(): OptionType {
            return self.optionType
        }
    }
    
    // Weather Derivatives Action Manager
    access(all) resource WeatherActionManager {
        access(all) var pendingActions: @{String: WeatherHedgeAction}
        access(all) var executedActions: {String: Bool}
        
        init() {
            self.pendingActions <- {}
            self.executedActions = {}
        }
        
        access(all) fun createWeatherHedgeAction(
            stationId: String,
            optionType: OptionType,
            strike: UFix64,
            premium: UFix64,
            expiry: UFix64,
            totalSupply: UInt64
        ): String {
            let actionId = "hedge_".concat(stationId).concat("_").concat(getCurrentBlock().timestamp.toString())
            
            let action <- create WeatherHedgeAction(
                actionId: actionId,
                stationId: stationId,
                optionType: optionType,
                strike: strike,
                premium: premium,
                expiry: expiry,
                totalSupply: totalSupply,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            let oldAction <- self.pendingActions[actionId] <- action
            destroy oldAction
            
            emit WeatherHedgeActionCreated(
                actionId: actionId,
                optionType: optionType.rawValue.toString(),
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            return actionId
        }
        
        access(all) fun executeAction(actionId: String): Bool {
            pre {
                self.pendingActions.containsKey(actionId): "Action does not exist"
                !self.executedActions.containsKey(actionId): "Action already executed"
            }
            
            let actionRef = &self.pendingActions[actionId] as &WeatherHedgeAction?
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
    
    // Trading Manager (Simplified)
    access(all) resource TradingManager {
        access(all) var userPositions: {Address: {String: Position}}
        access(all) var userBalances: {Address: UFix64}
        
        init() {
            self.userPositions = {}
            self.userBalances = {}
        }
        
        access(all) fun purchaseOption(optionId: String, quantity: UInt64, payment: UFix64) {
            pre {
                SimpleWeatherDerivatives.options.containsKey(optionId): "Option does not exist"
                quantity > 0: "Quantity must be positive"
            }
            
            let option = SimpleWeatherDerivatives.options[optionId]!
            let totalCost = option.premium * UFix64(quantity)
            
            assert(payment >= totalCost, message: "Insufficient payment")
            assert(getCurrentBlock().timestamp < option.expiry, message: "Option has expired")
            
            let buyer = self.owner?.address ?? panic("No owner address")
            
            // Initialize user positions if needed
            if self.userPositions[buyer] == nil {
                self.userPositions[buyer] = {}
            }
            
            let position = Position(
                optionId: optionId,
                quantity: quantity,
                entryPrice: option.premium,
                isLong: true
            )
            
            // Update user positions dictionary
            var updatedPositions = self.userPositions[buyer]!
            updatedPositions[optionId] = position
            self.userPositions[buyer] = updatedPositions
            
            // Handle payment
            if self.userBalances[buyer] == nil {
                self.userBalances[buyer] = 0.0
            }
            
            if payment > totalCost {
                self.userBalances[buyer] = self.userBalances[buyer]! + (payment - totalCost)
            }
            
            emit OptionPurchased(
                optionId: optionId,
                buyer: buyer,
                quantity: quantity,
                totalCost: totalCost
            )
        }
        
        access(all) fun getUserPosition(user: Address, optionId: String): Position? {
            if let userPositions = self.userPositions[user] {
                return userPositions[optionId]
            }
            return nil
        }
        
        access(all) fun getUserBalance(user: Address): UFix64 {
            return self.userBalances[user] ?? 0.0
        }
    }
    
    // Contract state
    access(all) var options: {String: WeatherOption}
    access(all) var activeOptions: [String]
    access(all) var totalVolumeTraded: UFix64
    
    init() {
        self.ActionManagerStoragePath = /storage/SimpleWeatherDerivativesActionManager
        self.TradingStoragePath = /storage/SimpleWeatherDerivativesTrading
        self.ActionManagerPublicPath = /public/SimpleWeatherDerivativesActionManager
        
        self.options = {}
        self.activeOptions = []
        self.totalVolumeTraded = 0.0
        
        // Create and store action manager
        let actionManager <- create WeatherActionManager()
        self.account.storage.save(<-actionManager, to: self.ActionManagerStoragePath)
        
        // Create and store trading manager
        let tradingManager <- create TradingManager()
        self.account.storage.save(<-tradingManager, to: self.TradingStoragePath)
    }
    
    // Public functions
    access(all) fun getOption(optionId: String): WeatherOption? {
        return self.options[optionId]
    }
    
    access(all) fun getActiveOptions(): [String] {
        return self.activeOptions
    }
    
    access(all) fun getTotalVolumeTraded(): UFix64 {
        return self.totalVolumeTraded
    }
    
    // Function to create action manager for users
    access(all) fun createActionManager(): @WeatherActionManager {
        return <- create WeatherActionManager()
    }
    
    // Function to create trading manager for users
    access(all) fun createTradingManager(): @TradingManager {
        return <- create TradingManager()
    }
}
