-- Oracle Data Quality and Performance Analytics
-- Compares Chainlink, Flare FDC, and WeatherXM data sources

WITH oracle_performance AS (
  SELECT 
    'Chainlink Oracle' as data_source,
    'ETH/USD Price Feed' as data_type,
    'Ethereum Mainnet' as network,
    99.8 as uptime_percent,
    2.5 as avg_response_time_seconds,
    0.95 as data_accuracy_score,
    15.50 as avg_cost_per_request_usd,
    1440 as updates_per_day
    
  UNION ALL
  
  SELECT 
    'Flare Data Connector' as data_source,
    'Wind Speed Data' as data_type,
    'Flare Coston2' as network,
    97.2 as uptime_percent,
    1.8 as avg_response_time_seconds,
    0.88 as data_accuracy_score,
    0.02 as avg_cost_per_request_usd,
    288 as updates_per_day
    
  UNION ALL
  
  SELECT 
    'WeatherXM API' as data_source,
    'Rainfall Data' as data_type,
    'Off-chain' as network,
    98.5 as uptime_percent,
    0.8 as avg_response_time_seconds,
    0.92 as data_accuracy_score,
    0.01 as avg_cost_per_request_usd,
    1440 as updates_per_day
    
  UNION ALL
  
  SELECT 
    'OpenWeather API' as data_source,
    'Multi-Weather Data' as data_type,
    'Off-chain' as network,
    99.1 as uptime_percent,
    1.2 as avg_response_time_seconds,
    0.89 as data_accuracy_score,
    0.005 as avg_cost_per_request_usd,
    720 as updates_per_day
),

data_validation_metrics AS (
  SELECT 
    'Cross-Source Validation' as validation_type,
    'Rainfall Data' as data_category,
    145 as total_validations,
    132 as successful_validations,
    8 as failed_validations,
    5 as disputed_validations,
    91.0 as validation_success_rate
    
  UNION ALL
  
  SELECT 
    'Historical Accuracy Check' as validation_type,
    'Wind Speed Data' as data_category,
    98 as total_validations,
    85 as successful_validations,
    10 as failed_validations,
    3 as disputed_validations,
    86.7 as validation_success_rate
    
  UNION ALL
  
  SELECT 
    'Real-time Verification' as validation_type,
    'Price Feed Data' as data_category,
    256 as total_validations,
    248 as successful_validations,
    6 as failed_validations,
    2 as disputed_validations,
    96.9 as validation_success_rate
),

oracle_cost_analysis AS (
  SELECT 
    'High Frequency (1min)' as update_frequency,
    'Price Feeds' as use_case,
    22.50 as daily_cost_usd,
    1440 as daily_requests,
    0.0156 as cost_per_request
    
  UNION ALL
  
  SELECT 
    'Medium Frequency (5min)' as update_frequency,
    'Weather Data' as use_case,
    4.80 as daily_cost_usd,
    288 as daily_requests,
    0.0167 as cost_per_request
    
  UNION ALL
  
  SELECT 
    'Low Frequency (1hour)' as update_frequency,
    'Settlement Data' as use_case,
    0.72 as daily_cost_usd,
    24 as daily_requests,
    0.0300 as cost_per_request
)

SELECT 
  -- Oracle Performance Metrics
  op.data_source,
  op.data_type,
  op.network,
  op.uptime_percent,
  op.avg_response_time_seconds,
  op.data_accuracy_score,
  op.avg_cost_per_request_usd,
  op.updates_per_day,
  
  -- Performance Rankings
  row_number() over (order by op.uptime_percent desc) as uptime_rank,
  row_number() over (order by op.data_accuracy_score desc) as accuracy_rank,
  row_number() over (order by op.avg_cost_per_request_usd) as cost_efficiency_rank,
  
  -- Data Validation Results
  dvm.validation_type,
  dvm.data_category,
  dvm.total_validations,
  dvm.successful_validations,
  dvm.failed_validations,
  dvm.disputed_validations,
  dvm.validation_success_rate,
  
  -- Cost Analysis
  oca.update_frequency,
  oca.use_case,
  oca.daily_cost_usd,
  oca.daily_requests,
  oca.cost_per_request,
  
  -- Overall Oracle Score (weighted: uptime 30%, accuracy 40%, cost 30%)
  round(
    (op.uptime_percent * 0.3 + 
     op.data_accuracy_score * 100 * 0.4 + 
     (1 / op.avg_cost_per_request_usd) * 10 * 0.3), 2
  ) as overall_oracle_score

FROM oracle_performance op
CROSS JOIN data_validation_metrics dvm
CROSS JOIN oracle_cost_analysis oca
ORDER BY overall_oracle_score DESC
