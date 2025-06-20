import { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function ManageEmployees() {
  const { user } = useContext(AuthContext);
  const isManager = user.role === 'manager';
  const title = 'Управління працівниками';

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    id: null,
    fullName: '',
    position: '',
    salary: '',
    startDate: '',
    birthDate: '',
    phone: '',
    address: '',
    username: '',
    password: ''
  });
  const [positionFilter, setPositionFilter] = useState('');
  const [searchName, setSearchName] = useState('');
  const [sortOrder, setSortOrder] = useState('lastNameAsc');

  useEffect(() => {
    if (!isManager) return;
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      // Повертаємо поля: id, fullName, position, salary, startDate, birthDate, phone, address, username
      setUsers(res.data.map(u => ({ ...u })));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault(); if (!isManager) return;
    if (!formData.fullName.trim() || !formData.position || !formData.salary || !formData.startDate || !formData.birthDate || !formData.phone.trim() || !formData.address.trim()) {
      alert('Заповніть усі поля'); return;
    }
    const payload = {
      fullName: formData.fullName.trim(),
      position: formData.position,
      salary: parseFloat(formData.salary),
      startDate: formData.startDate,
      birthDate: formData.birthDate,
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      username: formData.username.trim() || undefined,
      password: formData.password || undefined
    };
    try {
      if (formData.id) {
        await axios.put(`/api/users/${formData.id}`, payload);
      } else {
        if (!payload.username || !payload.password) { alert('Логін/пароль потрібні'); return; }
        await axios.post('/api/users', payload);
      }
      setFormData({ id: null, fullName:'', position:'', salary:'', startDate:'', birthDate:'', phone:'', address:'', username:'', password:'' });
      fetchUsers();
    } catch (err) {
      console.error(err);
      alert('Помилка збереження');
    }
  };

  const startEdit = u => {
    setFormData({
      id: u.id,
      fullName: u.fullName,
      position: u.position,
      salary: u.salary,
      startDate: u.startDate ? u.startDate.slice(0,10) : '',
      birthDate: u.birthDate ? u.birthDate.slice(0,10) : '',
      phone: u.phone,
      address: u.address,
      username: u.username || '',
      password: ''
    });
  };

  const handleDelete = async id => {
    if (!isManager) return;
    if (window.confirm('Видалити працівника?')) {
      try { await axios.delete(`/api/users/${id}`); fetchUsers(); } catch { alert('Помилка видалення'); }
    }
  };

  const getLastName = fullName => {
    const parts = fullName.trim().split(' ');
    return parts.length>1?parts[parts.length-1]:parts[0];
  };

  const filteredSorted = useMemo(() => {
    let arr = [...users];
    if (positionFilter) arr = arr.filter(u=>u.position===positionFilter);
    if (searchName.trim()) {
      const low = searchName.trim().toLowerCase(); arr = arr.filter(u=>u.fullName.toLowerCase().includes(low));
    }
    arr.sort((a,b)=>{
      const la = getLastName(a.fullName).localeCompare(getLastName(b.fullName));
      return sortOrder==='lastNameAsc'?la:-la;
    });
    return arr;
  }, [users, positionFilter, searchName, sortOrder]);

  if (!isManager) return <p>Недостатньо прав</p>;
  if (loading) return <p>Завантаження...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">{title}</h2>
      {/* Filters */}
      <div className="mb-4 bg-white p-4 rounded shadow">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Фільтр за посадою</label>
            <select className="w-full border rounded p-2" value={positionFilter} onChange={e=>setPositionFilter(e.target.value)}>
              <option value="">Усі</option>
              <option value="cashier">Касир</option>
              <option value="manager">Менеджер</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Пошук за ім'ям</label>
            <input type="text" className="w-full border rounded p-2" value={searchName} onChange={e=>setSearchName(e.target.value)} placeholder="Введіть ім'я або прізвище..." />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Сортування за прізвищем</label>
            <select className="w-full border rounded p-2" value={sortOrder} onChange={e=>setSortOrder(e.target.value)}>
              <option value="lastNameAsc">↑</option>
              <option value="lastNameDesc">↓</option>
            </select>
          </div>
        </div>
      </div>
      {/* Form */}
      <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
        <h3 className="mb-2">{formData.id?'Редагувати працівника':'Додати працівника'}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">ПІБ</label>
            <input type="text" className="w-full border rounded p-2" value={formData.fullName} onChange={e=>setFormData({...formData,fullName:e.target.value})} required />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Посада</label>
            <select className="w-full border rounded p-2" value={formData.position} onChange={e=>setFormData({...formData,position:e.target.value})} required>
              <option value="">Виберіть посад</option>
              <option value="cashier">Касир</option>
              <option value="manager">Менеджер</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Зарплата</label>
            <input type="number" min="0" step="0.01" className="w-full border rounded p-2" value={formData.salary} onChange={e=>setFormData({...formData,salary:e.target.value})} required />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Дата початку</label>
            <input type="date" className="w-full border rounded p-2" value={formData.startDate} onChange={e=>setFormData({...formData,startDate:e.target.value})} required />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Дата народження</label>
            <input type="date" className="w-full border rounded p-2" value={formData.birthDate} onChange={e=>setFormData({...formData,birthDate:e.target.value})} required />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Телефон</label>
            <input type="tel" className="w-full border rounded p-2" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})} required />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-gray-700 mb-1">Адреса</label>
            <input type="text" className="w-full border rounded p-2" value={formData.address} onChange={e=>setFormData({...formData,address:e.target.value})} required />
          </div>
          {!formData.id && (
            <>
              <div>
                <label className="block text-gray-700 mb-1">Логін</label>
                <input type="text" className="w-full border rounded p-2" value={formData.username} onChange={e=>setFormData({...formData,username:e.target.value})} required />
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Пароль</label>
                <input type="password" className="w-full border rounded p-2" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} required />
              </div>
            </>
          )}
          {formData.id && (
            <div>
              <label className="block text-gray-700 mb-1">Новий пароль (опц.)</label>
              <input type="password" className="w-full border rounded p-2" value={formData.password} onChange={e=>setFormData({...formData,password:e.target.value})} placeholder="Якщо потрібно змінити" />
            </div>
          )}
        </div>
        <div className="mt-4">
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{formData.id?'Оновити':'Додати'}</button>
          {formData.id && <button type="button" onClick={()=>setFormData({id:null,fullName:'',position:'',salary:'',startDate:'',birthDate:'',phone:'',address:'',username:'',password:''})} className="ml-2 bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400">Скасувати</button>}
        </div>
      </form>
      {/* Table */}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="p-2">ID</th>
            <th className="p-2">ПІБ</th>
            <th className="p-2">Посада</th>
            <th className="p-2">Зарплата</th>
            <th className="p-2">Початок роботи</th>
            <th className="p-2">Дата народження</th>
            <th className="p-2">Телефон</th>
            <th className="p-2">Адреса</th>
            <th className="p-2">Логін</th>
            <th className="p-2">Дії</th>
          </tr>
        </thead>
        <tbody>
          {filteredSorted.map(u=>(
            <tr key={u.id} className="border-t">
              <td className="p-2">{u.id}</td>
              <td className="p-2">{u.fullName}</td>
              <td className="p-2">{u.position==='manager'?'Менеджер':'Касир'}</td>
              <td className="p-2">{u.salary}</td>
              <td className="p-2">{u.startDate ? u.startDate.slice(0,10) : ''}</td>
              <td className="p-2">{u.birthDate ? u.birthDate.slice(0,10) : ''}</td>
              <td className="p-2">{u.phone}</td>
              <td className="p-2">{u.address}</td>
              <td className="p-2">{u.username}</td>
              <td className="p-2"><button onClick={()=>startEdit(u)} className="mr-2 text-blue-600">Редагувати</button><button onClick={()=>handleDelete(u.id)} className="text-red-600">Видалити</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}