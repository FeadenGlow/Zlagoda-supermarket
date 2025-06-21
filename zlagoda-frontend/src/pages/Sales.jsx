// Frontend: src/pages/Sales.jsx
import { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function Sales() {
  const { user } = useContext(AuthContext);
  const isManager = user.role === 'manager';
  const isCashier = user.role === 'cashier';

  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ cashierId: '', startDate: '', endDate: '', receiptId: '' });
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [storeItems, setStoreItems] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [customers, setCustomers] = useState([]); // список клієнтів/карт
  const [selectedProductUpc, setSelectedProductUpc] = useState('');
  const [totalQty, setTotalQty] = useState(null);
  const [receiptNotFound, setReceiptNotFound] = useState(false);

  // Для створення чека
  const [newItems, setNewItems] = useState([]);
  const [selectedCustomerCard, setSelectedCustomerCard] = useState(''); // номер карти або '' якщо без карти

  useEffect(() => {
    fetchReceipts();
    if (isCashier) {
      fetchStoreItems();
      fetchCustomers();
    }
    if (isManager) {
      fetchCashiers();
      fetchStoreItems();
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchReceipts();
    // eslint-disable-next-line
  }, [filters]);

  const fetchCashiers = async () => {
    try {
      const res = await axios.get('/api/users');
      const cashierList = res.data.filter(u => u.position === 'cashier' || u.role === 'cashier');
      setCashiers(cashierList);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers');
      setCustomers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    setReceiptNotFound(false);
    setSelectedReceipt(null);

    const { receiptId, startDate, endDate, cashierId } = filters;

    if (receiptId) {
      try {
        const res = await axios.get(`/api/receipts/${receiptId}`);
        const receipt = res.data;
        setReceipts([receipt]);
        setSelectedReceipt(receipt);
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 404) {
          setReceipts([]);
          setReceiptNotFound(true);
        } else {
          setReceipts([]);
          setError('Помилка під час пошуку чеку');
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (isManager && cashierId) params.cashierId = cashierId;
      const res = await axios.get('/api/receipts', { params });
      setReceipts(res.data);
      setError(null);
      setReceiptNotFound(false);
      setSelectedReceipt(null);
    } catch (err) {
      console.error(err);
      setReceipts([]);
      setError('Помилка завантаження чеків');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreItems = async () => {
    try {
      const res = await axios.get('/api/store-items');
      setStoreItems(res.data.map(it => ({ upc: it.upc, productName: it.productName || it.name, price: it.salePrice })));
    } catch (err) {
      console.error(err);
    }
  };

  const addNewItemRow = () => {
    setNewItems([...newItems, { upc: '', quantity: 1, price: 0, productName: '' }]);
  };
  const updateNewItem = (index, field, value) => {
    const arr = [...newItems];
    arr[index][field] = value;
    if (field === 'upc') {
      const found = storeItems.find(si => si.upc === value);
      if (found) {
        arr[index].price = found.price;
        arr[index].productName = found.productName;
      } else {
        arr[index].price = 0;
        arr[index].productName = '';
      }
    }
    setNewItems(arr);
  };
  const removeNewItemRow = index => {
    const arr = [...newItems]; arr.splice(index, 1); setNewItems(arr);
  };

  const submitNewReceipt = async () => {
    if (!isCashier) return;
    if (newItems.length === 0) { alert('Додайте товари'); return; }
    const itemsPayload = newItems.map(it => ({ upc: it.upc, quantity: parseInt(it.quantity, 10), price: it.price }));
    const payload = { items: itemsPayload };
    if (selectedCustomerCard) {
      payload.cardNumber = selectedCustomerCard;
    }
    try {
      await axios.post('/api/receipts', payload);
      setNewItems([]);
      setSelectedCustomerCard('');
      fetchReceipts();
      alert('Чек створено');
    } catch (err) {
      console.error(err);
      alert('Помилка створення чеку');
    }
  };

  const viewReceipt = async id => {
    try {
      const res = await axios.get(`/api/receipts/${id}`);
      setSelectedReceipt(res.data);
    } catch (err) {
      console.error(err);
      alert('Не вдалось завантажити чек');
    }
  };

  const deleteReceiptFn = async id => {
    if (!isManager) return;
    if (window.confirm('Видалити чек?')) {
      try {
        await axios.delete(`/api/receipts/${id}`);
        fetchReceipts();
        setSelectedReceipt(null);
      } catch (err) {
        console.error(err);
        alert('Помилка видалення');
      }
    }
  };

  const totalOfFiltered = useMemo(() => {
    return receipts.reduce((sum, r) => {
      const total = parseFloat(r.total) || 0;
      const vat = parseFloat(r.vat) || 0;
      return sum + total + vat;
    }, 0);
  }, [receipts]);

  useEffect(() => {
    const fetchQty = async () => {
      if (!selectedProductUpc) {
        setTotalQty(null);
        return;
      }
      try {
        const params = { productUpc: selectedProductUpc };
        if (filters.startDate) params.startDate = filters.startDate;
        if (filters.endDate) params.endDate = filters.endDate;
        if (isManager && filters.cashierId) params.cashierId = filters.cashierId;
        const res = await axios.get('/api/receipts/analytics/quantity', { params });
        setTotalQty(res.data.totalQty);
      } catch (err) {
        console.error(err);
      }
    };
    fetchQty();
  }, [selectedProductUpc, filters, receipts]);

  if (loading) return <p>Завантаження...</p>;

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">Чеки</h2>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      {isCashier && (
        <div className="mb-6 bg-white p-4 rounded shadow">
          <h3 className="mb-2">Створити новий чек</h3>
          {/* Вибір клієнтської карти (необов'язково) */}
          <div className="mb-2">
            <label className="block mb-1">Карта клієнта (необов'язково)</label>
            <select
              className="w-full border rounded p-2"
              value={selectedCustomerCard}
              onChange={e => setSelectedCustomerCard(e.target.value)}
            >
              <option value="">Без карти</option>
              {customers.map(c => (
                <option key={c.cardNumber} value={c.cardNumber}>
                  {c.cardNumber} - {c.fullName}
                </option>
              ))}
            </select>
          </div>
          {newItems.map((row, idx) => (
            <div key={idx} className="flex items-end gap-2 mb-2">
              <select
                className="border rounded p-2"
                value={row.upc}
                onChange={e => updateNewItem(idx, 'upc', e.target.value)}
              >
                <option value="">Виберіть товар</option>
                {storeItems.map(si => (
                  <option key={si.upc} value={si.upc}>{si.productName} ({si.upc})</option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                className="w-20 border rounded p-2"
                value={row.quantity}
                onChange={e => updateNewItem(idx, 'quantity', e.target.value)}
              />
              <span className="p-2">Ціна: {Number(row.price).toFixed(2)}</span>
              <button type="button" onClick={() => removeNewItemRow(idx)} className="text-red-600">Видалити</button>
            </div>
          ))}
          <button type="button" onClick={addNewItemRow} className="bg-blue-600 text-white px-3 py-1 rounded mb-2">Додати товар</button>
          <br />
          <button type="button" onClick={submitNewReceipt} className="bg-green-600 text-white px-4 py-2 rounded">Створити чек</button>
        </div>
      )}

      {isManager && (
        <>
          <div className="mb-4">
            <p className="font-semibold">Загальна сума всіх відображених чеків (з ПДВ): {totalOfFiltered.toFixed(2)}</p>
          </div>
          <div className="mb-4 bg-white p-4 rounded shadow grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1">Номер чеку</label>
              <input
                type="text"
                className="w-full border rounded p-2"
                placeholder="Введіть ID чеку"
                value={filters.receiptId}
                onChange={e => {
                  const val = e.target.value.trim();
                  setFilters(prev => ({ ...prev, receiptId: val }));
                }}
              />
            </div>
            <div>
              <label className="block mb-1">Касир</label>
              <select
                className="w-full border rounded p-2"
                value={filters.cashierId}
                onChange={e => setFilters(prev => ({ ...prev, cashierId: e.target.value }))}
                disabled={!!filters.receiptId}
              >
                <option value="">Усі</option>
                {cashiers.map(c => (
                  <option key={c.id} value={c.id}>{c.fullName || c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1">Початок</label>
              <input
                type="date"
                className="w-full border rounded p-2"
                value={filters.startDate}
                onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                disabled={!!filters.receiptId}
              />
            </div>
            <div>
              <label className="block mb-1">Кінець</label>
              <input
                type="date"
                className="w-full border rounded p-2"
                value={filters.endDate}
                onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                disabled={!!filters.receiptId}
              />
            </div>
            {filters.receiptId && (
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setFilters({ cashierId: '', startDate: '', endDate: '', receiptId: '' });
                    setError(null);
                    setReceiptNotFound(false);
                  }}
                  className="bg-gray-500 text-white px-3 py-1 rounded"
                >
                  Очистити пошук
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {filters.receiptId && receiptNotFound ? (
        <p className="text-gray-700">Чек з ID {filters.receiptId} не знайдено</p>
      ) : (
        <table className="w-full bg-white shadow rounded mb-4">
          <thead>
            <tr>
              <th className="p-2">ID</th>
              <th className="p-2">Касир</th>
              <th className="p-2">Дата</th>
              <th className="p-2">Сума</th>
              <th className="p-2">ПДВ</th>
              <th className="p-2">Загальна</th>
              <th className="p-2">Дії</th>
            </tr>
          </thead>
          <tbody>
            {receipts.map(r => {
              const total = parseFloat(r.total) || 0;
              const vat = parseFloat(r.vat) || 0;
              const totalWithVat = total + vat;
              return (
                <tr
                  key={r.id}
                  className={`border-t ${selectedReceipt && selectedReceipt.id === r.id ? 'bg-yellow-100' : ''}`}
                >
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.cashierName}</td>
                  <td className="p-2">{new Date(r.date).toLocaleString()}</td>
                  <td className="p-2">{total.toFixed(2)}</td>
                  <td className="p-2">{vat.toFixed(2)}</td>
                  <td className="p-2">{totalWithVat.toFixed(2)}</td>
                  <td className="p-2">
                    <button onClick={() => viewReceipt(r.id)} className="mr-2 text-blue-600">Деталі</button>
                    {isManager && <button onClick={() => deleteReceiptFn(r.id)} className="text-red-600">Видалити</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selectedReceipt && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="text-xl mb-2">Чек {selectedReceipt.id}</h3>
          <p>Касир: {selectedReceipt.cashierName}</p>
          <p>Дата: {new Date(selectedReceipt.date).toLocaleString()}</p>
          <p>Сума: {Number(selectedReceipt.total).toFixed(2)}</p>
          <p>ПДВ: {Number(selectedReceipt.vat).toFixed(2)}</p>
          <p>Загальна (з ПДВ): {(Number(selectedReceipt.total) + Number(selectedReceipt.vat)).toFixed(2)}</p>
          {/* Інформація про клієнтську карту */}
          {selectedReceipt.card_number ? (
            <p>Клієнтська карта: {selectedReceipt.card_number}</p>
          ) : (
            <p>Клієнтська карта: не використовувалась</p>
          )}
          <h4 className="mt-4 font-semibold">Товари</h4>
          <table className="w-full bg-white shadow rounded">
            <thead>
              <tr>
                <th className="p-2">Назва</th>
                <th className="p-2">UPC</th>
                <th className="p-2">Кількість</th>
                <th className="p-2">Ціна</th>
                <th className="p-2">Сума</th>
              </tr>
            </thead>
            <tbody>
              {selectedReceipt.items.map(item => (
                <tr key={item.upc} className="border-t">
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2">{item.upc}</td>
                  <td className="p-2">{item.quantity}</td>
                  <td className="p-2">{Number(item.price).toFixed(2)}</td>
                  <td className="p-2">{(Number(item.price) * item.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setSelectedReceipt(null)} className="mt-4 bg-gray-300 px-3 py-2 rounded">Закрити</button>
        </div>
      )}
    </div>
  );
}