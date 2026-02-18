import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

// Define the shape of our data
interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
}

const Inventory = () => {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time Listener
  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("name"));
    
    // This updates AUTOMATICALLY when the database changes
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const inventoryList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ingredient[];
      
      setIngredients(inventoryList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Traffic Light Logic
  const getStockStatus = (current: number, threshold: number) => {
    if (current === 0) return { color: "bg-red-100 border-red-500 text-red-700", icon: <XCircle />, label: "Out of Stock" };
    if (current <= threshold) return { color: "bg-yellow-100 border-yellow-500 text-yellow-800", icon: <AlertTriangle />, label: "Low Stock" };
    return { color: "bg-emerald-100 border-emerald-500 text-emerald-700", icon: <CheckCircle />, label: "Good" };
  };

  if (loading) return <div className="p-10 text-xl">Loading Inventory...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-800">📦 Inventory Management</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map((item) => {
          const status = getStockStatus(item.currentStock, item.lowStockThreshold);
          
          return (
            <div key={item.id} className={`p-6 rounded-2xl border-l-8 shadow-sm bg-white flex justify-between items-center ${status.color.replace('bg-', 'border-')}`}>
              <div>
                <h3 className="text-xl font-bold text-slate-800">{item.name}</h3>
                <p className="text-slate-500 text-sm uppercase tracking-wide mt-1">
                  Threshold: {item.lowStockThreshold} {item.unit}
                </p>
              </div>
              
              <div className="text-right">
                <div className="text-4xl font-black text-slate-900">
                  {item.currentStock}
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 mt-1 ${status.color}`}>
                  {status.icon}
                  {status.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inventory;