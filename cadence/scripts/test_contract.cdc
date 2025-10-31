// test_contract.cdc
// Simple script to test if SimpleWeatherOracle contract is deployed and working

import SimpleWeatherOracle from 0xf8d6e0586b0a20c7

access(all) fun main(): [String] {
    // Test basic contract functionality
    let stations = SimpleWeatherOracle.getAllStations()
    return stations
}
