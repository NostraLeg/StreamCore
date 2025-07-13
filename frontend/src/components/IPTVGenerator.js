import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Download, 
  Copy, 
  Upload, 
  Play, 
  Trash2, 
  Eye,
  Settings,
  Link,
  Shield,
  Clock,
  Users,
  List
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import VideoPlayer from './VideoPlayer';
import axios from 'axios';

const IPTVGenerator = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('channels');
  const [channels, setChannels] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [accessCodes, setAccessCodes] = useState([]);
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [currentStream, setCurrentStream] = useState(null);
  const [loading, setLoading] = useState(false);

  const API_BASE = `${process.env.REACT_APP_BACKEND_URL}/api`;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [channelsRes, playlistsRes, codesRes] = await Promise.all([
        axios.get(`${API_BASE}/channels`),
        axios.get(`${API_BASE}/playlists`),
        axios.get(`${API_BASE}/access-codes`)
      ]);

      setChannels(channelsRes.data);
      setPlaylists(playlistsRes.data);
      setAccessCodes(codesRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    setLoading(false);
  };

  const AddChannelForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      url: '',
      logo_url: '',
      category: 'general',
      country: '',
      language: '',
      quality: 'HD'
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      try {
        const response = await axios.post(`${API_BASE}/channels`, formData);
        setChannels([...channels, response.data]);
        setShowAddChannel(false);
        setFormData({
          name: '',
          url: '',
          logo_url: '',
          category: 'general',
          country: '',
          language: '',
          quality: 'HD'
        });
      } catch (error) {
        alert('Failed to add channel: ' + (error.response?.data?.detail || error.message));
      }
      setSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold text-white mb-4">Add New Channel</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Channel Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Stream URL</label>
              <input
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                placeholder="https://example.com/stream.m3u8"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Logo URL (Optional)</label>
              <input
                type="url"
                value={formData.logo_url}
                onChange={(e) => setFormData({...formData, logo_url: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                placeholder="https://example.com/logo.png"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                >
                  <option value="general">General</option>
                  <option value="sports">Sports</option>
                  <option value="news">News</option>
                  <option value="movies">Movies</option>
                  <option value="series">Series</option>
                  <option value="kids">Kids</option>
                  <option value="music">Music</option>
                  <option value="documentary">Documentary</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">Quality</label>
                <select
                  value={formData.quality}
                  onChange={(e) => setFormData({...formData, quality: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                >
                  <option value="SD">SD</option>
                  <option value="HD">HD</option>
                  <option value="FHD">Full HD</option>
                  <option value="4K">4K UHD</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 text-sm mb-1">Country</label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                  placeholder="France"
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm mb-1">Language</label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({...formData, language: e.target.value})}
                  className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                  placeholder="French"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {submitting ? 'Adding...' : 'Add Channel'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddChannel(false)}
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

  const CreatePlaylistForm = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      is_public: false,
      expiry_hours: 24
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      
      try {
        const response = await axios.post(`${API_BASE}/playlists`, {
          ...formData,
          channels: selectedChannels
        });
        setPlaylists([...playlists, response.data]);
        setShowCreatePlaylist(false);
        setSelectedChannels([]);
        setFormData({
          name: '',
          description: '',
          is_public: false,
          expiry_hours: 24
        });
      } catch (error) {
        alert('Failed to create playlist: ' + (error.response?.data?.detail || error.message));
      }
      setSubmitting(false);
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <h3 className="text-xl font-bold text-white mb-4">Create Playlist</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Playlist Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                rows="3"
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Expiry (Hours)</label>
              <input
                type="number"
                value={formData.expiry_hours}
                onChange={(e) => setFormData({...formData, expiry_hours: parseInt(e.target.value)})}
                className="w-full p-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500"
                min="1"
                max="8760"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_public"
                checked={formData.is_public}
                onChange={(e) => setFormData({...formData, is_public: e.target.checked})}
                className="mr-2"
              />
              <label htmlFor="is_public" className="text-gray-300 text-sm">Make playlist public</label>
            </div>

            <div className="bg-gray-700 p-3 rounded">
              <p className="text-sm text-gray-300 mb-2">Selected Channels: {selectedChannels.length}</p>
              <div className="max-h-20 overflow-y-auto">
                {selectedChannels.map(channelId => {
                  const channel = channels.find(c => c.id === channelId);
                  return (
                    <div key={channelId} className="text-xs text-blue-300">
                      • {channel?.name}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                disabled={submitting || selectedChannels.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded transition-colors disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Playlist'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreatePlaylist(false)}
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

  const generateAccessCode = async (playlistId) => {
    try {
      const response = await axios.post(`${API_BASE}/access-codes`, {
        playlist_id: playlistId,
        expiry_hours: 24,
        max_uses: null
      });
      setAccessCodes([...accessCodes, response.data]);
      alert('Access code generated: ' + response.data.code);
    } catch (error) {
      alert('Failed to generate access code: ' + (error.response?.data?.detail || error.message));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const playChannel = (channel) => {
    setCurrentStream(channel);
    setShowPlayer(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">📺 Media Manager</h1>
            <p className="text-gray-400">Professional content management and distribution</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 text-white px-3 py-1 rounded text-sm flex items-center space-x-1">
              <Shield size={16} />
              <span>Secured</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex space-x-6 mt-6">
          {[
            { id: 'channels', label: 'Channels', icon: Play },
            { id: 'playlists', label: 'Collections', icon: List },
            { id: 'codes', label: 'Access Codes', icon: Link }
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
        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Media Channels ({channels.length})</h2>
              <button
                onClick={() => setShowAddChannel(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Add Channel</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {channels.map(channel => (
                <div 
                  key={channel.id} 
                  className={`bg-gray-800 rounded-lg p-4 border-2 cursor-pointer transition-all hover:bg-gray-700 ${
                    selectedChannels.includes(channel.id) 
                      ? 'border-blue-500 bg-blue-900 bg-opacity-30' 
                      : 'border-gray-700'
                  }`}
                  onClick={() => {
                    if (selectedChannels.includes(channel.id)) {
                      setSelectedChannels(selectedChannels.filter(id => id !== channel.id));
                    } else {
                      setSelectedChannels([...selectedChannels, channel.id]);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{channel.name}</h3>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          channel.category === 'sports' ? 'bg-green-800 text-green-200' :
                          channel.category === 'news' ? 'bg-blue-800 text-blue-200' :
                          channel.category === 'movies' ? 'bg-purple-800 text-purple-200' :
                          'bg-gray-600 text-gray-200'
                        }`}>
                          {channel.category}
                        </span>
                        <span className="text-yellow-400 text-xs">{channel.quality}</span>
                      </div>
                      {channel.country && (
                        <p className="text-gray-400 text-sm">{channel.country}</p>
                      )}
                    </div>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          playChannel(channel);
                        }}
                        className="text-green-400 hover:text-green-300 p-1"
                        title="Play"
                      >
                        <Play size={16} />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Delete channel logic
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {selectedChannels.length > 0 && (
              <div className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-lg shadow-lg">
                <p className="mb-2">{selectedChannels.length} channels selected</p>
                <button
                  onClick={() => setShowCreatePlaylist(true)}
                  className="bg-white text-blue-600 px-4 py-2 rounded font-semibold hover:bg-gray-100"
                >
                  Create Collection
                </button>
              </div>
            )}
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Media Collections ({playlists.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map(playlist => (
                <div key={playlist.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white">{playlist.name}</h3>
                      <p className="text-gray-400 text-sm mt-1">{playlist.description}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => generateAccessCode(playlist.id)}
                        className="text-purple-400 hover:text-purple-300 p-1"
                        title="Generate Access Code"
                      >
                        <Link size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-400 mb-4">
                    <span>{playlist.channels.length} channels</span>
                    <span>{playlist.is_public ? 'Public' : 'Private'}</span>
                  </div>

                  {playlist.expiry_date && (
                    <div className="flex items-center text-yellow-400 text-sm mb-4">
                      <Clock size={14} className="mr-1" />
                      <span>Expires: {new Date(playlist.expiry_date).toLocaleDateString()}</span>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center space-x-1">
                      <Download size={14} />
                      <span>Export M3U8</span>
                    </button>
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm flex items-center justify-center space-x-1">
                      <Eye size={14} />
                      <span>Preview</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Access Codes Tab */}
        {activeTab === 'codes' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Access Codes ({accessCodes.length})</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {accessCodes.map(code => (
                <div key={code.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <code className="bg-gray-700 px-3 py-2 rounded font-mono text-green-400 text-lg">
                      {code.code}
                    </code>
                    <button
                      onClick={() => copyToClipboard(code.code)}
                      className="text-gray-400 hover:text-white p-1"
                      title="Copy Code"
                    >
                      <Copy size={16} />
                    </button>
                  </div>

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex justify-between">
                      <span>Usage:</span>
                      <span>{code.current_uses}/{code.max_uses || '∞'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expires:</span>
                      <span>
                        {code.expires_at 
                          ? new Date(code.expires_at).toLocaleDateString() 
                          : 'Never'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span className={`${code.is_active ? 'text-green-400' : 'text-red-400'}`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/playlist/${code.code}/m3u8`)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"
                    >
                      Copy M3U8 Link
                    </button>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/playlist/${code.code}/json`)}
                      className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm"
                    >
                      Copy JSON Link
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddChannel && <AddChannelForm />}
      {showCreatePlaylist && <CreatePlaylistForm />}

      {/* Video Player Modal */}
      {showPlayer && currentStream && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
          <div className="w-full h-full max-w-6xl max-h-6xl p-4">
            <div className="relative w-full h-full">
              <button
                onClick={() => setShowPlayer(false)}
                className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
              >
                ✕
              </button>
              <VideoPlayer
                src={currentStream.url}
                title={currentStream.name}
                onError={() => alert('Failed to load stream')}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPTVGenerator;