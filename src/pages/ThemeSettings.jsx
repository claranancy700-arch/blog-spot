import React, { useState } from 'react';

export default function ThemeSettings({ theme, setTheme }) {
  return (
    <div className="theme-settings-page">
      <h1>Theme Settings</h1>
      <div className="settings-group">
        <button onClick={() => setTheme('dark')}>Dark Theme</button>
        <button onClick={() => setTheme('light')}>Light Theme</button>
      </div>
    </div>
  );
}