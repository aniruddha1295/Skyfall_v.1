-- Skyfall Weather Derivatives - Basic Overview Dashboard
-- Simple metrics for demonstration purposes

SELECT 
  'Weather Derivatives Trading Platform' as platform_name,
  '0x9b94f5b3edd6c126' as contract_address,
  'Flow Testnet' as network,
  CURRENT_DATE as last_updated,
  
  -- Mock trading metrics for demo
  150 as total_contracts_created,
  1250 as total_positions_opened,
  45 as unique_traders,
  125000.50 as total_volume_usd,
  
  -- Weather metrics
  5 as active_weather_stations,
  850 as weather_data_points,
  25.4 as avg_temperature_c,
  12.8 as avg_rainfall_mm,
  
  -- Contract distribution
  85 as call_contracts,
  65 as put_contracts,
  
  -- Performance metrics
  78.5 as settlement_rate_percent,
  2500.75 as avg_premium_usd
