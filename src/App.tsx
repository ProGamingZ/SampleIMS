import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Sell from './pages/Sell';
import Inventory from './pages/Inventory';
import Settings from './pages/Settings';

// Placeholder pages (We will build these properly next!)
const Dashboard = () => <div className="text-3xl font-bold">📊 Dashboard Overview</div>;

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="sell" element={<Sell />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;