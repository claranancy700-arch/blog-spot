import React, { useState } from 'react';

export default function AccountSettings({ user, setUser, setToken }) {
  const [confirmDelete, setConfirmDelete] = useState('');

  const handleDeleteAccount = () => {
    if (confirmDelete === 'DELETE') {
      // Delete account
      alert('Account deleted!');
      setUser(null);
      setToken(null);
    } else {
      alert('Type DELETE to confirm');
    }
  };

  return (
    <div className="account-settings-page">
      <h1>Account Settings</h1>
      <div className="settings-group">
        <p>Export your data: <button>Download Data</button></p>
        <p>Deactivate account: <button>Deactivate</button></p>
        <p>Delete account:</p>
        <input
          type="text"
          placeholder="Type DELETE to confirm"
          value={confirmDelete}
          onChange={(e) => setConfirmDelete(e.target.value)}
        />
        <button onClick={handleDeleteAccount} style={{background: 'red'}}>Delete Account</button>
      </div>
    </div>
  );
}