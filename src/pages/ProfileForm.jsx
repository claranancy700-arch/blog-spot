import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCSRFToken } from '../csrf';

const API_BASE = 'http://localhost:8000/api';

export default function ProfileForm({ user, setUser }) {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    setEmail(user.email || '');
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setBio(user.profile?.bio || '');
    setAvatarUrl(user.profile?.avatar || '');
  }, [user]);

  if (!user) {
    return <p>Please log in to edit your profile.</p>;
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const options = {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
      };

      if (avatarFile) {
        const formData = new FormData();
        formData.append('email', email);
        formData.append('first_name', firstName);
        formData.append('last_name', lastName);
        formData.append('bio', bio);
        formData.append('avatar', avatarFile);
        options.body = formData;
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify({ email, first_name: firstName, last_name: lastName, bio });
      }

      const res = await fetch(`${API_BASE}/user/`, options);
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Failed to update profile');
      }
      const data = await res.json();
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));

      setMessage('Profile successfully updated.');
      navigate('/profile');
    } catch (err) {
      setMessage(err.message || 'Unable to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-form-page">
      <div className="profile-form-container">
        <h1>Edit Profile</h1>
        {message && <div className="message-box">{message}</div>}
        <form onSubmit={handleSave} className="profile-form">
          <div className="form-section">
            <h3>Basic Information</h3>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={user.username} disabled />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>First Name</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>About You</h3>
            <div className="form-group">
              <label>Bio</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} placeholder="Tell us about yourself..." />
            </div>
          </div>

          <div className="form-section">
            <h3>Profile Picture</h3>
            <div className="form-group">
              <label>Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  setAvatarFile(file);
                  if (file) {
                    setAvatarUrl(URL.createObjectURL(file));
                  }
                }}
              />
              {avatarUrl && (
                <div className="avatar-preview">
                  <img src={avatarUrl} alt="avatar preview" />
                </div>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/profile')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
