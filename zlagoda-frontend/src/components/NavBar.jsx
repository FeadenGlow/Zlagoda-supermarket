import { Link } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);
  if (!user) return null;
  const role = user.role;
  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center">
      <div className="flex space-x-4">
        <Link to="/dashboard" className="hover:underline font-bold">ZLAGODA</Link>
        {/* Товари: доступ і менеджера, і касира */}
        <Link to="/products" className="hover:underline">Товари</Link>
        {/* Клієнти */}
        <Link to="/customers" className="hover:underline">Клієнти</Link>
        {/* Категорії */}
        <Link to="/categories" className="hover:underline">Категорії</Link>
        {/* Продажі: касир і менеджер */}
        <Link to="/sales" className="hover:underline">Продажі</Link>
        {/* Історія продажів: менеджер, можна дати касиру тільки перегляд */}
        {role === 'manager' && <Link to="/employees" className="hover:underline">Працівники</Link>}
        {/* Звіти: тільки менеджер */}
        {role === 'manager' && <Link to="/reports" className="hover:underline">Звіти</Link>}
      </div>
      <div className="flex items-center space-x-4">
        <span>{user.name || user.username}</span>
        <button onClick={logout} className="bg-red-500 px-2 py-1 rounded hover:bg-red-600 cursor-pointer">Вийти</button>
      </div>
    </nav>
  );
}