import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { TrendingUp, AlertTriangle, Clock, PhilippinePeso } from 'lucide-react';

const Dashboard = () => {
  const [totalSales, setTotalSales] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to Sales (For Total Revenue & Recent List)
    const salesQuery = query(collection(db, "sales"), orderBy("date", "desc"), limit(10));
    
    const unsubSales = onSnapshot(salesQuery, (snapshot) => {
      let total = 0;
      const salesData = snapshot.docs.map(doc => {
        const data = doc.data();
        total += data.total; // Add to running total
        return { id: doc.id, ...data };
      });

      setTotalSales(total);
      setRecentSales(salesData);
    });

    // 2. Listen to Inventory (For Low Stock Alerts)
    const unsubInventory = onSnapshot(collection(db, "ingredients"), (snapshot) => {
      let count = 0;
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.currentStock <= data.lowStockThreshold) count++;
      });
      setLowStockCount(count);
      setLoading(false);
    });

    return () => { unsubSales(); unsubInventory(); };
  }, []);

  if (loading) return <div className="p-10">Loading Dashboard...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-800">📊 Store Overview</h1>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Revenue */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-emerald-100 text-emerald-600 rounded-xl">
            <PhilippinePeso size={32} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Total Revenue</p>
            <h3 className="text-3xl font-black text-slate-800">₱{totalSales.toFixed(2)}</h3>
          </div>
        </div>

        {/* Card 2: Low Stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className={`p-4 rounded-xl ${lowStockCount > 0 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
            <AlertTriangle size={32} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Low Stock Alerts</p>
            <h3 className="text-3xl font-black text-slate-800">{lowStockCount} Items</h3>
          </div>
        </div>

        {/* Card 3: Recent Activity */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
            <Clock size={32} />
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">Recent Transactions</p>
            <h3 className="text-3xl font-black text-slate-800">{recentSales.length}</h3>
          </div>
        </div>
      </div>

      {/* RECENT SALES TABLE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <TrendingUp className="text-emerald-500" />
          <h2 className="text-xl font-bold text-slate-800">Live Sales Feed</h2>
        </div>
        
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
            <tr>
              <th className="p-4 pl-6">Transaction ID</th>
              <th className="p-4">Items</th>
              <th className="p-4 text-right pr-6">Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {recentSales.map((sale) => (
              <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 pl-6 font-mono text-xs text-slate-400">
                  {sale.id.substring(0, 8)}...
                </td>
                <td className="p-4 text-slate-700">
                  {sale.items.map((i: any) => `${i.qty}x ${i.name}`).join(', ')}
                </td>
                <td className="p-4 text-right pr-6 font-bold text-slate-900">
                  ₱{sale.total.toFixed(2)}
                </td>
              </tr>
            ))}
            {recentSales.length === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-slate-400">No sales yet today. Go sell a burger!</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;