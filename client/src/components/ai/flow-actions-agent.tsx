// AI Agent for Flow Actions Discovery and Execution
// Bounty differentiator: "fully onchain agents with actions"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  Search, 
  Play, 
  Link, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Zap,
  Brain,
  Activity
} from 'lucide-react';

interface FlowAction {
  id: string;
  name: string;
  description: string;
  parameters: Array<{
    name: string;
    type: string;
    description: string;
    required: boolean;
  }>;
  contractAddress: string;
  category: string;
  safetyChecks: string[];
  composable: boolean;
}

interface ActionExecutionResult {
  success: boolean;
  transactionId: string;
  explorerUrl: string;
  actionId?: string;
  executionTime: number;
  gasUsed?: number;
  error?: string;
}

export function FlowActionsAgent() {
  const [availableActions, setAvailableActions] = useState<FlowAction[]>([]);
  const [selectedActions, setSelectedActions] = useState<FlowAction[]>([]);
  const [executionResults, setExecutionResults] = useState<ActionExecutionResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [agentQuery, setAgentQuery] = useState('');
  const [agentSuggestions, setAgentSuggestions] = useState<string[]>([]);

  // Discover available actions on component mount
  useEffect(() => {
    discoverActions();
  }, []);

  const discoverActions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/flow-actions/discover');
      const data = await response.json();
      
      if (data.success) {
        setAvailableActions(data.actions);
        generateAgentSuggestions(data.actions);
      }
    } catch (error) {
      console.error('Failed to discover actions:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateAgentSuggestions = (actions: FlowAction[]) => {
    const suggestions = [
      "Create a weather derivative for Dallas with 25mm rainfall threshold",
      "Update weather data for station DALLAS_001 with current conditions",
      "Schedule automatic settlement for rain options expiring tomorrow",
      "Chain weather update → derivative creation → settlement scheduling",
      "Execute automated payout based on weather conditions"
    ];
    setAgentSuggestions(suggestions);
  };

  const processAgentQuery = async (query: string) => {
    setLoading(true);
    
    // AI-powered action selection based on natural language
    const suggestedActions = analyzeQueryForActions(query, availableActions);
    setSelectedActions(suggestedActions);
    
    // Auto-execute if query is clear and specific
    if (suggestedActions.length === 1 && query.includes('execute')) {
      await executeSelectedActions();
    }
    
    setLoading(false);
  };

  const analyzeQueryForActions = (query: string, actions: FlowAction[]): FlowAction[] => {
    const lowerQuery = query.toLowerCase();
    const suggested: FlowAction[] = [];

    // Weather-related queries
    if (lowerQuery.includes('weather') && lowerQuery.includes('update')) {
      const weatherAction = actions.find(a => a.id === 'weather_update');
      if (weatherAction) suggested.push(weatherAction);
    }

    // Derivative creation queries
    if (lowerQuery.includes('derivative') || lowerQuery.includes('option')) {
      const derivativeAction = actions.find(a => a.id === 'create_derivative');
      if (derivativeAction) suggested.push(derivativeAction);
    }

    // Settlement scheduling queries
    if (lowerQuery.includes('schedule') || lowerQuery.includes('settlement')) {
      const scheduleAction = actions.find(a => a.id === 'schedule_settlement');
      if (scheduleAction) suggested.push(scheduleAction);
    }

    // Automation queries
    if (lowerQuery.includes('automat') || lowerQuery.includes('payout')) {
      const payoutAction = actions.find(a => a.id === 'automated_payout');
      if (payoutAction) suggested.push(payoutAction);
    }

    // Chain queries
    if (lowerQuery.includes('chain') || lowerQuery.includes('workflow')) {
      return actions.filter(a => a.composable).slice(0, 3);
    }

    return suggested;
  };

  const executeSelectedActions = async () => {
    if (selectedActions.length === 0) return;

    setLoading(true);
    const results: ActionExecutionResult[] = [];

    try {
      if (selectedActions.length === 1) {
        // Single action execution
        const action = selectedActions[0];
        const parameters = generateMockParameters(action);
        
        const response = await fetch('/api/flow-actions/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId: action.id,
            parameters,
            useRealExecution: false // Demo mode
          })
        });
        
        const data = await response.json();
        if (data.success) {
          results.push(data.result);
        }
      } else {
        // Action chain execution
        const chainActions = selectedActions.map(action => ({
          actionId: action.id,
          parameters: generateMockParameters(action)
        }));
        
        const response = await fetch('/api/flow-actions/chain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actions: chainActions,
            useRealExecution: false // Demo mode
          })
        });
        
        const data = await response.json();
        if (data.success) {
          results.push(...data.results);
        }
      }
      
      setExecutionResults(prev => [...results, ...prev]);
    } catch (error) {
      console.error('Execution failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMockParameters = (action: FlowAction): Record<string, any> => {
    const params: Record<string, any> = {};
    
    action.parameters.forEach(param => {
      switch (param.name) {
        case 'stationId':
          params[param.name] = 'DALLAS_001';
          break;
        case 'rainfall':
          params[param.name] = 25.5;
          break;
        case 'windSpeed':
          params[param.name] = 15.2;
          break;
        case 'temperature':
          params[param.name] = 22.0;
          break;
        case 'threshold':
          params[param.name] = 20.0;
          break;
        case 'premium':
          params[param.name] = 100.0;
          break;
        case 'optionId':
          params[param.name] = 'dallas_rain_call_20mm';
          break;
        case 'settlementTime':
          params[param.name] = Date.now() + 86400000; // Tomorrow
          break;
        case 'expiry':
          params[param.name] = Date.now() + 2592000000; // 30 days
          break;
        default:
          params[param.name] = 'auto_generated';
      }
    });
    
    return params;
  };

  return (
    <div className="space-y-6">
      {/* AI Agent Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-500" />
            Flow Actions AI Agent
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              FLIP-338 Compatible
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Bot className="h-4 w-4" />
            <AlertDescription>
              AI agent for discovering, composing, and executing Flow Actions. 
              Supports natural language queries and automated workflow creation.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Tabs defaultValue="discover" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">
            <Search className="h-4 w-4 mr-2" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="compose">
            <Link className="h-4 w-4 mr-2" />
            Compose
          </TabsTrigger>
          <TabsTrigger value="execute">
            <Play className="h-4 w-4 mr-2" />
            Execute
          </TabsTrigger>
          <TabsTrigger value="history">
            <Clock className="h-4 w-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Action Discovery */}
        <TabsContent value="discover" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Natural Language Action Discovery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Describe what you want to do... (e.g., 'Create weather derivative for Dallas')"
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && processAgentQuery(agentQuery)}
                />
                <Button 
                  onClick={() => processAgentQuery(agentQuery)}
                  disabled={loading || !agentQuery}
                >
                  <Search className="h-4 w-4 mr-2" />
                  Analyze
                </Button>
              </div>

              {/* AI Suggestions */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">AI Suggestions:</h4>
                <div className="flex flex-wrap gap-2">
                  {agentSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setAgentQuery(suggestion);
                        processAgentQuery(suggestion);
                      }}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Available Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableActions.map((action) => (
                  <Card key={action.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{action.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <Badge variant="outline">{action.category}</Badge>
                            {action.composable && (
                              <Badge variant="secondary">Composable</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => setSelectedActions([action])}
                          variant={selectedActions.includes(action) ? "default" : "outline"}
                        >
                          {selectedActions.includes(action) ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <Activity className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Composition */}
        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Composition</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Selected Actions:</span>
                  <Badge variant="outline">{selectedActions.length} actions</Badge>
                </div>
                
                {selectedActions.length > 0 ? (
                  <div className="space-y-2">
                    {selectedActions.map((action, index) => (
                      <div key={action.id} className="flex items-center gap-2 p-2 bg-secondary/20 rounded">
                        <span className="text-sm font-mono">{index + 1}.</span>
                        <span className="text-sm">{action.name}</span>
                        <Badge variant="outline" className="text-xs">{action.category}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      No actions selected. Use the Discover tab to select actions for your workflow.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution */}
        <TabsContent value="execute" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execute Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={executeSelectedActions}
                  disabled={loading || selectedActions.length === 0}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Activity className="h-4 w-4 mr-2 animate-spin" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Execute {selectedActions.length > 1 ? 'Action Chain' : 'Action'}
                    </>
                  )}
                </Button>

                <Alert>
                  <Bot className="h-4 w-4" />
                  <AlertDescription>
                    Demo Mode: Actions execute with enhanced mock data. 
                    Production mode would execute real blockchain transactions.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
            </CardHeader>
            <CardContent>
              {executionResults.length > 0 ? (
                <div className="space-y-3">
                  {executionResults.map((result, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm font-medium">
                            {result.actionId || 'Action'}
                          </span>
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.success ? 'Success' : 'Failed'}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 text-xs text-muted-foreground">
                        <div>Transaction: {result.transactionId}</div>
                        <div>Execution Time: {result.executionTime}ms</div>
                        {result.gasUsed && <div>Gas Used: {result.gasUsed}</div>}
                      </div>
                      
                      {result.explorerUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => window.open(result.explorerUrl, '_blank')}
                        >
                          View on Explorer
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    No executions yet. Use the Execute tab to run actions and see results here.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
