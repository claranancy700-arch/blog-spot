import React, { useState } from 'react';

export default function NotificationSettings() {
  const [emailLikes, setEmailLikes] = useState(false);
  const [emailComments, setEmailComments] = useState(false);
  const [emailFollows, setEmailFollows] = useState(false);

  const handleSave = () => {
    // Save to backend
    alert('Settings saved!');
  };

  return (
    <div className="notification-settings-page">
      <h1>Notification Settings</h1>
      <div className="settings-group">
        <label>
          <input type="checkbox" checked={emailLikes} onChange={(e) => setEmailLikes(e.target.checked)} />
          Email notifications for likes
        </label>
        <label>
          <input type="checkbox" checked={emailComments} onChange={(e) => setEmailComments(e.target.checked)} />
          Email notifications for comments
        </label>
        <label>
          <input type="checkbox" checked={emailFollows} onChange={(e) => setEmailFollows(e.target.checked)} />
          Email notifications for follows
        </label>
      </div>
      <button onClick={handleSave}>Save Settings</button>
    </div>
  );
}