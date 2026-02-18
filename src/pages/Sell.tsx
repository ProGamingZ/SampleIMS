import { useEffect, useState } from 'react';
import { collection, onSnapshot, runTransaction, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, Minus, Loader2, Receipt } from 'lucide-react';

// Interfaces
interface StoreSettings {
  taxSettings: {
    enableTax: boolean;
    vatRate: number;
    serviceChargeRate: number;
  };
}

interface IngredientRecipe {
  ingredientId: string;
  quantityRequired: number;
}

interface Product {
  id: string;
  name: string;
  basePrice: number;
  imgUrl: string;
  recipe: IngredientRecipe[];
}

interface CartItem extends Product {
  qty: number;
}

const Sell = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // 1. Listen to Products
    const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() })) as Product[]);
    });

    // 2. Listen to Tax Settings
    const unsubSettings = onSnapshot(doc(db, "settings", "global_config"), (d) => {
      if (d.exists()) setSettings(d.data() as StoreSettings);
      setLoading(false);
    });

    return () => { unsubProducts(); unsubSettings(); };
  }, []);

  // --- CART ACTIONS ---
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
    }).filter(item => item.qty > 0));
  };

  // --- DYNAMIC MATH ENGINE ---
  const subtotal = cart.reduce((sum, item) => sum + (item.basePrice * item.qty), 0);
  
  // VAT Logic
  const vatableSales = settings?.taxSettings.enableTax 
    ? subtotal / (1 + settings.taxSettings.vatRate) 
    : subtotal;
    
  const vatAmount = settings?.taxSettings.enableTax 
    ? vatableSales * settings.taxSettings.vatRate 
    : 0;

  // Service Charge
  const serviceCharge = (settings?.taxSettings.serviceChargeRate || 0) * subtotal;
  const grandTotal = subtotal + serviceCharge;

  // --- CHECKOUT LOGIC (The Button Action) ---
  const handleCheckout = async () => {
    setProcessing(true);
    
    try {
      await runTransaction(db, async (transaction) => {
        // Step A: Calculate totals needed
        const ingredientsNeeded = new Map<string, number>();

        cart.forEach((cartItem) => {
          if (cartItem.recipe) {
            cartItem.recipe.forEach((ing) => {
              const totalNeeded = ing.quantityRequired * cartItem.qty;
              const currentCount = ingredientsNeeded.get(ing.ingredientId) || 0;
              ingredientsNeeded.set(ing.ingredientId, currentCount + totalNeeded);
            });
          }
        });

        // --- PHASE 1: READ ALL ---
        const ingredientDocs = [];
        for (const [ingId, qtyNeeded] of ingredientsNeeded.entries()) {
          const ingRef = doc(db, "ingredients", ingId);
          const ingDoc = await transaction.get(ingRef);
          
          if (!ingDoc.exists()) {
            throw "System Error: Ingredient not found in database!";
          }
          
          ingredientDocs.push({ 
            ref: ingRef, 
            data: ingDoc.data(), 
            needed: qtyNeeded,
            name: ingDoc.data().name 
          });
        }

        // --- PHASE 2: WRITE ALL ---
        for (const item of ingredientDocs) {
          if (item.data.currentStock < item.needed) {
             throw `Out of Stock: ${item.name}. You need ${item.needed} but only have ${item.data.currentStock}.`;
          }

          transaction.update(item.ref, {
            currentStock: item.data.currentStock - item.needed
          });
        }
      });

      // Success!
      alert("✅ Sale Successful! Inventory Updated.");
      setCart([]); 

    } catch (error) {
      console.error(error);
      alert("❌ Transaction Failed: " + error);
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !settings) return <div className="p-10">Loading POS...</div>;

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-6">
      {/* Menu Grid */}
      <div className="flex-1 overflow-y-auto pr-2">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">🍔 Menu</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} onClick={() => addToCart(product)} className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md cursor-pointer border border-transparent hover:border-emerald-500">
              <div className="aspect-video rounded-xl bg-slate-100 mb-4 overflow-hidden relative">
                 <img src={product.imgUrl} className="w-full h-full object-cover" />
              </div>
              <h3 className="font-bold text-slate-800">{product.name}</h3>
              <p className="text-emerald-600 font-bold">₱{product.basePrice.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Receipt */}
      <div className="w-96 bg-white rounded-3xl shadow-xl flex flex-col border border-slate-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">Order Summary</h2>
          <Receipt size={20} className="text-slate-400" />
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex justify-between items-center animate-in fade-in slide-in-from-right-4">
              <div className="flex-1">
                <p className="font-bold text-slate-800">{item.name}</p>
                <p className="text-slate-500 text-sm">₱{item.basePrice} x {item.qty}</p>
              </div>
              
              <div className="flex items-center gap-2 mr-4">
                 <button onClick={() => updateQty(item.id, -1)} className="p-1 hover:bg-slate-100 rounded text-slate-500"><Minus size={14}/></button>
                 <span className="text-sm font-bold">{item.qty}</span>
                 <button onClick={() => updateQty(item.id, 1)} className="p-1 hover:bg-slate-100 rounded text-emerald-600"><Plus size={14}/></button>
              </div>

              <p className="font-bold">₱{(item.basePrice * item.qty).toFixed(2)}</p>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-50 rounded-b-3xl border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-slate-500 text-sm">
            <span>Vatable Sales</span>
            <span>₱{vatableSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-sm">
            <span>VAT (12%)</span>
            <span>₱{vatAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-yellow-600 font-medium text-sm">
            <span>Service Charge ({(settings.taxSettings.serviceChargeRate * 100).toFixed(0)}%)</span>
            <span>₱{serviceCharge.toFixed(2)}</span>
          </div>
          <div className="h-px bg-slate-200 my-2"></div>
          <div className="flex justify-between text-2xl font-black text-slate-900">
            <span>Total</span>
            <span>₱{grandTotal.toFixed(2)}</span>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || processing}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold mt-4 shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? <Loader2 className="animate-spin" /> : `Pay ₱${grandTotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sell;