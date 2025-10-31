// flow-actions.ts
// API routes for Flow Forte Actions integration

import { Router } from 'express';
import { flowForteActions } from '../services/flow-forte-actions.js';

const router = Router();

/**
 * Health check endpoint for Flow integration
 */
router.get('/health', async (req, res) => {
  try {
    const health = await flowForteActions.healthCheck();
    res.json({
      success: true,
      data: health,
      message: health.emulatorRunning 
        ? 'Flow emulator is running and contracts are deployed' 
        : 'Flow emulator is not running'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to check Flow health'
    });
  }
});

/**
 * Create weather update Forte Action
 * Integrates with existing weather data from APIs
 */
router.post('/weather-update', async (req, res) => {
  try {
    const { stationId, rainfall, windSpeed, temperature, source } = req.body;

    if (!stationId || rainfall === undefined || windSpeed === undefined || temperature === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: stationId, rainfall, windSpeed, temperature'
      });
    }

    const result = await flowForteActions.createWeatherUpdateAction(stationId, {
      rainfall: parseFloat(rainfall),
      windSpeed: parseFloat(windSpeed),
      temperature: parseFloat(temperature),
      timestamp: Date.now(),
      source: source || 'API'
    });

    res.json({
      success: result.success,
      data: {
        actionId: result.actionId,
        transactionId: result.transactionId,
        stationId,
        timestamp: new Date().toISOString()
      },
      message: result.success 
        ? 'Weather update Forte Action executed successfully' 
        : `Failed to execute weather update: ${result.error}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create weather update action'
    });
  }
});

/**
 * Create weather hedge Forte Action (derivatives option)
 */
router.post('/weather-hedge', async (req, res) => {
  try {
    const { stationId, optionType, strike, premium, expiry, totalSupply } = req.body;

    if (!stationId || optionType === undefined || !strike || !premium || !expiry || !totalSupply) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: stationId, optionType, strike, premium, expiry, totalSupply'
      });
    }

    // Convert expiry to timestamp if it's a date string
    let expiryTimestamp = expiry;
    if (typeof expiry === 'string') {
      expiryTimestamp = new Date(expiry).getTime();
    }

    const result = await flowForteActions.createWeatherHedgeAction(
      stationId,
      parseInt(optionType),
      parseFloat(strike),
      parseFloat(premium),
      expiryTimestamp,
      parseInt(totalSupply)
    );

    res.json({
      success: result.success,
      data: {
        actionId: result.actionId,
        transactionId: result.transactionId,
        optionDetails: {
          stationId,
          optionType: parseInt(optionType),
          strike: parseFloat(strike),
          premium: parseFloat(premium),
          expiry: expiryTimestamp,
          totalSupply: parseInt(totalSupply)
        }
      },
      message: result.success 
        ? 'Weather hedge Forte Action executed successfully' 
        : `Failed to execute weather hedge: ${result.error}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to create weather hedge action'
    });
  }
});

/**
 * Get weather data from Flow blockchain
 */
router.get('/weather/:stationId', async (req, res) => {
  try {
    const { stationId } = req.params;
    const weatherData = await flowForteActions.getWeatherData(stationId);

    if (weatherData) {
      res.json({
        success: true,
        data: {
          stationId,
          ...weatherData,
          timestamp: new Date(weatherData.timestamp).toISOString()
        },
        message: 'Weather data retrieved from Flow blockchain'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Weather data not found',
        message: `No weather data found for station ${stationId}`
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get weather data'
    });
  }
});

/**
 * Get all active weather options (derivatives)
 */
router.get('/options', async (req, res) => {
  try {
    const options = await flowForteActions.getActiveOptions();

    res.json({
      success: true,
      data: {
        options: options.map(option => ({
          ...option,
          optionTypeName: ['RainfallCall', 'RainfallPut', 'WindCall', 'WindPut'][option.optionType],
          expiryDate: new Date(option.expiry).toISOString(),
          createdDate: new Date(option.createdAt).toISOString()
        })),
        count: options.length
      },
      message: `Retrieved ${options.length} active weather options`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get active options'
    });
  }
});

/**
 * Get all weather stations with data
 */
router.get('/stations', async (req, res) => {
  try {
    const stations = await flowForteActions.getAllStations();

    res.json({
      success: true,
      data: {
        stations,
        count: stations.length
      },
      message: `Retrieved ${stations.length} weather stations`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to get weather stations'
    });
  }
});

/**
 * Bridge endpoint: Sync weather data from existing APIs to Flow blockchain
 */
router.post('/sync-weather', async (req, res) => {
  try {
    const { stations } = req.body;
    
    if (!stations || !Array.isArray(stations)) {
      return res.status(400).json({
        success: false,
        error: 'stations array is required'
      });
    }

    const results = [];
    
    for (const station of stations) {
      const { stationId, rainfall, windSpeed, temperature, source } = station;
      
      if (stationId && rainfall !== undefined && windSpeed !== undefined && temperature !== undefined) {
        const result = await flowForteActions.createWeatherUpdateAction(stationId, {
          rainfall: parseFloat(rainfall),
          windSpeed: parseFloat(windSpeed),
          temperature: parseFloat(temperature),
          timestamp: Date.now(),
          source: source || 'API_SYNC'
        });
        
        results.push({
          stationId,
          success: result.success,
          actionId: result.actionId,
          error: result.error
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    
    res.json({
      success: successCount > 0,
      data: {
        results,
        successCount,
        totalCount: results.length
      },
      message: `Synced ${successCount}/${results.length} weather stations to Flow blockchain`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to sync weather data'
    });
  }
});

export default router;
