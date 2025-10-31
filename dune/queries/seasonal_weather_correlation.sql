-- Seasonal Weather Trading Correlation Analysis
-- Analyzes how seasonal weather patterns affect trading behavior

WITH seasonal_data AS (
  SELECT 
    'Spring' as season,
    'March-May' as months,
    25.5 as avg_temperature_c,
    45.2 as avg_rainfall_mm,
    12.8 as avg_wind_speed_mph,
    1250 as total_volume_usd,
    85 as total_positions,
    'High rainfall activity' as dominant_pattern,
    'Put Options' as preferred_contracts
    
  UNION ALL
  
  SELECT 
    'Summer' as season,
    'June-August' as months,
    32.1 as avg_temperature_c,
    15.8 as avg_rainfall_mm,
    8.5 as avg_wind_speed_mph,
    950 as total_volume_usd,
    62 as total_positions,
    'Drought concerns' as dominant_pattern,
    'Call Options' as preferred_contracts
    
  UNION ALL
  
  SELECT 
    'Fall' as season,
    'September-November' as months,
    18.7 as avg_temperature_c,
    35.8 as avg_rainfall_mm,
    15.2 as avg_wind_speed_mph,
    1450 as total_volume_usd,
    95 as total_positions,
    'Storm season' as dominant_pattern,
    'Mixed Strategies' as preferred_contracts
    
  UNION ALL
  
  SELECT 
    'Winter' as season,
    'December-February' as months,
    8.2 as avg_temperature_c,
    28.5 as avg_rainfall_mm,
    18.9 as avg_wind_speed_mph,
    1100 as total_volume_usd,
    72 as total_positions,
    'Wind patterns' as dominant_pattern,
    'Wind Futures' as preferred_contracts
),

weather_extremes AS (
  SELECT 
    'Extreme Heat (>35°C)' as event_type,
    8 as days_per_year,
    185 as avg_daily_volume,
    'Temperature hedging' as trading_response
    
  UNION ALL
  
  SELECT 
    'Heavy Rain (>25mm)' as event_type,
    12 as days_per_year,
    220 as avg_daily_volume,
    'Flood protection' as trading_response
    
  UNION ALL
  
  SELECT 
    'High Wind (>20mph)' as event_type,
    15 as days_per_year,
    165 as avg_daily_volume,
    'Wind futures surge' as trading_response
)

SELECT 
  -- Seasonal Analysis
  sd.season,
  sd.months,
  sd.avg_temperature_c,
  sd.avg_rainfall_mm,
  sd.avg_wind_speed_mph,
  sd.total_volume_usd,
  sd.total_positions,
  sd.dominant_pattern,
  sd.preferred_contracts,
  
  -- Market Share by Season
  round(sd.total_volume_usd * 100.0 / sum(sd.total_volume_usd) over(), 2) as seasonal_volume_share,
  round(sd.total_positions * 100.0 / sum(sd.total_positions) over(), 2) as seasonal_position_share,
  
  -- Trading Intensity
  round(sd.total_volume_usd / sd.total_positions, 2) as avg_position_size,
  
  -- Weather Correlation Score (higher = more weather-driven trading)
  round(
    (sd.avg_rainfall_mm * 0.4 + sd.avg_wind_speed_mph * 0.3 + abs(sd.avg_temperature_c - 20) * 0.3) 
    * sd.total_volume_usd / 1000, 2
  ) as weather_correlation_score

FROM seasonal_data sd
ORDER BY sd.total_volume_usd DESC
