import React, { useState } from 'react';

export default function LanguageSettings() {
  const [language, setLanguage] = useState('en');

  return (
    <div className="language-settings-page">
      <h1>Language Settings</h1>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="en">English</option>
        <option value="es">Spanish</option>
      </select>
    </div>
  );
}