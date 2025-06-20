// src/pages/ManageCustomers.jsx
import { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function ManageCustomers() {
  const { user } = useContext(AuthContext);
  const isManager = user.role === 'manager';

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Форма
  const [formData, setFormData] = useState({
    cardNumber: '',
    fullName: '',
    phone: '',
    address: '',
    discount: ''
  });
  const [isEditing, setIsEditing] = useState(false);

  // Пошук/сортування
  const [searchName, setSearchName] = useState('');
  const [sortOrder, setSortOrder] = useState('nameAsc'); // 'nameAsc' або 'nameDesc'

  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchName.trim()) params.search = searchName.trim();
      if (sortOrder) params.sort = sortOrder;
      const res = await axios.get('/api/customers', { params });
      setCards(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження карток');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const { cardNumber, fullName, phone, address, discount } = formData;
    if (!cardNumber.trim() || !fullName.trim() || !phone.trim() || !address.trim() || discount === '') {
      alert('Заповніть усі поля');
      return;
    }
    const payload = {
      cardNumber: cardNumber.trim(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      discount: parseFloat(discount)
    };
    try {
      if (isEditing) {
        await axios.put(`/api/customers/${formData.cardNumber}`, payload);
      } else {
        if (!isManager) {
          alert('Недостатньо прав');
          return;
        }
        await axios.post('/api/customers', payload);
      }
      setFormData({ cardNumber: '', fullName: '', phone: '', address: '', discount: '' });
      setIsEditing(false);
      fetchCards();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження картки');
    }
  };

  const startEdit = card => {
    setFormData({
      cardNumber: card.cardNumber,
      fullName: card.fullName,
      phone: card.phone,
      address: card.address,
      discount: card.discount.toString()
    });
    setIsEditing(true);
  };

  const handleDelete = async cardNumber => {
    if (!isManager) {
      alert('Недостатньо прав');
      return;
    }
    if (window.confirm('Видалити картку клієнта?')) {
      try {
        await axios.delete(`/api/customers/${cardNumber}`);
        fetchCards();
      } catch (err) {
        console.error(err);
        alert('Помилка видалення картки');
      }
    }
  };

  const filteredSorted = useMemo(() => {
    let arr = [...cards];
    if (searchName.trim()) {
      const low = searchName.trim().toLowerCase();
      arr = arr.filter(c => c.fullName.toLowerCase().includes(low));
    }
    arr.sort((a, b) => {
      if (sortOrder === 'nameAsc') return a.fullName.localeCompare(b.fullName);
      else return b.fullName.localeCompare(a.fullName);
    });
    return arr;
  }, [cards, searchName, sortOrder]);

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Картки клієнтів</h2>
      {/* Пошук/сортування */}
      <div className="mb-4 bg-white p-4 rounded shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Пошук за ім’ям</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={searchName}
              onChange={e => setSearchName(e.target.value)}
              placeholder="Введіть ПІБ клієнта..."
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Сортування за ім’ям</label>
            <select
              className="w-full border rounded p-2"
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value)}
            >
              <option value="nameAsc">↑</option>
              <option value="nameDesc">↓</option>
            </select>
          </div>
        </div>
      </div>
      {/* Форма */}
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="mb-2">{isEditing ? 'Редагувати картку' : 'Додати картку'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!isEditing && (
            <div>
              <label className="block text-gray-700 mb-1">Номер карти</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                value={formData.cardNumber}
                onChange={e => setFormData({ ...formData, cardNumber: e.target.value })}
                required
              />
            </div>
          )}
          {/* Якщо редагування, номер незмінний */}
          {isEditing && (
            <div>
              <label className="block text-gray-700 mb-1">Номер карти</label>
              <input
                type="text"
                className="w-full border rounded p-2 bg-gray-100"
                value={formData.cardNumber}
                disabled
              />
            </div>
          )}
          <div>
            <label className="block text-gray-700 mb-1">ПІБ власника</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Телефон</label>
            <input
              type="tel"
              className="w-full border rounded p-2"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-gray-700 mb-1">Адреса</label>
            <input
              type="text"
              className="w-full border rounded p-2"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Знижка (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.01"
              className="w-full border rounded p-2"
              value={formData.discount}
              onChange={e => setFormData({ ...formData, discount: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            {isEditing ? 'Оновити' : 'Додати'}
          </button>
          {isEditing && (
            <button
              type="button"
              onClick={() => {
                setFormData({ cardNumber: '', fullName: '', phone: '', address: '', discount: '' });
                setIsEditing(false);
              }}
              className="ml-2 bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400"
            >
              Скасувати
            </button>
          )}
        </div>
      </form>
      {/* Таблиця */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="p-2">Номер карти</th>
            <th className="p-2">ПІБ</th>
            <th className="p-2">Телефон</th>
            <th className="p-2">Адреса</th>
            <th className="p-2">Знижка (%)</th>
            <th className="p-2">Дії</th>
          </tr>
        </thead>
        <tbody>
          {filteredSorted.map(card => (
            <tr key={card.cardNumber} className="border-t">
              <td className="p-2">{card.cardNumber}</td>
              <td className="p-2">{card.fullName}</td>
              <td className="p-2">{card.phone}</td>
              <td className="p-2">{card.address}</td>
              <td className="p-2">{Number(card.discount).toFixed(2)}</td>
              <td className="p-2">
                {/* Редагувати доступно всім, але перевірка на бекенді */}
                <button
                  onClick={() => startEdit(card)}
                  className="mr-2 text-blue-600"
                >
                  Редагувати
                </button>
                {isManager && (
                  <button
                    onClick={() => handleDelete(card.cardNumber)}
                    className="text-red-600"
                  >
                    Видалити
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
