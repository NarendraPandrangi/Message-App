import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import './index.css';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </Router>
    );
}

const Home = () => (
    <div className="app-container">
        <Navbar />
        <Hero />
        <Features />
    </div>
);

const Navbar = () => {
    const navigate = useNavigate();
    return (
        <nav className="navbar glass-panel">
            <div className="container nav-content">
                <Link to="/">
                    <h1 className="logo gradient-text">ChatVerse</h1>
                </Link>
                <div className="nav-links">
                    <button className="btn-text">Features</button>
                    <button onClick={() => navigate('/login')} className="btn-text">Login</button>
                    <button onClick={() => navigate('/register')} className="btn-primary">Get Started</button>
                </div>
            </div>
        </nav>
    );
};

const Hero = () => {
    const navigate = useNavigate();
    return (
        <header className="hero">
            <div className="container hero-content">
                <div className="hero-text">
                    <h2 className="hero-title">
                        Connect Beyond <br />
                        <span className="gradient-text">Boundaries</span>
                    </h2>
                    <p className="hero-subtitle">
                        Experience real-time messaging with a premium touch. Secure, fast, and beautifully designed for you.
                    </p>
                    <div className="hero-cta">
                        <button onClick={() => navigate('/register')} className="btn-primary large">Start Chatting Now</button>
                        <button className="btn-secondary">Learn More</button>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="visual-card glass-panel floating">
                        <div className="message-bubble received">Hey there! 👋</div>
                        <div className="message-bubble sent">Welcome to ChatVerse!</div>
                        <div className="message-bubble received">This design is amazing! 🚀</div>
                    </div>
                </div>
            </div>
        </header>
    );
};

const Features = () => (
    <section className="features container">
        <div className="feature-card glass-panel">
            <h3>Real-time</h3>
            <p>Instant delivery with zero latency.</p>
        </div>
        <div className="feature-card glass-panel">
            <h3>Secure</h3>
            <p>End-to-end encryption for your privacy.</p>
        </div>
        <div className="feature-card glass-panel">
            <h3>Cross-Platform</h3>
            <p>Access your chats from anywhere.</p>
        </div>
    </section>
)


export default App;
