import { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function ManageProducts() {
  const { user } = useContext(AuthContext);
  const isManager = user.role === 'manager';
  const title = isManager ? 'Управління товарами' : 'Товари';

  // Tabs: 'types' або 'items'
  const [tab, setTab] = useState('items');

  // Categories
  const [categories, setCategories] = useState([]);

  // ProductTypes (типи товарів)
  const [types, setTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [errorTypes, setErrorTypes] = useState(null);
  const [typeForm, setTypeForm] = useState({ id: null, name: '', manufacturer: '', characteristics: '', categoryId: '' });
  // Filters for types
  const [typeSearch, setTypeSearch] = useState('');
  const [typeCategoryFilter, setTypeCategoryFilter] = useState('');
  const [typeSort, setTypeSort] = useState('nameAsc'); // 'nameAsc','nameDesc'

  // StoreItems
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorItems, setErrorItems] = useState(null);
  const [itemForm, setItemForm] = useState({ id: null, productTypeId: '', upc: '', salePrice: '', quantity: '', isPromotional: false });
  // Filters for items
  const [categoryFilter, setCategoryFilter] = useState('');
  const [promoFilterOption, setPromoFilterOption] = useState('all'); // 'all', 'promo', 'nonpromo'
  const [nameFilter, setNameFilter] = useState('');
  const [upcFilter, setUpcFilter] = useState('');
  const [sortOption, setSortOption] = useState('nameAsc');

  useEffect(() => {
    fetchCategories();
    fetchTypes();
    fetchItems();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get('/api/categories');
      setCategories(res.data);
    } catch {
      // не критично
    }
  };

  const fetchTypes = async () => {
    setLoadingTypes(true);
    try {
      const res = await axios.get('/api/products'); // або '/api/product-types' згідно бекенд
      setTypes(res.data.map(it => ({ ...it }))); // очікуємо поля id, name, manufacturer, characteristics, categoryId, categoryName
      setErrorTypes(null);
    } catch {
      setErrorTypes('Помилка завантаження типів товарів');
    } finally {
      setLoadingTypes(false);
    }
  };

  const fetchItems = async () => {
    setLoadingItems(true);
    try {
      const res = await axios.get('/api/store-items');
      setItems(res.data.map(it => ({ ...it }))); // очікуємо fields upc, productId, productName, categoryId, categoryName, salePrice, quantity, isPromotional
      setErrorItems(null);
    } catch {
      setErrorItems('Помилка завантаження товарів у магазині');
    } finally {
      setLoadingItems(false);
    }
  };

  // ----- ProductType handlers -----
  const handleTypeSubmit = async e => {
    e.preventDefault();
    if (!isManager) return;
    const payload = {
      name: typeForm.name,
      manufacturer: typeForm.manufacturer,
      characteristics: typeForm.characteristics,
      categoryId: typeForm.categoryId || null
    };
    try {
      if (typeForm.id) {
        await axios.put(`/api/products/${typeForm.id}`, payload);
      } else {
        await axios.post('/api/products', payload);
      }
      setTypeForm({ id: null, name: '', manufacturer: '', characteristics: '', categoryId: '' });
      fetchTypes();
      fetchItems();
    } catch {
      alert('Помилка збереження типу товару');
    }
  };
  const startTypeEdit = type => {
    if (!isManager) return;
    setTypeForm({ id: type.id, name: type.name, manufacturer: type.manufacturer, characteristics: type.characteristics, categoryId: type.categoryId || '' });
  };
  const handleTypeDelete = async id => {
    if (!isManager) return;
    if (confirm('Видалити тип товару? Це вилучить пов’язані товари у магазині.')) {
      try {
        await axios.delete(`/api/products/${id}`);
        fetchTypes(); fetchItems();
      } catch {
        alert('Помилка видалення');
      }
    }
  };

  // ----- StoreItem handlers -----
  const handleItemSubmit = async e => {
    e.preventDefault();
    if (!isManager) return;
    const payload = {
      productId: itemForm.productTypeId,
      upc: itemForm.upc,
      salePrice: parseFloat(itemForm.salePrice),
      quantity: parseInt(itemForm.quantity, 10),
      isPromotional: itemForm.isPromotional
    };
    try {
      if (itemForm.id) {
        await axios.put(`/api/store-items/${itemForm.upc}`, payload);
      } else {
        await axios.post('/api/store-items', payload);
      }
      setItemForm({ id: null, productTypeId: '', upc: '', salePrice: '', quantity: '', isPromotional: false });
      fetchItems();
    } catch {
      alert('Помилка збереження товару');
    }
  };
  const startItemEdit = item => {
    if (!isManager) return;
    setItemForm({ id: item.upc, productTypeId: item.productId, upc: item.upc, salePrice: item.salePrice, quantity: item.quantity, isPromotional: item.isPromotional });
  };
  const handleItemDelete = async upc => {
    if (!isManager) return;
    if (confirm('Видалити товар у магазині?')) {
      try { await axios.delete(`/api/store-items/${upc}`); fetchItems(); } catch { alert('Помилка видалення'); }
    }
  };

  // ----- Filter logic -----
  const filteredSortedTypes = useMemo(() => {
    let arr = [...types];
    if (typeCategoryFilter) arr = arr.filter(t => String(t.categoryId) === String(typeCategoryFilter));
    if (typeSearch.trim()) {
      const low = typeSearch.trim().toLowerCase();
      arr = arr.filter(t => t.name && t.name.toLowerCase().includes(low));
    }
    switch (typeSort) {
      case 'nameAsc': arr.sort((a,b)=>a.name.localeCompare(b.name)); break;
      case 'nameDesc': arr.sort((a,b)=>b.name.localeCompare(a.name)); break;
      default: break;
    }
    return arr;
  }, [types, typeCategoryFilter, typeSearch, typeSort]);

  const filteredSortedItems = useMemo(() => {
    let arr = [...items];
    // Категорія
    if (categoryFilter) arr = arr.filter(it => String(it.categoryId) === String(categoryFilter));
    // Акційні / Неакційні
    if (promoFilterOption === 'promo') {
      arr = arr.filter(it => it.isPromotional);
    } else if (promoFilterOption === 'nonpromo') {
      arr = arr.filter(it => !it.isPromotional);
    }
    // Пошук за назвою
    if (nameFilter.trim()) {
      const low = nameFilter.trim().toLowerCase();
      arr = arr.filter(it => it.productName && it.productName.toLowerCase().includes(low));
    }
    // Пошук за UPC
    if (upcFilter.trim()) {
      const low = upcFilter.trim().toLowerCase();
      arr = arr.filter(it => it.upc && it.upc.toLowerCase().includes(low));
    }
    // Сортування
    switch (sortOption) {
      case 'nameAsc': arr.sort((a,b)=>a.productName.localeCompare(b.productName)); break;
      case 'nameDesc': arr.sort((a,b)=>b.productName.localeCompare(a.productName)); break;
      case 'priceAsc': arr.sort((a,b)=>parseFloat(a.salePrice)-parseFloat(b.salePrice)); break;
      case 'priceDesc': arr.sort((a,b)=>parseFloat(b.salePrice)-parseFloat(a.salePrice)); break;
      case 'qtyAsc': arr.sort((a,b)=>a.quantity-b.quantity); break;
      case 'qtyDesc': arr.sort((a,b)=>b.quantity-a.quantity); break;
      default: break;
    }
    return arr;
  }, [items, categoryFilter, promoFilterOption, nameFilter, upcFilter, sortOption]);

  // ----- Render -----
  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">{title}</h2>
      <div className="mb-4">
        <button onClick={() => setTab('types')} className={`px-4 py-2 mr-2 rounded ${tab==='types'?'bg-blue-600 text-white':'bg-gray-200'}`}>{isManager ? 'Типи товарів' : 'Типи товарів'}</button>
        <button onClick={() => setTab('items')} className={`px-4 py-2 rounded ${tab==='items'?'bg-blue-600 text-white':'bg-gray-200'}`}>Товари у магазині</button>
      </div>

      {tab==='types' ? (
        <> {/* Типи товарів */}
          {loadingTypes ? <p>Завантаження...</p> : errorTypes ? <p className="text-red-600">{errorTypes}</p> : (
            <>
              {/* Filters for types */}
              <div className="mb-4 bg-white p-4 rounded shadow">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Пошук за назвою</label>
                    <input type="text" className="w-full border rounded p-2" value={typeSearch} onChange={e=>setTypeSearch(e.target.value)} placeholder="Введіть назву..." />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Фільтр за категорією</label>
                    <select className="w-full border rounded p-2" value={typeCategoryFilter} onChange={e=>setTypeCategoryFilter(e.target.value)}>
                      <option value="">Усі</option>
                      {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Сортування</label>
                    <select className="w-full border rounded p-2" value={typeSort} onChange={e=>setTypeSort(e.target.value)}>
                      <option value="nameAsc">Назва ↑</option>
                      <option value="nameDesc">Назва ↓</option>
                    </select>
                  </div>
                </div>
              </div>
              {/* Form типів */}
              {isManager && (
                <form onSubmit={handleTypeSubmit} className="mb-6 bg-white p-4 rounded shadow">
                  <h3 className="mb-2">{typeForm.id ? 'Редагувати тип товару' : 'Додати тип товару'}</h3>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Назва</label>
                    <input type="text" className="w-full border rounded p-2" value={typeForm.name} onChange={e=>setTypeForm({...typeForm,name:e.target.value})} required />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Виробник</label>
                    <input type="text" className="w-full border rounded p-2" value={typeForm.manufacturer} onChange={e=>setTypeForm({...typeForm,manufacturer:e.target.value})} required />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Характеристики</label>
                    <textarea className="w-full border rounded p-2" rows={3} value={typeForm.characteristics} onChange={e=>setTypeForm({...typeForm,characteristics:e.target.value})} />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Категорія</label>
                    <select className="w-full border rounded p-2" value={typeForm.categoryId} onChange={e=>setTypeForm({...typeForm,categoryId:e.target.value})} required>
                      <option value="">Виберіть категорію</option>
                      {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">{typeForm.id?'Оновити':'Додати'}</button>
                  {typeForm.id && <button type="button" onClick={()=>setTypeForm({id:null,name:'',manufacturer:'',characteristics:'',categoryId:''})} className="ml-2 bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400">Скасувати</button>}
                </form>
              )}
              {/* Table типів */}
              <table className="w-full bg-white shadow rounded mb-8">
                <thead>
                  <tr>
                    <th className="p-2">Назва</th>
                    <th className="p-2">Виробник</th>
                    <th className="p-2">Категорія</th>
                    {isManager && <th className="p-2">Дії</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedTypes.map(type=>(
                    <tr key={type.id} className="border-t">
                      <td className="p-2">{type.name}</td>
                      <td className="p-2">{type.manufacturer}</td>
                      <td className="p-2">{type.categoryName||''}</td>
                      {isManager && <td className="p-2"><button onClick={()=>startTypeEdit(type)} className="mr-2 text-blue-600">Редагувати</button><button onClick={()=>handleTypeDelete(type.id)} className="text-red-600">Видалити</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      ) : (
        <> {/* Товари у магазині */}
          {loadingItems ? <p>Завантаження...</p> : errorItems ? <p className="text-red-600">{errorItems}</p> : (
            <>
              {/* Filters */}
              <div className="mb-4 bg-white p-4 rounded shadow">
                <h3 className="text-lg mb-2">Фільтри</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-gray-700 mb-1">Категорія</label>
                    <select className="w-full border rounded p-2" value={categoryFilter} onChange={e=>setCategoryFilter(e.target.value)}>
                      <option value="">Всі</option>
                      {categories.map(cat=><option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="block text-gray-700 mb-1">Акційність</span>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center"><input type="radio" name="promoFilter" value="all" checked={promoFilterOption==='all'} onChange={() => setPromoFilterOption('all')} className="mr-2" />Усі</label>
                      <label className="flex items-center"><input type="radio" name="promoFilter" value="promo" checked={promoFilterOption==='promo'} onChange={() => setPromoFilterOption('promo')} className="mr-2" />Лише акційні</label>
                      <label className="flex items-center"><input type="radio" name="promoFilter" value="nonpromo" checked={promoFilterOption==='nonpromo'} onChange={() => setPromoFilterOption('nonpromo')} className="mr-2" />Лише не акційні</label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Пошук за назвою</label>
                    <input type="text" className="w-full border rounded p-2" value={nameFilter} onChange={e=>setNameFilter(e.target.value)} placeholder="Введіть назву..." />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Пошук за UPC</label>
                    <input type="text" className="w-full border rounded p-2" value={upcFilter} onChange={e=>setUpcFilter(e.target.value)} placeholder="Введіть UPC..." />
                  </div>
                  <div>
                    <label className="block text-gray-700 mb-1">Сортування</label>
                    <select className="w-full border rounded p-2" value={sortOption} onChange={e=>setSortOption(e.target.value)}>
                      <option value="nameAsc">Назва ↑</option>
                      <option value="nameDesc">Назва ↓</option>
                      <option value="priceAsc">Ціна ↑</option>
                      <option value="priceDesc">Ціна ↓</option>
                      <option value="qtyAsc">Кількість ↑</option>
                      <option value="qtyDesc">Кількість ↓</option>
                    </select>
                  </div>
                </div>
              </div>
              {isManager && (
                <form
                  onSubmit={handleItemSubmit}
                  className="mb-6 bg-white p-4 rounded shadow"
                  autoComplete="off"
                >
                  <h3 className="mb-2">
                    {itemForm.id ? 'Редагувати товар у магазині' : 'Додати товар у магазині'}
                  </h3>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Тип продукту</label>
                    <select
                      className="w-full border rounded p-2"
                      value={itemForm.productTypeId}
                      onChange={e => setItemForm({ ...itemForm, productTypeId: e.target.value })}
                      required
                    >
                      <option value="">Виберіть тип товару</option>
                      {types.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">UPC</label>
                    <input
                      type="text"
                      className="w-full border rounded p-2"
                      value={itemForm.upc}
                      onChange={e => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setItemForm({ ...itemForm, upc: val });
                      }}
                      required
                      disabled={!!itemForm.id}
                      pattern="\d{6}"
                      maxLength={6}
                      inputMode="numeric"
                      title="UPC має складатися з 6 цифр"
                      placeholder="6 цифр"
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Ціна продажу </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full border rounded p-2"
                      value={itemForm.salePrice}
                      onChange={e => setItemForm({ ...itemForm, salePrice: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2">
                    <label className="block text-gray-700 mb-1">Кількість</label>
                    <input
                      type="number"
                      min="0"
                      className="w-full border rounded p-2"
                      value={itemForm.quantity}
                      onChange={e => setItemForm({ ...itemForm, quantity: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={itemForm.isPromotional}
                      onChange={e => setItemForm({ ...itemForm, isPromotional: e.target.checked })}
                      className="mr-2"
                    />
                    <label className="text-gray-700">Акційний</label>
                  </div>
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    {itemForm.id ? 'Оновити' : 'Додати'}
                  </button>
                  {itemForm.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setItemForm({
                          id: null,
                          productTypeId: '',
                          upc: '',
                          salePrice: '',
                          quantity: '',
                          isPromotional: false,
                        })
                      }
                      className="ml-2 bg-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-400"
                    >
                      Скасувати
                    </button>
                  )}
                </form>
              )}
              {/* Table items */}
              <table className="w-full bg-white shadow rounded">
                <thead>
                  <tr>
                    <th className="p-2">Тип товару</th>
                    <th className="p-2">Категорія</th>
                    <th className="p-2">UPC</th>
                    <th className="p-2">Ціна </th>
                    <th className="p-2">Кількість</th>
                    <th className="p-2">Акційний</th>
                    {isManager && <th className="p-2">Дії</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSortedItems.map(item => (
                    <tr key={item.upc} className="border-t">
                      <td className="p-2">{item.productName||''}</td>
                      <td className="p-2">{item.categoryName||''}</td>
                      <td className="p-2">{item.upc}</td>
                      <td className="p-2">{(() => { const p=Number(item.salePrice); return isNaN(p)? '-' : (<>{p.toFixed(2)}{item.isPromotional && <span className="ml-2 text-sm text-red-600">({(p*0.8).toFixed(2)})</span>}</>); })()}</td>
                      <td className="p-2">{item.quantity}</td>
                      <td className="p-2">{item.isPromotional?'Так':'Ні'}</td>
                      {isManager && <td className="p-2"><button onClick={()=>startItemEdit(item)} className="mr-2 text-blue-600">Редагувати</button><button onClick={()=>handleItemDelete(item.upc)} className="text-red-600">Видалити</button></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </>
      )}
    </div>
  );
}
