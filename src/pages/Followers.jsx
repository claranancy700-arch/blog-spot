import React, { useState, useEffect } from 'react';

export default function Followers({ user }) {
  const [followers, setFollowers] = useState([]);

  useEffect(() => {
    // Fetch followers
    setFollowers([{username: 'user1'}, {username: 'user2'}]); // Mock
  }, []);

  return (
    <div className="followers-page">
      <h1>My Followers</h1>
      <ul>
        {followers.map((f, i) => (
          <li key={i}>{f.username}</li>
        ))}
      </ul>
    </div>
  );
}