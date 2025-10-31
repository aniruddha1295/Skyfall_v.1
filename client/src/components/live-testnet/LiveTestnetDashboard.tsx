import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FlowActionsAgent } from '@/components/ai/flow-actions-agent';
import { 
  Activity, 
  Zap, 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  Calendar,
  TrendingUp,
  Shield,
  Bot,
  Wallet,
  Copy,
  Eye,
  FileText,
  AlertCircle,
  X,
  Home
} from 'lucide-react';
// Flow wallet integration moved to main page

interface TestnetStatus {
  network: string;
  contractAddress: string;
  contracts: {
    SimpleWeatherOracle: string;
    SimpleWeatherDerivatives: string;
    SimpleScheduledTransactions?: string;
  };
  explorerUrl: string;
  status: string;
}

interface ScheduledTransaction {
  scheduleId: string;
  transactionType: string;
  executionTime: number;
  parameters: Record<string, string>;
  executed: boolean;
}

interface TransactionLog {
  id: string;
  type: 'weather_action' | 'option_settlement' | 'reward_distribution';
  status: 'success' | 'pending' | 'failed';
  transactionId: string;
  explorerUrl: string;
  isReal: boolean;
  timestamp: number;
  details: Record<string, any>;
  message: string;
}

interface SuccessPopup {
  show: boolean;
  title: string;
  message: string;
  transactionId?: string;
  explorerUrl?: string;
  isReal: boolean;
}

