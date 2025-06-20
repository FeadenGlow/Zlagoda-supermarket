import { useContext, useEffect, useState, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

export default function Reports() {
  const { user } = useContext(AuthContext);
  if (user.role !== 'manager') return <p>Недостатньо прав</p>;

  const [reportType, setReportType] = useState('');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Общие списки
  const [cashiers, setCashiers] = useState([]);
  const [storeItems, setStoreItems] = useState([]);

  // Фильтры для чеков
  const [receiptFilters, setReceiptFilters] = useState({
    cashierId: '',
    startDate: '',
    endDate: '',
  });
  const [selectedProductUpc, setSelectedProductUpc] = useState('');
  const [totalQty, setTotalQty] = useState(null);

  // Хелперы fetch
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/users');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження працівників');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/customers');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження клієнтів');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/categories');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження категорій');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/products');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження товарів');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreItemsList = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/store-items');
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження товарів у магазині');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (receiptFilters.startDate) params.startDate = receiptFilters.startDate;
      if (receiptFilters.endDate) params.endDate = receiptFilters.endDate;
      if (receiptFilters.cashierId) params.cashierId = receiptFilters.cashierId;
      const res = await axios.get('/api/receipts', { params });
      setData(res.data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Помилка завантаження чеків');
    } finally {
      setLoading(false);
    }
  };

  // При смене типа отчета, сбрасываем данные и загружаем нужный список
  useEffect(() => {
    setData([]);
    setError(null);
    if (!reportType) return;
    switch (reportType) {
      case 'employees':
        fetchEmployees();
        break;
      case 'clients':
        fetchClients();
        break;
      case 'categories':
        fetchCategories();
        break;
      case 'products':
        fetchProducts();
        break;
      case 'store-items':
        fetchStoreItemsList();
        break;
      case 'receipts':
        // initial fetch for receipts when selecting report
        fetchReceipts();
        fetchCashiersList();
        fetchStoreItemsForSelect();
        break;
      default:
        break;
    }
  }, [reportType]);

  // Добавляем автоматический рефетч при изменении фильтров
  useEffect(() => {
    if (reportType === 'receipts') {
      fetchReceipts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [receiptFilters, reportType]);

  // Список касиров для фильтра
  const fetchCashiersList = async () => {
    try {
      const res = await axios.get('/api/users');
      const list = res.data.filter(u => u.role === 'cashier' || u.position === 'cashier');
      setCashiers(list);
    } catch (err) {
      console.error(err);
    }
  };
  // Список товаров для фильтра по UPC/название
  const fetchStoreItemsForSelect = async () => {
    try {
      const res = await axios.get('/api/store-items');
      setStoreItems(
        res.data.map(it => ({
          upc: it.upc,
          name: it.productName || it.name,
        }))
      );
    } catch (err) {
      console.error(err);
    }
  };

  // Подсчет общей суммы (с ПДВ) для отображенных чеков
  const totalSumReceipts = useMemo(() => {
    if (reportType !== 'receipts') return 0;
    return data.reduce((sum, r) => {
      const t = parseFloat(r.total) || 0;
      const v = parseFloat(r.vat) || 0;
      return sum + t + v;
    }, 0);
  }, [data, reportType]);

  // Подсчет кол-ва выбранного товара по отображенным чекам через API
  useEffect(() => {
    if (reportType !== 'receipts') return;
    if (!selectedProductUpc) {
      setTotalQty(null);
      return;
    }
    const fetchQty = async () => {
      try {
        const params = { productUpc: selectedProductUpc };
        if (receiptFilters.startDate) params.startDate = receiptFilters.startDate;
        if (receiptFilters.endDate) params.endDate = receiptFilters.endDate;
        if (receiptFilters.cashierId) params.cashierId = receiptFilters.cashierId;
        const res = await axios.get('/api/receipts/analytics/quantity', { params });
        setTotalQty(res.data.totalQty);
      } catch (err) {
        console.error(err);
      }
    };
    fetchQty();
  }, [selectedProductUpc, receiptFilters, reportType]);

  const handlePrint = () => {
    window.print();
  };

  // Відображення фільтрів для чеків: інпути тільки на екрані, а на друк - текст
  const renderFilters = () => {
    if (reportType === 'receipts') {
      const cashierName =
        receiptFilters.cashierId && cashiers.length
          ? cashiers.find(c => String(c.id) === String(receiptFilters.cashierId))?.name ||
            cashiers.find(c => String(c.id) === String(receiptFilters.cashierId))?.fullName ||
            cashiers.find(c => String(c.id) === String(receiptFilters.cashierId))?.username ||
            ''
          : 'Усі';
      const startDate = receiptFilters.startDate || '—';
      const endDate = receiptFilters.endDate || '—';
      const productName =
        selectedProductUpc && storeItems.length
          ? storeItems.find(si => String(si.upc) === String(selectedProductUpc))?.name
          : '';

      return (
        <div className="mb-4 bg-white p-4 rounded shadow grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="print:hidden">
            <label className="block mb-1">Касир</label>
            <select
              className="w-full border rounded p-2"
              value={receiptFilters.cashierId}
              onChange={e =>
                setReceiptFilters(prev => ({ ...prev, cashierId: e.target.value }))
              }
            >
              <option value="">Усі</option>
              {cashiers.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name || c.fullName || c.username}
                </option>
              ))}
            </select>
          </div>
          <div className="print:hidden">
            <label className="block mb-1">Початок</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={receiptFilters.startDate}
              onChange={e =>
                setReceiptFilters(prev => ({ ...prev, startDate: e.target.value }))
              }
            />
          </div>
          <div className="print:hidden">
            <label className="block mb-1">Кінець</label>
            <input
              type="date"
              className="w-full border rounded p-2"
              value={receiptFilters.endDate}
              onChange={e =>
                setReceiptFilters(prev => ({ ...prev, endDate: e.target.value }))
              }
            />
          </div>
          {/* Выбор товара для подсчета */}
          <div className="sm:col-span-2 print:hidden">
            <label className="block mb-1">Обрати товар для підрахунку кількості</label>
            <select
              className="w-full border rounded p-2"
              value={selectedProductUpc}
              onChange={e => setSelectedProductUpc(e.target.value)}
            >
              <option value="">Не обрано</option>
              {storeItems.map(si => (
                <option key={si.upc} value={si.upc}>
                  {si.name}
                </option>
              ))}
            </select>
            {selectedProductUpc && (
              <p className="mt-2">
                Загальна кількість одиниць: {totalQty != null ? totalQty : '...'}
              </p>
            )}
          </div>
          {/* Текстове відображення для друку */}
          <div className="col-span-4 print:block hidden">
            <div className="flex flex-wrap gap-4">
              <span>
                <strong>Касир:</strong> {cashierName}
              </span>
              <span>
                <strong>Початок:</strong> {startDate}
              </span>
              <span>
                <strong>Кінець:</strong> {endDate}
              </span>
              {selectedProductUpc && (
                <span>
                  <strong>Товар:</strong> {productName} | <strong>Кількість:</strong>{' '}
                  {totalQty != null ? totalQty : '...'}
                </span>
              )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTable = () => {
    if (!reportType) return null;
    if (loading) return <p>Завантаження...</p>;
    if (error) return <p className="text-red-600">{error}</p>;

    switch (reportType) {
      case 'employees':
        return (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Логін</th>
                <th>ПІБ</th>
                <th>Посада</th>
                <th>Зарплата</th>
                <th>Дата початку</th>
                <th>Дата народження</th>
                <th>Телефон</th>
                <th>Адреса</th>
              </tr>
            </thead>
            <tbody>
              {data.map(u => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>{u.username}</td>
                  <td>{u.fullName || u.name}</td>
                  <td>{u.role === 'manager' ? 'Менеджер' : 'Касир'}</td>
                  <td>{u.salary}</td>
                  <td>{u.startDate?.slice(0, 10)}</td>
                  <td>{u.birthDate?.slice(0, 10)}</td>
                  <td>{u.phone}</td>
                  <td>{u.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'clients':
        return (
          <table>
            <thead>
              <tr>
                <th>Номер карти</th>
                <th>ПІБ</th>
                <th>Телефон</th>
                <th>Адреса</th>
                <th>Знижка %</th>
              </tr>
            </thead>
            <tbody>
              {data.map(c => (
                <tr key={c.cardNumber}>
                  <td>{c.cardNumber}</td>
                  <td>{c.fullName}</td>
                  <td>{c.phone}</td>
                  <td>{c.address}</td>
                  <td>{c.discount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'categories':
        return (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Назва категорії</th>
              </tr>
            </thead>
            <tbody>
              {data.map(cat => (
                <tr key={cat.id}>
                  <td>{cat.id}</td>
                  <td>{cat.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'products':
        return (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Назва</th>
                <th>Виробник</th>
                <th>Характеристики</th>
                <th>Категорія</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.name}</td>
                  <td>{p.manufacturer}</td>
                  <td>{p.characteristics}</td>
                  <td>{p.categoryName || p.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'store-items':
        return (
          <table>
            <thead>
              <tr>
                <th>UPC</th>
                <th>Назва</th>
                <th>Категорія</th>
                <th>Ціна (з ПДВ)</th>
                <th>Кількість</th>
                <th>Акційний</th>
              </tr>
            </thead>
            <tbody>
              {data.map(it => (
                <tr key={it.upc}>
                  <td>{it.upc}</td>
                  <td>{it.productName || it.name}</td>
                  <td>{it.categoryName}</td>
                  <td>{Number(it.salePrice).toFixed(2)}</td>
                  <td>{it.quantity}</td>
                  <td>{it.isPromotional ? 'Так' : 'Ні'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
      case 'receipts':
        return (
          <>
            <p className="font-semibold mb-2">
              Загальна сума всіх відображених чеків (з ПДВ): {totalSumReceipts.toFixed(2)}
            </p>
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Касир</th>
                  <th>Дата</th>
                  <th>Сума</th>
                  <th>ПДВ</th>
                  <th>Загальна</th>
                </tr>
              </thead>
              <tbody>
                {data.map(r => {
                  const t = parseFloat(r.total) || 0;
                  const v = parseFloat(r.vat) || 0;
                  return (
                    <tr key={r.id}>
                      <td>{r.id}</td>
                      <td>{r.cashierName}</td>
                      <td>{new Date(r.date).toLocaleString()}</td>
                      <td>{t.toFixed(2)}</td>
                      <td>{v.toFixed(2)}</td>
                      <td>{(t + v).toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">Звіти</h1>
      <div className="mb-4">
        <label className="block mb-1">Оберіть звіт:</label>
        <select
          className="border rounded p-2"
          value={reportType}
          onChange={e => {
            setReportType(e.target.value);
            setSelectedProductUpc('');
            setReceiptFilters({ cashierId: '', startDate: '', endDate: '' });
          }}
        >
          <option value="">--</option>
          <option value="employees">Працівники</option>
          <option value="clients">Клієнти</option>
          <option value="categories">Категорії</option>
          <option value="products">Товари</option>
          <option value="store-items">Товари у магазині</option>
          <option value="receipts">Чеки</option>
        </select>
      </div>

      {reportType && (
        <>
          <button onClick={handlePrint} className="mb-4 bg-blue-600 text-white px-4 py-2 rounded print:hidden">
            Попередній перегляд / Друк
          </button>

          <div id="report-container" className="bg-white p-4 rounded shadow">
            <header className="mb-4">
              <h2 className="text-xl">
                Звіт: {' '}
                {{
                  employees: 'Працівники',
                  clients: 'Клієнти',
                  categories: 'Категорії',
                  products: 'Товари',
                  'store-items': 'Товари у магазині',
                  receipts: 'Чеки',
                }[reportType]}
              </h2>
              {reportType === 'receipts' && (
                <p className="text-sm print:hidden">
                  Фільтр: {receiptFilters.cashierId
                    ? `Касир ${cashiers.find(c => c.id === Number(receiptFilters.cashierId))?.name || ''}`
                    : 'Усі'},{' '}
                  {receiptFilters.startDate || '—'} - {receiptFilters.endDate || '—'}
                </p>
              )}
            </header>

            {renderFilters()}

            {renderTable()}

            <footer className="mt-4">
              <p className="text-sm">Звіт згенеровано: {new Date().toLocaleString()}</p>
            </footer>
          </div>
        </>
      )}
    </div>
  );
}
