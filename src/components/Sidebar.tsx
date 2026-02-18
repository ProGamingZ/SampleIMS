import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ShoppingCart, Settings, Package, LogOut } from 'lucide-react';

const Sidebar = () => {
  const navItems = [
    { icon: <LayoutDashboard size={24} />, label: "Dashboard", path: "/" },
    { icon: <ShoppingCart size={24} />, label: "Sell", path: "/sell" },
    { icon: <Package size={24} />, label: "Inventory", path: "/inventory" },
    { icon: <Settings size={24} />, label: "Settings", path: "/settings" },
  ];

  return (
    <aside className="w-20 lg:w-64 bg-slate-900 text-white flex flex-col h-screen sticky top-0 transition-all duration-300">
      {/* Brand Logo area */}
      <div className="h-20 flex items-center justify-center border-b border-slate-800">
        <div className="font-bold text-2xl tracking-tighter text-emerald-400">
          V<span className="hidden lg:inline">ibePOS</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-6 flex flex-col gap-2 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-4 px-4 py-4 rounded-xl transition-colors duration-200 group
              ${isActive 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`
            }
          >
            <div className="w-6 h-6">{item.icon}</div>
            <span className="font-medium text-lg hidden lg:block">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-4 px-4 py-3 w-full rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors">
          <LogOut size={24} />
          <span className="font-medium hidden lg:block">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;