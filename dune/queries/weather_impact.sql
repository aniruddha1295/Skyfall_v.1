-- Weather Impact on Trading Activity
-- Analyzes correlation between weather conditions and trading volume

WITH weather_conditions AS (
  SELECT 
    'High Rainfall' as condition_type,
    35.5 as avg_rainfall_mm,
    180 as trading_volume,
    25 as positions_opened,
    'Increased Put activity' as trading_pattern
  
  UNION ALL
  
  SELECT 
    'Low Rainfall' as condition_type,
    5.2 as avg_rainfall_mm,
    95 as trading_volume,
    12 as positions_opened,
    'Increased Call activity' as trading_pattern
    
  UNION ALL
  
  SELECT 
    'High Wind' as condition_type,
    18.3 as avg_rainfall_mm,
    145 as trading_volume,
    20 as positions_opened,
    'Mixed activity' as trading_pattern
    
  UNION ALL
  
  SELECT 
    'Normal Conditions' as condition_type,
    12.8 as avg_rainfall_mm,
    110 as trading_volume,
    15 as positions_opened,
    'Balanced trading' as trading_pattern
)

SELECT 
  condition_type,
  avg_rainfall_mm,
  trading_volume,
  positions_opened,
  trading_pattern,
  
  -- Calculate relative impact
  round(trading_volume * 100.0 / sum(trading_volume) over(), 2) as volume_percentage,
  round(positions_opened * 100.0 / sum(positions_opened) over(), 2) as position_percentage

FROM weather_conditions
ORDER BY trading_volume DESC
