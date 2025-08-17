// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title CommunityStaking
 * @dev Community staking contract for Flow and Flare tokens with yield farming
 */
contract CommunityStaking is ReentrancyGuard, Ownable, Pausable {
    struct StakingPool {
        IERC20 stakingToken;
        IERC20 rewardToken;
        uint256 rewardRate; // Rewards per second
        uint256 lastUpdateTime;
        uint256 rewardPerTokenStored;
        uint256 totalStaked;
        uint256 lockPeriod; // Minimum lock time in seconds
        bool active;
    }

    struct UserStake {
        uint256 balance;
        uint256 userRewardPerTokenPaid;
        uint256 rewards;
        uint256 stakeTime;
        uint256 lockEndTime;
    }

    mapping(uint256 => StakingPool) public stakingPools;
    mapping(uint256 => mapping(address => UserStake)) public userStakes;
    mapping(address => uint256[]) public userPoolIds;
    
    uint256 public poolCount;
    uint256 public constant REWARD_DURATION = 7 days;
    uint256 public constant MIN_STAKE_AMOUNT = 1e18; // 1 token minimum
    
    event PoolCreated(uint256 indexed poolId, address stakingToken, address rewardToken, uint256 rewardRate);
    event Staked(address indexed user, uint256 indexed poolId, uint256 amount);
    event Withdrawn(address indexed user, uint256 indexed poolId, uint256 amount);
    event RewardPaid(address indexed user, uint256 indexed poolId, uint256 reward);
    event PoolUpdated(uint256 indexed poolId, uint256 newRewardRate);
    event EmergencyWithdraw(address indexed user, uint256 indexed poolId, uint256 amount);

    constructor() Ownable(msg.sender) {}

    modifier updateReward(uint256 poolId, address account) {
        StakingPool storage pool = stakingPools[poolId];
        pool.rewardPerTokenStored = rewardPerToken(poolId);
        pool.lastUpdateTime = lastTimeRewardApplicable(poolId);

        if (account != address(0)) {
            UserStake storage userStake = userStakes[poolId][account];
            userStake.rewards = earned(poolId, account);
            userStake.userRewardPerTokenPaid = pool.rewardPerTokenStored;
        }
        _;
    }

    modifier poolExists(uint256 poolId) {
        require(poolId < poolCount, "Pool does not exist");
        require(stakingPools[poolId].active, "Pool is not active");
        _;
    }

    /**
     * @dev Create a new staking pool
     */
    function createPool(
        address _stakingToken,
        address _rewardToken,
        uint256 _rewardRate,
        uint256 _lockPeriod
    ) external onlyOwner {
        require(_stakingToken != address(0), "Invalid staking token");
        require(_rewardToken != address(0), "Invalid reward token");
        require(_rewardRate > 0, "Reward rate must be positive");

        stakingPools[poolCount] = StakingPool({
            stakingToken: IERC20(_stakingToken),
            rewardToken: IERC20(_rewardToken),
            rewardRate: _rewardRate,
            lastUpdateTime: block.timestamp,
            rewardPerTokenStored: 0,
            totalStaked: 0,
            lockPeriod: _lockPeriod,
            active: true
        });

        emit PoolCreated(poolCount, _stakingToken, _rewardToken, _rewardRate);
        poolCount++;
    }

    /**
     * @dev Stake tokens in a specific pool
     */
    function stake(uint256 poolId, uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        poolExists(poolId) 
        updateReward(poolId, msg.sender) 
    {
        require(amount >= MIN_STAKE_AMOUNT, "Amount below minimum");
        
        StakingPool storage pool = stakingPools[poolId];
        UserStake storage userStake = userStakes[poolId][msg.sender];

        // Transfer tokens to contract
        pool.stakingToken.transferFrom(msg.sender, address(this), amount);

        // Update state
        if (userStake.balance == 0) {
            userPoolIds[msg.sender].push(poolId);
        }
        
        userStake.balance += amount;
        userStake.stakeTime = block.timestamp;
        userStake.lockEndTime = block.timestamp + pool.lockPeriod;
        pool.totalStaked += amount;

        emit Staked(msg.sender, poolId, amount);
    }

    /**
     * @dev Withdraw staked tokens and claim rewards
     */
    function withdraw(uint256 poolId, uint256 amount) 
        external 
        nonReentrant 
        poolExists(poolId) 
        updateReward(poolId, msg.sender) 
    {
        UserStake storage userStake = userStakes[poolId][msg.sender];
        require(userStake.balance >= amount, "Insufficient balance");
        require(block.timestamp >= userStake.lockEndTime, "Tokens still locked");

        StakingPool storage pool = stakingPools[poolId];
        
        userStake.balance -= amount;
        pool.totalStaked -= amount;

        // Transfer tokens back to user
        pool.stakingToken.transfer(msg.sender, amount);

        emit Withdrawn(msg.sender, poolId, amount);
    }

    /**
     * @dev Claim earned rewards
     */
    function claimReward(uint256 poolId) 
        external 
        nonReentrant 
        poolExists(poolId) 
        updateReward(poolId, msg.sender) 
    {
        UserStake storage userStake = userStakes[poolId][msg.sender];
        uint256 reward = userStake.rewards;
        
        if (reward > 0) {
            userStake.rewards = 0;
            StakingPool storage pool = stakingPools[poolId];
            pool.rewardToken.transfer(msg.sender, reward);
            emit RewardPaid(msg.sender, poolId, reward);
        }
    }

    /**
     * @dev Emergency withdraw without rewards (in case of emergency)
     */
    function emergencyWithdraw(uint256 poolId) 
        external 
        nonReentrant 
        poolExists(poolId) 
    {
        UserStake storage userStake = userStakes[poolId][msg.sender];
        uint256 amount = userStake.balance;
        require(amount > 0, "No balance to withdraw");

        StakingPool storage pool = stakingPools[poolId];
        
        userStake.balance = 0;
        userStake.rewards = 0;
        pool.totalStaked -= amount;

        pool.stakingToken.transfer(msg.sender, amount);
        emit EmergencyWithdraw(msg.sender, poolId, amount);
    }

    /**
     * @dev Calculate reward per token
     */
    function rewardPerToken(uint256 poolId) public view returns (uint256) {
        StakingPool memory pool = stakingPools[poolId];
        if (pool.totalStaked == 0) {
            return pool.rewardPerTokenStored;
        }
        return
            pool.rewardPerTokenStored +
            (((lastTimeRewardApplicable(poolId) - pool.lastUpdateTime) * pool.rewardRate * 1e18) / pool.totalStaked);
    }

    /**
     * @dev Calculate earned rewards for a user
     */
    function earned(uint256 poolId, address account) public view returns (uint256) {
        UserStake memory userStake = userStakes[poolId][account];
        return
            ((userStake.balance * (rewardPerToken(poolId) - userStake.userRewardPerTokenPaid)) / 1e18) +
            userStake.rewards;
    }

    /**
     * @dev Get last applicable reward time
     */
    function lastTimeRewardApplicable(uint256 poolId) public view returns (uint256) {
        return block.timestamp;
    }

    /**
     * @dev Get user's staking info for all pools
     */
    function getUserStakes(address user) external view returns (
        uint256[] memory poolIds,
        uint256[] memory balances,
        uint256[] memory rewards,
        uint256[] memory lockEndTimes
    ) {
        uint256[] memory userPools = userPoolIds[user];
        uint256 activeStakes = 0;

        // Count active stakes
        for (uint256 i = 0; i < userPools.length; i++) {
            if (userStakes[userPools[i]][user].balance > 0) {
                activeStakes++;
            }
        }

        poolIds = new uint256[](activeStakes);
        balances = new uint256[](activeStakes);
        rewards = new uint256[](activeStakes);
        lockEndTimes = new uint256[](activeStakes);

        uint256 index = 0;
        for (uint256 i = 0; i < userPools.length; i++) {
            uint256 poolId = userPools[i];
            UserStake memory userStake = userStakes[poolId][user];
            
            if (userStake.balance > 0) {
                poolIds[index] = poolId;
                balances[index] = userStake.balance;
                rewards[index] = earned(poolId, user);
                lockEndTimes[index] = userStake.lockEndTime;
                index++;
            }
        }
    }

    /**
     * @dev Get pool information
     */
    function getPoolInfo(uint256 poolId) external view returns (
        address stakingToken,
        address rewardToken,
        uint256 rewardRate,
        uint256 totalStaked,
        uint256 lockPeriod,
        bool active
    ) {
        StakingPool memory pool = stakingPools[poolId];
        return (
            address(pool.stakingToken),
            address(pool.rewardToken),
            pool.rewardRate,
            pool.totalStaked,
            pool.lockPeriod,
            pool.active
        );
    }

    /**
     * @dev Update reward rate for a pool (owner only)
     */
    function updateRewardRate(uint256 poolId, uint256 newRewardRate) 
        external 
        onlyOwner 
        poolExists(poolId) 
        updateReward(poolId, address(0)) 
    {
        stakingPools[poolId].rewardRate = newRewardRate;
        emit PoolUpdated(poolId, newRewardRate);
    }

    /**
     * @dev Pause/unpause contract
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /**
     * @dev Deactivate a pool
     */
    function deactivatePool(uint256 poolId) external onlyOwner poolExists(poolId) {
        stakingPools[poolId].active = false;
    }

    /**
     * @dev Get APY for a pool (approximate)
     */
    function getPoolAPY(uint256 poolId) external view returns (uint256) {
        StakingPool memory pool = stakingPools[poolId];
        if (pool.totalStaked == 0) return 0;
        
        // Annual reward rate as percentage
        uint256 annualRewards = pool.rewardRate * 365 days;
        return (annualRewards * 10000) / pool.totalStaked; // Returns APY in basis points
    }
}