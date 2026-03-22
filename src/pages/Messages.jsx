import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getCSRFToken } from '../csrf';

const API_BASE = 'http://localhost:8000/api';

export default function Messages() {
  const { username: routeUsername } = useParams();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [counts, setCounts] = useState({ unread_total: 0, inbox_total: 0, sent_total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadConversations = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load conversations');
      const data = await res.json();
      setConversations(data);
      // no default selection: chat opens only after explicit click
    } catch (err) {
      setError(err.message);
    }
  };

  const loadCounts = async () => {
    try {
      const res = await fetch(`${API_BASE}/messages/counts/`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load message counts');
      const data = await res.json();
      setCounts(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadMessages = async (username) => {
    if (!username) return;
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/messages/${username}/`, {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to load messages');
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    loadCounts();
  }, []);

  const isChatPage = Boolean(routeUsername);

  useEffect(() => {
    if (routeUsername) {
      setSelectedUser(routeUsername);
    }
  }, [routeUsername]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser);
      if (!isChatPage) {
        navigate(`/messages/${selectedUser}`, { replace: true });
      }
    }
  }, [selectedUser, isChatPage]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!selectedUser || !newMessage.trim()) return;

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/messages/${selectedUser}/`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCSRFToken(),
        },
        body: JSON.stringify({ body: newMessage }),
      });

      if (!res.ok) {
        const errResp = await res.json().catch(() => null);
        throw new Error((errResp && errResp.error) || 'Unable to send message');
      }

      const saved = await res.json();
      setMessages((prev) => [...prev, saved]);
      setNewMessage('');
      await loadConversations();
      await loadCounts();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isChatPage && selectedUser) {
    return (
      <div className="messages-page">
        <div className="messages-container full-page-chat">
          <div className="messages-header">
            <button className="back-btn" onClick={() => { setSelectedUser(null); navigate('/messages'); }}>
              ← Back
            </button>
            <h1>Chat with {selectedUser}</h1>
          </div>
          {error && <div className="alert error">{error}</div>}

          <div className="message-list full-page-message-list">
            {loading ? (
              <p>Loading...</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`message-item ${msg.sender_username === selectedUser ? 'incoming' : 'outgoing'}`}
                >
                  <div className="message-text">{msg.body}</div>
                  <div className="message-meta">{msg.sender_username} · {new Date(msg.created).toLocaleString()}</div>
                </div>
              ))
            )}
          </div>

          <div className="sticky-input-bar">
            <form className="send-form" onSubmit={handleSend}>
              <input
                type="text"
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={loading}
              />
              <button type="submit" disabled={loading || !newMessage.trim()}>
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-page">
      <div className="messages-container">
        <div className="messages-header">
          <h1>Messages</h1>
          <div className="message-counts">
            <span>Inbox: {counts.inbox_total}</span>
            <span>Unread: {counts.unread_total}</span>
            <span>Sent: {counts.sent_total}</span>
          </div>
        </div>
        {error && <div className="alert error">{error}</div>}
        <div className="messages-layout">
          <aside className="conversations-panel">
            <h2>Conversations</h2>
            {conversations.length === 0 ? (
              <p>No conversations yet. Start by messaging someone from their profile page.</p>
            ) : (
              <ul>
                {conversations.map((conv) => (
                  <li
                    key={conv.id}
                    className={conv.username === selectedUser ? 'active' : ''}
                    onClick={() => {
                      if (selectedUser === conv.username) {
                        setSelectedUser(null);
                        setMessages([]);
                        navigate('/messages');
                      } else {
                        setSelectedUser(conv.username);
                        navigate(`/messages/${conv.username}`);
                      }
                    }}
                  >
                    <div className="conv-name">
                      {conv.username}
                      {conv.unread_count > 0 && (
                        <span className="unread-badge">{conv.unread_count}</span>
                      )}
                    </div>
                    <div className="conv-preview">{conv.last_message}</div>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          {selectedUser && (
            <section className="chat-panel">
              <h2>Chat with {selectedUser}</h2>
              <div className="message-list">
                {loading ? (
                  <p>Loading...</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`message-item ${msg.sender_username === selectedUser ? 'incoming' : 'outgoing'}`}
                    >
                      <div className="message-text">{msg.body}</div>
                      <div className="message-meta">{msg.sender_username} · {new Date(msg.created).toLocaleString()}</div>
                    </div>
                  ))
                )}
              </div>

              <form className="send-form" onSubmit={handleSend}>
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={loading}
                />
                <button type="submit" disabled={loading || !newMessage.trim()}>
                  Send
                </button>
              </form>
            </section>
          )}

          {!selectedUser && selectedUser !== null && (
            <section className="chat-panel">
              <p>Select a conversation to start.</p>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
