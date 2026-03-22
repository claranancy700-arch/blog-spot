import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getCSRFToken } from '../csrf';
import { API_BASE } from '../config';

export default function ProfileMenu({ user, setUser, setToken }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/logout/`, {
        method: 'POST',
        credentials: 'include',
        headers: {'X-CSRFToken': getCSRFToken()},
      });
    } catch (e) {}
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
    navigate('/');
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="profile-menu-page">
      <div className="profile-menu-container">
        <h1>Profile Menu</h1>
        <ul className="menu-options">
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/edit')}
          >
            Edit Profile
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/change-password')}
          >
            Change Password
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/privacy')}
          >
            Privacy Settings
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/notifications')}
          >
            Notification Settings
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/account')}
          >
            Account Settings
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/followers')}
          >
            My Followers
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/following')}
          >
            My Following
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/blocked')}
          >
            Blocked Users
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/theme')}
          >
            Theme Settings
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/help')}
          >
            Help & Support
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/about')}
          >
            About
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/terms')}
          >
            Terms of Service
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/language')}
          >
            Language Settings
          </li>
          <li
            className="menu-option-item"
            onClick={() => navigate('/profile/activity')}
          >
            Activity Log
          </li>
          <li
            className="menu-option-item logout-item"
            onClick={handleLogout}
          >
            Logout
          </li>
        </ul>
      </div>
    </div>
  );
}