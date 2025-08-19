'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/api';
import { socketManager } from '../../../lib/socket';

export default function ConnectionTest() {
  const [backendStatus, setBackendStatus] = useState<{
    connected: boolean;
    response?: any;
    error?: string;
  }>({ connected: false });

  const [socketStatus, setSocketStatus] = useState<{
    connected: boolean;
    error?: string;
  }>({ connected: false });

  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    testConnections();
  }, []);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testConnections = async () => {
    addTestResult('🔄 Starting connection tests...');

    // Test Backend API Connection
    try {
      addTestResult('📡 Testing backend API connection...');
      const healthResponse = await apiClient.getHealthStatus();
      
      if (healthResponse.success) {
        setBackendStatus({ connected: true, response: healthResponse });
        addTestResult('✅ Backend API connection successful!');
        
        // Test additional endpoints
        try {
          const statusResponse = await apiClient.getSystemStatus();
          addTestResult('✅ System status endpoint working!');
        } catch (error) {
          addTestResult('⚠️ System status endpoint error (normal if not implemented)');
        }
      } else {
        setBackendStatus({ connected: false, error: 'Health check failed' });
        addTestResult('❌ Backend API health check failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setBackendStatus({ connected: false, error: errorMessage });
      addTestResult(`❌ Backend API connection failed: ${errorMessage}`);
    }

    // Test Socket.IO Connection
    try {
      addTestResult('🔌 Testing Socket.IO connection...');
      
      socketManager.connect('test-token');
      
      // Listen for connection events
      const socket = socketManager.getSocket();
      if (socket) {
        socket.on('connect', () => {
          setSocketStatus({ connected: true });
          addTestResult('✅ Socket.IO connection successful!');
        });
        
        socket.on('connect_error', (error: any) => {
          setSocketStatus({ connected: false, error: error.message });
          addTestResult(`❌ Socket.IO connection failed: ${error.message}`);
        });

        socket.on('disconnect', () => {
          setSocketStatus({ connected: false });
          addTestResult('🔌 Socket.IO disconnected');
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setSocketStatus({ connected: false, error: errorMessage });
      addTestResult(`❌ Socket.IO setup failed: ${errorMessage}`);
    }
  };

  const testSpecificEndpoint = async (endpoint: string) => {
    try {
      addTestResult(`🔍 Testing ${endpoint}...`);
      const response = await fetch(`http://localhost:5000/api${endpoint}`);
      const data = await response.json();
      
      if (response.ok) {
        addTestResult(`✅ ${endpoint} - Status: ${response.status}`);
      } else {
        addTestResult(`⚠️ ${endpoint} - Status: ${response.status}, Message: ${data.message}`);
      }
    } catch (error) {
      addTestResult(`❌ ${endpoint} - Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          🔗 Frontend ↔ Backend Connection Test
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Backend Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🖥️ Backend API Status
              <span className={`ml-3 w-3 h-3 rounded-full ${backendStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </h2>
            
            <div className="space-y-2">
              <p><strong>URL:</strong> http://localhost:5000/api</p>
              <p><strong>Status:</strong> {backendStatus.connected ? '✅ Connected' : '❌ Disconnected'}</p>
              {backendStatus.error && (
                <p className="text-red-400"><strong>Error:</strong> {backendStatus.error}</p>
              )}
              {backendStatus.response && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-blue-400">View Response</summary>
                  <pre className="mt-2 p-3 bg-gray-700 rounded text-sm overflow-auto">
                    {JSON.stringify(backendStatus.response, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>

          {/* Socket Status */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              🔌 Socket.IO Status
              <span className={`ml-3 w-3 h-3 rounded-full ${socketStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </h2>
            
            <div className="space-y-2">
              <p><strong>URL:</strong> http://localhost:5000</p>
              <p><strong>Status:</strong> {socketStatus.connected ? '✅ Connected' : '❌ Disconnected'}</p>
              {socketStatus.error && (
                <p className="text-red-400"><strong>Error:</strong> {socketStatus.error}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick Tests */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">🧪 Quick Endpoint Tests</h2>
          <div className="flex flex-wrap gap-3">
            {['/health', '/status', '/auth/profile', '/logs/stats', '/threats/stats', '/alerts/stats'].map(endpoint => (
              <button
                key={endpoint}
                onClick={() => testSpecificEndpoint(endpoint)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
              >
                Test {endpoint}
              </button>
            ))}
          </div>
        </div>

        {/* Test Results Log */}
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">📝 Test Results Log</h2>
            <button
              onClick={() => {
                setTestResults([]);
                testConnections();
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors"
            >
              🔄 Rerun Tests
            </button>
          </div>
          
          <div className="bg-gray-900 rounded p-4 h-64 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-400 italic">No test results yet...</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm mb-1 font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Connection Summary */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 rounded-lg border border-blue-500/30">
          <h3 className="text-lg font-semibold mb-3">📊 Connection Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-400">🖥️</div>
              <div className="text-sm">Frontend</div>
              <div className="text-green-400">Port 3001 ✅</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-400">🔗</div>
              <div className="text-sm">API Connection</div>
              <div className={backendStatus.connected ? 'text-green-400' : 'text-red-400'}>
                {backendStatus.connected ? 'Connected ✅' : 'Failed ❌'}
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">🖥️</div>
              <div className="text-sm">Backend</div>
              <div className="text-green-400">Port 5000 ✅</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
