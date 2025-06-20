// src/pages/Profile.jsx
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function Profile() {
  const { user, token } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Якщо AuthContext не містить усіх полів,
        // звертаємось до бекенду
        const res = await axios.get('/api/auth/profile', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setProfile(res.data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError('Помилка завантаження профілю');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [token]);

  if (loading) return <p className="p-6">Завантаження...</p>;
  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!profile) return <p className="p-6">Профіль не знайдено</p>;

  // Виводимо інформацію у вигляді read-only
  return (
    <div className="p-6 bg-white rounded shadow max-w-md mx-auto">
      <h2 className="text-2xl mb-4">Профіль користувача</h2>
      <div className="space-y-3">
        <div>
          <label className="block text-gray-700">ID:</label>
          <p className="mt-1 text-gray-900">{profile.id}</p>
        </div>
        <div>
          <label className="block text-gray-700">Логін:</label>
          <p className="mt-1 text-gray-900">{profile.username}</p>
        </div>
        <div>
          <label className="block text-gray-700">ПІБ:</label>
          <p className="mt-1 text-gray-900">{profile.name || profile.fullName}</p>
        </div>
        <div>
          <label className="block text-gray-700">Роль:</label>
          <p className="mt-1 text-gray-900">{profile.role === 'manager' ? 'Менеджер' : 'Касир'}</p>
        </div>
        {/* Додаткові поля, якщо є */}
        {profile.salary != null && (
          <div>
            <label className="block text-gray-700">Зарплата:</label>
            <p className="mt-1 text-gray-900">{profile.salary}</p>
          </div>
        )}
        {profile.startDate && (
          <div>
            <label className="block text-gray-700">Дата початку роботи:</label>
            <p className="mt-1 text-gray-900">{profile.startDate.slice(0,10)}</p>
          </div>
        )}
        {profile.birthDate && (
          <div>
            <label className="block text-gray-700">Дата народження:</label>
            <p className="mt-1 text-gray-900">{profile.birthDate.slice(0,10)}</p>
          </div>
        )}
        {profile.phone && (
          <div>
            <label className="block text-gray-700">Телефон:</label>
            <p className="mt-1 text-gray-900">{profile.phone}</p>
          </div>
        )}
        {profile.address && (
          <div>
            <label className="block text-gray-700">Адреса:</label>
            <p className="mt-1 text-gray-900">{profile.address}</p>
          </div>
        )}
      </div>
    </div>
  );
}
