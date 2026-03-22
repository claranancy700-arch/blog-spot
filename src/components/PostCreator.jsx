import React, { useState, useRef, useCallback, useEffect } from 'react';
import { getCSRFToken } from '../csrf';

const API_BASE = 'http://localhost:8000/api';

export default function PostCreator({ onClose, onPostCreated = () => {}, user }) {
  const [step, setStep] = useState('media'); // 'media', 'details', 'publish'
  const [mediaFiles, setMediaFiles] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle file selection
  const handleFiles = useCallback((files) => {
    const validFiles = Array.from(files).filter(file => {
      const isValidType = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only images/videos under 50MB are allowed.');
    }

    setMediaFiles(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 files
    setError('');
  }, []);

  // Drag and drop handlers
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  // Remove media file
  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Submit post
  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      formData.append('published', 'true');
      formData.append('author', user.id);

      // Add tags
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      tagList.forEach(tag => formData.append('tags', tag));

      // Add media files
      mediaFiles.forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          formData.append('image', file);
        } else if (file.type.startsWith('video/')) {
          formData.append('video_file', file);
        }
      });

      const response = await fetch(`${API_BASE}/posts/`, {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCSRFToken(),
        },
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Failed to create post (${response.status})`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.non_field_errors) {
            errorMessage = errorData.non_field_errors[0];
          } else if (errorData.title) {
            errorMessage = `Title: ${errorData.title[0]}`;
          } else if (errorData.body) {
            errorMessage = `Body: ${errorData.body[0]}`;
          } else {
            errorMessage = JSON.stringify(errorData);
          }
        } catch (e) {
          // If response is not JSON, try to get text
          try {
            const text = await response.text();
            if (text) {
              errorMessage = `Server error: ${text.substring(0, 100)}`;
            }
          } catch (e2) {
            // Keep the default error message
          }
        }
        throw new Error(errorMessage);
      }

      onPostCreated();
      onClose();
      // Refresh the page to show the new post
      window.location.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 'media' && mediaFiles.length > 0) {
      setStep('details');
    } else if (step === 'details' && title.trim().length > 0) {
      setStep('publish');
    }
  };

  const prevStep = () => {
    if (step === 'details') setStep('media');
    if (step === 'publish') setStep('details');
  };

  return (
    <div className="post-creator-overlay" onClick={onClose}>
      <div className="post-creator-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="post-creator-header">
          <button className="close-btn" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div className="step-indicator">
            <div className={`step ${step === 'media' ? 'active' : ''}`}>1</div>
            <div className={`step ${step === 'details' ? 'active' : ''}`}>2</div>
            <div className={`step ${step === 'publish' ? 'active' : ''}`}>3</div>
          </div>
          {step !== 'media' && (
            <button
              className="next-btn"
              onClick={nextStep}
              disabled={
                (step === 'details' && title.trim().length === 0) ||
                (step === 'publish' && loading)
              }
            >
              {step === 'publish' ? (loading ? 'Sharing...' : 'Share') : 'Next'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="post-creator-content">
          {step === 'media' && (
            <div className="media-step">
              <div className="upload-area">
                <div
                  className={`drop-zone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="upload-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
                      <polyline points="14,2 14,8 20,8"></polyline>
                      <line x1="16" y1="13" x2="8" y2="13"></line>
                      <line x1="16" y1="17" x2="8" y2="17"></line>
                      <polyline points="10,9 9,9 8,9"></polyline>
                    </svg>
                  </div>
                  <h3>Drag photos and videos here</h3>
                  <p>or click to browse</p>
                  <div className="upload-options">
                    <button
                      className="upload-option-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                    >
                      📷 Photo
                    </button>
                    <button
                      className="upload-option-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        videoInputRef.current?.click();
                      }}
                    >
                      🎥 Video
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  style={{ display: 'none' }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFiles(e.target.files)}
                />
              </div>

              {/* Media Preview */}
              {mediaFiles.length > 0 && (
                <div className="media-preview">
                  <h4>Selected Media ({mediaFiles.length}/10)</h4>
                  <div className="media-grid">
                    {mediaFiles.map((file, index) => (
                      <div key={index} className="media-item">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="" />
                        ) : (
                          <video src={URL.createObjectURL(file)} />
                        )}
                        <button
                          className="remove-media"
                          onClick={() => removeMedia(index)}
                        >
                          ✕
                        </button>
                        <div className="media-type">
                          {file.type.startsWith('image/') ? '📷' : '🎥'}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    className="continue-btn"
                    onClick={nextStep}
                    disabled={mediaFiles.length === 0}
                  >
                    Continue
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'details' && (
            <div className="details-step">
              <div className="form-section">
                <label className="form-label">Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Write a title for your post..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                />
                <div className="char-count">{title.length}/100</div>
              </div>

              <div className="form-section">
                <label className="form-label">Description (optional)</label>
                <textarea
                  className="form-textarea"
                  placeholder="Tell your story..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={6}
                  maxLength={2000}
                />
                <div className="char-count">{body.length}/2000</div>
              </div>

              <div className="form-section">
                <label className="form-label">Tags (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="art, photography, travel..."
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <div className="tags-preview">
                  {tags.split(',').map((tag, index) =>
                    tag.trim() && (
                      <span key={index} className="tag-chip">
                        #{tag.trim()}
                      </span>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'publish' && (
            <div className="publish-step">
              <div className="post-preview">
                <div className="preview-header">
                  <div className="preview-avatar">👤</div>
                  <div className="preview-info">
                    <div className="preview-username">Your Post</div>
                    <div className="preview-time">now</div>
                  </div>
                </div>

                {mediaFiles.length > 0 && (
                  <div className="preview-media">
                    {mediaFiles.slice(0, 1).map((file, index) => (
                      <div key={index} className="preview-media-item">
                        {file.type.startsWith('image/') ? (
                          <img src={URL.createObjectURL(file)} alt="" />
                        ) : (
                          <video src={URL.createObjectURL(file)} controls />
                        )}
                      </div>
                    ))}
                    {mediaFiles.length > 1 && (
                      <div className="media-count">+{mediaFiles.length - 1} more</div>
                    )}
                  </div>
                )}

                <div className="preview-content">
                  <h3 className="preview-title">{title || 'Your title will appear here'}</h3>
                  {body && <p className="preview-body">{body}</p>}
                  {tags && (
                    <div className="preview-tags">
                      {tags.split(',').map((tag, index) =>
                        tag.trim() && (
                          <span key={index} className="preview-tag">
                            #{tag.trim()}
                          </span>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="publish-actions">
                <button className="back-btn" onClick={prevStep}>
                  Back
                </button>
                <button
                  className="share-btn"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Sharing...' : 'Share Post'}
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>
    </div>
  );
}