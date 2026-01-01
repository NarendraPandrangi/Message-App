import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (password !== confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            // Create user
            const res = await createUserWithEmailAndPassword(auth, email, password);

            // Update Auth Profile
            await updateProfile(res.user, {
                displayName: email.split('@')[0],
                photoURL: "https://ui-avatars.com/api/?name=" + email
            });

            // Create user document in Firestore
            await setDoc(doc(db, "users", res.user.uid), {
                uid: res.user.uid,
                email,
                displayName: email.split('@')[0],
                photoURL: "https://ui-avatars.com/api/?name=" + email,
            });

            // Create empty user chats on firestore
            await setDoc(doc(db, "userChats", res.user.uid), {});

            setSuccess("Registration successful! Redirecting to login...");

            setTimeout(() => {
                navigate("/login");
            }, 2000);

        } catch (err) {
            console.error(err);
            if (err.message.includes("Missing or insufficient permissions")) {
                setError("Firestore Permission Error: Please update your Database Rules in Firebase Console to allow writes.");
            } else {
                setError(err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card glass-panel">
                <h2 className="gradient-text">Create Account</h2>
                <p className="auth-subtitle">Join ChatVerse today</p>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="error-message" style={{ color: '#ff4b4b', background: 'rgba(255, 75, 75, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="success-message" style={{ color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '10px', borderRadius: '8px', marginBottom: '10px', fontSize: '0.9rem' }}>
                            {success}
                        </div>
                    )}
                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value.toLowerCase())}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input
                            type="password"
                            placeholder="Confirm your password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? "Signing up..." : "Sign Up"}
                    </button>
                </form>
                <p className="auth-footer">
                    Already have an account? <Link to="/login" className="gradient-text">Login</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
