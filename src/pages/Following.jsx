import React, { useState, useEffect } from 'react';

export default function Following({ user }) {
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    // Fetch following
    setFollowing([{username: 'user3'}, {username: 'user4'}]); // Mock
  }, []);

  return (
    <div className="following-page">
      <h1>My Following</h1>
      <ul>
        {following.map((f, i) => (
          <li key={i}>{f.username}</li>
        ))}
      </ul>
    </div>
  );
}