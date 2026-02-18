import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Inventory from './pages/Inventory';
import Sell from './pages/Sell';

// Placeholder pages (We will build these properly next!)
const Dashboard = () => <div className="text-3xl font-bold">📊 Dashboard Overview</div>;
const Settings = () => <div className="text-3xl font-bold">⚙️ System Settings</div>;

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