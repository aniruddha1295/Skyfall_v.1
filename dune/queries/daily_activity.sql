-- Daily Activity Trends - Basic Time Series
-- Shows daily trading activity over the last 30 days

WITH date_range AS (
  SELECT date_add('day', -row_number() over(), current_date) as date
  FROM unnest(sequence(0, 29)) as t(day_offset)
),

daily_metrics AS (
  SELECT 
    date,
    -- Simulate realistic daily patterns
    cast(20 + 15 * sin(2 * pi() * day(date) / 7) + 5 * random() as integer) as daily_positions,
    cast(2000 + 800 * sin(2 * pi() * day(date) / 7) + 200 * random() as decimal(10,2)) as daily_volume,
    cast(3 + 2 * random() as integer) as daily_traders,
    cast(5 + 3 * random() as integer) as daily_contracts,
    cast(15 + 10 * random() as decimal(5,1)) as avg_rainfall
  FROM date_range
)

SELECT 
  date,
  daily_positions,
  daily_volume,
  daily_traders,
  daily_contracts,
  avg_rainfall,
  
  -- Running totals
  sum(daily_positions) over (order by date) as cumulative_positions,
  sum(daily_volume) over (order by date) as cumulative_volume,
  
  -- Moving averages
  avg(daily_positions) over (order by date rows between 6 preceding and current row) as positions_7day_avg,
  avg(daily_volume) over (order by date rows between 6 preceding and current row) as volume_7day_avg

FROM daily_metrics
ORDER BY date DESC
