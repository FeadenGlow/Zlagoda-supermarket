import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Login() {
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const { login } = useContext(AuthContext);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await login(loginData);
    } catch (err) {
      alert('Невірні облікові дані');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-full max-w-sm">
        <h2 className="text-xl mb-4">Вхід</h2>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Логін</label>
          <input type="text" className="w-full border rounded p-2" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} required />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-1">Пароль</label>
          <input type="password" className="w-full border rounded p-2" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} required />
        </div>
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Увійти</button>
      </form>
    </div>
  );
}