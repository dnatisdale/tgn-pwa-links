// src/hooks/useAuth.ts
import { useState, useEffect } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase'; // or '../firebase' if that's your actual file

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('tgn.guest') === '1') {
      setIsGuest(true);
    }

    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        setIsGuest(false);
        localStorage.removeItem('tgn.guest');
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const handleGuest = () => {
      setIsGuest(true);
      localStorage.setItem('tgn.guest', '1');
    };
    const handleLogout = () => {
      setIsGuest(false);
      localStorage.removeItem('tgn.guest');
    };
    const handleLogin = () => {
      setIsGuest(false);
      localStorage.removeItem('tgn.guest');
    };

    window.addEventListener('guest:continue', handleGuest);
    window.addEventListener('auth:logout', handleLogout);
    window.addEventListener('auth:login', handleLogin);

    return () => {
      window.removeEventListener('guest:continue', handleGuest);
      window.removeEventListener('auth:logout', handleLogout);
      window.removeEventListener('auth:login', handleLogin);
    };
  }, []);

  return { user, isGuest, loading };
};
