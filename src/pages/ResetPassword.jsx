import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getCSRFToken } from '../csrf';
import { API_BASE } from '../config';

export default function ResetPassword() {
  const location = useLocation();
  const [uid, setUid] = useState('');
  const [token, setToken] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    setUid(params.get('uid') || '');
    setToken(params.get('token') || '');
  }, [location.search]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/password_reset_confirm/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ uid, token, new_password: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setMessage('Password has been reset. You may now log in.');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!uid || !token) {
    return <p>Invalid reset link.</p>;
  }

  return (
    <div className="reset-password-page">
      <h2>Reset Password</h2>
      {message && <p className="info">{message}</p>}
      <form onSubmit={handleSubmit} className="profile-form">
        <div className="form-group">
          <label>New Password</label>
          <input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? 'Saving...' : 'Reset Password'}
        </button>
      </form>
    </div>
  );
}