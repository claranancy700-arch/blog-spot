import React, { useEffect, useRef } from 'react';
import './LoadingScreen.css';

const LoadingScreen = ({ onComplete }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-play animation on mount
    const timer = setTimeout(() => {
      const dot = containerRef.current?.querySelector('.dot');
      if (dot) {
        dot.style.opacity = '1';
      }
    }, 120);

    // Complete loading after animation finishes (about 1.5 seconds)
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const replayAnimation = () => {
    const bl = containerRef.current?.querySelector('.name1');
    const ogspot = containerRef.current?.querySelector('.ogspot');
    const dot = containerRef.current?.querySelector('.dot');

    if (bl && ogspot && dot) {
      // Reset all
      bl.style.animation = 'none';
      ogspot.style.animation = 'none';
      dot.style.animation = 'none';

      // Force reflow
      void bl.offsetWidth;
      void ogspot.offsetWidth;
      void dot.offsetWidth;

      // Re-trigger with exact same timing (dot → og Spot → Bl)
      dot.style.animation = 'logoPop 950ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards';
      ogspot.style.animation = 'logoPop 950ms cubic-bezier(0.34, 1.56, 0.64, 1) 280ms forwards';
      bl.style.animation = 'logoPop 950ms cubic-bezier(0.34, 1.56, 0.64, 1) 520ms forwards';
    }
  };

  return (
    <div className="loading-screen">
      <div className="logo-container" ref={containerRef}>
        <svg xmlns="http://www.w3.org/2000/svg" width="620" height="220" viewBox="0 0 560 200" role="img" aria-label="Blog Spot logo">
          <title>Blog Spot brand</title>

          <defs>
            <filter id="softShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="8" stdDeviation="14" flood-color="#000" flood-opacity="0.35"/>
            </filter>
          </defs>

          {/* Logo group */}
          <g id="logo-group" filter="url(#softShadow)" transform="translate(170,36)">

            {/* "Bl" (bold) - appears last in the unfold */}
            <text className="name1" x="0" y="70">
              Bl
            </text>

            {/* "og Spot." split into two tspans so the dot can animate FIRST */}
            <text className="name" x="60" y="70">
              {/* "og Spot" part (appears second) */}
              <tspan className="ogspot">og Spot</tspan>
              {/* "." dot part (appears FIRST - the starting point!) */}
              <tspan className="dot">.</tspan>
            </text>

          </g>
        </svg>
      </div>
    </div>
  );
};

export default LoadingScreen;