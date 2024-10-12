import { Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/dashboard';
import { CarDetails } from './components/car-details';
import { History } from './components/history';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/car-details" element={<CarDetails />} />
      <Route path="/history" element={<History />} />
    </Routes>
  );
}

export default App;
