// get_weather_data.cdc
// Script to read weather data from WeatherOracle contract

import WeatherOracle from "../contracts/WeatherOracle.cdc"

access(all) fun main(stationId: String): WeatherOracle.WeatherData? {
    return WeatherOracle.getWeatherData(stationId: stationId)
}
