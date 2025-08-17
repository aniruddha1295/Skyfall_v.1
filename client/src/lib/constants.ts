export const CITIES = [
  { city: "Dallas", state: "TX", stationId: "wxm_dallas_001" },
  { city: "Houston", state: "TX", stationId: "wxm_houston_001" },
  { city: "Austin", state: "TX", stationId: "wxm_austin_001" },
  { city: "San Antonio", state: "TX", stationId: "wxm_sanantonio_001" },
  { city: "New York", state: "NY", stationId: "wxm_newyork_001" },
  { city: "Los Angeles", state: "CA", stationId: "wxm_losangeles_001" },
  { city: "Chicago", state: "IL", stationId: "wxm_chicago_001" },
  { city: "Phoenix", state: "AZ", stationId: "wxm_phoenix_001" },
  { city: "Philadelphia", state: "PA", stationId: "wxm_philadelphia_001" },
  { city: "San Diego", state: "CA", stationId: "wxm_sandiego_001" },
  { city: "Miami", state: "FL", stationId: "wxm_miami_001" },
  { city: "Atlanta", state: "GA", stationId: "wxm_atlanta_001" },
  { city: "Boston", state: "MA", stationId: "wxm_boston_001" },
  { city: "Seattle", state: "WA", stationId: "wxm_seattle_001" },
  { city: "Denver", state: "CO", stationId: "wxm_denver_001" },
  { city: "Las Vegas", state: "NV", stationId: "wxm_lasvegas_001" },
  { city: "Portland", state: "OR", stationId: "wxm_portland_001" },
  { city: "Nashville", state: "TN", stationId: "wxm_nashville_001" },
  { city: "Charlotte", state: "NC", stationId: "wxm_charlotte_001" },
  { city: "Indianapolis", state: "IN", stationId: "wxm_indianapolis_001" },
  // Add more cities as needed
];

export const EXPIRY_DATES = [
  { label: "Jan 31", value: "2025-01-31" },
  { label: "Feb 14", value: "2025-02-14" },
  { label: "Feb 28", value: "2025-02-28" },
  { label: "Mar 15", value: "2025-03-15" },
  { label: "Mar 31", value: "2025-03-31" },
];

export const STRIKE_LEVELS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];

export const FLOW_EVM_CONFIG = {
  chainId: 747, // Flow EVM Testnet
  networkName: "Flow EVM Testnet",
  rpcUrl: "https://testnet.evm.nodes.onflow.org",
  blockExplorerUrl: "https://evm-testnet.flowscan.io",
  nativeCurrency: {
    name: "Flow",
    symbol: "FLOW",
    decimals: 18
  }
};

export const GREEKS_EXPLANATIONS = {
  delta: {
    name: "Delta (Δ)",
    description: "Price sensitivity to rainfall changes",
    example: "A delta of 0.5 means the option price increases by $0.50 for every 1mm increase in rainfall"
  },
  gamma: {
    name: "Gamma (Γ)",
    description: "Rate of change of delta",
    example: "Higher gamma means delta changes more rapidly as rainfall changes"
  },
  theta: {
    name: "Theta (Θ)",
    description: "Time decay per day",
    example: "A theta of -0.05 means the option loses $0.05 in value each day"
  },
  vega: {
    name: "Vega (ν)",
    description: "Volatility sensitivity",
    example: "Higher vega means the option is more sensitive to changes in weather volatility"
  }
};

export const AI_INSIGHTS_CONFIG = {
  updateInterval: 30000, // 30 seconds
  confidenceThreshold: 0.7,
  maxRecommendations: 5
};
