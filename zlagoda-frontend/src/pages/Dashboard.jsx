import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  if (!user) return null;
  const role = user.role;
  // Набір кнопок залежно від ролі
  const buttons = [];
  if (role === 'manager') {
    buttons.push(
      { to: '/employees', label: 'Управління працівниками' },
      { to: '/categories', label: 'Управління категоріями' },
      { to: '/products', label: 'Управління товарами' },
      { to: '/customers', label: 'Управління клієнтами' },
      { to: '/sales', label: 'Продажі' },
      { to: '/reports', label: 'Звіти' },
    );
  }
  if (role === 'cashier') {
    buttons.push(
      { to: '/products', label: 'Товари' },
      { to: '/categories', label: 'Категорії' },
      { to: '/customers', label: 'Клієнти' },
      { to: '/sales', label: 'Продажі' },
    );
  }
  // Завжди доступно: профіль, допомога
  buttons.push({ to: '/profile', label: 'Профіль' });

  return (
    <div className="p-6">
      <h1 className="text-2xl mb-4">ZLAGODA</h1>
      <p className="mb-6">Ласкаво просимо, {user.name || user.username}!</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {buttons.map((btn) => (
          <Link
            key={btn.to}
            to={btn.to}
            className="bg-blue-500 text-white p-4 rounded shadow hover:bg-blue-600 text-center"
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  );
}