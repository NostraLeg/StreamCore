import React, { useState, useEffect } from 'react';
import { 
  Users, 
  PlayCircle, 
  List, 
  Key, 
  BarChart3, 
  Shield,
  Plus,
  Download,
  Settings,
  Trash2,
  Edit,
  Eye,
  Copy
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [channels, setChannels] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    if (user?.role === 'admin') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, channelsRes, playlistsRes, codesRes, usersRes] = await Promise.all([
        axios.get(`${API_BASE}/admin/stats`),
        axios.get(`${API_BASE}/channels`),
        axios.get(`${API_BASE}/playlists`),
        axios.get(`${API_BASE}/access-codes`),
        axios.get(`${API_BASE}/admin/users`)
      ]);

      setStats(statsRes.data);
      setChannels(channelsRes.data);
      setPlaylists(playlistsRes.data);
      setAccessCodes(codesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
    setLoading(false);
  };

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className={`text-2xl font-bold ${color}`}>{value}</p>
        </div>
        <Icon className={`w-8 h-8 ${color}`} />
      </div>
    </div>
  );

  const ChannelRow = ({ channel }) => (
    <tr className="border-b border-gray-700 hover:bg-gray-700">
      <td className="px-4 py-3">{channel.name}</td>
      <td className="px-4 py-3">
        <span className={`px-2 py-1 rounded text-xs ${
          channel.category === 'sports' ? 'bg-green-800 text-green-200' :
          channel.category === 'news' ? 'bg-blue-800 text-blue-200' :
          channel.category === 'movies' ? 'bg-purple-800 text-purple-200' :
          'bg-gray-600 text-gray-200'
        }`}>
          {channel.category}
        </span>
      </td>
      <td className="px-4 py-3">{channel.country || 'N/A'}</td>
      <td className="px-4 py-3">{channel.quality}</td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          <button className="text-blue-400 hover:text-blue-300">
            <Edit size={16} />
          </button>
          <button className="text-red-400 hover:text-red-300">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  const PlaylistRow = ({ playlist }) => (
    <tr className="border-b border-gray-700 hover:bg-gray-700">
      <td className="px-4 py-3">{playlist.name}</td>
      <td className="px-4 py-3">{playlist.channels.length}</td>
      <td className="px-4 py-3">
        {playlist.is_public ? 'Public' : 'Private'}
      </td>
      <td className="px-4 py-3">
        {playlist.expiry_date ? new Date(playlist.expiry_date).toLocaleDateString() : 'No expiry'}
      </td>
      <td className="px-4 py-3">
        <div className="flex space-x-2">
          <button className="text-blue-400 hover:text-blue-300">
            <Eye size={16} />
          </button>
          <button className="text-green-400 hover:text-green-300">
            <Download size={16} />
          </button>
          <button className="text-red-400 hover:text-red-300">
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );

  const AccessCodeRow = ({ code }) => {
    const copyCode = () => {
      navigator.clipboard.writeText(code.code);
    };

    return (
      <tr className="border-b border-gray-700 hover:bg-gray-700">
        <td className="px-4 py-3">
          <div className="flex items-center space-x-2">
            <code className="bg-gray-700 px-2 py-1 rounded text-green-400">
              {code.code}
            </code>
            <button onClick={copyCode} className="text-gray-400 hover:text-white">
              <Copy size={14} />
            </button>
          </div>
        </td>
        <td className="px-4 py-3">{code.current_uses}/{code.max_uses || '∞'}</td>
        <td className="px-4 py-3">
          {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'No expiry'}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 rounded text-xs ${
            code.is_active ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'
          }`}>
            {code.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td className="px-4 py-3">
          <button className="text-red-400 hover:text-red-300">
            <Trash2 size={16} />
          </button>
        </td>
      </tr>
    );
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
          <p className="text-gray-400">Admin privileges required</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🎬 IPTV Admin Dashboard</h1>
            <p className="text-gray-400">Secure IPTV Management System</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-green-600 text-white px-3 py-1 rounded text-sm">
              ● Live
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome back,</p>
              <p className="font-semibold">{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-8 mt-6">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'channels', label: 'Channels', icon: PlayCircle },
            { id: 'playlists', label: 'Playlists', icon: List },
            { id: 'codes', label: 'Access Codes', icon: Key },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
            <p className="text-gray-400">Loading dashboard...</p>
          </div>
        )}

        {!loading && activeTab === 'overview' && (
          <div>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard 
                title="Total Users" 
                value={stats.total_users || 0} 
                icon={Users} 
                color="text-blue-400" 
              />
              <StatCard 
                title="Active Channels" 
                value={stats.total_channels || 0} 
                icon={PlayCircle} 
                color="text-green-400" 
              />
              <StatCard 
                title="Playlists" 
                value={stats.total_playlists || 0} 
                icon={List} 
                color="text-purple-400" 
              />
              <StatCard 
                title="Access Codes" 
                value={stats.total_access_codes || 0} 
                icon={Key} 
                color="text-yellow-400" 
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg flex items-center space-x-3 transition-colors">
                  <Plus size={24} />
                  <span>Add New Channel</span>
                </button>
                <button className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg flex items-center space-x-3 transition-colors">
                  <List size={24} />
                  <span>Create Playlist</span>
                </button>
                <button className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg flex items-center space-x-3 transition-colors">
                  <Key size={24} />
                  <span>Generate Code</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && activeTab === 'channels' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">IPTV Channels</h3>
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus size={20} />
                <span>Add Channel</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Category</th>
                    <th className="px-4 py-3 text-left">Country</th>
                    <th className="px-4 py-3 text-left">Quality</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.map(channel => (
                    <ChannelRow key={channel.id} channel={channel} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'playlists' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">Playlists</h3>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus size={20} />
                <span>Create Playlist</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Channels</th>
                    <th className="px-4 py-3 text-left">Visibility</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {playlists.map(playlist => (
                    <PlaylistRow key={playlist.id} playlist={playlist} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && activeTab === 'codes' && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">Access Codes</h3>
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                <Plus size={20} />
                <span>Generate Code</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">Code</th>
                    <th className="px-4 py-3 text-left">Usage</th>
                    <th className="px-4 py-3 text-left">Expires</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accessCodes.map(code => (
                    <AccessCodeRow key={code.id} code={code} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;