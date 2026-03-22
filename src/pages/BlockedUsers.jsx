import React, { useState, useEffect } from 'react';

export default function BlockedUsers({ user }) {
  const [blocked, setBlocked] = useState([]);

  useEffect(() => {
    // Fetch blocked
    setBlocked([{username: 'blocked1'}]); // Mock
  }, []);

  return (
    <div className="blocked-users-page">
      <h1>Blocked Users</h1>
      <ul>
        {blocked.map((b, i) => (
          <li key={i}>{b.username} <button>Unblock</button></li>
        ))}
      </ul>
    </div>
  );
}