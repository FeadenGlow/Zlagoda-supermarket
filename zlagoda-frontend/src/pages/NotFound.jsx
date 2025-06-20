import { Link } from 'react-router-dom';
export default function NotFound() {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl mb-4">Сторінку не знайдено</h2>
      <Link to="/dashboard" className="text-blue-500 underline">Повернутися на Dashboard</Link>
    </div>
  );
}