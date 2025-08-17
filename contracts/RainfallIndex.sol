// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title RainfallIndex
 * @dev Smart contract for trading rainfall-based weather derivatives on Flow EVM
 * @notice This contract enables creation, trading, and settlement of rainfall options
 */
contract RainfallIndex is ReentrancyGuard, Ownable, Pausable {
    
    // Events
    event OptionCreated(bytes32 indexed optionId, address indexed creator, uint256 strike, uint256 premium, uint256 expiry);
    event OptionPurchased(bytes32 indexed optionId, address indexed buyer, uint256 quantity, uint256 totalCost);
    event OptionSettled(bytes32 indexed optionId, uint256 actualRainfall, uint256 payout);
    event OracleUpdated(address indexed newOracle);
    event RainfallDataUpdated(string indexed stationId, uint256 rainfall, uint256 timestamp);
    event EmergencyWithdrawal(address indexed user, uint256 amount);
    
    // Structs
    struct RainfallOption {
        bytes32 optionId;
        string stationId;
        uint256 strike;          // Strike price in mm of rainfall
        uint256 premium;         // Premium in wei
        uint256 expiry;          // Expiry timestamp
        uint256 totalSupply;     // Total options available
        uint256 purchased;       // Options purchased
        bool isCall;             // true for call, false for put
        bool settled;            // Settlement status
        uint256 settlementValue; // Final settlement value
        address creator;         // Option creator
    }
    
    struct Position {
        bytes32 optionId;
        uint256 quantity;
        uint256 entryPrice;
        bool isLong;            // true for buyer, false for seller
    }
    
    struct RainfallData {
        uint256 value;          // Rainfall in mm (scaled by 1e6 for precision)
        uint256 timestamp;
        bool verified;
        string source;          // Data source (WeatherXM, Chainlink, etc.)
    }
    
    // State variables
    mapping(bytes32 => RainfallOption) public options;
    mapping(address => mapping(bytes32 => Position)) public positions;
    mapping(string => RainfallData) public rainfallData;
    mapping(address => uint256) public balances;
    
    bytes32[] public activeOptions;
    string[] public weatherStations;
    
    address public weatherOracle;
    uint256 public constant PRECISION = 1e6;
    uint256 public constant MIN_PREMIUM = 0.001 ether;
    uint256 public constant MAX_EXPIRY_DURATION = 365 days;
    uint256 public protocolFee = 250; // 2.5% in basis points
    uint256 public totalVolumeTraded;
    
    // Modifiers
    modifier onlyOracle() {
        require(msg.sender == weatherOracle, "Only oracle can call this function");
        _;
    }
    
    modifier validOption(bytes32 optionId) {
        require(options[optionId].optionId != bytes32(0), "Option does not exist");
        _;
    }
    
    modifier notExpired(bytes32 optionId) {
        require(block.timestamp < options[optionId].expiry, "Option has expired");
        _;
    }
    
    modifier notSettled(bytes32 optionId) {
        require(!options[optionId].settled, "Option already settled");
        _;
    }
    
    constructor(address _weatherOracle) Ownable(msg.sender) {
        weatherOracle = _weatherOracle;
        
        // Initialize with Dallas weather station
        weatherStations.push("wxm_dallas_001");
    }
    
    /**
     * @dev Create a new rainfall option
     * @param stationId Weather station identifier
     * @param strike Strike price in mm of rainfall
     * @param premium Premium per option in wei
     * @param expiry Expiry timestamp
     * @param totalSupply Total number of options to create
     * @param isCall True for call option, false for put option
     */
    function createOption(
        string memory stationId,
        uint256 strike,
        uint256 premium,
        uint256 expiry,
        uint256 totalSupply,
        bool isCall
    ) external payable whenNotPaused nonReentrant returns (bytes32) {
        require(premium >= MIN_PREMIUM, "Premium too low");
        require(expiry > block.timestamp, "Expiry must be in future");
        require(expiry <= block.timestamp + MAX_EXPIRY_DURATION, "Expiry too far in future");
        require(totalSupply > 0, "Total supply must be positive");
        require(strike > 0, "Strike must be positive");
        
        // Calculate collateral requirement for option writer
        uint256 maxPayout = isCall ? 
            (strike * totalSupply * PRECISION) / PRECISION : // Call: unlimited upside, capped by practical limits
            (strike * totalSupply); // Put: max payout is strike price
            
        require(msg.value >= maxPayout, "Insufficient collateral");
        
        bytes32 optionId = keccak256(abi.encodePacked(
            stationId,
            strike,
            expiry,
            isCall,
            block.timestamp,
            msg.sender
        ));
        
        require(options[optionId].optionId == bytes32(0), "Option already exists");
        
        options[optionId] = RainfallOption({
            optionId: optionId,
            stationId: stationId,
            strike: strike,
            premium: premium,
            expiry: expiry,
            totalSupply: totalSupply,
            purchased: 0,
            isCall: isCall,
            settled: false,
            settlementValue: 0,
            creator: msg.sender
        });
        
        activeOptions.push(optionId);
        
        // Store excess collateral
        balances[msg.sender] += msg.value - maxPayout;
        
        emit OptionCreated(optionId, msg.sender, strike, premium, expiry);
        return optionId;
    }
    
    /**
     * @dev Purchase rainfall options
     * @param optionId Option to purchase
     * @param quantity Number of options to buy
     */
    function purchaseOption(bytes32 optionId, uint256 quantity) 
        external 
        payable 
        whenNotPaused 
        nonReentrant 
        validOption(optionId) 
        notExpired(optionId) 
        notSettled(optionId) 
    {
        RainfallOption storage option = options[optionId];
        require(option.purchased + quantity <= option.totalSupply, "Insufficient options available");
        
        uint256 totalCost = option.premium * quantity;
        uint256 fee = (totalCost * protocolFee) / 10000;
        uint256 totalRequired = totalCost + fee;
        
        require(msg.value >= totalRequired, "Insufficient payment");
        
        // Update option state
        option.purchased += quantity;
        
        // Update position
        Position storage position = positions[msg.sender][optionId];
        if (position.quantity == 0) {
            position.optionId = optionId;
            position.isLong = true;
        }
        position.quantity += quantity;
        position.entryPrice = ((position.entryPrice * (position.quantity - quantity)) + totalCost) / position.quantity;
        
        // Transfer premium to option creator
        balances[option.creator] += totalCost;
        
        // Return excess payment
        if (msg.value > totalRequired) {
            balances[msg.sender] += msg.value - totalRequired;
        }
        
        totalVolumeTraded += totalCost;
        
        emit OptionPurchased(optionId, msg.sender, quantity, totalCost);
    }
    
    /**
     * @dev Update rainfall data (oracle only)
     * @param stationId Weather station identifier
     * @param rainfall Rainfall amount in mm (scaled by PRECISION)
     * @param source Data source identifier
     */
    function updateRainfallData(
        string memory stationId,
        uint256 rainfall,
        string memory source
    ) external onlyOracle {
        rainfallData[stationId] = RainfallData({
            value: rainfall,
            timestamp: block.timestamp,
            verified: true,
            source: source
        });
        
        emit RainfallDataUpdated(stationId, rainfall, block.timestamp);
        
        // Auto-settle expired options for this station
        _autoSettleExpiredOptions(stationId);
    }
    
    /**
     * @dev Settle an expired option
     * @param optionId Option to settle
     */
    function settleOption(bytes32 optionId) 
        external 
        validOption(optionId) 
        notSettled(optionId) 
    {
        RainfallOption storage option = options[optionId];
        require(block.timestamp >= option.expiry, "Option not yet expired");
        
        RainfallData memory data = rainfallData[option.stationId];
        require(data.verified, "No verified rainfall data");
        require(data.timestamp >= option.expiry - 24 hours, "Stale rainfall data");
        
        uint256 actualRainfall = data.value;
        uint256 payout = _calculatePayout(option, actualRainfall);
        
        option.settled = true;
        option.settlementValue = payout;
        
        emit OptionSettled(optionId, actualRainfall, payout);
    }
    
    /**
     * @dev Claim settlement proceeds
     * @param optionId Settled option
     */
    function claimSettlement(bytes32 optionId) 
        external 
        nonReentrant 
        validOption(optionId) 
    {
        RainfallOption storage option = options[optionId];
        require(option.settled, "Option not settled");
        
        Position storage position = positions[msg.sender][optionId];
        require(position.quantity > 0, "No position to claim");
        
        uint256 totalPayout = (option.settlementValue * position.quantity) / option.totalSupply;
        position.quantity = 0; // Prevent re-claiming
        
        if (totalPayout > 0) {
            balances[msg.sender] += totalPayout;
        }
    }
    
    /**
     * @dev Withdraw user balance
     * @param amount Amount to withdraw
     */
    function withdraw(uint256 amount) external nonReentrant {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev Calculate option payout based on actual rainfall
     */
    function _calculatePayout(RainfallOption memory option, uint256 actualRainfall) 
        internal 
        pure 
        returns (uint256) 
    {
        if (option.isCall) {
            // Call option: pays when actual > strike
            if (actualRainfall > option.strike * PRECISION) {
                return ((actualRainfall - (option.strike * PRECISION)) * option.purchased) / PRECISION;
            }
        } else {
            // Put option: pays when actual < strike
            if (actualRainfall < option.strike * PRECISION) {
                return (((option.strike * PRECISION) - actualRainfall) * option.purchased) / PRECISION;
            }
        }
        return 0;
    }
    
    /**
     * @dev Auto-settle expired options for a weather station
     */
    function _autoSettleExpiredOptions(string memory stationId) internal {
        for (uint256 i = 0; i < activeOptions.length; i++) {
            bytes32 optionId = activeOptions[i];
            RainfallOption storage option = options[optionId];
            
            if (
                !option.settled &&
                block.timestamp >= option.expiry &&
                keccak256(bytes(option.stationId)) == keccak256(bytes(stationId))
            ) {
                RainfallData memory data = rainfallData[stationId];
                uint256 payout = _calculatePayout(option, data.value);
                
                option.settled = true;
                option.settlementValue = payout;
                
                emit OptionSettled(optionId, data.value, payout);
            }
        }
    }
    
    // Admin functions
    function setWeatherOracle(address _newOracle) external onlyOwner {
        weatherOracle = _newOracle;
        emit OracleUpdated(_newOracle);
    }
    
    function addWeatherStation(string memory stationId) external onlyOwner {
        weatherStations.push(stationId);
    }
    
    function setProtocolFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Fee too high"); // Max 10%
        protocolFee = _newFee;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Emergency function
    function emergencyWithdraw() external {
        require(paused(), "Contract must be paused");
        uint256 balance = balances[msg.sender];
        require(balance > 0, "No balance to withdraw");
        
        balances[msg.sender] = 0;
        
        (bool success, ) = msg.sender.call{value: balance}("");
        require(success, "Emergency withdrawal failed");
        
        emit EmergencyWithdrawal(msg.sender, balance);
    }
    
    // View functions
    function getActiveOptions() external view returns (bytes32[] memory) {
        return activeOptions;
    }
    
    function getWeatherStations() external view returns (string[] memory) {
        return weatherStations;
    }
    
    function getOptionDetails(bytes32 optionId) external view returns (RainfallOption memory) {
        return options[optionId];
    }
    
    function getUserPosition(address user, bytes32 optionId) external view returns (Position memory) {
        return positions[user][optionId];
    }
    
    function getRainfallData(string memory stationId) external view returns (RainfallData memory) {
        return rainfallData[stationId];
    }
    
    // Receive function to accept ETH
    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}