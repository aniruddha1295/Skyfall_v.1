-- Contract Details Analytics
-- Tracks location, strike levels, expiration data for all weather derivatives

WITH contract_details AS (
  SELECT 
    'wxm_dallas_001' as weather_station_id,
    'Dallas, TX' as location,
    32.7767 as latitude,
    -96.7970 as longitude,
    'Rainfall Put' as contract_type,
    15.5 as rain_strike_level_mm,
    NULL as wind_strike_level_mph,
    '2024-12-15' as contract_expiration,
    44 as days_to_expiration,
    'Flow EVM' as blockchain,
    850.25 as position_value_usd,
    'Active' as contract_status
    
  UNION ALL
  
  SELECT 
    'wxm_dallas_001' as weather_station_id,
    'Dallas, TX' as location,
    32.7767 as latitude,
    -96.7970 as longitude,
    'Rainfall Call' as contract_type,
    25.0 as rain_strike_level_mm,
    NULL as wind_strike_level_mph,
    '2024-11-30' as contract_expiration,
    29 as days_to_expiration,
    'Flow EVM' as blockchain,
    1250.80 as position_value_usd,
    'Active' as contract_status
    
  UNION ALL
  
  SELECT 
    'flare_dallas_wind' as weather_station_id,
    'Dallas, TX' as location,
    32.7767 as latitude,
    -96.7970 as longitude,
    'Wind Futures Long' as contract_type,
    NULL as rain_strike_level_mm,
    12.5 as wind_strike_level_mph,
    '2024-12-01' as contract_expiration,
    30 as days_to_expiration,
    'Flare Coston2' as blockchain,
    750.50 as position_value_usd,
    'Active' as contract_status
    
  UNION ALL
  
  SELECT 
    'flare_dallas_wind' as weather_station_id,
    'Dallas, TX' as location,
    32.7767 as latitude,
    -96.7970 as longitude,
    'Wind Futures Short' as contract_type,
    NULL as rain_strike_level_mm,
    18.0 as wind_strike_level_mph,
    '2024-11-25' as contract_expiration,
    24 as days_to_expiration,
    'Flare Coston2' as blockchain,
    950.75 as position_value_usd,
    'Active' as contract_status
    
  UNION ALL
  
  SELECT 
    'wxm_houston_002' as weather_station_id,
    'Houston, TX' as location,
    29.7604 as latitude,
    -95.3698 as longitude,
    'Rainfall Put' as contract_type,
    20.0 as rain_strike_level_mm,
    NULL as wind_strike_level_mph,
    '2024-12-10' as contract_expiration,
    39 as days_to_expiration,
    'Flow EVM' as blockchain,
    1150.25 as position_value_usd,
    'Active' as contract_status
    
  UNION ALL
  
  SELECT 
    'wxm_austin_003' as weather_station_id,
    'Austin, TX' as location,
    30.2672 as latitude,
    -97.7431 as longitude,
    'Wind Futures Long' as contract_type,
    NULL as rain_strike_level_mm,
    15.5 as wind_strike_level_mph,
    '2024-11-20' as contract_expiration,
    19 as days_to_expiration,
    'Flare Coston2' as blockchain,
    680.90 as position_value_usd,
    'Active' as contract_status
    
  UNION ALL
  
  SELECT 
    'wxm_miami_004' as weather_station_id,
    'Miami, FL' as location,
    25.7617 as latitude,
    -80.1918 as longitude,
    'Rainfall Call' as contract_type,
    35.0 as rain_strike_level_mm,
    NULL as wind_strike_level_mph,
    '2024-11-15' as contract_expiration,
    14 as days_to_expiration,
    'Flow EVM' as blockchain,
    2100.50 as position_value_usd,
    'Expiring Soon' as contract_status
    
  UNION ALL
  
  SELECT 
    'flare_chicago_wind' as weather_station_id,
    'Chicago, IL' as location,
    41.8781 as latitude,
    -87.6298 as longitude,
    'Wind Futures Short' as contract_type,
    NULL as rain_strike_level_mm,
    22.0 as wind_strike_level_mph,
    '2024-11-08' as contract_expiration,
    7 as days_to_expiration,
    'Flare Coston2' as blockchain,
    1850.75 as position_value_usd,
    'Expiring Soon' as contract_status
),

