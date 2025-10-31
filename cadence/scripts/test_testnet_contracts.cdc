// Test script for deployed testnet contracts
import SimpleWeatherOracle from 0xf2085ff3cef1d657
import SimpleWeatherDerivatives from 0xf2085ff3cef1d657

access(all) fun main(): {String: AnyStruct} {
    // Test SimpleWeatherOracle
    let stations = SimpleWeatherOracle.getAllStations()
    
    // Test SimpleWeatherDerivatives  
    let activeOptions = SimpleWeatherDerivatives.getActiveOptions()
    let totalVolume = SimpleWeatherDerivatives.getTotalVolumeTraded()
    
    return {
        "weatherStations": stations,
        "activeOptions": activeOptions,
        "totalVolumeTraded": totalVolume.toString(),
        "contractsWorking": true
    }
}
