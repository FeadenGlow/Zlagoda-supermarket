import { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function ManageCategories() {
  const { user } = useContext(AuthContext);
  const isManager = user.role === 'manager';
  const title = isManager ? 'Управління категоріями' : 'Категорії';

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ id: null, name: '' });

  // Filters
  const [search, setSearch] = useState('');
  const [sortOption, setSortOption] = useState('nameAsc'); // 'nameAsc','nameDesc'

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data.map(c=>({ id:c.id, name:c.name })));
      setError(null);
    } catch {
      setError('Помилка завантаження категорій');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!isManager) return;
    const name = formData.name.trim();
    if (!name) { alert('Введіть назву категорії'); return; }
    try {
      if (formData.id) await axios.put(`/api/categories/${formData.id}`, { name });
      else await axios.post('/api/categories', { name });
      setFormData({ id: null, name: '' });
      fetchCategories();
    } catch {
      alert('Помилка збереження категорії');
    }
  };
  const startEdit = cat => { if (!isManager) return; setFormData({ id: cat.id, name: cat.name }); };
  const handleDelete = async id => { if (!isManager) return; if (window.confirm('Видалити категорію?')) { try { await axios.delete(`/api/categories/${id}`); fetchCategories(); } catch { alert('Помилка видалення'); } } };

  const filteredSorted = useMemo(() => {
    let arr = [...categories];
    if (search.trim()) {
      const low = search.trim().toLowerCase(); arr = arr.filter(c => c.name.toLowerCase().includes(low));
    }
    switch (sortOption) {
      case 'nameAsc': arr.sort((a,b)=>a.name.localeCompare(b.name)); break;
      case 'nameDesc': arr.sort((a,b)=>b.name.localeCompare(a.name)); break;
      default: break;
    }
    return arr;
  }, [categories, search, sortOption]);

  if (loading) return <p>Завантаження...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">{title}</h2>
      {/* Filters */}
      <div className="mb-4 bg-white p-4 rounded shadow">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 mb-1">Пошук за назвою</label>
            <input type="text" className="w-full border rounded p-2" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Введіть назву..." />
          </div>
          <div>
            <label className="block text-gray-700 mb-1">Сортування</label>
            <select className="w-full border rounded p-2" value={sortOption} onChange={e=>setSortOption(e.target.value)}>
              <option value="nameAsc">Назва ↑</option>
              <option value="nameDesc">Назва ↓</option>
            </select>
          </div>
        </div>
      </div>
      {isManager && (
        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow">
          <h3 className="mb-2">{formData.id ? 'Редагувати категорію' : 'Додати категорію'}</h3>
          <div className="mb-2">
            <label className="block text-gray-700 mb-1">Назва категорії</label>
            <input type="text" className="w-full border rounded p-2" value={formData.name} onChange={e=>setFormData({...formData,name:e.target.value})} required />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{formData.id?'Оновити':'Додати'}</button>
          {formData.id && <button type="button" onClick={()=>setFormData({id:null,name:''})} className="ml-2 bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400">Скасувати</button>}
        </form>
      )}
      <table className="w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="p-2 text-left">ID</th>
            <th className="p-2 text-left">Назва</th>
            {isManager && <th className="p-2">Дії</th>}
          </tr>
        </thead>
        <tbody>
          {filteredSorted.map(cat=>(
            <tr key={cat.id} className="border-t">
              <td className="p-2">{cat.id}</td>
              <td className="p-2">{cat.name}</td>
              {isManager && <td className="p-2"><button onClick={()=>startEdit(cat)} className="mr-2 text-blue-600">Редагувати</button><button onClick={()=>handleDelete(cat.id)} className="text-red-600">Видалити</button></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}