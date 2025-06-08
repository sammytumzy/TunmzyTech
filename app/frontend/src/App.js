import React, { useState, useEffect } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";

<<<<<<< HEAD
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
=======
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
>>>>>>> f0d38d87b7a8cbf4156ccd4c1cf1b8254d297799
const API = `${BACKEND_URL}/api`;

// Pi Network Service
class PiNetworkService {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
  }

  async authenticate() {
    try {
      console.log('Starting Pi authentication...');
      const scopes = ['username', 'payments'];
      
      const onIncompletePaymentFound = (payment) => {
        console.log('Incomplete payment found:', payment);
      };

      const authResult = await window.Pi.authenticate(scopes, onIncompletePaymentFound);
      console.log('Authentication successful:', authResult);
      
      // Verify with backend
      const response = await axios.post(`${API}/auth/verify`, {
        accessToken: authResult.accessToken
      });
      
      this.user = response.data.user;
      this.isAuthenticated = true;
      return response.data;
    } catch (error) {
      console.error('Authentication failed:', error);
      throw error;
    }
  }

  async createPayment(amount, memo, metadata = {}) {
    try {
      console.log('Creating payment:', { amount, memo, metadata });
      
      const paymentData = {
        amount: parseFloat(amount),
        memo: memo,
        metadata: metadata
      };

      const paymentCallbacks = {
        onReadyForServerApproval: async (paymentId) => {
          console.log('Payment ready for server approval:', paymentId);
          try {
            const response = await axios.post(`${API}/payments/approve`, {
              paymentId: paymentId,
              amount: amount
            });
            console.log('Server approval response:', response.data);
          } catch (error) {
            console.error('Server approval failed:', error);
          }
        },
        onReadyForServerCompletion: async (paymentId, txid) => {
          console.log('Payment ready for server completion:', paymentId, txid);
          try {
            const response = await axios.post(`${API}/payments/complete`, {
              paymentId: paymentId,
              txid: txid
            });
            console.log('Payment completed:', response.data);
            return response.data;
          } catch (error) {
            console.error('Payment completion failed:', error);
          }
        },
        onCancel: (paymentId) => {
          console.log('Payment cancelled:', paymentId);
        },
        onError: (error, payment) => {
          console.error('Payment error:', error, payment);
        }
      };

      const payment = await window.Pi.createPayment(paymentData, paymentCallbacks);
      console.log('Payment created:', payment);
      return payment;
    } catch (error) {
      console.error('Payment creation failed:', error);
      throw error;
    }
  }
}

const piService = new PiNetworkService();

// Components
const Header = ({ user, onLogin, onLogout }) => {
  return (
    <header className="header">
      <div className="container">
        <h1 className="logo">TunmzyTech</h1>
        <nav className="nav">
          {user ? (
            <div className="user-info">
              <span>Welcome, {user.username}!</span>
              <button onClick={onLogout} className="btn btn-secondary">Logout</button>
            </div>
          ) : (
            <button onClick={onLogin} className="btn btn-primary">Login with Pi</button>
          )}
        </nav>
      </div>
    </header>
  );
};

const AIToolCard = ({ title, description, price, onPurchase, loading }) => {
  return (
    <div className="tool-card">
      <h3 className="tool-title">{title}</h3>
      <p className="tool-description">{description}</p>
      <div className="tool-price">π {price}</div>
      <button 
        onClick={() => onPurchase(price, title)}
        disabled={loading}
        className="btn btn-pi"
      >
        {loading ? 'Processing...' : 'Pay with Pi'}
      </button>
    </div>
  );
};

const Home = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('');

  const aiTools = [
    {
      title: "AI Text Generator",
      description: "Generate high-quality content with advanced AI",
      price: "10"
    },
    {
      title: "AI Image Creator",
      description: "Create stunning images from text descriptions",
      price: "15"
    },
    {
      title: "AI Code Assistant",
      description: "Get help with coding and development tasks",
      price: "20"
    },
    {
      title: "AI Data Analyzer", 
      description: "Analyze and visualize your data with AI insights",
      price: "25"
    }
  ];

  const handleLogin = async () => {
    if (!window.Pi) {
      alert('Pi SDK not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    try {
      const authData = await piService.authenticate();
      setUser(authData.user);
      setPaymentStatus('Successfully logged in!');
    } catch (error) {
      console.error('Login failed:', error);
      setPaymentStatus('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    piService.user = null;
    piService.isAuthenticated = false;
    setPaymentStatus('');
  };

  const handlePurchase = async (amount, toolName) => {
    if (!user) {
      alert('Please login with Pi Network first');
      return;
    }

    if (!window.Pi) {
      alert('Pi SDK not available. Please refresh the page.');
      return;
    }

    setLoading(true);
    setPaymentStatus('Initiating payment...');

    try {
      const payment = await piService.createPayment(
        amount,
        `Payment for ${toolName}`,
        { tool: toolName, userId: user.uid }
      );
      
      setPaymentStatus(`Payment initiated for ${toolName}. Complete the transaction in your Pi app.`);
    } catch (error) {
      console.error('Purchase failed:', error);
      setPaymentStatus('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test backend connection
    const testConnection = async () => {
      try {
        const response = await axios.get(`${API}/`);
        console.log('Backend connected:', response.data.message);
      } catch (error) {
        console.error('Backend connection failed:', error);
      }
    };
    testConnection();
  }, []);

  return (
    <div className="home">
      <Header user={user} onLogin={handleLogin} onLogout={handleLogout} />
      
      <main className="main">
        <section className="hero">
          <div className="container">
            <h2 className="hero-title">AI-Powered Tools for Everyone</h2>
            <p className="hero-subtitle">
              Access premium AI tools and content generation with Pi Network payments
            </p>
            {paymentStatus && (
              <div className="payment-status">
                {paymentStatus}
              </div>
            )}
          </div>
        </section>

        <section className="tools">
          <div className="container">
            <h3 className="section-title">Available AI Tools</h3>
            <div className="tools-grid">
              {aiTools.map((tool, index) => (
                <AIToolCard
                  key={index}
                  {...tool}
                  onPurchase={handlePurchase}
                  loading={loading}
                />
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App; 