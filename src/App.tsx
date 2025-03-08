import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/auth-context';
import { ProtectedRoute } from './components/auth/protected-route';
import { SignIn } from './components/auth/sign-in';
import { Dashboard } from './components/dashboard';
import CarDetails from './components/car-details';
import { History } from './components/history';
import { ThemeProvider } from './contexts/theme-context';

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/car-details"
              element={
                <ProtectedRoute>
                  <CarDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/car-details/:id"
              element={
                <ProtectedRoute>
                  <CarDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