expiration_categories AS (
  SELECT 
    cd.*,
    CASE 
      WHEN cd.days_to_expiration <= 7 THEN 'Expiring Soon (≤7 days)'
      WHEN cd.days_to_expiration <= 14 THEN 'Short Term (8-14 days)'
      WHEN cd.days_to_expiration <= 30 THEN 'Medium Term (15-30 days)'
      ELSE 'Long Term (>30 days)'
    END as expiration_category,
    
    CASE 
      WHEN cd.days_to_expiration <= 7 THEN 'High'
      WHEN cd.days_to_expiration <= 14 THEN 'Medium'
      ELSE 'Low'
    END as time_decay_risk
  FROM contract_details cd
),

location_summary AS (
  SELECT 
    location,
    COUNT(*) as total_contracts,
    COUNT(CASE WHEN rain_strike_level_mm IS NOT NULL THEN 1 END) as rainfall_contracts,
    COUNT(CASE WHEN wind_strike_level_mph IS NOT NULL THEN 1 END) as wind_contracts,
    AVG(CASE WHEN rain_strike_level_mm IS NOT NULL THEN rain_strike_level_mm END) as avg_rain_strike,
    AVG(CASE WHEN wind_strike_level_mph IS NOT NULL THEN wind_strike_level_mph END) as avg_wind_strike,
    SUM(position_value_usd) as total_position_value,
    AVG(days_to_expiration) as avg_days_to_expiration
  FROM contract_details
  GROUP BY location
)

SELECT 
  -- Contract Location Details
  ec.weather_station_id,
  ec.location,
  ec.latitude,
  ec.longitude,
  
  -- Contract Specifications
  ec.contract_type,
  ec.rain_strike_level_mm,
  ec.wind_strike_level_mph,
  
  -- Expiration Information
  ec.contract_expiration,
  ec.days_to_expiration,
  ec.expiration_category,
  ec.time_decay_risk,
  
  -- Trading Details
  ec.blockchain,
  ec.position_value_usd,
  ec.contract_status,
  
  -- Location Summary Statistics
  ls.total_contracts as contracts_at_location,
  ls.rainfall_contracts,
  ls.wind_contracts,
  ls.avg_rain_strike as location_avg_rain_strike,
  ls.avg_wind_strike as location_avg_wind_strike,
  ls.total_position_value as location_total_value,
  ls.avg_days_to_expiration as location_avg_expiration,
  
  -- Risk Metrics
  CASE 
    WHEN ec.rain_strike_level_mm IS NOT NULL THEN
      CASE 
        WHEN ec.rain_strike_level_mm < 10 THEN 'Low Rain Threshold'
        WHEN ec.rain_strike_level_mm < 25 THEN 'Medium Rain Threshold'
        ELSE 'High Rain Threshold'
      END
    ELSE NULL
  END as rain_risk_category,
  
  CASE 
    WHEN ec.wind_strike_level_mph IS NOT NULL THEN
      CASE 
        WHEN ec.wind_strike_level_mph < 15 THEN 'Low Wind Threshold'
        WHEN ec.wind_strike_level_mph < 25 THEN 'Medium Wind Threshold'
        ELSE 'High Wind Threshold'
      END
    ELSE NULL
  END as wind_risk_category,
  
  -- Geographic Distribution
  round(ec.position_value_usd * 100.0 / sum(ec.position_value_usd) over(), 2) as position_weight_percent

FROM expiration_categories ec
LEFT JOIN location_summary ls ON ec.location = ls.location
ORDER BY ec.days_to_expiration ASC, ec.position_value_usd DESC
