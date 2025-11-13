import React, { useState, useEffect, useRef } from 'react';
import { Search, RefreshCw, AlertCircle, Terminal, Filter, Wifi, WifiOff } from 'lucide-react';

export default function K8sLogMonitor() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // K8s specific states
  const [namespaces, setNamespaces] = useState([]);
  const [pods, setPods] = useState([]);
  const [selectedNamespace, setSelectedNamespace] = useState('default');
  const [selectedPod, setSelectedPod] = useState('');
  const [selectedContainer, setSelectedContainer] = useState('');
  const [availableContainers, setAvailableContainers] = useState([]);
  const [backendUrl, setBackendUrl] = useState('http://localhost:8000');
  const [wsUrl, setWsUrl] = useState('ws://localhost:8000');
  
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);

  // ดึง namespaces
  const fetchNamespaces = async () => {
    try {
      const response = await fetch(`/api/namespaces`);
      const data = await response.json();
      setNamespaces(data.namespaces);
    } catch (error) {
      console.error('Error fetching namespaces:', error);
    }
  };

  // ดึง pods
  const fetchPods = async () => {
    try {
      const response = await fetch(`/api/pods?namespace=${selectedNamespace}`);
      const data = await response.json();
      setPods(data.pods);
      
      // Reset container selection when pods change
      setSelectedContainer('');
      setAvailableContainers([]);
    } catch (error) {
      console.error('Error fetching pods:', error);
    }
  };

  // Update containers when pod changes
  useEffect(() => {
    if (selectedPod) {
      const pod = pods.find(p => p.name === selectedPod);
      if (pod && pod.containers) {
        setAvailableContainers(pod.containers);
        // Auto-select first container
        if (pod.containers.length > 0) {
          setSelectedContainer(pod.containers[0]);
        }
      }
    }
  }, [selectedPod, pods]);

  // เชื่อมต่อ WebSocket
  const connectWebSocket = () => {
    if (!selectedPod || isPaused) return;

    // ปิด connection เก่า
    if (wsRef.current) {
      wsRef.current.close();
    }

    const containerPath = selectedContainer ? `/${selectedContainer}` : '';
    const ws = new WebSocket(`/ws/logs/${selectedNamespace}/${selectedPod}${containerPath}`);
    
    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      console.log('event',event);
      
      const data = JSON.parse(event.data);
      console.log('data',data);
      
      if (data.type === 'log') {
        const newLog = {
          id: Date.now() + Math.random(),
          timestamp: data.timestamp,
          level: data.level,
          service: data.namespace,
          message: data.message,
          pod: data.pod
        };
        setLogs(prev => [...prev.slice(-199), newLog]);
      } else if (data.type === 'connected') {
        console.log('Watching logs for:', data.pod);
      } else if (data.type === 'info') {
        console.log('Info:', data.message);
        if (data.availableContainers) {
          console.log('Available containers:', data.availableContainers);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket closed');
    };

    wsRef.current = ws;
  };

  // Load namespaces เมื่อ component mount
  useEffect(() => {
    fetchNamespaces();
  }, []);

  // Load pods เมื่อเปลี่ยน namespace
  useEffect(() => {
    if (selectedNamespace) {
      fetchPods();
    }
  }, [selectedNamespace]);

  // เชื่อมต่อ WebSocket เมื่อเลือก pod
  useEffect(() => {
    if (selectedPod && !isPaused) {
      connectWebSocket();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [selectedPod, selectedContainer, selectedNamespace, isPaused]);

  // Filter logs
  useEffect(() => {
    let filtered = logs;

    if (selectedLevel !== 'all') {
      filtered = filtered.filter(log => log.level === selectedLevel);
    }

    if (searchTerm) {
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.pod.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, selectedLevel]);

  // Auto scroll
  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, autoScroll]);

  const getLevelColor = (level) => {
    switch (level) {
      case 'ERROR': return 'text-red-500 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'INFO': return 'text-blue-500 bg-blue-50';
      case 'DEBUG': return 'text-gray-500 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setFilteredLogs([]);
  };

  const levelCounts = logs.reduce((acc, log) => {
    acc[log.level] = (acc[log.level] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Terminal className="w-8 h-8 text-green-400" />
              <h1 className="text-3xl font-bold">K8s Log Monitor</h1>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <div className="flex items-center gap-2 text-green-400">
                  <Wifi className="w-4 h-4" />
                  <span className="text-sm">Connected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-400">
                  <WifiOff className="w-4 h-4" />
                  <span className="text-sm">Disconnected</span>
                </div>
              )}
              <span className="text-sm text-gray-400">
                {logs.length} logs
              </span>
            </div>
          </div>

      

          {/* K8s Selectors */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Namespace</label>
                <select
                  value={selectedNamespace}
                  onChange={(e) => {
                    setSelectedNamespace(e.target.value);
                    setSelectedPod('');
                    setSelectedContainer('');
                    clearLogs();
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                >
                  {namespaces.map(ns => (
                    <option key={ns} value={ns}>{ns}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Pod</label>
                <select
                  value={selectedPod}
                  onChange={(e) => {
                    setSelectedPod(e.target.value);
                    clearLogs();
                  }}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select a pod...</option>
                  {pods.map(pod => (
                    <option key={pod.name} value={pod.name}>
                      {pod.name} ({pod.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">Container</label>
                <select
                  value={selectedContainer}
                  onChange={(e) => {
                    setSelectedContainer(e.target.value);
                    clearLogs();
                  }}
                  disabled={availableContainers.length === 0}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:border-blue-500 disabled:opacity-50"
                >
                  {availableContainers.length === 0 ? (
                    <option value="">No containers</option>
                  ) : (
                    availableContainers.map(container => (
                      <option key={container} value={container}>{container}</option>
                    ))
                  )}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchPods}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-medium transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Pods
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            {['ERROR', 'WARN', 'INFO', 'DEBUG'].map(level => (
              <div key={level} className="bg-gray-800 rounded-lg p-4">
                <div className="text-sm text-gray-400">{level}</div>
                <div className="text-2xl font-bold">{levelCounts[level] || 0}</div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
              />
            </div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white"
            >
              <option value="all">All Levels</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                isPaused
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-yellow-600 hover:bg-yellow-700'
              }`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition"
            >
              Clear
            </button>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Auto-scroll</span>
            </label>
          </div>
        </div>

        {/* Logs Display */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="h-[600px] overflow-y-auto font-mono text-sm">
            {!selectedPod ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Terminal className="w-12 h-12 mb-2" />
                <p>Please select a pod to view logs</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <AlertCircle className="w-12 h-12 mb-2" />
                <p>No logs to display</p>
                {!isConnected && <p className="text-sm mt-2">Connecting to pod...</p>}
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex gap-3 p-3 bg-gray-900 rounded border border-gray-700 hover:border-gray-600 transition"
                  >
                    <span className="text-gray-500 text-xs whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString('th-TH')}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${getLevelColor(log.level)}`}>
                      {log.level}
                    </span>
                    <span className="text-purple-400 text-xs whitespace-nowrap">
                      [{log.pod}]
                    </span>
                    <span className="text-cyan-400 text-xs whitespace-nowrap">
                      {log.service}
                    </span>
                    <span className="text-gray-300 flex-1 break-all">
                      {log.message}
                    </span>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}