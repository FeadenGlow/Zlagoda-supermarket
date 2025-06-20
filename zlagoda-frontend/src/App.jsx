import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { useContext } from 'react';
import NavBar from './components/NavBar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageEmployees from './pages/ManageEmployees';
import ManageCategories from './pages/ManageCategories';
import ManageProducts from './pages/ManageProducts';
import ManageCustomers from './pages/ManageCustomers';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

function PrivateRoute({ children, roles }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NavBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          {/* Працівники, категорії: тільки менеджер */}
          <Route path="/employees" element={<PrivateRoute roles={[ 'manager' ]}><ManageEmployees /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute roles={[ 'manager' , 'cashier']}><ManageCategories /></PrivateRoute>} />
          {/* Товари: для касира і менеджера */}
          <Route path="/products" element={<PrivateRoute roles={[ 'manager', 'cashier' ]}><ManageProducts /></PrivateRoute>} />
          {/* Клієнти: для касира і менеджера */}
          <Route path="/customers" element={<PrivateRoute roles={[ 'manager', 'cashier' ]}><ManageCustomers /></PrivateRoute>} />
          {/* Продажі: для касира і менеджера */}
          <Route path="/sales" element={<PrivateRoute roles={[ 'manager','cashier' ]}><Sales /></PrivateRoute>} />
          {/* Звіти: тільки менеджер */}
          <Route path="/reports" element={<PrivateRoute roles={[ 'manager' ]}><Reports /></PrivateRoute>} />
          {/* Профіль/Допомога */}
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}