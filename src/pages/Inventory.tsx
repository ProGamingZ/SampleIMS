import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { AlertTriangle, CheckCircle, XCircle, Plus, Search, X, Save, Trash2, Utensils, Package } from 'lucide-react';

// --- TYPES ---
interface Ingredient {
  id: string;
  name: string;
  currentStock: number;
  lowStockThreshold: number;
  unit: string;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  imgUrl: string;
  category: string;
  recipe: { ingredientId: string; quantityRequired: number; name?: string }[];
}

const Inventory = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'products'>('ingredients');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Ingredient Modal State
  const [isIngModalOpen, setIsIngModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [ingForm, setIngForm] = useState({ name: '', currentStock: 0, lowStockThreshold: 10, unit: 'pcs' });

  // Product Modal State
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [prodForm, setProdForm] = useState({ 
    name: '', 
    basePrice: 0, 
    category: 'Food', 
    imgUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Food',
    recipe: [] as { ingredientId: string; quantityRequired: number }[] 
  });

  // 1. Real-time Listeners
  useEffect(() => {
    const unsubIng = onSnapshot(query(collection(db, "ingredients"), orderBy("name")), (snap) => {
      setIngredients(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Ingredient[]);
    });
    const unsubProd = onSnapshot(query(collection(db, "products"), orderBy("name")), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
      setLoading(false);
    });
    return () => { unsubIng(); unsubProd(); };
  }, []);

  // --- INGREDIENT LOGIC ---
  const openIngModal = (item?: Ingredient) => {
    if (item) {
      setEditingIngredient(item);
      setIngForm({ ...item });
    } else {
      setEditingIngredient(null);
      setIngForm({ name: '', currentStock: 0, lowStockThreshold: 10, unit: 'pcs' });
    }
    setIsIngModalOpen(true);
  };

  const saveIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingIngredient) {
      await updateDoc(doc(db, "ingredients", editingIngredient.id), {
        ...ingForm,
        currentStock: Number(ingForm.currentStock),
        lowStockThreshold: Number(ingForm.lowStockThreshold)
      });
    } else {
      await addDoc(collection(db, "ingredients"), {
        ...ingForm,
        currentStock: Number(ingForm.currentStock),
        lowStockThreshold: Number(ingForm.lowStockThreshold)
      });
    }
    setIsIngModalOpen(false);
  };

  // --- PRODUCT LOGIC ---
  const openProdModal = () => {
    setProdForm({ 
      name: '', 
      basePrice: 0, 
      category: 'Food', 
      imgUrl: 'https://placehold.co/400x300/e2e8f0/1e293b?text=Food',
      recipe: [] 
    });
    setIsProdModalOpen(true);
  };

  const toggleIngredientInRecipe = (ingId: string) => {
    setProdForm(prev => {
      const exists = prev.recipe.find(r => r.ingredientId === ingId);
      if (exists) {
        return { ...prev, recipe: prev.recipe.filter(r => r.ingredientId !== ingId) };
      }
      return { ...prev, recipe: [...prev.recipe, { ingredientId: ingId, quantityRequired: 1 }] };
    });
  };

  const updateRecipeQty = (ingId: string, qty: number) => {
    setProdForm(prev => ({
      ...prev,
      recipe: prev.recipe.map(r => r.ingredientId === ingId ? { ...r, quantityRequired: qty } : r)
    }));
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDoc(collection(db, "products"), {
      ...prodForm,
      basePrice: Number(prodForm.basePrice)
    });
    setIsProdModalOpen(false);
  };

  const deleteProduct = async (id: string) => {
    if(confirm("Delete this menu item?")) await deleteDoc(doc(db, "products", id));
  };

  if (loading) return <div className="p-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-slate-800">Inventory & Menu</h1>
        
        {/* TABS */}
        <div className="bg-slate-200 p-1 rounded-xl flex gap-1">
          <button 
            onClick={() => setActiveTab('ingredients')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'ingredients' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Raw Ingredients
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'products' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Menu Items
          </button>
        </div>
      </div>

      {/* --- INGREDIENTS VIEW --- */}
      {activeTab === 'ingredients' && (
        <>
          <div className="flex justify-between">
            <input 
              type="text" 
              placeholder="Search ingredients..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="p-3 rounded-xl border border-slate-200 w-64"
            />
            <button onClick={() => openIngModal()} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-bold flex gap-2 items-center">
              <Plus size={20} /> Add Ingredient
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ingredients.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
              <div key={item.id} onClick={() => openIngModal(item)} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:border-emerald-500 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg">{item.name}</h3>
                  <Package size={20} className="text-slate-400"/>
                </div>
                <div className="text-3xl font-black text-slate-800">{item.currentStock} <span className="text-sm font-medium text-slate-400">{item.unit}</span></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- PRODUCTS VIEW --- */}
      {activeTab === 'products' && (
        <>
          <div className="flex justify-end">
            <button onClick={openProdModal} className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold flex gap-2 items-center shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all">
              <Utensils size={20} /> Create New Menu Item
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(prod => (
              <div key={prod.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden group">
                <div className="h-48 bg-slate-100 relative">
                  <img src={prod.imgUrl} className="w-full h-full object-cover" />
                  <button onClick={() => deleteProduct(prod.id)} className="absolute top-2 right-2 bg-white/90 p-2 rounded-full text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                    <Trash2 size={18} />
                  </button>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-xl text-slate-800">{prod.name}</h3>
                    <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-sm font-bold">₱{prod.basePrice}</span>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Recipe:</p>
                  <div className="flex flex-wrap gap-2">
                    {prod.recipe && prod.recipe.map((r, idx) => {
                      // Lookup ingredient name
                      const ingName = ingredients.find(i => i.id === r.ingredientId)?.name || 'Unknown';
                      return (
                        <span key={idx} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                          {r.quantityRequired}x {ingName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* --- INGREDIENT MODAL (Reuse from Phase 2, simplified here) --- */}
      {isIngModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingIngredient ? 'Edit Ingredient' : 'New Ingredient'}</h2>
            <form onSubmit={saveIngredient} className="space-y-4">
              <input required placeholder="Name" className="w-full p-3 border rounded-xl" value={ingForm.name} onChange={e => setIngForm({...ingForm, name: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <input required type="number" placeholder="Stock" className="w-full p-3 border rounded-xl" value={ingForm.currentStock} onChange={e => setIngForm({...ingForm, currentStock: Number(e.target.value)})} />
                <input required placeholder="Unit" className="w-full p-3 border rounded-xl" value={ingForm.unit} onChange={e => setIngForm({...ingForm, unit: e.target.value})} />
              </div>
              <input required type="number" placeholder="Low Stock Threshold" className="w-full p-3 border rounded-xl" value={ingForm.lowStockThreshold} onChange={e => setIngForm({...ingForm, lowStockThreshold: Number(e.target.value)})} />
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">Save</button>
              <button type="button" onClick={() => setIsIngModalOpen(false)} className="w-full mt-2 text-slate-500 py-2">Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* --- PRODUCT BUILDER MODAL (THE NEW FEATURE) --- */}
      {isProdModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Utensils className="text-emerald-500" /> Construct New Menu Item
              </h2>
              <button onClick={() => setIsProdModalOpen(false)}><X size={24} className="text-slate-400" /></button>
            </div>
            
            <div className="p-8 overflow-y-auto flex-1 space-y-8">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Product Name</label>
                  <input required type="text" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="e.g. Bacon Deluxe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (₱)</label>
                  <input required type="number" value={prodForm.basePrice} onChange={e => setProdForm({...prodForm, basePrice: Number(e.target.value)})} className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold" placeholder="0.00" />
                </div>
              </div>

              {/* Recipe Builder */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-4">Recipe Construction (Select Ingredients)</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-100">
                  {ingredients.map(ing => {
                    const isSelected = prodForm.recipe.find(r => r.ingredientId === ing.id);
                    return (
                      <div key={ing.id} 
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-300'}`}
                        onClick={() => toggleIngredientInRecipe(ing.id)}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-sm truncate">{ing.name}</span>
                          {isSelected && <CheckCircle size={16} className="text-emerald-600" />}
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                            <input 
                              type="number" 
                              min="0.1"
                              step="0.1"
                              value={isSelected.quantityRequired}
                              onChange={(e) => updateRecipeQty(ing.id, Number(e.target.value))}
                              className="w-full p-1 text-center text-sm font-bold border border-emerald-200 rounded bg-white"
                            />
                            <span className="text-xs text-slate-500">{ing.unit}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-2">Click an ingredient to add it. Type the quantity needed per serving.</p>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <button onClick={saveProduct} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg">
                Launch Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;