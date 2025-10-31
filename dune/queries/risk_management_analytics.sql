-- Risk Management and Settlement Analytics
-- Tracks margin utilization, liquidations, and settlement performance

WITH margin_analytics AS (
  SELECT 
    'Low Risk (5-10% margin)' as risk_category,
    25 as position_count,
    8.5 as avg_margin_percent,
    0 as liquidation_count,
    98.5 as settlement_success_rate,
    450.25 as avg_position_value
    
  UNION ALL
  
  SELECT 
    'Medium Risk (10-15% margin)' as risk_category,
    45 as position_count,
    12.8 as avg_margin_percent,
    2 as liquidation_count,
    95.2 as settlement_success_rate,
    750.80 as avg_position_value
    
  UNION ALL
  
  SELECT 
    'High Risk (15-20% margin)' as risk_category,
    35 as position_count,
    17.5 as avg_margin_percent,
    5 as liquidation_count,
    88.9 as settlement_success_rate,
    1250.50 as avg_position_value
    
  UNION ALL
  
  SELECT 
    'Maximum Risk (20% margin)' as risk_category,
    15 as position_count,
    20.0 as avg_margin_percent,
    3 as liquidation_count,
    82.5 as settlement_success_rate,
    2100.75 as avg_position_value
),

settlement_performance AS (
  SELECT 
    'Rainfall Puts' as contract_type,
    'Flow EVM' as blockchain,
    85 as total_contracts,
    78 as successful_settlements,
    5 as failed_settlements,
    2 as disputed_settlements,
    24.5 as avg_settlement_hours
    
  UNION ALL
  
  SELECT 
    'Rainfall Calls' as contract_type,
    'Flow EVM' as blockchain,
    65 as total_contracts,
    58 as successful_settlements,
    4 as failed_settlements,
    3 as disputed_settlements,
    18.2 as avg_settlement_hours
    
  UNION ALL
  
  SELECT 
    'Wind Futures Long' as contract_type,
    'Flare Coston2' as blockchain,
    42 as total_contracts,
    38 as successful_settlements,
    2 as failed_settlements,
    2 as disputed_settlements,
    12.8 as avg_settlement_hours
    
  UNION ALL
  
  SELECT 
    'Wind Futures Short' as contract_type,
    'Flare Coston2' as blockchain,
    28 as total_contracts,
    25 as successful_settlements,
    1 as failed_settlements,
    2 as disputed_settlements,
    15.5 as avg_settlement_hours
),

portfolio_concentration AS (
  SELECT 
    'Diversified (3+ contract types)' as portfolio_type,
    35 as trader_count,
    2.8 as avg_risk_score,
    850.25 as avg_portfolio_value,
    15.2 as avg_positions_per_trader
    
  UNION ALL
  
  SELECT 
    'Focused (2 contract types)' as portfolio_type,
    28 as trader_count,
    4.2 as avg_risk_score,
    1250.80 as avg_portfolio_value,
    8.5 as avg_positions_per_trader
    
  UNION ALL
  
  SELECT 
    'Concentrated (1 contract type)' as portfolio_type,
    12 as trader_count,
    6.8 as avg_risk_score,
    2100.50 as avg_portfolio_value,
    12.8 as avg_positions_per_trader
)

SELECT 
  -- Margin Risk Analysis
  ma.risk_category,
  ma.position_count,
  ma.avg_margin_percent,
  ma.liquidation_count,
  ma.settlement_success_rate,
  ma.avg_position_value,
  
  -- Risk Metrics
  round(ma.liquidation_count * 100.0 / ma.position_count, 2) as liquidation_rate_percent,
  round(ma.avg_position_value * ma.avg_margin_percent / 100, 2) as avg_margin_amount,
  
  -- Settlement Performance by Contract Type
  sp.contract_type,
  sp.blockchain,
  sp.total_contracts,
  sp.successful_settlements,
  sp.failed_settlements,
  sp.disputed_settlements,
  sp.avg_settlement_hours,
  
  -- Settlement Success Rate
  round(sp.successful_settlements * 100.0 / sp.total_contracts, 2) as settlement_success_rate_pct,
  round(sp.disputed_settlements * 100.0 / sp.total_contracts, 2) as dispute_rate_pct,
  
  -- Portfolio Risk Distribution
  pc.portfolio_type,
  pc.trader_count,
  pc.avg_risk_score,
  pc.avg_portfolio_value,
  pc.avg_positions_per_trader

FROM margin_analytics ma
CROSS JOIN settlement_performance sp
CROSS JOIN portfolio_concentration pc
ORDER BY ma.avg_margin_percent, sp.settlement_success_rate DESC
