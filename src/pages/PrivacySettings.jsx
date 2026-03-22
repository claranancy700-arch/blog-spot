import React, { useState, useEffect } from 'react';
import { getCSRFToken } from '../csrf';

const API_BASE = 'http://localhost:8000/api';

export default function PrivacySettings({ user, setUser }) {
  const [profilePublic, setProfilePublic] = useState(true);
  const [showFollowers, setShowFollowers] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Load current settings if available
    // For now, assume defaults
  }, []);

  const handleSave = async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`${API_BASE}/user/privacy/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({
          profile_public: profilePublic,
          show_followers: showFollowers,
          allow_comments: allowComments,
        }),
      });
      if (response.ok) {
        setMessage('Privacy settings updated successfully.');
      } else {
        setMessage('Failed to update settings.');
      }
    } catch (error) {
      setMessage('Error updating settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="privacy-settings-page">
      <h1>Privacy Settings</h1>
      {message && <p className="message">{message}</p>}
      <div className="settings-group">
        <label>
          <input
            type="checkbox"
            checked={profilePublic}
            onChange={(e) => setProfilePublic(e.target.checked)}
          />
          Make profile public
        </label>
        <label>
          <input
            type="checkbox"
            checked={showFollowers}
            onChange={(e) => setShowFollowers(e.target.checked)}
          />
          Show followers and following
        </label>
        <label>
          <input
            type="checkbox"
            checked={allowComments}
            onChange={(e) => setAllowComments(e.target.checked)}
          />
          Allow comments on my posts
        </label>
      </div>
      <button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </button>
    </div>
  );
}