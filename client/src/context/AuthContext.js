import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API = 'https://devboard-tfen.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('devboard_user')) || null;
    } catch { return null; }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('devboard_token') || null;
  });

  const login = async (email, password) => {
    const { data } = await axios.post(
      `${API}/api/auth/login`,
      { email, password }
    );
    localStorage.setItem('devboard_user',  JSON.stringify(data.user));
    localStorage.setItem('devboard_token', data.token);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const register = async (name, email, password) => {
    const { data } = await axios.post(
      `${API}/api/auth/register`,
      { name, email, password }
    );
    localStorage.setItem('devboard_user',  JSON.stringify(data.user));
    localStorage.setItem('devboard_token', data.token);
    setUser(data.user);
    setToken(data.token);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('devboard_user');
    localStorage.removeItem('devboard_token');
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser, setToken, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);