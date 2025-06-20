import { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const navigate = useNavigate();

  // Налаштовуємо базовий URL для axios один раз
  useEffect(() => {
    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    axios.defaults.baseURL = baseURL;
  }, []);

  // При зміні token оновлюємо заголовок Authorization
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common.Authorization = `Bearer ${token}`;
      // Запит профілю
      axios.get('/api/auth/profile')
        .then(res => setUser(res.data))
        .catch(() => {
          // Некоректний або прострочений токен
          setToken(null);
          setUser(null);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common.Authorization;
          navigate('/login');
        });
    } else {
      // Якщо token відсутній, очищуємо
      delete axios.defaults.headers.common.Authorization;
      setUser(null);
    }
  }, [token, navigate]);

  const login = async ({ username, password }) => {
    const res = await axios.post('/api/auth/login', { username, password });
    const t = res.data.token;
    // Зберігаємо токен
    localStorage.setItem('token', t);
    setToken(t);
    // Встановлюємо заголовок
    axios.defaults.headers.common.Authorization = `Bearer ${t}`;
    // Встановимо user з відповіді (щоб уникнути додаткового запиту)
    setUser(res.data.user);
    navigate('/dashboard');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common.Authorization;
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}