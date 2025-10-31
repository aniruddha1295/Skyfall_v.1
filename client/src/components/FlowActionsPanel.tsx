// FlowActionsPanel.tsx
// Frontend component to interact with Flow Forte Actions

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Activity, Zap } from 'lucide-react';

interface FlowHealth {
  emulatorRunning: boolean;
  contractsDeployed: boolean;
  blockHeight: number;
}

interface WeatherOption {
  optionId: string;
  stationId: string;
  optionType: number;
  optionTypeName: string;
  strike: number;
  premium: number;
  expiry: string;
  totalSupply: number;
  creator: string;
}

export function FlowActionsPanel() {
  const [flowHealth, setFlowHealth] = useState<FlowHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [weatherOptions, setWeatherOptions] = useState<WeatherOption[]>([]);
  const [stations, setStations] = useState<string[]>([]);
  
  // Weather Update Form
  const [weatherForm, setWeatherForm] = useState({
    stationId: '',
    rainfall: '',
    windSpeed: '',
    temperature: '',
    source: 'Manual'
  });
  
  // Weather Hedge Form
  const [hedgeForm, setHedgeForm] = useState({
    stationId: '',
    optionType: '0',
    strike: '',
    premium: '',
    expiry: '',
    totalSupply: '100'
  });

  const [actionResults, setActionResults] = useState<any[]>([]);

  useEffect(() => {
    checkFlowHealth();
    loadWeatherOptions();
    loadStations();
  }, []);

  const checkFlowHealth = async () => {
    try {
      const response = await fetch('/api/flow-actions/health');
      const data = await response.json();
      setFlowHealth(data.data);
    } catch (error) {
      console.error('Failed to check Flow health:', error);
      setFlowHealth({ emulatorRunning: false, contractsDeployed: false, blockHeight: 0 });
    }
  };

  const loadWeatherOptions = async () => {
    try {
      const response = await fetch('/api/flow-actions/options');
      const data = await response.json();
      if (data.success) {
        setWeatherOptions(data.data.options);
      }
    } catch (error) {
      console.error('Failed to load weather options:', error);
    }
  };

  const loadStations = async () => {
    try {
      const response = await fetch('/api/flow-actions/stations');
      const data = await response.json();
      if (data.success) {
        setStations(data.data.stations);
      }
    } catch (error) {
      console.error('Failed to load stations:', error);
    }
  };

  const createWeatherUpdateAction = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/flow-actions/weather-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(weatherForm)
      });
      
      const result = await response.json();
      setActionResults(prev => [result, ...prev.slice(0, 4)]);
      
      if (result.success) {
        setWeatherForm({
          stationId: '',
          rainfall: '',
          windSpeed: '',
          temperature: '',
          source: 'Manual'
        });
        loadStations(); // Refresh stations list
      }
    } catch (error) {
      console.error('Failed to create weather update action:', error);
    } finally {
      setLoading(false);
    }
  };

  const createWeatherHedgeAction = async () => {
    setLoading(true);
    try {
      const expiryDate = new Date(hedgeForm.expiry).getTime();
      
      const response = await fetch('/api/flow-actions/weather-hedge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...hedgeForm,
          expiry: expiryDate
        })
      });
      
      const result = await response.json();
      setActionResults(prev => [result, ...prev.slice(0, 4)]);
      
      if (result.success) {
        setHedgeForm({
          stationId: '',
          optionType: '0',
          strike: '',
          premium: '',
          expiry: '',
          totalSupply: '100'
        });
        loadWeatherOptions(); // Refresh options list
      }
    } catch (error) {
      console.error('Failed to create weather hedge action:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOptionTypeName = (type: number) => {
    const types = ['Rainfall Call', 'Rainfall Put', 'Wind Call', 'Wind Put'];
    return types[type] || 'Unknown';
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Flow Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Flow Blockchain Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {flowHealth ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${flowHealth.emulatorRunning ? 'text-green-600' : 'text-red-600'}`}>
                  {flowHealth.emulatorRunning ? <CheckCircle className="h-8 w-8 mx-auto" /> : <XCircle className="h-8 w-8 mx-auto" />}
                </div>
                <p className="text-sm text-muted-foreground">Emulator</p>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${flowHealth.contractsDeployed ? 'text-green-600' : 'text-red-600'}`}>
                  {flowHealth.contractsDeployed ? <CheckCircle className="h-8 w-8 mx-auto" /> : <XCircle className="h-8 w-8 mx-auto" />}
                </div>
                <p className="text-sm text-muted-foreground">Contracts</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {flowHealth.blockHeight}
                </div>
                <p className="text-sm text-muted-foreground">Block Height</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="text-sm text-muted-foreground mt-2">Checking Flow status...</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Update Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Weather Update Action
            </CardTitle>
            <CardDescription>
              Create a Forte Action to update weather data on Flow blockchain
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="weather-station">Station ID</Label>
              <Input
                id="weather-station"
                placeholder="e.g., STATION_001"
                value={weatherForm.stationId}
                onChange={(e) => setWeatherForm(prev => ({ ...prev, stationId: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="rainfall">Rainfall (mm)</Label>
                <Input
                  id="rainfall"
                  type="number"
                  step="0.1"
                  placeholder="25.5"
                  value={weatherForm.rainfall}
                  onChange={(e) => setWeatherForm(prev => ({ ...prev, rainfall: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="windspeed">Wind Speed (mph)</Label>
                <Input
                  id="windspeed"
                  type="number"
                  step="0.1"
                  placeholder="15.2"
                  value={weatherForm.windSpeed}
                  onChange={(e) => setWeatherForm(prev => ({ ...prev, windSpeed: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  placeholder="22.0"
                  value={weatherForm.temperature}
                  onChange={(e) => setWeatherForm(prev => ({ ...prev, temperature: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              onClick={createWeatherUpdateAction} 
              disabled={loading || !weatherForm.stationId || !weatherForm.rainfall || !weatherForm.windSpeed || !weatherForm.temperature}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Weather Update Action
            </Button>
          </CardContent>
        </Card>

        {/* Weather Hedge Action */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Weather Hedge Action
            </CardTitle>
            <CardDescription>
              Create a Forte Action for weather derivatives trading
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="hedge-station">Station ID</Label>
              <Input
                id="hedge-station"
                placeholder="e.g., STATION_001"
                value={hedgeForm.stationId}
                onChange={(e) => setHedgeForm(prev => ({ ...prev, stationId: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="option-type">Option Type</Label>
                <Select value={hedgeForm.optionType} onValueChange={(value) => setHedgeForm(prev => ({ ...prev, optionType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Rainfall Call</SelectItem>
                    <SelectItem value="1">Rainfall Put</SelectItem>
                    <SelectItem value="2">Wind Call</SelectItem>
                    <SelectItem value="3">Wind Put</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="strike">Strike Price</Label>
                <Input
                  id="strike"
                  type="number"
                  step="0.01"
                  placeholder="100.00"
                  value={hedgeForm.strike}
                  onChange={(e) => setHedgeForm(prev => ({ ...prev, strike: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="premium">Premium</Label>
                <Input
                  id="premium"
                  type="number"
                  step="0.01"
                  placeholder="5.00"
                  value={hedgeForm.premium}
                  onChange={(e) => setHedgeForm(prev => ({ ...prev, premium: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="expiry">Expiry Date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={hedgeForm.expiry}
                  onChange={(e) => setHedgeForm(prev => ({ ...prev, expiry: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="supply">Total Supply</Label>
                <Input
                  id="supply"
                  type="number"
                  placeholder="100"
                  value={hedgeForm.totalSupply}
                  onChange={(e) => setHedgeForm(prev => ({ ...prev, totalSupply: e.target.value }))}
                />
              </div>
            </div>

            <Button 
              onClick={createWeatherHedgeAction} 
              disabled={loading || !hedgeForm.stationId || !hedgeForm.strike || !hedgeForm.premium || !hedgeForm.expiry}
              className="w-full"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Weather Hedge Action
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Action Results */}
      {actionResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Action Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {actionResults.map((result, index) => (
                <Alert key={index}>
                  <AlertDescription className="flex items-center justify-between">
                    <span className={getStatusColor(result.success)}>
                      {result.success ? <CheckCircle className="h-4 w-4 inline mr-2" /> : <XCircle className="h-4 w-4 inline mr-2" />}
                      {result.message}
                    </span>
                    {result.data?.transactionId && (
                      <Badge variant="outline" className="text-xs">
                        TX: {result.data.transactionId.slice(0, 8)}...
                      </Badge>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Weather Options */}
      {weatherOptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Weather Options</CardTitle>
            <CardDescription>Weather derivatives created via Forte Actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weatherOptions.map((option) => (
                <div key={option.optionId} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{option.optionTypeName}</Badge>
                    <span className="text-sm text-muted-foreground">{option.stationId}</span>
                  </div>
                  <div className="text-sm">
                    <p><strong>Strike:</strong> {option.strike}</p>
                    <p><strong>Premium:</strong> {option.premium}</p>
                    <p><strong>Supply:</strong> {option.totalSupply}</p>
                    <p><strong>Expires:</strong> {new Date(option.expiry).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weather Stations */}
      {stations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Weather Stations on Flow</CardTitle>
            <CardDescription>Stations with weather data stored on blockchain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stations.map((station) => (
                <Badge key={station} variant="outline">{station}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
