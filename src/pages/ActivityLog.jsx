import React, { useState, useEffect } from 'react';

export default function ActivityLog({ user }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    // Fetch activities
    setActivities(['Posted a new blog', 'Liked a post', 'Commented']); // Mock
  }, []);

  return (
    <div className="activity-log-page">
      <h1>Activity Log</h1>
      <ul>
        {activities.map((a, i) => (
          <li key={i}>{a}</li>
        ))}
      </ul>
    </div>
  );
}