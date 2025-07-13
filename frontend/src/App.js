import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import IPTVGenerator from "./components/IPTVGenerator";
import VPNProxy from "./components/VPNProxy";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-400">Insufficient permissions</p>
        </div>
      </div>
    );
  }

  return children;
};

// Main App Layout
const AppLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <h1 className="text-2xl font-bold text-white">🎬 Secure IPTV</h1>
            
            <div className="flex space-x-4">
              <a 
                href="/generator" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded transition-colors"
              >
                IPTV Generator
              </a>
              <a 
                href="/vpn" 
                className="text-gray-300 hover:text-white px-3 py-2 rounded transition-colors"
              >
                VPN & Proxy
              </a>
              {user?.role === 'admin' && (
                <a 
                  href="/admin" 
                  className="text-gray-300 hover:text-white px-3 py-2 rounded transition-colors"
                >
                  Admin Dashboard
                </a>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-400">Welcome,</p>
              <p className="font-semibold text-white">{user?.username}</p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${
              user?.role === 'admin' ? 'bg-red-600 text-white' :
              user?.role === 'user' ? 'bg-blue-600 text-white' :
              'bg-gray-600 text-gray-200'
            }`}>
              {user?.role?.toUpperCase()}
            </span>
            <button
              onClick={logout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/generator" replace />} />
          <Route 
            path="/generator" 
            element={
              <ProtectedRoute>
                <IPTVGenerator />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
