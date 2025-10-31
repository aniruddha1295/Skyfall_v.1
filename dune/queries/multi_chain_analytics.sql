-- Multi-Chain Trading Analytics
-- Compares trading activity across Flow EVM, Flare Network, and Ethereum

WITH chain_metrics AS (
  SELECT 
    'Flow EVM' as blockchain,
    'Rainfall Derivatives' as primary_product,
    'USDF' as primary_currency,
    850 as daily_volume_usd,
    45 as daily_transactions,
    12 as unique_traders,
    0.95 as settlement_success_rate,
    0.02 as avg_gas_cost_usd
    
  UNION ALL
  
  SELECT 
    'Flare Coston2' as blockchain,
    'Wind Futures' as primary_product,
    'FLR/USDT' as primary_currency,
    650 as daily_volume_usd,
    32 as daily_transactions,
    18 as unique_traders,
    0.92 as settlement_success_rate,
    0.015 as avg_gas_cost_usd
    
  UNION ALL
  
  SELECT 
    'Ethereum Mainnet' as blockchain,
    'Oracle Services' as primary_product,
    'ETH' as primary_currency,
    120 as daily_volume_usd,
    8 as daily_transactions,
    25 as unique_traders,
    0.98 as settlement_success_rate,
    15.50 as avg_gas_cost_usd
),

cross_chain_users AS (
  SELECT 
    'Single Chain Users' as user_type,
    85 as user_count,
    450.25 as avg_volume_per_user
    
  UNION ALL
  
  SELECT 
    'Multi Chain Users' as user_type,
    15 as user_count,
    1250.80 as avg_volume_per_user
)

SELECT 
  -- Chain Performance
  cm.blockchain,
  cm.primary_product,
  cm.primary_currency,
  cm.daily_volume_usd,
  cm.daily_transactions,
  cm.unique_traders,
  cm.settlement_success_rate,
  cm.avg_gas_cost_usd,
  
  -- Market Share
  round(cm.daily_volume_usd * 100.0 / sum(cm.daily_volume_usd) over(), 2) as volume_market_share,
  round(cm.unique_traders * 100.0 / sum(cm.unique_traders) over(), 2) as trader_market_share,
  
  -- Efficiency Metrics
  round(cm.daily_volume_usd / cm.daily_transactions, 2) as avg_tx_size,
  round(cm.avg_gas_cost_usd / cm.daily_volume_usd * 10000, 2) as gas_cost_bps

FROM chain_metrics cm
ORDER BY cm.daily_volume_usd DESC
