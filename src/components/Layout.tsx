import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => {
  return (
    <div className="flex bg-slate-100 min-h-screen font-sans text-slate-900">
      {/* 1. Fixed Sidebar */}
      <Sidebar />

      {/* 2. Main Scrollable Content Area */}
      <main className="flex-1 h-screen overflow-y-auto overflow-x-hidden relative">
        {/* Header/Top Bar (Optional, good for showing user info or clock) */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-slate-800">Welcome Back, Chef</h2>
          <div className="text-sm text-slate-500">{new Date().toDateString()}</div>
        </header>

        {/* 3. The "Outlet" is where your pages (Dashboard, Inventory) appear */}
        <div className="p-6 lg:p-10 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;