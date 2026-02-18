import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, CheckCircle, XCircle, Plus, Search, X, Save, Trash2 } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);

  // Form State
  const [formData, setFormData] = useState({ name: '', currentStock: 0, lowStockThreshold: 10, unit: 'pcs' });

  // 1. Real-time Listener
  useEffect(() => {
    const q = query(collection(db, "ingredients"), orderBy("name"));
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

  // 2. Open Modal Logic
  const openAddModal = () => {
    setEditingItem(null); // Null means "Create New"
    setFormData({ name: '', currentStock: 0, lowStockThreshold: 10, unit: 'pcs' });
    setIsModalOpen(true);
  };

  const openEditModal = (item: Ingredient) => {
    setEditingItem(item); // Object means "Edit Mode"
    setFormData({ 
      name: item.name, 
      currentStock: item.currentStock, 
      lowStockThreshold: item.lowStockThreshold, 
      unit: item.unit 
    });
    setIsModalOpen(true);
  };

  // 3. Save Logic (Create OR Update)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // UPDATE Existing
        const itemRef = doc(db, "ingredients", editingItem.id);
        await updateDoc(itemRef, {
          name: formData.name,
          currentStock: Number(formData.currentStock),
          lowStockThreshold: Number(formData.lowStockThreshold),
          unit: formData.unit
        });
      } else {
        // CREATE New
        await addDoc(collection(db, "ingredients"), {
          name: formData.name,
          currentStock: Number(formData.currentStock),
          lowStockThreshold: Number(formData.lowStockThreshold),
          unit: formData.unit
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save item.");
    }
  };

  // 4. Delete Logic
  const handleDelete = async () => {
    if (!editingItem) return;
    if (confirm(`Are you sure you want to delete ${editingItem.name}? This might break recipes!`)) {
      await deleteDoc(doc(db, "ingredients", editingItem.id));
      setIsModalOpen(false);
    }
  };

  // Helper: Traffic Light
  const getStockStatus = (current: number, threshold: number) => {
    if (current === 0) return { color: "bg-red-100 border-red-500 text-red-700", icon: <XCircle />, label: "Out of Stock" };
    if (current <= threshold) return { color: "bg-yellow-100 border-yellow-500 text-yellow-800", icon: <AlertTriangle />, label: "Low Stock" };
    return { color: "bg-emerald-100 border-emerald-500 text-emerald-700", icon: <CheckCircle />, label: "Good" };
  };

  // Helper: Filter items
  const filteredIngredients = ingredients.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="p-10 text-xl">Loading Inventory...</div>;

  return (
    <div className="space-y-6 relative">
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800">📦 Inventory</h1>
        
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-3 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button 
            onClick={openAddModal}
            className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 transition-colors"
          >
            <Plus size={20} /> Add Item
          </button>
        </div>
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredIngredients.map((item) => {
          const status = getStockStatus(item.currentStock, item.lowStockThreshold);
          return (
            <div 
              key={item.id} 
              onClick={() => openEditModal(item)}
              className={`p-6 rounded-2xl border-l-8 shadow-sm bg-white flex justify-between items-center cursor-pointer hover:shadow-md transition-all group ${status.color.replace('bg-', 'border-')}`}
            >
              <div>
                <h3 className="text-xl font-bold text-slate-800 group-hover:text-emerald-600 transition-colors">{item.name}</h3>
                <p className="text-slate-500 text-sm uppercase tracking-wide mt-1">
                  Threshold: {item.lowStockThreshold} {item.unit}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-slate-900">{item.currentStock}</div>
                <div className={`text-xs font-bold px-2 py-1 rounded-full inline-flex items-center gap-1 mt-1 ${status.color}`}>
                  {status.icon} {status.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- THE SMART MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">
                {editingItem ? 'Edit / Restock Item' : 'Add New Ingredient'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={24} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Ingredient Name</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="e.g. Cheese Slices"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Stock</label>
                  <input 
                    required
                    type="number" 
                    value={formData.currentStock}
                    onChange={(e) => setFormData({...formData, currentStock: Number(e.target.value)})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit</label>
                  <input 
                    required
                    type="text" 
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="e.g. pcs, kg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Low Stock Threshold</label>
                <p className="text-xs text-slate-400 mb-2">Alert me when stock is below this number</p>
                <input 
                  required
                  type="number" 
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({...formData, lowStockThreshold: Number(e.target.value)})}
                  className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="pt-4 flex gap-3">
                {editingItem && (
                  <button 
                    type="button"
                    onClick={handleDelete}
                    className="px-4 py-3 rounded-xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  type="submit"
                  className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all flex justify-center items-center gap-2"
                >
                  <Save size={20} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;