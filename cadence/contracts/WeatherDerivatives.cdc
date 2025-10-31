// WeatherDerivatives.cdc
// Cadence 1.0+ compliant weather derivatives trading contract with Forte Actions integration
// Supports rainfall and wind speed options trading

access(all) contract WeatherDerivatives {
    
    // Events
    access(all) event OptionCreated(optionId: String, creator: Address, strike: UFix64, premium: UFix64, expiry: UFix64)
    access(all) event OptionPurchased(optionId: String, buyer: Address, quantity: UInt64, totalCost: UFix64)
    access(all) event OptionSettled(optionId: String, actualValue: UFix64, payout: UFix64)
    access(all) event PositionClaimed(optionId: String, user: Address, payout: UFix64)
    
    // Forte Action Events
    access(all) event WeatherHedgeActionCreated(actionId: String, optionType: String, executor: Address)
    access(all) event SettlementActionCreated(actionId: String, optionId: String, executor: Address)
    
    // Storage and Public paths
    access(all) let AdminStoragePath: StoragePath
    access(all) let TradingStoragePath: StoragePath
    access(all) let ActionManagerStoragePath: StoragePath
    access(all) let TradingPublicPath: PublicPath
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
        access(all) let strike: UFix64          // Strike value (rainfall in mm or wind in mph, scaled)
        access(all) let premium: UFix64         // Premium per option
        access(all) let expiry: UFix64          // Expiry timestamp
        access(all) let totalSupply: UInt64     // Total options available
        access(all) var purchased: UInt64       // Options purchased
        access(all) var settled: Bool           // Settlement status
        access(all) var settlementValue: UFix64 // Final settlement value
        access(all) let creator: Address        // Option creator
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
            self.purchased = 0
            self.settled = false
            self.settlementValue = 0.0
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
        }
        
        access(all) fun updatePurchased(quantity: UInt64) {
            self.purchased = self.purchased + quantity
        }
        
        access(all) fun settle(value: UFix64) {
            self.settlementValue = value
            self.settled = true
        }
    }
    
    // User position structure
    access(all) struct Position {
        access(all) let optionId: String
        access(all) var quantity: UInt64
        access(all) let entryPrice: UFix64
        access(all) let isLong: Bool            // true for buyer, false for seller
        access(all) let timestamp: UFix64
        
        init(optionId: String, quantity: UInt64, entryPrice: UFix64, isLong: Bool) {
            self.optionId = optionId
            self.quantity = quantity
            self.entryPrice = entryPrice
            self.isLong = isLong
            self.timestamp = getCurrentBlock().timestamp
        }
        
        access(all) fun updateQuantity(newQuantity: UInt64) {
            self.quantity = newQuantity
        }
    }
    
    // Forte Action Interface for Weather Hedge Actions
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
            
            // Create the weather option
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
            
            WeatherDerivatives.options[optionId] = option
            WeatherDerivatives.activeOptions.append(optionId)
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
    
    // Settlement Action Resource (Forte Action)
    access(all) resource SettlementAction: WeatherHedgeActionInterface {
        access(all) let actionId: String
        access(all) let optionId: String
        access(all) let settlementValue: UFix64
        access(all) let executor: Address
        access(all) var executed: Bool
        
        init(actionId: String, optionId: String, settlementValue: UFix64, executor: Address) {
            self.actionId = actionId
            self.optionId = optionId
            self.settlementValue = settlementValue
            self.executor = executor
            self.executed = false
        }
        
        access(all) fun executeAction(): Bool {
            pre {
                !self.executed: "Action already executed"
                WeatherDerivatives.options.containsKey(self.optionId): "Option does not exist"
            }
            
            let optionRef = &WeatherDerivatives.options[self.optionId] as &WeatherOption?
                ?? panic("Could not get option reference")
            
            // Check if option is expired and not already settled
            if getCurrentBlock().timestamp >= optionRef.expiry && !optionRef.settled {
                let payout = self.calculatePayout(option: optionRef, actualValue: self.settlementValue)
                optionRef.settle(value: self.settlementValue)
                self.executed = true
                
                emit OptionSettled(
                    optionId: self.optionId,
                    actualValue: self.settlementValue,
                    payout: payout
                )
                
                return true
            }
            
            return false
        }
        
        access(all) fun calculatePayout(option: &WeatherOption, actualValue: UFix64): UFix64 {
            let strikeValue = option.strike
            
            switch option.optionType {
                case OptionType.RainfallCall:
                    // Call option: pays when actual > strike
                    if actualValue > strikeValue {
                        return (actualValue - strikeValue) * UFix64(option.purchased)
                    }
                case OptionType.RainfallPut:
                    // Put option: pays when actual < strike
                    if actualValue < strikeValue {
                        return (strikeValue - actualValue) * UFix64(option.purchased)
                    }
                case OptionType.WindCall:
                    // Wind call: pays when actual > strike
                    if actualValue > strikeValue {
                        return (actualValue - strikeValue) * UFix64(option.purchased)
                    }
                case OptionType.WindPut:
                    // Wind put: pays when actual < strike
                    if actualValue < strikeValue {
                        return (strikeValue - actualValue) * UFix64(option.purchased)
                    }
            }
            
            return 0.0
        }
        
        access(all) fun getActionId(): String {
            return self.actionId
        }
        
        access(all) fun getExecutor(): Address {
            return self.executor
        }
        
        access(all) fun getOptionType(): OptionType {
            return OptionType.RainfallCall // Default, not used for settlement actions
        }
    }
    
    // Weather Derivatives Action Manager
    access(all) resource WeatherActionManager {
        access(all) var pendingActions: @{String: {WeatherHedgeActionInterface}}
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
        
        access(all) fun createSettlementAction(
            optionId: String,
            settlementValue: UFix64
        ): String {
            let actionId = "settlement_".concat(optionId).concat("_").concat(getCurrentBlock().timestamp.toString())
            
            let action <- create SettlementAction(
                actionId: actionId,
                optionId: optionId,
                settlementValue: settlementValue,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            let oldAction <- self.pendingActions[actionId] <- action
            destroy oldAction
            
            emit SettlementActionCreated(
                actionId: actionId,
                optionId: optionId,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            return actionId
        }
        
        access(all) fun executeAction(actionId: String): Bool {
            pre {
                self.pendingActions.containsKey(actionId): "Action does not exist"
                !self.executedActions.containsKey(actionId): "Action already executed"
            }
            
            let actionRef = &self.pendingActions[actionId] as &{WeatherHedgeActionInterface}?
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
    
    // Trading interface
    access(all) resource interface TradingPublic {
        access(all) fun getOption(optionId: String): WeatherOption?
        access(all) fun getActiveOptions(): [String]
        access(all) fun getUserPosition(user: Address, optionId: String): Position?
    }
    
    // Trading resource
    access(all) resource TradingManager: TradingPublic {
        access(all) var userPositions: {Address: {String: Position}}
        access(all) var userBalances: {Address: UFix64}
        
        init() {
            self.userPositions = {}
            self.userBalances = {}
        }
        
        access(all) fun purchaseOption(optionId: String, quantity: UInt64, payment: UFix64) {
            pre {
                WeatherDerivatives.options.containsKey(optionId): "Option does not exist"
                quantity > 0: "Quantity must be positive"
            }
            
            let optionRef = &WeatherDerivatives.options[optionId] as &WeatherOption?
                ?? panic("Could not get option reference")
            
            let totalCost = optionRef.premium * UFix64(quantity)
            let protocolFee = totalCost * 0.025 // 2.5% fee
            let totalRequired = totalCost + protocolFee
            
            assert(payment >= totalRequired, message: "Insufficient payment")
            assert(optionRef.purchased + quantity <= optionRef.totalSupply, message: "Insufficient options available")
            assert(getCurrentBlock().timestamp < optionRef.expiry, message: "Option has expired")
            assert(!optionRef.settled, message: "Option already settled")
            
            // Update option state
            optionRef.updatePurchased(quantity: quantity)
            
            // Update user position
            let buyer = self.owner?.address ?? panic("No owner address")
            if self.userPositions[buyer] == nil {
                self.userPositions[buyer] = {}
            }
            
            let position = Position(
                optionId: optionId,
                quantity: quantity,
                entryPrice: optionRef.premium,
                isLong: true
            )
            
            self.userPositions[buyer]![optionId] = position
            
            // Handle payment
            if self.userBalances[buyer] == nil {
                self.userBalances[buyer] = 0.0
            }
            
            if payment > totalRequired {
                self.userBalances[buyer] = self.userBalances[buyer]! + (payment - totalRequired)
            }
            
            // Transfer premium to option creator
            if self.userBalances[optionRef.creator] == nil {
                self.userBalances[optionRef.creator] = 0.0
            }
            self.userBalances[optionRef.creator] = self.userBalances[optionRef.creator]! + totalCost
            
            emit OptionPurchased(
                optionId: optionId,
                buyer: buyer,
                quantity: quantity,
                totalCost: totalCost
            )
        }
        
        access(all) fun claimSettlement(optionId: String) {
            pre {
                WeatherDerivatives.options.containsKey(optionId): "Option does not exist"
            }
            
            let optionRef = &WeatherDerivatives.options[optionId] as &WeatherOption?
                ?? panic("Could not get option reference")
            
            assert(optionRef.settled, message: "Option not settled")
            
            let user = self.owner?.address ?? panic("No owner address")
            let userPosition = self.userPositions[user]?[optionId]
                ?? panic("No position found")
            
            assert(userPosition.quantity > 0, message: "No position to claim")
            
            // Calculate payout based on settlement
            let totalPayout = self.calculateUserPayout(option: optionRef, position: userPosition)
            
            // Update user position to prevent re-claiming
            let updatedPosition = Position(
                optionId: userPosition.optionId,
                quantity: 0,
                entryPrice: userPosition.entryPrice,
                isLong: userPosition.isLong
            )
            self.userPositions[user]![optionId] = updatedPosition
            
            // Add payout to user balance
            if self.userBalances[user] == nil {
                self.userBalances[user] = 0.0
            }
            self.userBalances[user] = self.userBalances[user]! + totalPayout
            
            emit PositionClaimed(
                optionId: optionId,
                user: user,
                payout: totalPayout
            )
        }
        
        access(all) fun calculateUserPayout(option: &WeatherOption, position: Position): UFix64 {
            if option.settlementValue == 0.0 || position.quantity == 0 {
                return 0.0
            }
            
            let strikeValue = option.strike
            let actualValue = option.settlementValue
            let userQuantity = UFix64(position.quantity)
            
            switch option.optionType {
                case OptionType.RainfallCall:
                    if actualValue > strikeValue {
                        return (actualValue - strikeValue) * userQuantity / UFix64(option.totalSupply) * UFix64(option.purchased)
                    }
                case OptionType.RainfallPut:
                    if actualValue < strikeValue {
                        return (strikeValue - actualValue) * userQuantity / UFix64(option.totalSupply) * UFix64(option.purchased)
                    }
                case OptionType.WindCall:
                    if actualValue > strikeValue {
                        return (actualValue - strikeValue) * userQuantity / UFix64(option.totalSupply) * UFix64(option.purchased)
                    }
                case OptionType.WindPut:
                    if actualValue < strikeValue {
                        return (strikeValue - actualValue) * userQuantity / UFix64(option.totalSupply) * UFix64(option.purchased)
                    }
            }
            
            return 0.0
        }
        
        access(all) fun getOption(optionId: String): WeatherOption? {
            return WeatherDerivatives.options[optionId]
        }
        
        access(all) fun getActiveOptions(): [String] {
            return WeatherDerivatives.activeOptions
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
        
        access(all) fun withdraw(amount: UFix64) {
            let user = self.owner?.address ?? panic("No owner address")
            let balance = self.userBalances[user] ?? 0.0
            
            assert(balance >= amount, message: "Insufficient balance")
            
            self.userBalances[user] = balance - amount
            // In a real implementation, this would transfer tokens back to the user
        }
    }
    
    // Contract state
    access(all) var options: {String: WeatherOption}
    access(all) var activeOptions: [String]
    access(all) var totalVolumeTraded: UFix64
    access(all) var protocolFeeRate: UFix64
    
    init() {
        // Initialize storage paths
        self.AdminStoragePath = /storage/WeatherDerivativesAdmin
        self.TradingStoragePath = /storage/WeatherDerivativesTrading
        self.ActionManagerStoragePath = /storage/WeatherDerivativesActionManager
        
        self.TradingPublicPath = /public/WeatherDerivativesTrading
        self.ActionManagerPublicPath = /public/WeatherDerivativesActionManager
        
        // Initialize state
        self.options = {}
        self.activeOptions = []
        self.totalVolumeTraded = 0.0
        self.protocolFeeRate = 0.025 // 2.5%
        
        // Create and store trading manager
        let tradingManager <- create TradingManager()
        self.account.storage.save(<-tradingManager, to: self.TradingStoragePath)
        
        // Create public capability for trading
        let tradingCap = self.account.capabilities.storage.issue<&TradingManager>(self.TradingStoragePath)
        self.account.capabilities.publish(tradingCap, at: self.TradingPublicPath)
        
        // Create and store action manager
        let actionManager <- create WeatherActionManager()
        self.account.storage.save(<-actionManager, to: self.ActionManagerStoragePath)
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
    
    // Function to create trading manager for users
    access(all) fun createTradingManager(): @TradingManager {
        return <- create TradingManager()
    }
    
    // Function to create action manager for users
    access(all) fun createActionManager(): @WeatherActionManager {
        return <- create WeatherActionManager()
    }
}
