-- Strike Level Analysis
-- Detailed analysis of rain and wind strike levels across locations

WITH strike_level_distribution AS (
  SELECT 
    'Dallas, TX' as location,
    'Rainfall Contracts' as contract_category,
    15.5 as strike_level,
    'mm' as unit,
    3 as contract_count,
    2850.25 as total_value_usd,
    25 as avg_days_to_expiration
    
  UNION ALL
  
  SELECT 
    'Dallas, TX' as location,
    'Wind Contracts' as contract_category,
    12.5 as strike_level,
    'mph' as unit,
    2 as contract_count,
    1700.25 as total_value_usd,
    27 as avg_days_to_expiration
    
  UNION ALL
  
  SELECT 
    'Houston, TX' as location,
    'Rainfall Contracts' as contract_category,
    20.0 as strike_level,
    'mm' as unit,
    2 as contract_count,
    1950.50 as total_value_usd,
    35 as avg_days_to_expiration
    
  UNION ALL
  
  SELECT 
    'Austin, TX' as location,
    'Wind Contracts' as contract_category,
    15.5 as strike_level,
    'mph' as unit,
    1 as contract_count,
    680.90 as total_value_usd,
    19 as avg_days_to_expiration
    
  UNION ALL
  
  SELECT 
    'Miami, FL' as location,
    'Rainfall Contracts' as contract_category,
    35.0 as strike_level,
    'mm' as unit,
    1 as contract_count,
    2100.50 as total_value_usd,
    14 as avg_days_to_expiration
    
  UNION ALL
  
  SELECT 
    'Chicago, IL' as location,
    'Wind Contracts' as contract_category,
    22.0 as strike_level,
    'mph' as unit,
    1 as contract_count,
    1850.75 as total_value_usd,
    7 as avg_days_to_expiration
),

strike_level_ranges AS (
  SELECT 
    'Rain Strike Ranges' as analysis_type,
    'Low (0-15mm)' as range_category,
    1 as contract_count,
    15.5 as avg_strike_level,
    850.25 as total_value
    
  UNION ALL
  
  SELECT 
    'Rain Strike Ranges' as analysis_type,
    'Medium (15-25mm)' as range_category,
    2 as contract_count,
    20.0 as avg_strike_level,
    3100.75 as total_value
    
  UNION ALL
  
  SELECT 
    'Rain Strike Ranges' as analysis_type,
    'High (25mm+)' as range_category,
    1 as contract_count,
    35.0 as avg_strike_level,
    2100.50 as total_value
    
  UNION ALL
  
  SELECT 
    'Wind Strike Ranges' as analysis_type,
    'Low (0-15mph)' as range_category,
    2 as contract_count,
    14.0 as avg_strike_level,
    2381.15 as total_value
    
  UNION ALL
  
  SELECT 
    'Wind Strike Ranges' as analysis_type,
    'Medium (15-20mph)' as range_category,
    1 as contract_count,
    15.5 as avg_strike_level,
    680.90 as total_value
    
  UNION ALL
  
  SELECT 
    'Wind Strike Ranges' as analysis_type,
    'High (20mph+)' as range_category,
    1 as contract_count,
    22.0 as avg_strike_level,
    1850.75 as total_value
),

expiration_urgency AS (
  SELECT 
    location,
    contract_category,
    strike_level,
    unit,
    contract_count,
    total_value_usd,
    avg_days_to_expiration,
    CASE 
      WHEN avg_days_to_expiration <= 7 THEN 'URGENT - Expiring This Week'
      WHEN avg_days_to_expiration <= 14 THEN 'SOON - Expiring Next Week'
      WHEN avg_days_to_expiration <= 30 THEN 'NORMAL - Expiring This Month'
      ELSE 'LONG - Expiring Later'
    END as expiration_urgency,
    CASE 
      WHEN avg_days_to_expiration <= 7 THEN 'red'
      WHEN avg_days_to_expiration <= 14 THEN 'orange'
      WHEN avg_days_to_expiration <= 30 THEN 'yellow'
      ELSE 'green'
    END as urgency_color
  FROM strike_level_distribution
)

SELECT 
  -- Location and Strike Details
  sld.location,
  sld.contract_category,
  sld.strike_level,
  sld.unit,
  sld.contract_count,
  sld.total_value_usd,
  sld.avg_days_to_expiration,
  
  -- Strike Level Analysis
  CASE 
    WHEN sld.contract_category = 'Rainfall Contracts' THEN
      CASE 
        WHEN sld.strike_level < 15 THEN 'Conservative Rain Bet'
        WHEN sld.strike_level < 25 THEN 'Moderate Rain Bet'
        ELSE 'Aggressive Rain Bet'
      END
    WHEN sld.contract_category = 'Wind Contracts' THEN
      CASE 
        WHEN sld.strike_level < 15 THEN 'Conservative Wind Bet'
        WHEN sld.strike_level < 20 THEN 'Moderate Wind Bet'
        ELSE 'Aggressive Wind Bet'
      END
  END as strike_strategy,
  
  -- Market Share by Strike Level
  round(sld.total_value_usd * 100.0 / sum(sld.total_value_usd) over(), 2) as value_market_share,
  round(sld.contract_count * 100.0 / sum(sld.contract_count) over(), 2) as count_market_share,
  
  -- Expiration Urgency
  eu.expiration_urgency,
  eu.urgency_color,
  
  -- Strike Level Ranges Analysis
  slr.analysis_type,
  slr.range_category,
  slr.avg_strike_level as range_avg_strike,
  slr.total_value as range_total_value,
  
  -- Risk Assessment
  CASE 
    WHEN sld.avg_days_to_expiration <= 7 AND sld.total_value_usd > 1000 THEN 'HIGH RISK - Large position expiring soon'
    WHEN sld.avg_days_to_expiration <= 14 AND sld.total_value_usd > 1500 THEN 'MEDIUM RISK - Significant exposure'
    ELSE 'LOW RISK - Normal position'
  END as risk_assessment,
  
  -- Performance Indicators
  round(sld.total_value_usd / sld.contract_count, 2) as avg_contract_size,
  round(sld.strike_level * sld.total_value_usd / 1000, 2) as strike_weighted_exposure

FROM strike_level_distribution sld
LEFT JOIN expiration_urgency eu ON sld.location = eu.location AND sld.contract_category = eu.contract_category
CROSS JOIN strike_level_ranges slr
ORDER BY sld.avg_days_to_expiration ASC, sld.total_value_usd DESC
