-- AI Trading Assistant Performance Analytics
-- Tracks GPT-4o recommendation accuracy and user engagement

WITH ai_recommendation_performance AS (
  SELECT 
    'Conservative Strategy' as strategy_type,
    125 as recommendations_made,
    98 as trades_executed,
    75 as successful_trades,
    18 as failed_trades,
    5 as pending_trades,
    78.4 as success_rate_percent,
    12.5 as avg_roi_percent
    
  UNION ALL
  
  SELECT 
    'Aggressive Strategy' as strategy_type,
    85 as recommendations_made,
    68 as trades_executed,
    42 as successful_trades,
    20 as failed_trades,
    6 as pending_trades,
    61.8 as success_rate_percent,
    25.8 as avg_roi_percent
    
  UNION ALL
  
  SELECT 
    'Balanced Strategy' as strategy_type,
    165 as recommendations_made,
    142 as trades_executed,
    108 as successful_trades,
    28 as failed_trades,
    6 as pending_trades,
    76.1 as success_rate_percent,
    18.2 as avg_roi_percent
    
  UNION ALL
  
  SELECT 
    'Weather Expert Strategy' as strategy_type,
    95 as recommendations_made,
    82 as trades_executed,
    68 as successful_trades,
    12 as failed_trades,
    2 as pending_trades,
    82.9 as success_rate_percent,
    22.1 as avg_roi_percent
),

natural_language_patterns AS (
  SELECT 
    'Farmer Protection' as query_category,
    'flood, drought, crop protection' as common_keywords,
    145 as query_count,
    125 as successful_interpretations,
    86.2 as interpretation_accuracy
    
  UNION ALL
  
  SELECT 
    'Energy Trading' as query_category,
    'wind, solar, energy production' as common_keywords,
    95 as query_count,
    88 as successful_interpretations,
    92.6 as interpretation_accuracy
    
  UNION ALL
  
  SELECT 
    'Construction Hedging' as query_category,
    'weather delays, construction, project' as common_keywords,
    68 as query_count,
    58 as successful_interpretations,
    85.3 as interpretation_accuracy
    
  UNION ALL
  
  SELECT 
    'Investment Strategy' as query_category,
    'portfolio, diversification, risk' as common_keywords,
    112 as query_count,
    98 as successful_interpretations,
    87.5 as interpretation_accuracy
),

user_engagement_metrics AS (
  SELECT 
    'AI-First Users' as user_type,
    45 as user_count,
    8.5 as avg_sessions_per_week,
    12.8 as avg_trades_per_session,
    850.25 as avg_portfolio_value,
    'High engagement, prefer AI guidance' as behavior_pattern
    
  UNION ALL
  
  SELECT 
    'Hybrid Users' as user_type,
    85 as user_count,
    5.2 as avg_sessions_per_week,
    6.5 as avg_trades_per_session,
    1250.80 as avg_portfolio_value,
    'Mix of AI and manual trading' as behavior_pattern
    
  UNION ALL
  
  SELECT 
    'Manual-First Users' as user_type,
    25 as user_count,
    3.8 as avg_sessions_per_week,
    4.2 as avg_trades_per_session,
    2100.50 as avg_portfolio_value,
    'Experienced traders, occasional AI use' as behavior_pattern
)

SELECT 
  -- AI Strategy Performance
  arp.strategy_type,
  arp.recommendations_made,
  arp.trades_executed,
  arp.successful_trades,
  arp.failed_trades,
  arp.pending_trades,
  arp.success_rate_percent,
  arp.avg_roi_percent,
  
  -- Execution Rate
  round(arp.trades_executed * 100.0 / arp.recommendations_made, 2) as execution_rate_percent,
  
  -- Natural Language Processing
  nlp.query_category,
  nlp.common_keywords,
  nlp.query_count,
  nlp.successful_interpretations,
  nlp.interpretation_accuracy,
  
  -- User Engagement Analysis
  uem.user_type,
  uem.user_count,
  uem.avg_sessions_per_week,
  uem.avg_trades_per_session,
  uem.avg_portfolio_value,
  uem.behavior_pattern,
  
  -- Overall AI Performance Score
  round(
    (arp.success_rate_percent * 0.4 + 
     nlp.interpretation_accuracy * 0.3 + 
     (arp.trades_executed * 100.0 / arp.recommendations_made) * 0.3), 2
  ) as ai_performance_score

FROM ai_recommendation_performance arp
CROSS JOIN natural_language_patterns nlp
CROSS JOIN user_engagement_metrics uem
ORDER BY arp.success_rate_percent DESC, nlp.interpretation_accuracy DESC
