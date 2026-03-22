import React, { useState } from 'react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = () => {
    // Mock search
    setResults(['User1', 'Post about React', 'Blog on AI']);
  };

  return (
    <div className="search-page">
      <div className="search-container">
        <input
          type="text"
          placeholder="Search users, posts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        <button onClick={handleSearch} className="search-btn">Search</button>
        <div className="search-results">
          {results.map((r, i) => (
            <div key={i} className="result-item">{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
}