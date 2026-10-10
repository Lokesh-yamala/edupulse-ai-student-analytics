
import React, { useState } from 'react';
import { GraduationCap, Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import './login.css';

export default function Login({ onLogin }) {
  const [role, setRole] = useState('student');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!name.trim() || !password) {
      setError('Please enter your name and password.');
      return;
    }

    const expectedPassword =
      role === 'faculty' ? 'faculty@123' : 'student@123';

    if (password !== expectedPassword) {
      setError('Incorrect password. Please try again.');
      return;
    }

    onLogin({
      name: name.trim(),
      role,
    });
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand-icon">
          <GraduationCap size={34} />
        </div>

        <h1>EduPulse AI</h1>
        <p className="login-subtitle">Academic Intelligence Platform</p>

        <div className="role-switch">
          <button
            type="button"
            className={role === 'student' ? 'role-active' : ''}
            onClick={() => {
              setRole('student');
              setError('');
            }}
          >
            Student
          </button>
          <button
            type="button"
            className={role === 'faculty' ? 'role-active' : ''}
            onClick={() => {
              setRole('faculty');
              setError('');
            }}
          >
            Faculty
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <label htmlFor="login-name">Name</label>
          <div className="login-input-wrap">
            <UserRound size={18} />
            <input
              id="login-name"
              type="text"
              placeholder="Enter your name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="username"
            />
          </div>

          <label htmlFor="login-password">Password</label>
          <div className="login-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <button type="submit" className="login-submit">
            Sign in as {role === 'faculty' ? 'Faculty' : 'Student'}
          </button>
        </form>
      </section>
    </main>
  );
}
