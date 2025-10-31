-- Contract Analytics - Enhanced with Location and Strike Data
-- Analyzes different contract types, locations, strike levels, and expiration data

WITH contract_types AS (
  SELECT 
    'Rainfall Put' as contract_type,
    'Put' as option_type,
    'Dallas, TX' as location,
    15.5 as rain_strike_level_mm,
    NULL as wind_strike_level_mph,
    25 as avg_days_to_expiration,
    45 as total_contracts,
    38 as settled_contracts,
    25 as profitable_settlements,
    125000.50 as total_premium,
    95000.75 as total_payouts
    
  UNION ALL
  
  SELECT 
    'Rainfall Call' as contract_type,
    'Call' as option_type,
    'Houston, TX' as location,
    25.0 as rain_strike_level_mm,
    NULL as wind_strike_level_mph,
    32 as avg_days_to_expiration,
    35 as total_contracts,
    30 as settled_contracts,
    18 as profitable_settlements,
    89500.25 as total_premium,
    67200.80 as total_payouts
    
  UNION ALL
  
  SELECT 
    'Wind Speed Put' as contract_type,
    'Put' as option_type,
    'Austin, TX' as location,
    NULL as rain_strike_level_mm,
    12.5 as wind_strike_level_mph,
    18 as avg_days_to_expiration,
    28 as total_contracts,
    25 as settled_contracts,
    15 as profitable_settlements,
    78900.00 as total_premium,
    58750.50 as total_payouts
    
  UNION ALL
  
  SELECT 
    'Wind Speed Call' as contract_type,
    'Call' as option_type,
    'Chicago, IL' as location,
    NULL as rain_strike_level_mm,
    18.0 as wind_strike_level_mph,
    8 as avg_days_to_expiration,
    22 as total_contracts,
    20 as settled_contracts,
    12 as profitable_settlements,
    65400.75 as total_premium,
    48900.25 as total_payouts
    
  UNION ALL
  
  SELECT 
    'Temperature Put' as contract_type,
    'Put' as option_type,
    'Miami, FL' as location,
    NULL as rain_strike_level_mm,
    NULL as wind_strike_level_mph,
    14 as avg_days_to_expiration,
    20 as total_contracts,
    18 as settled_contracts,
    10 as profitable_settlements,
    52800.00 as total_premium,
    38500.00 as total_payouts
)

SELECT 
  -- Contract Details
  contract_type,
  option_type,
  location,
  rain_strike_level_mm,
  wind_strike_level_mph,
  avg_days_to_expiration,
  
  -- Contract Volumes
  total_contracts,
  settled_contracts,
  profitable_settlements,
  total_premium,
  total_payouts,
  
  -- Performance metrics
  round(settled_contracts * 100.0 / total_contracts, 2) as settlement_rate_percent,
  round(profitable_settlements * 100.0 / settled_contracts, 2) as profitability_rate_percent,
  round(total_payouts / total_premium * 100, 2) as payout_ratio_percent,
  round(total_premium / total_contracts, 2) as avg_premium_per_contract,
  
  -- Market share
  round(total_contracts * 100.0 / sum(total_contracts) over(), 2) as market_share_percent,
  
  -- Expiration Analysis
  CASE 
    WHEN avg_days_to_expiration <= 7 THEN 'Expiring Soon'
    WHEN avg_days_to_expiration <= 14 THEN 'Short Term'
    WHEN avg_days_to_expiration <= 30 THEN 'Medium Term'
    ELSE 'Long Term'
  END as expiration_category,
  
  -- Strike Level Analysis
  CASE 
    WHEN rain_strike_level_mm IS NOT NULL THEN
      CASE 
        WHEN rain_strike_level_mm < 20 THEN 'Conservative Rain Strike'
        WHEN rain_strike_level_mm < 30 THEN 'Moderate Rain Strike'
        ELSE 'Aggressive Rain Strike'
      END
    WHEN wind_strike_level_mph IS NOT NULL THEN
      CASE 
        WHEN wind_strike_level_mph < 15 THEN 'Conservative Wind Strike'
        WHEN wind_strike_level_mph < 20 THEN 'Moderate Wind Strike'
        ELSE 'Aggressive Wind Strike'
      END
    ELSE 'Other Strike Type'
  END as strike_strategy

FROM contract_types
ORDER BY avg_days_to_expiration ASC, total_contracts DESC
