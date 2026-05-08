import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import CalendarPage from './pages/CalendarPage';
import ClientsPage from './pages/ClientsPage';
import EventsPage from './pages/EventsPage';
import QuotesPage from './pages/QuotesPage';
import EventRequestPage from './pages/EventRequestPage';
import EventSummaryPage from './pages/EventSummaryPage';
import EventMenuPage from './pages/EventMenuPage';
import EventSectionPlaceholderPage from './pages/EventSectionPlaceholderPage';
import EventMontagePage from './pages/EventMontagePage';
import EventQuotePage from './pages/EventQuotePage';
import EventPaymentsPage from './pages/EventPaymentsPage';
import EventAgendaPage from './pages/EventAgendaPage';
import CatalogsPage from './pages/CatalogsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Ruta pública de login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><CalendarPage /></ProtectedRoute>} />
            <Route path="quotes" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><QuotesPage /></ProtectedRoute>} />
            <Route path="clients" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><ClientsPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><ReportsPage /></ProtectedRoute>} />
            <Route
              path="users"
              element={
                <ProtectedRoute requiredRoles="ADMINISTRADOR">
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            
            {/* Catálogos - Solo ADMINISTRADOR y GERENTE */}
            <Route
              path="catalogs"
              element={
                <ProtectedRoute requiredRoles="ADMINISTRADOR">
                  <CatalogsPage />
                </ProtectedRoute>
              }
            />
            
            <Route path="events" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventsPage /></ProtectedRoute>} />
            <Route path="events/request" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventRequestPage /></ProtectedRoute>} />
            <Route path="events/:eventId" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventSummaryPage /></ProtectedRoute>} />
            <Route path="events/:eventId/menu" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventMenuPage /></ProtectedRoute>} />
            <Route path="events/:eventId/agenda" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventAgendaPage /></ProtectedRoute>} />
            <Route path="events/:eventId/montaje" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventMontagePage /></ProtectedRoute>} />
            <Route path="events/:eventId/cotizacion" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventQuotePage /></ProtectedRoute>} />
            
            {/* Pagos - Solo ADMINISTRADOR, GERENTE y TESORERO */}
            <Route
              path="events/:eventId/pagos"
              element={
                <ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}>
                  <EventPaymentsPage />
                </ProtectedRoute>
              }
            />
            
            <Route path="events/:eventId/:section" element={<ProtectedRoute requiredRoles={['ADMINISTRADOR', 'GERENTE', 'TESORERO']}><EventSectionPlaceholderPage /></ProtectedRoute>} />
          </Route>

          {/* Redirigir cualquier ruta no encontrada al inicio */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
