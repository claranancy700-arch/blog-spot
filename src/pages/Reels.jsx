import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import './Reels.css';
import { API_BASE } from '../config';

export default function Reels({ token, user }) {
  const [virtualReels, setVirtualReels] = useState([]);
  const [virtualStartIndex, setVirtualStartIndex] = useState(0);

  // Add missing state declarations
  const [reels, setReels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentReelIndex, setCurrentReelIndex] = useState(() => {
    const saved = localStorage.getItem('currentReelIndex');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [pausedVideos, setPausedVideos] = useState(new Set());
  const [isMuted, setIsMuted] = useState(true);
  const videoRefs = useRef([]);

  // Persist current reel index
  useEffect(() => {
    if (reels.length > 0) {
      const realIndex = currentReelIndex % reels.length;
      localStorage.setItem('currentReelIndex', realIndex.toString());
    }
  }, [currentReelIndex, reels.length]);

  // Create virtual reels for infinite scroll
  useEffect(() => {
    if (reels.length > 0) {
      // Create a larger array with repeated content for infinite scroll
      const repeatedReels = [];
      for (let i = 0; i < 10; i++) { // Repeat 10 times for smooth infinite scroll
        reels.forEach(reel => repeatedReels.push({ ...reel, virtualIndex: repeatedReels.length }));
      }
      setVirtualReels(repeatedReels);
      setVirtualStartIndex(reels.length * 3); // Start in the middle
      setCurrentReelIndex(reels.length * 3 + currentReelIndex); // Start at middle + saved position
    }
  }, [reels]);
  const containerRef = useRef(null);

  // Fetch reels from API
  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/posts/?has_video=true`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const reelPosts = data.results || data;
        console.log('Fetched reels:', reelPosts); // Debug log
        setReels(reelPosts.filter(post => post.video_file || post.video_url));
      }
    } catch (error) {
      console.error('Error fetching reels:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load videos dynamically for better performance
  useEffect(() => {
    const loadAdjacentVideos = () => {
      const indicesToLoad = [currentReelIndex - 1, currentReelIndex, currentReelIndex + 1];
      indicesToLoad.forEach(index => {
        if (index >= 0 && index < virtualReels.length) {
          const video = videoRefs.current[index];
          if (video && !video.src) {
            const reel = virtualReels[index];
            const videoSrc = reel.video || reel.video_url;
            video.src = videoSrc;
            video.load();
          }
        }
      });
    };

    if (virtualReels.length > 0) {
      loadAdjacentVideos();
    }
  }, [currentReelIndex, virtualReels]);
  useEffect(() => {
    // Pause all videos first
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentReelIndex) {
        video.pause();
        video.currentTime = 0; // Reset to beginning
      }
    });

    // Play only the current video if it's not manually paused
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo && currentVideo.readyState >= 2) {
      currentVideo.muted = isMuted;
      const isManuallyPaused = pausedVideos.has(currentReelIndex);
      if (!isManuallyPaused) {
        currentVideo.play().catch((error) => {
          console.error('Video play failed:', error);
        });
      }
    }
  }, [currentReelIndex, isMuted, pausedVideos]);

  // Set initial scroll position when virtual reels are ready
  useEffect(() => {
    if (containerRef.current && virtualReels.length > 0 && currentReelIndex >= reels.length * 3) {
      const initialScrollTop = currentReelIndex * containerRef.current.clientHeight;
      containerRef.current.scrollTop = initialScrollTop;
    }
  }, [virtualReels.length, currentReelIndex, reels.length]);

  // Handle scroll to change current reel
  const handleScroll = useCallback((e) => {
    if (!containerRef.current || virtualReels.length === 0) return;

    const container = containerRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const newIndex = Math.round(scrollTop / containerHeight);

    // Handle infinite loop by resetting position when reaching boundaries
    if (newIndex < reels.length * 2) {
      // Near the beginning, jump to middle
      const middleIndex = reels.length * 5;
      container.scrollTop = middleIndex * containerHeight;
      setCurrentReelIndex(middleIndex);
      return;
    } else if (newIndex >= reels.length * 8) {
      // Near the end, jump to middle
      const middleIndex = reels.length * 5;
      container.scrollTop = middleIndex * containerHeight;
      setCurrentReelIndex(middleIndex);
      return;
    }

    if (newIndex !== currentReelIndex && newIndex >= 0 && newIndex < virtualReels.length) {
      setCurrentReelIndex(newIndex);
    }
  }, [currentReelIndex, virtualReels.length, reels.length]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  // Handle video end - auto advance to next reel
  const handleVideoEnd = () => {
    const nextIndex = currentReelIndex + 1;
    setCurrentReelIndex(nextIndex);
    // Smooth scroll to next reel
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: nextIndex * containerRef.current.clientHeight,
        behavior: 'smooth'
      });
    }
  };

  // Handle user interactions
  const togglePlayPause = () => {
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      setPausedVideos(prev => {
        const newSet = new Set(prev);
        if (newSet.has(currentReelIndex)) {
          // Currently paused, remove from paused set and play
          newSet.delete(currentReelIndex);
          currentVideo.play().catch((error) => {
            console.error('Video play failed:', error);
          });
        } else {
          // Currently playing, add to paused set and pause
          newSet.add(currentReelIndex);
          currentVideo.pause();
        }
        return newSet;
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Apply to current video
    const currentVideo = videoRefs.current[currentReelIndex];
    if (currentVideo) {
      currentVideo.muted = !isMuted;
    }
  };

  const goToNextReel = () => {
    let nextIndex = currentReelIndex + 1;
    if (nextIndex >= virtualReels.length) {
      nextIndex = 0;
    }
    setCurrentReelIndex(nextIndex);
    containerRef.current?.scrollTo({
      top: nextIndex * containerRef.current.clientHeight,
      behavior: 'smooth'
    });
  };

  const goToPrevReel = () => {
    let prevIndex = currentReelIndex - 1;
    if (prevIndex < 0) {
      prevIndex = virtualReels.length - 1;
    }
    setCurrentReelIndex(prevIndex);
    containerRef.current?.scrollTo({
      top: prevIndex * containerRef.current.clientHeight,
      behavior: 'smooth'
    });
  };

  if (loading) {
    return (
      <div className="reels-loading">
        <div className="loading-spinner"></div>
        <p>Loading reels...</p>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="reels-empty">
        <div className="empty-icon">🎬</div>
        <h3>No reels yet</h3>
        <p>Be the first to share a video!</p>
        {token && (
          <Link to="/" className="create-reel-btn">Create your first reel</Link>
        )}
      </div>
    );
  }

  return (
    <div className="reels-container">
      {/* Header */}
      <div className="reels-header">
        <h1 className="reels-title">Reels</h1>
        <Link to="/" className="reels-close">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </Link>
      </div>

      {/* Reels Feed */}
      <div className="reels-feed" ref={containerRef}>
        {virtualReels.map((reel, index) => {
          const videoSrc = reel.video || reel.video_url;
          console.log('Video source for reel', index, ':', videoSrc); // Debug log
          
          return (
            <div key={`${reel.id}-${index}`} className="reel-item">
              <video
                ref={el => videoRefs.current[index] = el}
                src={index === currentReelIndex || index === currentReelIndex - 1 || index === currentReelIndex + 1 ? videoSrc : undefined}
                className="reel-video"
                loop
                muted={isMuted}
                playsInline
                preload={index === currentReelIndex ? "metadata" : "none"}
                onEnded={handleVideoEnd}
                onClick={togglePlayPause}
                onError={(e) => console.error('Video error:', e)}
                onLoadStart={() => console.log('Video load start:', videoSrc)}
                onLoadedData={() => {
                  console.log('Video loaded data:', videoSrc);
                  // Auto-play if this is the current reel
                  if (index === currentReelIndex && !pausedVideos.has(index)) {
                    const video = videoRefs.current[index];
                    if (video) {
                      video.muted = isMuted; // Ensure muted state is applied
                      video.play().catch((error) => {
                        console.error('Auto-play failed:', error);
                      });
                    }
                  }
                }}
                onCanPlay={() => console.log('Video can play:', videoSrc)}
              />

              {/* Video Controls Overlay */}
              <div className="reel-overlay">
              {/* Play/Pause Indicator */}
              {pausedVideos.has(index) && index === currentReelIndex && (
                <div className="play-indicator">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </div>
              )}

              {/* Side Actions */}
              <div className="reel-actions">
                <button className="action-btn" onClick={() => {/* Like functionality */}}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{reel.likes_count || 0}</span>
                </button>

                <button className="action-btn" onClick={() => {/* Comment functionality */}}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span>{reel.comments_count || 0}</span>
                </button>

                <button className="action-btn" onClick={() => {/* Share functionality */}}>
                  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                    <circle cx="18" cy="5" r="3"/>
                    <circle cx="6" cy="12" r="3"/>
                    <circle cx="18" cy="19" r="3"/>
                    <path d="M8.59 13.51l6.83 3.98"/>
                    <path d="M15.41 6.51l-6.82 3.98"/>
                  </svg>
                </button>

                <button className="action-btn" onClick={toggleMute}>
                  {isMuted ? (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <line x1="23" y1="9" x2="17" y2="15"/>
                      <line x1="17" y1="9" x2="23" y2="15"/>
                    </svg>
                  ) : (
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
                    </svg>
                  )}
                </button>
              </div>

              {/* Reel Info */}
              <div className="reel-info">
                <Link to={`/user/${reel.author_username}`} className="reel-author">
                  <img
                    src={reel.author_profile?.avatar_url || '/default-avatar.png'}
                    alt={reel.author_username}
                    className="reel-avatar"
                  />
                  <span className="reel-username">{reel.author_username}</span>
                </Link>

                <p className="reel-caption">{reel.body}</p>

                {/* Tags */}
                {reel.tags_display && reel.tags_display.length > 0 && (
                  <div className="reel-tags">
                    {reel.tags_display.slice(0, 3).map(tag => (
                      <Link key={tag} to={`/?tag=${tag}`} className="reel-tag">
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Arrows */}
            {index === currentReelIndex && (
              <>
                <button className="reel-nav prev" onClick={goToPrevReel}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M15 18l-6-6 6-6"/>
                  </svg>
                </button>
                <button className="reel-nav next" onClick={goToNextReel}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              </>
            )}
          </div>
        )})}
      </div>
    </div>
  );
}