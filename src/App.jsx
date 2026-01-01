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

const Home = () => {
    const navigate = useNavigate();
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-dark)', // Use the vibrant dark background
            padding: '2rem',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decorations */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '50vw',
                height: '50vw',
                background: 'var(--primary-gradient)',
                filter: 'blur(150px)',
                borderRadius: '50%',
                opacity: 0.15,
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '50vw',
                height: '50vw',
                background: 'var(--secondary-gradient)',
                filter: 'blur(150px)',
                borderRadius: '50%',
                opacity: 0.15,
                zIndex: 0
            }} />

            <div className="glass-panel" style={{
                maxWidth: '1200px',
                width: '100%',
                minHeight: '80vh',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                alignItems: 'center',
                gap: '4rem',
                padding: '4rem',
                zIndex: 1,
                borderRadius: '24px',
                border: '1px solid var(--glass-border)'
            }}>
                {/* Left Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', textAlign: 'left' }}>
                    <h1 style={{
                        fontSize: '4rem',
                        fontWeight: '800',
                        lineHeight: '1.1',
                        background: 'linear-gradient(to right, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Share the <br />
                        <span className="gradient-text">Moment.</span>
                    </h1>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: '500px' }}>
                        Experience a new era of messaging. Instant, secure, and designed to bring people closer together, no matter the distance.
                    </p>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={() => navigate('/login')}
                            className="btn-primary"
                            style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', borderRadius: '50px' }}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            style={{
                                padding: '1rem 2.5rem',
                                fontSize: '1.1rem',
                                borderRadius: '50px',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'white',
                                border: '1px solid var(--glass-border)',
                                cursor: 'pointer'
                            }}
                        >
                            Create Account
                        </button>
                    </div>
                </div>

                {/* Right Content (Visual) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', position: 'relative' }}>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px 20px 20px 0', alignSelf: 'flex-start', maxWidth: '80%', transform: 'rotate(-2deg)' }}>
                        <p style={{ margin: 0 }}>Hey! Have you seen the new design?</p>
                    </div>
                    <div className="glass-panel" style={{
                        padding: '1.5rem',
                        borderRadius: '20px 20px 0 20px',
                        alignSelf: 'flex-end',
                        maxWidth: '80%',
                        background: 'var(--primary-gradient)',
                        transform: 'rotate(2deg)',
                        boxShadow: '0 10px 30px rgba(99, 102, 241, 0.3)'
                    }}>
                        <p style={{ margin: 0, color: 'white' }}>It looks absolutely stunning! 💜</p>
                    </div>
                    <div className="glass-panel" style={{ padding: '1.5rem', borderRadius: '20px 20px 20px 0', alignSelf: 'flex-start', maxWidth: '80%', transform: 'rotate(-1deg)' }}>
                        <p style={{ margin: 0 }}>Can't wait to try it out with everyone.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default App;
