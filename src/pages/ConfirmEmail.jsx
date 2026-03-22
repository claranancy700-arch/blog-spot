import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { API_BASE } from '../config';

export default function ConfirmEmail() {
  const { uid, token } = useParams();
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const doConfirm = async () => {
      try {
        const res = await fetch(`${API_BASE}/confirm_email/${uid}/${token}/`);
        const data = await res.json();
        if (res.ok) {
          setStatus('success');
          setMessage(data.detail || 'Email confirmed');
        } else {
          setStatus('error');
          setMessage(data.error || 'Unable to confirm');
        }
      } catch (e) {
        setStatus('error');
        setMessage(e.message);
      }
    };
    doConfirm();
  }, [uid, token]);

  if (status === 'pending') return <p>Verifying…</p>;
  return <p>{message}</p>;
}