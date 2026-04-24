import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShellLayout } from '@/features/shell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertTriangle,
  Search,
  WifiOff,
  Shield,
  Bug,
  Globe,
  RefreshCw,
  ArrowRight,
  Terminal,
  CheckCircle,
  XCircle,
  Clock,
  Info,
} from 'lucide-react';

// Component that throws error for testing
const ErrorComponent: React.FC<{ shouldError: boolean }> = ({ shouldError }) => {
  if (shouldError) {
    throw new Error('Test error for ErrorBoundary');
  }
  return <div>No error</div>;
};

export default function ErrorTestPage() {
  const [shouldShowError, setShouldShowError] = React.useState(false);
  const [testStatus, setTestStatus] = React.useState<
    Record<string, 'idle' | 'testing' | 'success' | 'error'>
  >({});
  const [logs, setLogs] = React.useState<
    Array<{
      id: string;
      timestamp: Date;
      type: 'info' | 'success' | 'error' | 'warning';
      message: string;
      details?: string;
    }>
  >([]);

  const addLog = (
    type: 'info' | 'success' | 'error' | 'warning',
    message: string,
    details?: string
  ) => {
    const newLog = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type,
      message,
      details,
    };
    setLogs((prev) => [newLog, ...prev].slice(0, 50)); // Keep last 50 logs
  };

  const updateStatus = (test: string, status: 'idle' | 'testing' | 'success' | 'error') => {
    setTestStatus((prev) => ({ ...prev, [test]: status }));
    if (status === 'testing') {
      setTimeout(() => setTestStatus((prev) => ({ ...prev, [test]: 'idle' })), 2000);
    }
  };

  const trigger500Error = () => {
    addLog('info', 'Starting 500 Server Error test', 'Fetching /api/admin/nonexistent-endpoint');
    updateStatus('server', 'testing');

    fetch('/api/admin/nonexistent-endpoint')
      .then((response) => {
        if (!response.ok) {
          const error = `Server error: ${response.status}`;
          addLog('error', 'Server error detected', error);
          updateStatus('server', 'error');
          throw new Error(error);
        }
        return response.json();
      })
      .catch((error) => {
        addLog('success', '500 test completed', error.message);
        updateStatus('server', 'success');
      });
  };

  const triggerTypeError = () => {
    addLog('info', 'Starting JavaScript Error test', 'Triggering null property access');
    updateStatus('javascript', 'testing');

    setTimeout(() => {
      try {
        const obj = null;
        (obj as any).nonexistent.property.method();
      } catch (error) {
        addLog('error', 'JavaScript error triggered', (error as Error).message);
        updateStatus('javascript', 'error');
      }
    }, 100);
  };

  const triggerNetworkError = () => {
    addLog('info', 'Starting Network Error test', 'Fetching from localhost:9999');
    updateStatus('network', 'testing');

    fetch('http://localhost:9999/nonexistent-port').catch((error) => {
      addLog('success', 'Network error test completed', error.message);
      updateStatus('network', 'success');
    });
  };

  const triggerErrorBoundary = () => {
    addLog('info', 'Starting ErrorBoundary test', 'Rendering ErrorComponent with error');
    updateStatus('boundary', 'testing');
    setShouldShowError(true);
  };

  const trigger404Error = () => {
    addLog('info', 'Starting 404 Error test', 'Navigating to /nonexistent-page');
    updateStatus('404', 'testing');
    setTimeout(() => {
      window.location.href = '/nonexistent-page';
    }, 500);
  };

  const trigger403Error = () => {
    addLog('info', 'Starting 403 Access Denied test', 'Navigating to /admin/categories');
    updateStatus('403', 'testing');
    setTimeout(() => {
      window.location.href = '/admin/categories';
    }, 500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <RefreshCw className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'testing':
        return <Badge className="bg-yellow-100 text-yellow-800">Testing</Badge>;
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge variant="outline">Ready</Badge>;
    }
  };

  const errorTests = [
    {
      id: '404',
      title: '404 Page Not Found',
      description: 'Test 404 error page with invalid URL',
      icon: Search,
      action: trigger404Error,
      buttonText: 'Test 404',
      status: testStatus['404'] || 'idle',
      category: 'http',
    },
    {
      id: '403',
      title: '403 Access Denied',
      description: 'Test 403 error (requires logout)',
      icon: Globe,
      action: trigger403Error,
      buttonText: 'Test 403',
      status: testStatus['403'] || 'idle',
      category: 'http',
    },
    {
      id: 'server',
      title: '500 Server Error',
      description: 'Test server error with invalid API call',
      icon: AlertTriangle,
      action: trigger500Error,
      buttonText: 'Test 500',
      status: testStatus.server || 'idle',
      category: 'server',
    },
    {
      id: 'network',
      title: 'Network Error',
      description: 'Test network connection error',
      icon: WifiOff,
      action: triggerNetworkError,
      buttonText: 'Test Network',
      status: testStatus.network || 'idle',
      category: 'server',
    },
    {
      id: 'boundary',
      title: 'ErrorBoundary Test',
      description: 'Direct ErrorBoundary component test',
      icon: Bug,
      action: triggerErrorBoundary,
      buttonText: 'Test Boundary',
      status: testStatus.boundary || 'idle',
      category: 'javascript',
      customContent: shouldShowError && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <ErrorComponent shouldError={true} />
        </div>
      ),
    },
    {
      id: 'javascript',
      title: 'JavaScript Error',
      description: 'Test JavaScript runtime error',
      icon: Shield,
      action: triggerTypeError,
      buttonText: 'Test JS Error',
      status: testStatus.javascript || 'idle',
      category: 'javascript',
    },
  ];

  const getCardStyles = (color: string) => {
    const colorMap = {
      blue: 'border-blue-200 bg-blue-50/60',
      purple: 'border-purple-200 bg-purple-50/60',
      red: 'border-red-200 bg-red-50/60',
      orange: 'border-orange-200 bg-orange-50/60',
      yellow: 'border-yellow-200 bg-yellow-50/60',
      indigo: 'border-indigo-200 bg-indigo-50/60',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getButtonStyles = (color: string) => {
    const colorMap = {
      blue: 'bg-blue-600 hover:bg-blue-700 text-white',
      purple: 'bg-purple-600 hover:bg-purple-700 text-white',
      red: 'bg-red-600 hover:bg-red-700 text-white',
      orange: 'bg-orange-600 hover:bg-orange-700 text-white',
      yellow: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      indigo: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  const getIconColor = (color: string) => {
    const colorMap = {
      blue: 'text-blue-600',
      purple: 'text-purple-600',
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      indigo: 'text-indigo-600',
    };
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <ShellLayout variant="admin">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Error Testing Suite</h1>
              <p className="text-sm text-slate-600">
                Test all error types to verify they display correctly within the main application
                layout
              </p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="w-10 h-10 rounded-full border-2 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200">
                  <AlertTriangle className="w-4 h-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-md p-4">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Expected Behavior:</h4>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      <li>All errors display within main layout (sidebar + header)</li>
                      <li>Error pages show appropriate images (404.png or Sorry.png)</li>
                      <li>Action buttons work correctly (Try Again, Go Home)</li>
                      <li>Error details show at bottom with timestamp</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-slate-900 mb-2">Test Status:</h4>
                    <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                      <li>404: Test with non-existent URLs</li>
                      <li>403: Test admin pages without login</li>
                      <li>500/Network: Test with buttons above</li>
                      <li>JavaScript: Test ErrorBoundary button</li>
                    </ul>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="space-y-6">
            {/* Tabs for Error Categories */}
            <Tabs defaultValue="http" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="http" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  HTTP Errors
                </TabsTrigger>
                <TabsTrigger value="server" className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Server Errors
                </TabsTrigger>
                <TabsTrigger value="javascript" className="flex items-center gap-2">
                  <Bug className="w-4 h-4" />
                  JavaScript Errors
                </TabsTrigger>
              </TabsList>

              {/* HTTP Errors Tab */}
              <TabsContent value="http" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {errorTests
                    .filter((test) => test.category === 'http')
                    .map((test) => {
                      const Icon = test.icon;
                      return (
                        <Card
                          key={test.id}
                          className={`border-2 ${getCardStyles('blue')} hover:shadow-lg transition-all duration-200`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                                <Icon className="w-4 h-4 text-blue-600" />
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(test.status)}
                                {getStatusBadge(test.status)}
                              </div>
                            </div>
                            <CardTitle className="text-base font-semibold text-slate-900">
                              {test.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {test.description}
                            </p>

                            <Button
                              onClick={test.action}
                              className="w-full py-2 font-medium bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md transition-all duration-200">
                              <span className="flex items-center justify-center gap-2">
                                {test.buttonText}
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </Button>

                            {test.customContent}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>

              {/* Server Errors Tab */}
              <TabsContent value="server" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {errorTests
                    .filter((test) => test.category === 'server')
                    .map((test) => {
                      const Icon = test.icon;
                      return (
                        <Card
                          key={test.id}
                          className={`border-2 ${getCardStyles('red')} hover:shadow-lg transition-all duration-200`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                                <Icon className="w-4 h-4 text-red-600" />
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(test.status)}
                                {getStatusBadge(test.status)}
                              </div>
                            </div>
                            <CardTitle className="text-base font-semibold text-slate-900">
                              {test.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {test.description}
                            </p>

                            <Button
                              onClick={test.action}
                              className="w-full py-2 font-medium bg-red-600 hover:bg-red-700 text-white hover:shadow-md transition-all duration-200">
                              <span className="flex items-center justify-center gap-2">
                                {test.buttonText}
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </Button>

                            {test.customContent}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>

              {/* JavaScript Errors Tab */}
              <TabsContent value="javascript" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {errorTests
                    .filter((test) => test.category === 'javascript')
                    .map((test) => {
                      const Icon = test.icon;
                      return (
                        <Card
                          key={test.id}
                          className={`border-2 ${getCardStyles('orange')} hover:shadow-lg transition-all duration-200`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                                <Icon className="w-4 h-4 text-orange-600" />
                              </div>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(test.status)}
                                {getStatusBadge(test.status)}
                              </div>
                            </div>
                            <CardTitle className="text-base font-semibold text-slate-900">
                              {test.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <p className="text-sm text-slate-600 leading-relaxed">
                              {test.description}
                            </p>

                            <Button
                              onClick={test.action}
                              className="w-full py-2 font-medium bg-orange-600 hover:bg-orange-700 text-white hover:shadow-md transition-all duration-200">
                              <span className="flex items-center justify-center gap-2">
                                {test.buttonText}
                                <ArrowRight className="w-4 h-4" />
                              </span>
                            </Button>

                            {test.customContent}
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>
              </TabsContent>
            </Tabs>

            {/* Activity Log */}
            <Card className="border-2 border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Terminal className="w-4 h-4 text-slate-600" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      Activity Log
                    </CardTitle>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setLogs([])}
                    className="hover:bg-slate-100">
                    Clear Logs
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">
                        No activity logs yet. Run some tests to see logs here.
                      </p>
                    </div>
                  ) : (
                    logs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="mt-1">
                          {log.type === 'success' && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {log.type === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                          {log.type === 'warning' && (
                            <AlertTriangle className="w-4 h-4 text-yellow-500" />
                          )}
                          {log.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-slate-900">
                              {log.message}
                            </span>
                            <span className="text-xs text-slate-500">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          {log.details && (
                            <p className="text-xs text-slate-600 font-mono bg-slate-100 p-2 rounded">
                              {log.details}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Manual Test Section */}
            <Card className="border-2 border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-slate-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900">
                    Manual URL Testing
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">
                  Visit these URLs directly to test error pages:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['/nonexistent-page', '/admin/invalid-url', '/kpi/fake-page'].map((url) => (
                    <div
                      key={url}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200">
                      <code className="text-xs font-mono text-slate-700">{url}</code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          addLog('info', 'Manual URL test', `Navigating to ${url}`);
                          window.location.href = url;
                        }}
                        className="hover:bg-slate-100">
                        Visit
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
