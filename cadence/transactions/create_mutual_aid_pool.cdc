// create_mutual_aid_pool.cdc
// Transaction to create a Forte Action for mutual aid pool entry

import CommunityPools from "../contracts/CommunityPools.cdc"

transaction(
    poolType: UInt8,
    stakingToken: String,
    rewardToken: String,
    rewardRate: UFix64,
    lockPeriod: UFix64
) {
    
    let actionManager: &CommunityPools.CommunityActionManager
    
    prepare(signer: auth(Storage, SaveValue) &Account) {
        // Get or create action manager
        if signer.storage.borrow<&CommunityPools.CommunityActionManager>(from: CommunityPools.ActionManagerStoragePath) == nil {
            let actionManager <- CommunityPools.createActionManager()
            signer.storage.save(<-actionManager, to: CommunityPools.ActionManagerStoragePath)
        }
        
        self.actionManager = signer.storage.borrow<&CommunityPools.CommunityActionManager>(
            from: CommunityPools.ActionManagerStoragePath
        ) ?? panic("Could not borrow action manager")
    }
    
    execute {
        // Convert UInt8 to PoolType enum
        let poolTypeEnum = CommunityPools.PoolType(rawValue: poolType) 
            ?? panic("Invalid pool type")
        
        // Create mutual aid pool action
        let actionId = self.actionManager.createMutualAidPoolAction(
            poolType: poolTypeEnum,
            stakingToken: stakingToken,
            rewardToken: rewardToken,
            rewardRate: rewardRate,
            lockPeriod: lockPeriod
        )
        
        log("Created mutual aid pool action with ID: ".concat(actionId))
    }
}
