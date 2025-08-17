// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title FlareWindFutures
 * @dev Wind futures trading contract on Flare Network with FTSO price feeds
 * Supports long/short positions with automatic settlement and FLR/USDT collateral
 */
// Flare FTSO interfaces
interface IFtsoV2 {
    function getFeedById(bytes21 feedId) external view returns (uint256 value, int8 decimals, uint64 timestamp);
}

interface IContractRegistry {
    function getFtsoV2() external view returns (IFtsoV2);
}

contract FlareWindFutures is ReentrancyGuard, Ownable {
    
    // Contract state
    IContractRegistry public immutable contractRegistry;
    IFtsoV2 public ftsoV2;
    
    // Supported tokens
    IERC20 public immutable flrToken;
    IERC20 public immutable usdtToken;
    
    // Wind data feed ID (will be updated with actual Flare feed ID)
    bytes21 public constant WIND_SPEED_FEED_ID = 0x01574E442f55534400000000000000000000000000; // Placeholder
    bytes21 public constant FLR_USD_FEED_ID = 0x01464c522f55534400000000000000000000000000;
    
    struct WindFuture {
        bytes32 contractId;
        address trader;
        bool isLong; // true = long, false = short
        uint256 strikePrice; // Wind speed in mph * 100 (e.g., 1350 = 13.5 mph)
        uint256 notionalAmount; // Position size in USD
        uint256 collateralAmount; // Collateral deposited
        address collateralToken; // FLR or USDT
        uint256 expiryTimestamp;
        bool isSettled;
        int256 pnl; // Profit/Loss in USD
        uint256 createdAt;
    }
    
    struct MarketData {
        uint256 currentWindSpeed; // Wind speed * 100
        uint256 flrUsdPrice; // FLR/USD price
        uint256 lastUpdate;
    }
    
    // State variables
    mapping(bytes32 => WindFuture) public windFutures;
    mapping(address => bytes32[]) public userPositions;
    bytes32[] public allContracts;
    
    uint256 public constant MARGIN_REQUIREMENT = 20; // 20% margin requirement
    uint256 public constant SETTLEMENT_WINDOW = 1 hours; // Settlement grace period
    
    MarketData public marketData;
    
    // Events
    event FutureCreated(
        bytes32 indexed contractId,
        address indexed trader,
        bool isLong,
        uint256 strikePrice,
        uint256 notionalAmount,
        uint256 collateralAmount,
        address collateralToken,
        uint256 expiryTimestamp
    );
    
    event FutureSettled(
        bytes32 indexed contractId,
        address indexed trader,
        int256 pnl,
        uint256 windSpeedAtExpiry
    );
    
    event MarketDataUpdated(
        uint256 windSpeed,
        uint256 flrUsdPrice,
        uint256 timestamp
    );
    
    constructor(
        address _contractRegistry,
        address _flrToken,
        address _usdtToken
    ) Ownable(msg.sender) {
        contractRegistry = IContractRegistry(_contractRegistry);
        ftsoV2 = contractRegistry.getFtsoV2();
        flrToken = IERC20(_flrToken);
        usdtToken = IERC20(_usdtToken);
    }
    
    /**
     * @dev Create a new wind future position
     * @param _isLong True for long position, false for short
     * @param _strikePrice Wind speed strike price (mph * 100)
     * @param _notionalAmount Position size in USD
     * @param _collateralToken Address of collateral token (FLR or USDT)
     * @param _expiryDays Number of days until expiry (7, 14, or 30)
     */
    function createWindFuture(
        bool _isLong,
        uint256 _strikePrice,
        uint256 _notionalAmount,
        address _collateralToken,
        uint256 _expiryDays
    ) external nonReentrant {
        require(_expiryDays == 7 || _expiryDays == 14 || _expiryDays == 30, "Invalid expiry period");
        require(_strikePrice >= 400 && _strikePrice <= 2400, "Strike price out of range (4-24 mph)");
        require(_notionalAmount >= 100e18, "Minimum position size: $100");
        require(_collateralToken == address(flrToken) || _collateralToken == address(usdtToken), "Invalid collateral token");
        
        // Update market data from FTSO
        updateMarketData();
        
        // Calculate required collateral
        uint256 requiredCollateral = (_notionalAmount * MARGIN_REQUIREMENT) / 100;
        uint256 collateralInToken;
        
        if (_collateralToken == address(flrToken)) {
            // Convert USD to FLR using FTSO price
            collateralInToken = (requiredCollateral * 1e18) / marketData.flrUsdPrice;
        } else {
            // USDT collateral (assuming 1:1 USD)
            collateralInToken = requiredCollateral;
        }
        
        // Transfer collateral
        IERC20(_collateralToken).transferFrom(msg.sender, address(this), collateralInToken);
        
        // Create contract
        bytes32 contractId = keccak256(abi.encodePacked(
            msg.sender,
            _strikePrice,
            _notionalAmount,
            block.timestamp,
            allContracts.length
        ));
        
        uint256 expiryTimestamp = block.timestamp + (_expiryDays * 1 days);
        
        windFutures[contractId] = WindFuture({
            contractId: contractId,
            trader: msg.sender,
            isLong: _isLong,
            strikePrice: _strikePrice,
            notionalAmount: _notionalAmount,
            collateralAmount: collateralInToken,
            collateralToken: _collateralToken,
            expiryTimestamp: expiryTimestamp,
            isSettled: false,
            pnl: 0,
            createdAt: block.timestamp
        });
        
        userPositions[msg.sender].push(contractId);
        allContracts.push(contractId);
        
        emit FutureCreated(
            contractId,
            msg.sender,
            _isLong,
            _strikePrice,
            _notionalAmount,
            collateralInToken,
            _collateralToken,
            expiryTimestamp
        );
    }
    
    /**
     * @dev Settle an expired wind future contract
     * @param _contractId Contract ID to settle
     */
    function settleFuture(bytes32 _contractId) external nonReentrant {
        WindFuture storage future = windFutures[_contractId];
        require(future.trader != address(0), "Contract does not exist");
        require(!future.isSettled, "Contract already settled");
        require(block.timestamp >= future.expiryTimestamp, "Contract not yet expired");
        require(block.timestamp <= future.expiryTimestamp + SETTLEMENT_WINDOW, "Settlement window expired");
        
        // Update market data to get settlement wind speed
        updateMarketData();
        uint256 settlementWindSpeed = marketData.currentWindSpeed;
        
        // Calculate P&L
        int256 priceDifference = int256(settlementWindSpeed) - int256(future.strikePrice);
        
        // For long positions: profit if wind speed > strike, loss if wind speed < strike
        // For short positions: profit if wind speed < strike, loss if wind speed > strike
        if (!future.isLong) {
            priceDifference = -priceDifference;
        }
        
        // P&L = (price difference / strike price) * notional amount
        int256 pnl = (priceDifference * int256(future.notionalAmount)) / int256(future.strikePrice);
        
        future.pnl = pnl;
        future.isSettled = true;
        
        // Calculate payout
        uint256 totalPayout = future.collateralAmount;
        
        if (pnl > 0) {
            // Profit - add to collateral
            uint256 profitInToken;
            if (future.collateralToken == address(flrToken)) {
                profitInToken = (uint256(pnl) * 1e18) / marketData.flrUsdPrice;
            } else {
                profitInToken = uint256(pnl);
            }
            totalPayout += profitInToken;
        } else if (pnl < 0) {
            // Loss - deduct from collateral
            uint256 lossInToken;
            if (future.collateralToken == address(flrToken)) {
                lossInToken = (uint256(-pnl) * 1e18) / marketData.flrUsdPrice;
            } else {
                lossInToken = uint256(-pnl);
            }
            
            if (lossInToken >= totalPayout) {
                totalPayout = 0; // Total loss
            } else {
                totalPayout -= lossInToken;
            }
        }
        
        // Transfer payout to trader
        if (totalPayout > 0) {
            IERC20(future.collateralToken).transfer(future.trader, totalPayout);
        }
        
        emit FutureSettled(_contractId, future.trader, pnl, settlementWindSpeed);
    }
    
    /**
     * @dev Update market data from Flare FTSO
     */
    function updateMarketData() public {
        // Get FLR/USD price from FTSO
        (uint256 flrUsdValue, int8 flrDecimals, uint64 flrTimestamp) = ftsoV2.getFeedById(FLR_USD_FEED_ID);
        
        // Convert price to 18 decimals
        uint256 flrUsdPrice;
        if (flrDecimals >= 0) {
            flrUsdPrice = flrUsdValue * (10 ** (18 - uint8(flrDecimals)));
        } else {
            flrUsdPrice = flrUsdValue / (10 ** uint8(-flrDecimals));
        }
        
        // For now, use a simulated wind speed - in production this would come from FDC
        uint256 currentWindSpeed = 750; // 7.5 mph as placeholder
        
        marketData = MarketData({
            currentWindSpeed: currentWindSpeed,
            flrUsdPrice: flrUsdPrice,
            lastUpdate: block.timestamp
        });
        
        emit MarketDataUpdated(currentWindSpeed, flrUsdPrice, block.timestamp);
    }
    
    /**
     * @dev Get user's open positions
     * @param _user User address
     * @return Array of contract IDs
     */
    function getUserPositions(address _user) external view returns (bytes32[] memory) {
        return userPositions[_user];
    }
    
    /**
     * @dev Get contract details
     * @param _contractId Contract ID
     * @return WindFuture struct
     */
    function getContract(bytes32 _contractId) external view returns (WindFuture memory) {
        return windFutures[_contractId];
    }
    
    /**
     * @dev Get all active contracts
     * @return Array of contract IDs
     */
    function getAllContracts() external view returns (bytes32[] memory) {
        return allContracts;
    }
    
    /**
     * @dev Get current market data
     * @return MarketData struct
     */
    function getMarketData() external view returns (MarketData memory) {
        return marketData;
    }
    
    /**
     * @dev Emergency function to update FTSO interface
     */
    function updateFtsoInterface() external onlyOwner {
        ftsoV2 = contractRegistry.getFtsoV2();
    }
}