import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Minus, Trash2 } from 'lucide-react';

// Types
interface Product {
  id: string;
  name: string;
  basePrice: number;
  imgUrl: string;
  category: string;
}

interface CartItem extends Product {
  qty: number;
}

const Sell = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch Menu Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
      const menu = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[];
      setProducts(menu);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Cart Logic
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, qty: Math.max(0, item.qty + delta) };
      }
      return item;
    }).filter(item => item.qty > 0)); // Remove if 0
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.basePrice * item.qty), 0);

  if (loading) return <div className="p-10">Loading Menu...</div>;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* LEFT: Product Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">🍔 Menu</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div 
              key={product.id} 
              onClick={() => addToCart(product)}
              className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer transition-all border border-transparent hover:border-emerald-500 group"
            >
              <div className="aspect-video rounded-xl bg-slate-100 mb-4 overflow-hidden relative">
                <img src={product.imgUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
              <h3 className="font-bold text-slate-800">{product.name}</h3>
              <p className="text-emerald-600 font-bold">₱{product.basePrice.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT: The Receipt / Cart */}
      <div className="w-96 bg-white rounded-3xl shadow-xl flex flex-col border border-slate-200">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Current Order</h2>
          <p className="text-slate-400 text-sm">Order #0042</p>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <span className="text-4xl mb-2">🛒</span>
              <p>Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-bold text-slate-800">{item.name}</p>
                  <p className="text-slate-500 text-sm">₱{item.basePrice}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1">
                  <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-white rounded-md shadow-sm transition-colors text-slate-600"><Minus size={16} /></button>
                  <span className="font-bold w-4 text-center">{item.qty}</span>
                  <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-white rounded-md shadow-sm transition-colors text-emerald-600"><Plus size={16} /></button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer: Totals & Button */}
        <div className="p-6 bg-slate-50 rounded-b-3xl border-t border-slate-100">
          <div className="flex justify-between mb-4 text-slate-600">
            <span>Subtotal</span>
            <span>₱{cartTotal.toFixed(2)}</span>
          </div>
          
          <div className="flex justify-between mb-6 text-xl font-black text-slate-900">
            <span>Total</span>
            <span>₱{cartTotal.toFixed(2)}</span>
          </div>

          <button 
            disabled={cart.length === 0}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            Charge ₱{cartTotal.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sell;