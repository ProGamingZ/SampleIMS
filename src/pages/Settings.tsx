import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Calculator, Save } from 'lucide-react';

interface StoreSettings {
  storeName: string;
  taxSettings: {
    enableTax: boolean;
    vatRate: number;
    serviceChargeRate: number;
    isVatInclusive: boolean;
  };
}

const Settings = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Listen to Real-time Settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "global_config"), (doc) => {
      if (doc.exists()) {
        setSettings(doc.data() as StoreSettings);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Handle Toggles (Updates Firebase Instantly)
  const toggleSetting = async (key: string, value: boolean | number) => {
    if (!settings) return;
    
    const settingRef = doc(db, "settings", "global_config");
    await updateDoc(settingRef, {
      [`taxSettings.${key}`]: value
    });
  };

  if (loading || !settings) return <div className="p-10">Loading Config...</div>;

  // --- THE MATH ENGINE ---
  // We simulate a ₱1,000.00 transaction to show how the breakdown changes
  const SAMPLE_TOTAL = 1000;
  
  // Philippine VAT Logic: 
  // If VAT is enabled, the Price includes VAT. 
  // Vatable Sales = Total / 1.12
  const vatableSales = settings.taxSettings.enableTax 
    ? SAMPLE_TOTAL / (1 + settings.taxSettings.vatRate) 
    : SAMPLE_TOTAL;
    
  const vatAmount = settings.taxSettings.enableTax 
    ? vatableSales * settings.taxSettings.vatRate 
    : 0;

  // Service Charge is usually on top of the base price
  // For this demo, let's assume SC is added ON TOP of the sample total if enabled
  const serviceCharge = settings.taxSettings.serviceChargeRate > 0 
    ? SAMPLE_TOTAL * settings.taxSettings.serviceChargeRate 
    : 0;

  const finalCustomerPay = SAMPLE_TOTAL + serviceCharge;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
        <Calculator className="text-emerald-500" /> 
        Tax & Store Configuration
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* LEFT: The Controls */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Compliance Settings</h2>
            <div className="space-y-6">
              
              {/* Toggle 1: VAT */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Enable 12% VAT</p>
                  <p className="text-sm text-slate-500">Calculates Vatable Sales & VAT Amount</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.taxSettings.enableTax}
                    onChange={(e) => toggleSetting('enableTax', e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {/* Toggle 2: Service Charge */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-700">Enable 10% Service Charge</p>
                  <p className="text-sm text-slate-500">Adds 10% on top of the bill</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={settings.taxSettings.serviceChargeRate > 0}
                    // A simple hack: toggle between 0.10 (10%) and 0.00 (0%)
                    onChange={(e) => toggleSetting('serviceChargeRate', e.target.checked ? 0.10 : 0.00)}
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT: The Live Preview (The "Utak" Feature) */}
        <div className="bg-slate-900 text-slate-300 p-8 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
          
          <h2 className="text-xl font-bold text-white mb-6 relative z-10">Live Receipt Preview</h2>
          <p className="text-sm mb-6 text-slate-400">Simulation based on a ₱1,000.00 Order</p>

          <div className="space-y-3 font-mono relative z-10">
            <div className="flex justify-between">
              <span>Gross Sales</span>
              <span>₱{SAMPLE_TOTAL.toFixed(2)}</span>
            </div>
            
            <div className="h-px bg-slate-700 my-2"></div>

            <div className="flex justify-between text-emerald-400">
              <span>Vatable Sales</span>
              <span>₱{vatableSales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-400">
              <span>VAT Amount (12%)</span>
              <span>₱{vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-yellow-400">
              <span>Service Charge (10%)</span>
              <span>₱{serviceCharge.toFixed(2)}</span>
            </div>

            <div className="h-px bg-slate-700 my-4"></div>

            <div className="flex justify-between text-2xl font-bold text-white">
              <span>Total Due</span>
              <span>₱{finalCustomerPay.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;