export function LiveTestnetDashboard() {
  const [testnetStatus, setTestnetStatus] = useState<TestnetStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [scheduledTxs, setScheduledTxs] = useState<ScheduledTransaction[]>([]);
  const [useRealExecution] = useState(true); // Always use real execution
  const [transactionLogs, setTransactionLogs] = useState<TransactionLog[]>([]);
  const [successPopup, setSuccessPopup] = useState<SuccessPopup>({
    show: false,
    title: '',
    message: '',
    isReal: false
  });
  const [weatherForm, setWeatherForm] = useState({
    stationId: 'DALLAS_001',
    rainfall: '25.5',
    windSpeed: '15.2',
    temperature: '22.0'
  });
  
  const [scheduleForm, setScheduleForm] = useState({
    optionId: 'dallas_rain_call_15mm',
    settlementTime: '',
    poolId: 'weather_protection_pool',
    distributionAmount: '1000'
  });

  useEffect(() => {
    loadTestnetStatus();
    loadScheduledTransactions();
  }, []);

  const loadTestnetStatus = async () => {
    try {
      const response = await fetch('/api/flow-testnet/status');
      const data = await response.json();
      setTestnetStatus(data);
    } catch (error) {
      console.error('Failed to load testnet status:', error);
    }
  };

  const loadScheduledTransactions = async () => {
    // Mock scheduled transactions for demo
    setScheduledTxs([
      {
        scheduleId: 'settlement_dallas_rain_call_1730345400',
        transactionType: 'OptionSettlement',
        executionTime: Date.now() + 3600000, // 1 hour from now
        parameters: { optionId: 'dallas_rain_call_15mm', action: 'settle' },
        executed: false
      },
      {
        scheduleId: 'reward_weather_pool_1730349000',
        transactionType: 'RewardDistribution',
        executionTime: Date.now() + 7200000, // 2 hours from now
        parameters: { poolId: 'weather_protection_pool', amount: '500', action: 'distribute' },
        executed: false
      }
    ]);
  };

  const createWeatherAction = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/flow-testnet/create-weather-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...weatherForm,
          useRealExecution
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newTx = {
          id: `weather_${Date.now()}`,
          type: 'weather_update',
          status: 'completed',
          transactionId: data.transactionId,
          scheduleId: `api_${Date.now()}`,
          transactionType: useRealExecution ? 'Real Execution' : 'Demo Mode',
          executionTime: Date.now(),
          parameters: weatherForm,
          executed: true
        };
        
        setScheduledTxs(prev => [newTx, ...prev]);
        
        // Add to transaction log
        const logEntry: TransactionLog = {
          id: `weather_${Date.now()}`,
          type: 'weather_action',
          status: 'success',
          transactionId: data.transactionId,
          explorerUrl: data.explorerUrl || `https://testnet.flowscan.io/transaction/${data.transactionId}`,
          isReal: data.isReal || useRealExecution,
          timestamp: Date.now(),
          details: {
            stationId: weatherForm.stationId,
            rainfall: weatherForm.rainfall,
            windSpeed: weatherForm.windSpeed,
            temperature: weatherForm.temperature
          },
          message: data.isReal ? 'Weather data successfully updated on Flow testnet' : 'Weather action executed in demo mode'
        };
        
        setTransactionLogs(prev => [logEntry, ...prev]);
        
        // Show success popup
        setSuccessPopup({
          show: true,
          title: '✅ Transaction Successful!',
          message: 'Weather data has been successfully recorded on Flow testnet blockchain.',
          transactionId: data.transactionId,
          explorerUrl: data.explorerUrl || `https://testnet.flowscan.io/transaction/${data.transactionId}`,
          isReal: data.isReal || useRealExecution
        });
      }
    } catch (error) {
      console.error('Weather action failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const scheduleOptionSettlement = async () => {
    setLoading(true);
    try {
      // Call real Flow testnet API for scheduling
      const response = await fetch('/api/flow-testnet/schedule-settlement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          optionId: scheduleForm.optionId,
          settlementTime: scheduleForm.settlementTime,
          useRealExecution
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newSchedule: ScheduledTransaction = {
          scheduleId: data.scheduleId,
          transactionType: useRealExecution ? 'Real Flow Settlement' : 'Demo Settlement',
          executionTime: new Date(scheduleForm.settlementTime).getTime(),
          parameters: { 
            optionId: scheduleForm.optionId, 
            action: 'settle',
            transactionId: data.transactionId || 'demo'
          },
          executed: false
        };
        
        setScheduledTxs(prev => [...prev, newSchedule]);
        
        // Add to transaction log
        const logEntry: TransactionLog = {
          id: `settlement_${Date.now()}`,
          type: 'option_settlement',
          status: 'success',
          transactionId: data.transactionId || 'demo',
          explorerUrl: data.explorerUrl || `https://testnet.flowscan.io/transaction/${data.transactionId}`,
          isReal: data.isReal || useRealExecution,
          timestamp: Date.now(),
          details: {
            optionId: scheduleForm.optionId,
            settlementTime: scheduleForm.settlementTime,
            scheduleId: data.scheduleId
          },
          message: data.message || 'Option settlement scheduled successfully'
        };
        
        setTransactionLogs(prev => [logEntry, ...prev]);
        
        // Show success popup
        setSuccessPopup({
          show: true,
          title: '✅ Settlement Scheduled!',
          message: 'Option settlement has been successfully scheduled on Flow testnet blockchain.',
          transactionId: data.transactionId,
          explorerUrl: data.explorerUrl,
          isReal: data.isReal || useRealExecution
        });
      }
    } catch (error) {
      console.error('Failed to schedule settlement:', error);
      alert('Failed to schedule settlement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const scheduleRewardDistribution = async () => {
    setLoading(true);
    try {
      // Call real Flow testnet API for reward distribution
      const response = await fetch('/api/flow-testnet/schedule-reward', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poolId: scheduleForm.poolId,
          amount: scheduleForm.distributionAmount,
          useRealExecution
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        const newSchedule: ScheduledTransaction = {
          scheduleId: data.scheduleId,
          transactionType: useRealExecution ? 'Real Flow Reward Distribution' : 'Demo Reward Distribution',
          executionTime: Date.now() + 3600000, // 1 hour from now
          parameters: { 
            poolId: scheduleForm.poolId, 
            amount: scheduleForm.distributionAmount, 
            action: 'distribute',
            transactionId: data.transactionId || 'demo'
          },
          executed: false
        };
        
        setScheduledTxs(prev => [...prev, newSchedule]);
        
        // Add to transaction log
        const logEntry: TransactionLog = {
          id: `reward_${Date.now()}`,
          type: 'reward_distribution',
          status: 'success',
          transactionId: data.transactionId || 'demo',
          explorerUrl: data.explorerUrl || `https://testnet.flowscan.io/transaction/${data.transactionId}`,
          isReal: data.isReal || useRealExecution,
          timestamp: Date.now(),
          details: {
            poolId: scheduleForm.poolId,
            amount: scheduleForm.distributionAmount,
            scheduleId: data.scheduleId
          },
          message: data.message || 'Reward distribution scheduled successfully'
        };
        
        setTransactionLogs(prev => [logEntry, ...prev]);
        
        // Show success popup
        setSuccessPopup({
          show: true,
          title: '✅ Reward Distribution Scheduled!',
          message: 'Reward distribution has been successfully scheduled on Flow testnet blockchain.',
          transactionId: data.transactionId,
          explorerUrl: data.explorerUrl,
          isReal: data.isReal || useRealExecution
        });
      }
    } catch (error) {
      console.error('Failed to schedule reward distribution:', error);
      alert('Failed to schedule reward distribution. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const getTimeUntilExecution = (timestamp: number) => {
    const diff = timestamp - Date.now();
    if (diff <= 0) return 'Ready to execute';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const closeSuccessPopup = () => {
    setSuccessPopup(prev => ({ ...prev, show: false }));
  };

  return (
    <div className="space-y-4 p-3 sm:p-6">
      {/* Header with Home Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Live Testnet Dashboard</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/'}
          className="flex items-center gap-2"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Home</span>
        </Button>
      </div>
      
      <Tabs defaultValue="forte-actions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 gap-1">
          <TabsTrigger value="forte-actions" className="text-xs sm:text-sm">
            <Zap className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Forte Actions</span>
            <span className="sm:hidden">Forte</span>
          </TabsTrigger>
          <TabsTrigger value="scheduled-transactions" className="text-xs sm:text-sm">
            <Clock className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Scheduled Transactions</span>
            <span className="sm:hidden">Schedule</span>
          </TabsTrigger>
          <TabsTrigger value="transaction-logs" className="text-xs sm:text-sm">
            <FileText className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Transaction Logs</span>
            <span className="sm:hidden">Logs</span>
          </TabsTrigger>
        </TabsList>

        {/* Forte Actions Tab */}
        <TabsContent value="forte-actions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Create Weather Forte Action
              </CardTitle>
              <CardDescription>
                Execute a Forte Action on live Flow testnet contracts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="station">Weather Station</Label>
                  <Input
                    id="station"
                    value={weatherForm.stationId}
                    onChange={(e) => setWeatherForm(prev => ({ ...prev, stationId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="rainfall">Rainfall (mm)</Label>
                  <Input
                    id="rainfall"
                    type="number"
                    step="0.1"
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
                    value={weatherForm.windSpeed}
                    onChange={(e) => setWeatherForm(prev => ({ ...prev, windSpeed: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="temp">Temperature (°C)</Label>
                  <Input
                    id="temp"
                    type="number"
                    step="0.1"
                    value={weatherForm.temperature}
                    onChange={(e) => setWeatherForm(prev => ({ ...prev, temperature: e.target.value }))}
                  />
                </div>
              </div>

              <Button
                onClick={createWeatherAction}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Creating Transaction...' : 'Execute Weather Forte Action'}
              </Button>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://testnet.flowscan.io/tx', '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify Transactions on FlowScan
                </Button>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Demo Mode: This demonstrates the transaction flow using live testnet contracts. Production mode would execute real blockchain transactions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduled Transactions Tab */}
        <TabsContent value="scheduled-transactions" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Schedule Option Settlement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule Option Settlement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="option-id">Option ID</Label>
                  <Input
                    id="option-id"
                    value={scheduleForm.optionId}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, optionId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="settlement-time">Settlement Time</Label>
                  <Input
                    id="settlement-time"
                    type="datetime-local"
                    value={scheduleForm.settlementTime}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, settlementTime: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={scheduleOptionSettlement}
                  disabled={loading}
                  className="w-full"
                >
                  Schedule Settlement
                </Button>
              </CardContent>
            </Card>

            {/* Schedule Reward Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Schedule Reward Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="pool-id">Pool ID</Label>
                  <Input
                    id="pool-id"
                    value={scheduleForm.poolId}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, poolId: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="amount">Distribution Amount (FLOW)</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={scheduleForm.distributionAmount}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, distributionAmount: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={scheduleRewardDistribution}
                  disabled={loading}
                  className="w-full"
                >
                  Schedule Distribution
                </Button>
              </CardContent>
            </Card>
          </div>
          
          {/* Transaction Verification Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ExternalLink className="h-5 w-5" />
                Transaction Verification
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://testnet.flowscan.io/tx', '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Verify Scheduled Transactions on FlowScan
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Use FlowScan to verify and monitor your scheduled transactions on Flow testnet blockchain.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transaction Logs Tab */}
        <TabsContent value="transaction-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transaction Logs
              </CardTitle>
              <CardDescription>
                Detailed history of all transactions executed on Flow testnet
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionLogs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No transactions yet. Execute some actions to see logs here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {transactionLogs.map((log) => (
                    <div
                      key={log.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={log.isReal ? "default" : "secondary"}>
                            {log.isReal ? "Real Testnet" : "Demo Mode"}
                          </Badge>
                          <Badge variant={log.status === 'success' ? "default" : "destructive"}>
                            {log.status}
                          </Badge>
                          <span className="text-sm font-medium capitalize">
                            {log.type.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm">{log.message}</p>
                        
                        <div className="flex flex-col sm:flex-row gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="font-medium">TX ID:</span>
                            <code className="bg-muted px-1 rounded">
                              {log.transactionId.slice(0, 8)}...{log.transactionId.slice(-6)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(log.transactionId)}
                              className="h-6 w-6 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(log.explorerUrl, '_blank')}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View on FlowScan
                          </Button>
                        </div>
                        
                        {/* Transaction Details */}
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            View Details
                          </summary>
                          <div className="mt-2 p-2 bg-muted rounded text-xs">
                            <pre>{JSON.stringify(log.details, null, 2)}</pre>
                          </div>
                        </details>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Success Popup */}
      {successPopup.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background border rounded-lg shadow-lg max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">{successPopup.title}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeSuccessPopup}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-sm text-muted-foreground">{successPopup.message}</p>
            
            {successPopup.transactionId && (
              <div className="space-y-2">
                <div className="space-y-2">
                  <span className="text-xs font-medium">Transaction ID:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded text-xs flex-1 break-all">
                      {successPopup.transactionId}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(successPopup.transactionId!)}
                      className="h-6 w-6 p-0 flex-shrink-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button onClick={closeSuccessPopup} className="flex-1">
                Continue
              </Button>
              {successPopup.explorerUrl && (
                <Button
                  variant="outline"
                  onClick={() => window.open(successPopup.explorerUrl, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on FlowScan
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
