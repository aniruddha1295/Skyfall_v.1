// CommunityPools.cdc
// Cadence 1.0+ compliant community staking and mutual aid pools with Forte Actions integration
// Supports community-driven weather risk sharing and staking rewards

access(all) contract CommunityPools {
    
    // Events
    access(all) event PoolCreated(poolId: String, creator: Address, stakingToken: String, rewardRate: UFix64)
    access(all) event UserStaked(poolId: String, user: Address, amount: UFix64)
    access(all) event UserWithdrew(poolId: String, user: Address, amount: UFix64)
    access(all) event RewardsClaimed(poolId: String, user: Address, amount: UFix64)
    access(all) event MutualAidClaimed(poolId: String, user: Address, amount: UFix64, reason: String)
    
    // Forte Action Events
    access(all) event MutualAidPoolActionCreated(actionId: String, poolType: String, executor: Address)
    access(all) event StakingActionCreated(actionId: String, poolId: String, executor: Address)
    access(all) event ClaimActionCreated(actionId: String, claimType: String, executor: Address)
    
    // Storage and Public paths
    access(all) let AdminStoragePath: StoragePath
    access(all) let PoolManagerStoragePath: StoragePath
    access(all) let ActionManagerStoragePath: StoragePath
    access(all) let PoolManagerPublicPath: PublicPath
    access(all) let ActionManagerPublicPath: PublicPath
    
    // Pool types
    access(all) enum PoolType: UInt8 {
        access(all) case WeatherRisk
        access(all) case CommunityStaking
        access(all) case MutualAid
        access(all) case EmergencyFund
    }
    
    // Staking pool structure
    access(all) struct StakingPool {
        access(all) let poolId: String
        access(all) let poolType: PoolType
        access(all) let stakingToken: String
        access(all) let rewardToken: String
        access(all) let rewardRate: UFix64        // Rewards per second
        access(all) var totalStaked: UFix64
        access(all) let lockPeriod: UFix64        // Minimum lock time in seconds
        access(all) var active: Bool
        access(all) let creator: Address
        access(all) let createdAt: UFix64
        access(all) var lastUpdateTime: UFix64
        access(all) var rewardPerTokenStored: UFix64
        
        init(
            poolId: String,
            poolType: PoolType,
            stakingToken: String,
            rewardToken: String,
            rewardRate: UFix64,
            lockPeriod: UFix64,
            creator: Address
        ) {
            self.poolId = poolId
            self.poolType = poolType
            self.stakingToken = stakingToken
            self.rewardToken = rewardToken
            self.rewardRate = rewardRate
            self.totalStaked = 0.0
            self.lockPeriod = lockPeriod
            self.active = true
            self.creator = creator
            self.createdAt = getCurrentBlock().timestamp
            self.lastUpdateTime = getCurrentBlock().timestamp
            self.rewardPerTokenStored = 0.0
        }
        
        access(all) fun updateTotalStaked(amount: UFix64, isDeposit: Bool) {
            if isDeposit {
                self.totalStaked = self.totalStaked + amount
            } else {
                self.totalStaked = self.totalStaked - amount
            }
        }
        
        access(all) fun updateRewardData(rewardPerToken: UFix64) {
            self.rewardPerTokenStored = rewardPerToken
            self.lastUpdateTime = getCurrentBlock().timestamp
        }
        
        access(all) fun deactivate() {
            self.active = false
        }
    }
    
    // User stake information
    access(all) struct UserStake {
        access(all) let poolId: String
        access(all) var balance: UFix64
        access(all) var userRewardPerTokenPaid: UFix64
        access(all) var rewards: UFix64
        access(all) let stakeTime: UFix64
        access(all) var lockEndTime: UFix64
        
        init(poolId: String, balance: UFix64, lockEndTime: UFix64) {
            self.poolId = poolId
            self.balance = balance
            self.userRewardPerTokenPaid = 0.0
            self.rewards = 0.0
            self.stakeTime = getCurrentBlock().timestamp
            self.lockEndTime = lockEndTime
        }
        
        access(all) fun updateBalance(amount: UFix64, isDeposit: Bool) {
            if isDeposit {
                self.balance = self.balance + amount
            } else {
                self.balance = self.balance - amount
            }
        }
        
        access(all) fun updateRewards(earned: UFix64, rewardPerToken: UFix64) {
            self.rewards = earned
            self.userRewardPerTokenPaid = rewardPerToken
        }
        
        access(all) fun claimRewards(): UFix64 {
            let claimAmount = self.rewards
            self.rewards = 0.0
            return claimAmount
        }
    }
    
    // Forte Action Interface for Community Pool Actions
    access(all) resource interface CommunityPoolActionInterface {
        access(all) fun executeAction(): Bool
        access(all) fun getActionId(): String
        access(all) fun getExecutor(): Address
        access(all) fun getActionType(): String
    }
    
    // Mutual Aid Pool Entry Action (Forte Action)
    access(all) resource MutualAidPoolAction: CommunityPoolActionInterface {
        access(all) let actionId: String
        access(all) let poolType: PoolType
        access(all) let stakingToken: String
        access(all) let rewardToken: String
        access(all) let rewardRate: UFix64
        access(all) let lockPeriod: UFix64
        access(all) let executor: Address
        access(all) var executed: Bool
        
        init(
            actionId: String,
            poolType: PoolType,
            stakingToken: String,
            rewardToken: String,
            rewardRate: UFix64,
            lockPeriod: UFix64,
            executor: Address
        ) {
            self.actionId = actionId
            self.poolType = poolType
            self.stakingToken = stakingToken
            self.rewardToken = rewardToken
            self.rewardRate = rewardRate
            self.lockPeriod = lockPeriod
            self.executor = executor
            self.executed = false
        }
        
        access(all) fun executeAction(): Bool {
            pre {
                !self.executed: "Action already executed"
                self.rewardRate > 0.0: "Reward rate must be positive"
            }
            
            // Create the community pool
            let poolId = self.actionId.concat("_pool")
            
            let pool = StakingPool(
                poolId: poolId,
                poolType: self.poolType,
                stakingToken: self.stakingToken,
                rewardToken: self.rewardToken,
                rewardRate: self.rewardRate,
                lockPeriod: self.lockPeriod,
                creator: self.executor
            )
            
            CommunityPools.stakingPools[poolId] = pool
            CommunityPools.activePools.append(poolId)
            self.executed = true
            
            emit PoolCreated(
                poolId: poolId,
                creator: self.executor,
                stakingToken: self.stakingToken,
                rewardRate: self.rewardRate
            )
            
            return true
        }
        
        access(all) fun getActionId(): String {
            return self.actionId
        }
        
        access(all) fun getExecutor(): Address {
            return self.executor
        }
        
        access(all) fun getActionType(): String {
            return "MutualAidPool"
        }
    }
    
    // Staking Action Resource (Forte Action)
    access(all) resource StakingAction: CommunityPoolActionInterface {
        access(all) let actionId: String
        access(all) let poolId: String
        access(all) let amount: UFix64
        access(all) let isStaking: Bool // true for stake, false for unstake
        access(all) let executor: Address
        access(all) var executed: Bool
        
        init(actionId: String, poolId: String, amount: UFix64, isStaking: Bool, executor: Address) {
            self.actionId = actionId
            self.poolId = poolId
            self.amount = amount
            self.isStaking = isStaking
            self.executor = executor
            self.executed = false
        }
        
        access(all) fun executeAction(): Bool {
            pre {
                !self.executed: "Action already executed"
                CommunityPools.stakingPools.containsKey(self.poolId): "Pool does not exist"
                self.amount > 0.0: "Amount must be positive"
            }
            
            let poolRef = &CommunityPools.stakingPools[self.poolId] as &StakingPool?
                ?? panic("Could not get pool reference")
            
            if !poolRef.active {
                return false
            }
            
            if self.isStaking {
                // Execute staking
                self.executeStaking(poolRef: poolRef)
            } else {
                // Execute unstaking
                self.executeUnstaking(poolRef: poolRef)
            }
            
            self.executed = true
            return true
        }
        
        access(all) fun executeStaking(poolRef: &StakingPool) {
            // Update pool state
            poolRef.updateTotalStaked(amount: self.amount, isDeposit: true)
            
            // Update user stake
            let lockEndTime = getCurrentBlock().timestamp + poolRef.lockPeriod
            let userStake = UserStake(
                poolId: self.poolId,
                balance: self.amount,
                lockEndTime: lockEndTime
            )
            
            // Initialize user stakes if needed
            if CommunityPools.userStakes[self.executor] == nil {
                CommunityPools.userStakes[self.executor] = {}
            }
            
            // Add to existing stake or create new one
            if let existingStake = CommunityPools.userStakes[self.executor]![self.poolId] {
                let updatedStake = UserStake(
                    poolId: self.poolId,
                    balance: existingStake.balance + self.amount,
                    lockEndTime: lockEndTime
                )
                CommunityPools.userStakes[self.executor]![self.poolId] = updatedStake
            } else {
                CommunityPools.userStakes[self.executor]![self.poolId] = userStake
            }
            
            emit UserStaked(
                poolId: self.poolId,
                user: self.executor,
                amount: self.amount
            )
        }
        
        access(all) fun executeUnstaking(poolRef: &StakingPool) {
            let userStakes = CommunityPools.userStakes[self.executor] ?? panic("No user stakes found")
            let userStake = userStakes[self.poolId] ?? panic("No stake found")
            
            // Check lock period
            if getCurrentBlock().timestamp < userStake.lockEndTime {
                panic("Tokens still locked")
            }
            
            if userStake.balance < self.amount {
                panic("Insufficient balance")
            }
            
            // Update pool state
            poolRef.updateTotalStaked(amount: self.amount, isDeposit: false)
            
            // Update user stake
            let updatedStake = UserStake(
                poolId: userStake.poolId,
                balance: userStake.balance - self.amount,
                lockEndTime: userStake.lockEndTime
            )
            CommunityPools.userStakes[self.executor]![self.poolId] = updatedStake
            
            emit UserWithdrew(
                poolId: self.poolId,
                user: self.executor,
                amount: self.amount
            )
        }
        
        access(all) fun getActionId(): String {
            return self.actionId
        }
        
        access(all) fun getExecutor(): Address {
            return self.executor
        }
        
        access(all) fun getActionType(): String {
            return self.isStaking ? "Stake" : "Unstake"
        }
    }
    
    // Claim Action Resource (Forte Action)
    access(all) resource ClaimAction: CommunityPoolActionInterface {
        access(all) let actionId: String
        access(all) let poolId: String
        access(all) let claimType: String // "rewards" or "mutual_aid"
        access(all) let claimReason: String // for mutual aid claims
        access(all) let executor: Address
        access(all) var executed: Bool
        
        init(actionId: String, poolId: String, claimType: String, claimReason: String, executor: Address) {
            self.actionId = actionId
            self.poolId = poolId
            self.claimType = claimType
            self.claimReason = claimReason
            self.executor = executor
            self.executed = false
        }
        
        access(all) fun executeAction(): Bool {
            pre {
                !self.executed: "Action already executed"
                CommunityPools.stakingPools.containsKey(self.poolId): "Pool does not exist"
            }
            
            if self.claimType == "rewards" {
                self.executeRewardsClaim()
            } else if self.claimType == "mutual_aid" {
                self.executeMutualAidClaim()
            } else {
                return false
            }
            
            self.executed = true
            return true
        }
        
        access(all) fun executeRewardsClaim() {
            let userStake = CommunityPools.userStakes[self.executor]?[self.poolId]
                ?? panic("No stake found")
            
            // Calculate rewards (simplified calculation)
            let poolRef = &CommunityPools.stakingPools[self.poolId] as &StakingPool?
                ?? panic("Could not get pool reference")
            
            let timeElapsed = getCurrentBlock().timestamp - poolRef.lastUpdateTime
            let rewardPerToken = poolRef.rewardPerTokenStored + 
                (timeElapsed * poolRef.rewardRate / poolRef.totalStaked)
            
            let earned = userStake.balance * (rewardPerToken - userStake.userRewardPerTokenPaid)
            
            if earned > 0.0 {
                // Update user stake
                let updatedStake = UserStake(
                    poolId: userStake.poolId,
                    balance: userStake.balance,
                    lockEndTime: userStake.lockEndTime
                )
                updatedStake.updateRewards(earned: 0.0, rewardPerToken: rewardPerToken)
                CommunityPools.userStakes[self.executor]![self.poolId] = updatedStake
                
                // Update pool
                poolRef.updateRewardData(rewardPerToken: rewardPerToken)
                
                emit RewardsClaimed(
                    poolId: self.poolId,
                    user: self.executor,
                    amount: earned
                )
            }
        }
        
        access(all) fun executeMutualAidClaim() {
            let poolRef = &CommunityPools.stakingPools[self.poolId] as &StakingPool?
                ?? panic("Could not get pool reference")
            
            // Check if pool is mutual aid type
            if poolRef.poolType != PoolType.MutualAid && poolRef.poolType != PoolType.EmergencyFund {
                panic("Not a mutual aid pool")
            }
            
            // Simplified mutual aid claim (in practice, this would require governance approval)
            let claimAmount = poolRef.totalStaked * 0.1 // Max 10% of pool
            
            emit MutualAidClaimed(
                poolId: self.poolId,
                user: self.executor,
                amount: claimAmount,
                reason: self.claimReason
            )
        }
        
        access(all) fun getActionId(): String {
            return self.actionId
        }
        
        access(all) fun getExecutor(): Address {
            return self.executor
        }
        
        access(all) fun getActionType(): String {
            return "Claim_".concat(self.claimType)
        }
    }
    
    // Community Pools Action Manager
    access(all) resource CommunityActionManager {
        access(all) var pendingActions: @{String: {CommunityPoolActionInterface}}
        access(all) var executedActions: {String: Bool}
        
        init() {
            self.pendingActions <- {}
            self.executedActions = {}
        }
        
        access(all) fun createMutualAidPoolAction(
            poolType: PoolType,
            stakingToken: String,
            rewardToken: String,
            rewardRate: UFix64,
            lockPeriod: UFix64
        ): String {
            let actionId = "mutual_aid_".concat(getCurrentBlock().timestamp.toString())
            
            let action <- create MutualAidPoolAction(
                actionId: actionId,
                poolType: poolType,
                stakingToken: stakingToken,
                rewardToken: rewardToken,
                rewardRate: rewardRate,
                lockPeriod: lockPeriod,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            let oldAction <- self.pendingActions[actionId] <- action
            destroy oldAction
            
            emit MutualAidPoolActionCreated(
                actionId: actionId,
                poolType: poolType.rawValue.toString(),
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            return actionId
        }
        
        access(all) fun createStakingAction(
            poolId: String,
            amount: UFix64,
            isStaking: Bool
        ): String {
            let actionType = isStaking ? "stake" : "unstake"
            let actionId = actionType.concat("_").concat(poolId).concat("_").concat(getCurrentBlock().timestamp.toString())
            
            let action <- create StakingAction(
                actionId: actionId,
                poolId: poolId,
                amount: amount,
                isStaking: isStaking,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            let oldAction <- self.pendingActions[actionId] <- action
            destroy oldAction
            
            emit StakingActionCreated(
                actionId: actionId,
                poolId: poolId,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            return actionId
        }
        
        access(all) fun createClaimAction(
            poolId: String,
            claimType: String,
            claimReason: String
        ): String {
            let actionId = "claim_".concat(claimType).concat("_").concat(getCurrentBlock().timestamp.toString())
            
            let action <- create ClaimAction(
                actionId: actionId,
                poolId: poolId,
                claimType: claimType,
                claimReason: claimReason,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            let oldAction <- self.pendingActions[actionId] <- action
            destroy oldAction
            
            emit ClaimActionCreated(
                actionId: actionId,
                claimType: claimType,
                executor: self.owner?.address ?? panic("No owner address")
            )
            
            return actionId
        }
        
        access(all) fun executeAction(actionId: String): Bool {
            pre {
                self.pendingActions.containsKey(actionId): "Action does not exist"
                !self.executedActions.containsKey(actionId): "Action already executed"
            }
            
            let actionRef = &self.pendingActions[actionId] as &{CommunityPoolActionInterface}?
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
    
    // Public interface for pool access
    access(all) resource interface PoolManagerPublic {
        access(all) fun getPool(poolId: String): StakingPool?
        access(all) fun getActivePools(): [String]
        access(all) fun getUserStake(user: Address, poolId: String): UserStake?
    }
    
    // Pool manager resource
    access(all) resource PoolManager: PoolManagerPublic {
        
        access(all) fun getPool(poolId: String): StakingPool? {
            return CommunityPools.stakingPools[poolId]
        }
        
        access(all) fun getActivePools(): [String] {
            return CommunityPools.activePools
        }
        
        access(all) fun getUserStake(user: Address, poolId: String): UserStake? {
            if let userStakes = CommunityPools.userStakes[user] {
                return userStakes[poolId]
            }
            return nil
        }
        
        access(all) fun calculateRewards(user: Address, poolId: String): UFix64 {
            let pool = CommunityPools.stakingPools[poolId] ?? panic("Pool not found")
            let userStake = CommunityPools.userStakes[user]?[poolId] ?? panic("No stake found")
            
            let timeElapsed = getCurrentBlock().timestamp - pool.lastUpdateTime
            let rewardPerToken = pool.rewardPerTokenStored + 
                (timeElapsed * pool.rewardRate / pool.totalStaked)
            
            return userStake.balance * (rewardPerToken - userStake.userRewardPerTokenPaid)
        }
        
        access(all) fun getPoolAPY(poolId: String): UFix64 {
            let pool = CommunityPools.stakingPools[poolId] ?? panic("Pool not found")
            
            if pool.totalStaked == 0.0 {
                return 0.0
            }
            
            // Annual reward rate as percentage (simplified calculation)
            let annualRewards = pool.rewardRate * 31536000.0 // seconds in a year
            return (annualRewards * 10000.0) / pool.totalStaked // Returns APY in basis points
        }
    }
    
    // Contract state
    access(all) var stakingPools: {String: StakingPool}
    access(all) var userStakes: {Address: {String: UserStake}}
    access(all) var activePools: [String]
    access(all) var totalValueLocked: UFix64
    access(all) var protocolFeeRate: UFix64
    
    init() {
        // Initialize storage paths
        self.AdminStoragePath = /storage/CommunityPoolsAdmin
        self.PoolManagerStoragePath = /storage/CommunityPoolsManager
        self.ActionManagerStoragePath = /storage/CommunityPoolsActionManager
        
        self.PoolManagerPublicPath = /public/CommunityPoolsManager
        self.ActionManagerPublicPath = /public/CommunityPoolsActionManager
        
        // Initialize state
        self.stakingPools = {}
        self.userStakes = {}
        self.activePools = []
        self.totalValueLocked = 0.0
        self.protocolFeeRate = 0.025 // 2.5%
        
        // Create and store pool manager
        let poolManager <- create PoolManager()
        self.account.storage.save(<-poolManager, to: self.PoolManagerStoragePath)
        
        // Create public capability for pool management
        let poolCap = self.account.capabilities.storage.issue<&PoolManager>(self.PoolManagerStoragePath)
        self.account.capabilities.publish(poolCap, at: self.PoolManagerPublicPath)
        
        // Create and store action manager
        let actionManager <- create CommunityActionManager()
        self.account.storage.save(<-actionManager, to: self.ActionManagerStoragePath)
    }
    
    // Public functions
    access(all) fun getPool(poolId: String): StakingPool? {
        return self.stakingPools[poolId]
    }
    
    access(all) fun getActivePools(): [String] {
        return self.activePools
    }
    
    access(all) fun getTotalValueLocked(): UFix64 {
        return self.totalValueLocked
    }
    
    // Function to create pool manager for users
    access(all) fun createPoolManager(): @PoolManager {
        return <- create PoolManager()
    }
    
    // Function to create action manager for users
    access(all) fun createActionManager(): @CommunityActionManager {
        return <- create CommunityActionManager()
    }
}
