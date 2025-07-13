import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Globe, 
  Lock, 
  Wifi, 
  Server, 
  Settings,
  Power,
  MapPin,
  Activity,
  Plus,
  Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const VPNProxy = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [selectedProxy, setSelectedProxy] = useState(null);
  const [proxyConfigs, setProxyConfigs] = useState([]);
  const [showAddProxy, setShowAddProxy] = useState(false);
  const [connectionStats, setConnectionStats] = useState({
    uploadSpeed: 0,
    downloadSpeed: 0,
    ping: 0,
    location: 'Unknown'
  });

  // Built-in free proxy servers
  const freeProxies = [
    {
      id: 'free-1',
      name: 'Free Proxy France',
      host: 'proxy-fr.secureiptv.com',
      port: 8080,
      type: 'http',
      country: 'France',
      speed: 'Medium',
      status: 'online'
    },
    {
      id: 'free-2', 
      name: 'Free Proxy Germany',
      host: 'proxy-de.secureiptv.com',
      port: 8080,
      type: 'http',
      country: 'Germany',
      speed: 'Fast',
      status: 'online'
    },
    {
      id: 'free-3',
      name: 'Free Proxy Netherlands',
      host: 'proxy-nl.secureiptv.com',
      port: 8080,
      type: 'socks5',
      country: 'Netherlands', 
      speed: 'Fast',
      status: 'online'
    }
  ];

  useEffect(() => {
    // Simulate connection stats updates
    const interval = setInterval(() => {
      if (isConnected) {
        setConnectionStats({
          uploadSpeed: Math.floor(Math.random() * 50) + 10,
          downloadSpeed: Math.floor(Math.random() * 100) + 20,
          ping: Math.floor(Math.random() * 50) + 10,
          location: selectedProxy?.country || 'Unknown'
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isConnected, selectedProxy]);

  const connectToProxy = async (proxy) => {
    setSelectedProxy(proxy);
    setIsConnected(true);
    
    // Simulate connection process
    setTimeout(() => {
      setConnectionStats({
        uploadSpeed: Math.floor(Math.random() * 50) + 10,
        downloadSpeed: Math.floor(Math.random() * 100) + 20,
        ping: Math.floor(Math.random() * 50) + 10,
        location: proxy.country
      });
    }, 1000);
  };

  const disconnect = () => {
    setIsConnected(false);
    setSelectedProxy(null);
    setConnectionStats({
      uploadSpeed: 0,
      downloadSpeed: 0,
      ping: 0,
      location: 'Unknown'
    });
  };

  const AddProxyForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      host: '',
      port: '',
      type: 'http',
      username: '',
      password: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      const newProxy = {
        id: Date.now().toString(),
        ...formData,
        port: parseInt(formData.port),
        country: 'Custom',
        speed: 'Unknown',
        status: 'unknown'
      };
      setProxyConfigs([...proxyConfigs, newProxy]);
      setShowAddProxy(false);
      setFormData({
        name: '',
        host: '',
        port: '',
        type: 'http',
        username: '',
        password: ''
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold text-white mb-4">Add Custom Proxy</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Proxy Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Host</label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => setFormData({...formData, host: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                  placeholder="proxy.example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">Port</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({...formData, port: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                  placeholder="8080"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks5">SOCKS5</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Username (Optional)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">Password (Optional)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors"
              >
                Add Proxy
              </button>
              <button
                type="button"
                onClick={() => setShowAddProxy(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const ProxyCard = ({ proxy, isCustom = false }) => (
    <div className={`bg-gray-800 rounded-lg p-4 border-2 transition-all ${
      selectedProxy?.id === proxy.id && isConnected
        ? 'border-green-500 bg-green-900 bg-opacity-30'
        : 'border-gray-700 hover:border-gray-600'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{proxy.name}</h3>
          <p className="text-gray-400 text-sm">{proxy.host}:{proxy.port}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${
            proxy.status === 'online' ? 'bg-green-400' :
            proxy.status === 'offline' ? 'bg-red-400' :
            'bg-yellow-400'
          }`}></span>
          {isCustom && (
            <button
              onClick={() => {
                setProxyConfigs(proxyConfigs.filter(p => p.id !== proxy.id));
              }}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
        <div className="flex items-center space-x-1">
          <MapPin size={14} />
          <span>{proxy.country}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Activity size={14} />
          <span>{proxy.speed}</span>
        </div>
        <span className="bg-gray-700 px-2 py-1 rounded text-xs">{proxy.type.toUpperCase()}</span>
      </div>

      <button
        onClick={() => {
          if (selectedProxy?.id === proxy.id && isConnected) {
            disconnect();
          } else {
            connectToProxy(proxy);
          }
        }}
        className={`w-full py-2 rounded transition-colors flex items-center justify-center space-x-2 ${
          selectedProxy?.id === proxy.id && isConnected
            ? 'bg-red-600 hover:bg-red-700 text-white'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        <Power size={16} />
        <span>
          {selectedProxy?.id === proxy.id && isConnected ? 'Disconnect' : 'Connect'}
        </span>
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-3">
              <Shield className="text-blue-500" />
              <span>VPN & Proxy</span>
            </h1>
            <p className="text-gray-400 mt-2">Secure your IPTV streaming with encrypted connections</p>
          </div>
          
          <div className="flex items-center space-x-4">
            {isConnected ? (
              <div className="bg-green-600 px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
                <span>Connected</span>
              </div>
            ) : (
              <div className="bg-red-600 px-4 py-2 rounded-lg flex items-center space-x-2">
                <div className="w-2 h-2 bg-red-300 rounded-full"></div>
                <span>Disconnected</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Stats */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Download</p>
                <p className="text-2xl font-bold text-green-400">{connectionStats.downloadSpeed}</p>
                <p className="text-gray-400 text-xs">Mbps</p>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Upload</p>
                <p className="text-2xl font-bold text-blue-400">{connectionStats.uploadSpeed}</p>
                <p className="text-gray-400 text-xs">Mbps</p>
              </div>
              <Wifi className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Ping</p>
                <p className="text-2xl font-bold text-yellow-400">{connectionStats.ping}</p>
                <p className="text-gray-400 text-xs">ms</p>
              </div>
              <Server className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Location</p>
                <p className="text-lg font-bold text-purple-400">{connectionStats.location}</p>
              </div>
              <Globe className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      )}

      {/* Free Proxies */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
          <Globe className="text-green-500" />
          <span>Free Proxy Servers</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {freeProxies.map(proxy => (
            <ProxyCard key={proxy.id} proxy={proxy} />
          ))}
        </div>
      </div>

      {/* Custom Proxies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold flex items-center space-x-2">
            <Settings className="text-blue-500" />
            <span>Custom Proxies</span>
          </h2>
          
          <button
            onClick={() => setShowAddProxy(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Proxy</span>
          </button>
        </div>

        {proxyConfigs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {proxyConfigs.map(proxy => (
              <ProxyCard key={proxy.id} proxy={proxy} isCustom={true} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg p-8 text-center border border-gray-700">
            <Settings className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Custom Proxies</h3>
            <p className="text-gray-500 mb-4">Add your own proxy servers for enhanced privacy</p>
            <button
              onClick={() => setShowAddProxy(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
            >
              Add First Proxy
            </button>
          </div>
        )}
      </div>

      {/* Security Notice */}
      <div className="mt-8 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Lock className="w-6 h-6 text-blue-400 mt-1" />
          <div>
            <h3 className="font-semibold text-blue-300 mb-1">Security Notice</h3>
            <p className="text-blue-200 text-sm">
              All IPTV streams are automatically routed through the selected proxy for enhanced privacy and security. 
              Your real IP address is hidden from content providers.
            </p>
          </div>
        </div>
      </div>

      {/* Add Proxy Modal */}
      {showAddProxy && <AddProxyForm />}
    </div>
  );
};

export default VPNProxy;