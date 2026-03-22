import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import ProfileForm from './pages/ProfileForm';
import ProfileMenu from './pages/ProfileMenu';
import UserPage from './pages/UserPage';
import PostDetail from './pages/PostDetail';
import ChangePassword from './pages/ChangePassword';
import PrivacySettings from './pages/PrivacySettings';
import NotificationSettings from './pages/NotificationSettings';
import AccountSettings from './pages/AccountSettings';
import Followers from './pages/Followers';
import Following from './pages/Following';
import BlockedUsers from './pages/BlockedUsers';
import ThemeSettings from './pages/ThemeSettings';
import Help from './pages/Help';
import About from './pages/About';
import Terms from './pages/Terms';
import LanguageSettings from './pages/LanguageSettings';
import ActivityLog from './pages/ActivityLog';
import Search from './pages/Search';
import Messages from './pages/Messages';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ConfirmEmail from './pages/ConfirmEmail';
import Reels from './pages/Reels';
import PostForm from './components/PostForm';
import PostCreator from './components/PostCreator';
import LoadingScreen from './components/LoadingScreen';
import Placeholder from './components/Placeholder';
import { getCSRFToken } from './csrf';
import { API_BASE } from './config';
import './index.css';

function AppContent() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [showPostModal, setShowPostModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // grab any saved login state
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    if (savedUser && savedToken) {
      const u = JSON.parse(savedUser);
      console.log('Loaded user from localStorage:', u);
      setUser(u);
      setToken(savedToken);
      // refresh user info from server in case it changed
      // fetch(`${API_BASE}/user/`, { credentials: 'include' })
      //   .then(r => r.ok ? r.json() : null)
      //   .then(data => {
      //     if (data) {
      //       console.log('Refreshed user data:', data);
      //       setUser(data);
      //       localStorage.setItem('user', JSON.stringify(data));
      //     }
      //   })
      //   .catch(() => {});
    }
    // request csrf cookie from backend so subsequent POSTs can send token
    fetch(`${API_BASE}/csrf/`, { credentials: 'include' }).catch(() => {});
  }, []);

  // apply theme class to root element
  useEffect(() => {
    const isLight = theme === 'light';
    document.documentElement.classList.toggle('light-theme', isLight);
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  const handleLogin = (userData, authToken) => {
    console.log('Login successful, user data:', userData);
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    navigate('/');
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand"><img src="/Blog-brand.svg" alt="Blog Spot" style={{height: '50px'}} /></Link>
          
          {location.pathname === '/profile' && (
            <button
              className="hamburger-btn"
              onClick={() => navigate('/profile/menu')}
              aria-label="Open profile menu"
            >
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </button>
          )}
          
          <div className="nav-links">            <Link to="/" className="nav-feed">Feed</Link>
            {location.pathname === "/" && token && (
              <button className="nav-search" onClick={() => navigate('/search')}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            )}
            {user ? (
              <>
                <Link to="/profile" className="nav-profile">Profile</Link>
              </>
            ) : (
              <> 
                <Link to="/login">Login</Link>
                <Link to="/signup">Sign Up</Link>
              </>
            )}
            <button
              className="nav-theme-toggle"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

          </div>
        </div>
      </nav>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home token={token} user={user} />} />
          <Route path="/reels" element={<Reels token={token} user={user} />} />
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={user ? <Admin token={token} user={user} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile" element={user ? <Profile user={user} setUser={setUser} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/edit" element={user ? <ProfileForm user={user} setUser={setUser} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/menu" element={user ? <ProfileMenu user={user} setUser={setUser} setToken={setToken} /> : <Login onLogin={handleLogin} />} />
          <Route path="/user/:username" element={<UserPage currentUser={user} />} />
          <Route path="/post/:id" element={<PostDetail currentUser={user} />} />
          <Route path="/change-password" element={user ? <ChangePassword /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/privacy" element={user ? <PrivacySettings user={user} setUser={setUser} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/notifications" element={user ? <NotificationSettings /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/account" element={user ? <AccountSettings user={user} setUser={setUser} setToken={setToken} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/followers" element={user ? <Followers user={user} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/following" element={user ? <Following user={user} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/blocked" element={user ? <BlockedUsers user={user} /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/theme" element={user ? <ThemeSettings theme={theme} setTheme={setTheme} /> : <Login onLogin={handleLogin} />} />
          <Route path="/help" element={<Help />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/profile/language" element={user ? <LanguageSettings /> : <Login onLogin={handleLogin} />} />
          <Route path="/profile/activity" element={user ? <ActivityLog user={user} /> : <Login onLogin={handleLogin} />} />
          <Route path="/search" element={<Search />} />
          <Route path="/messages" element={user ? <Messages /> : <Login onLogin={handleLogin} />} />
          <Route path="/messages/:username" element={user ? <Messages /> : <Login onLogin={handleLogin} />} />
        </Routes>
      </main>

      {/* Post Creation Modal */}
      {showPostModal && (
        <PostCreator
          onClose={() => setShowPostModal(false)}
          token={token}
          user={user}
        />
      )}

      {/* Bottom Navigation for Mobile */}
      {!(location.pathname.startsWith('/messages/') && location.pathname !== '/messages') && (
        <nav className="bottom-nav">
        <Link to="/" className="bottom-nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            {/* Artistic roof with soft curve */}
            <path d="M3 9.8 L12 2.5 L21 9.8" />
            {/* House body with perspective */}
            <path d="M5 10 L5 19.5 C5 20.88 6.12 22 7.5 22 L16.5 22 C17.88 22 19 20.88 19 19.5 L19 10" />
            {/* Modern door */}
            <rect x="9.5" y="15" width="3" height="5" rx="0.6" fill="none" />
            {/* Artistic window with glow feel */}
            <rect x="13.5" y="12.5" width="3.2" height="3" rx="0.5" fill="none" />
          </svg>
          <span>Home</span>
        </Link>
        <Link to="/reels" className="bottom-nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            {/* Modern video frame with rounded corners */}
            <rect x="3.5" y="4.5" width="17" height="15" rx="3.5" fill="none" />
            {/* Play triangle - bold & centered */}
            <polygon points="10.5,8.5 17.5,12 10.5,15.5" fill="currentColor" stroke="none" />
            {/* Artistic film perforations (left side) */}
            <rect x="4.8" y="7" width="1.1" height="2" rx="0.3" fill="currentColor" />
            <rect x="4.8" y="10.8" width="1.1" height="2" rx="0.3" fill="currentColor" />
            <rect x="4.8" y="14.6" width="1.1" height="2" rx="0.3" fill="currentColor" />
          </svg>
          <span>Reel</span>
        </Link>
        <Link to="/messages" className="bottom-nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            {/* Artistic chat bubble with elegant tail */}
            <path d="M4.5 5.5 C4.5 3.6 6.1 2 8.1 2 L18.9 2 C20.9 2 22.5 3.6 22.5 5.5 L22.5 14.5 C22.5 16.4 20.9 18 18.9 18 L8.1 18 L3.5 22 L4.5 18 L4.5 5.5 Z" />
            {/* Modern message lines inside (different lengths for artistic feel) */}
            <path d="M8.5 9 L15.5 9" strokeWidth="1.6" />
            <path d="M8.5 12 L13.5 12" strokeWidth="1.6" />
          </svg>
          <span>Message</span>
        </Link>
        <Link to="/profile" className="bottom-nav-item">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
            {/* Artistic head (slightly oval + premium proportion) */}
            <ellipse cx="12" cy="7.8" rx="4.1" ry="4.6" />
            {/* Elegant shoulders & body with soft curve */}
            <path d="M5.8 18.5 C5.8 15.8 8.1 13.5 12 13.5 C15.9 13.5 18.2 15.8 18.2 18.5 L18.2 21 L5.8 21 Z" />
          </svg>
          <span>Profile</span>
        </Link>
      </nav>
      )}

      {/* Floating New Post */}
      {user && (location.pathname === "/" || location.pathname === "/profile") && (
        <button
          className="floating-new-post"
          onClick={() => setShowPostModal(true)}
          title="Create new post"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="m18.5 2.5 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}