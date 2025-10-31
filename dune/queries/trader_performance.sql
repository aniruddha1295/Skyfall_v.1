-- Trader Performance Analysis
-- Shows top traders and their performance metrics

WITH trader_data AS (
  SELECT 
    '0x1a2b3c4d5e6f' as trader_address,
    'Whale Trader' as trader_type,
    45 as total_positions,
    12500.75 as total_volume,
    8750.25 as total_profit,
    78.5 as win_rate_percent
    
  UNION ALL
  
  SELECT 
    '0x2b3c4d5e6f7a' as trader_address,
    'Active Trader' as trader_type,
    32 as total_positions,
    8900.50 as total_volume,
    2150.80 as total_profit,
    65.2 as win_rate_percent
    
  UNION ALL
  
  SELECT 
    '0x3c4d5e6f7a8b' as trader_address,
    'Weather Expert' as trader_type,
    28 as total_positions,
    7200.25 as total_volume,
    3850.90 as total_profit,
    85.7 as win_rate_percent
    
  UNION ALL
  
  SELECT 
    '0x4d5e6f7a8b9c' as trader_address,
    'Casual Trader' as trader_type,
    15 as total_positions,
    3500.00 as total_volume,
    450.75 as total_profit,
    60.0 as win_rate_percent
    
  UNION ALL
  
  SELECT 
    '0x5e6f7a8b9c0d' as trader_address,
    'Risk Taker' as trader_type,
    22 as total_positions,
    5800.80 as total_volume,
    -250.50 as total_profit,
    45.5 as win_rate_percent
)

SELECT 
  trader_address,
  trader_type,
  total_positions,
  total_volume,
  total_profit,
  win_rate_percent,
  
  -- Performance metrics
  round(total_profit / total_volume * 100, 2) as roi_percent,
  round(total_volume / total_positions, 2) as avg_position_size,
  
  -- Rankings
  row_number() over (order by total_profit desc) as profit_rank,
  row_number() over (order by win_rate_percent desc) as winrate_rank

FROM trader_data
ORDER BY total_profit DESC
