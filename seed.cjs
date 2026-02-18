const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// 1. Initialize the Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- THE DATA ---

// A. Ingredients (Raw Stock)
const ingredients = [
  {
    id: "ing_bun",
    data: { name: "Burger Buns", unit: "pcs", currentStock: 50, lowStockThreshold: 10, cost: 5.00 }
  },
  {
    id: "ing_patty",
    data: { name: "Beef Patty (100g)", unit: "pcs", currentStock: 42, lowStockThreshold: 15, cost: 25.00 }
  },
  {
    id: "ing_cheese",
    data: { name: "Cheddar Slice", unit: "slice", currentStock: 100, lowStockThreshold: 20, cost: 3.50 }
  },
  {
    id: "ing_lettuce",
    data: { name: "Iceberg Lettuce", unit: "grams", currentStock: 500, lowStockThreshold: 100, cost: 0.50 }
  }
];

// B. Products (The Menu)
const products = [
  {
    id: "prod_classic_burger",
    data: {
      name: "Classic Cheeseburger",
      category: "Mains",
      basePrice: 150.00,
      imgUrl: "https://placehold.co/400x300?text=Burger", // Placeholder image
      recipe: [
        { ingredientId: "ing_bun", quantityRequired: 1 },
        { ingredientId: "ing_patty", quantityRequired: 1 },
        { ingredientId: "ing_cheese", quantityRequired: 1 },
        { ingredientId: "ing_lettuce", quantityRequired: 20 } // 20 grams
      ]
    }
  },
  {
    id: "prod_double_burger",
    data: {
      name: "Double Decker",
      category: "Mains",
      basePrice: 240.00,
      imgUrl: "https://placehold.co/400x300?text=Double",
      recipe: [
        { ingredientId: "ing_bun", quantityRequired: 1 },
        { ingredientId: "ing_patty", quantityRequired: 2 }, // Uses 2 patties!
        { ingredientId: "ing_cheese", quantityRequired: 2 },
        { ingredientId: "ing_lettuce", quantityRequired: 30 }
      ]
    }
  }
];

// C. Settings (PH Tax Logic)
const settings = {
  id: "global_config",
  data: {
    storeName: "Vibe Burger Joint",
    currency: "PHP",
    taxSettings: {
      enableTax: true,
      vatRate: 0.12,          // 12% VAT
      serviceChargeRate: 0.10,// 10% Service Charge
      isVatInclusive: true    // Price on menu includes VAT
    }
  }
};

// --- THE SEEDING FUNCTION ---

async function seedDatabase() {
  const batch = db.batch(); // Use a batch for atomic writes (all or nothing)

  console.log("🌱 Starting Seed Process...");

  // 1. Queue Ingredients
  ingredients.forEach((ing) => {
    const ref = db.collection("ingredients").doc(ing.id);
    batch.set(ref, ing.data);
  });
  console.log(`📦 Queued ${ingredients.length} ingredients.`);

  // 2. Queue Products
  products.forEach((prod) => {
    const ref = db.collection("products").doc(prod.id);
    batch.set(ref, prod.data);
  });
  console.log(`🍔 Queued ${products.length} products.`);

  // 3. Queue Settings
  const settingsRef = db.collection("settings").doc(settings.id);
  batch.set(settingsRef, settings.data);
  console.log(`⚙️ Queued Settings.`);

  // 4. Commit to Firestore
  await batch.commit();
  console.log("✅ Database successfully seeded! Ready for Vibe Coding.");
}

seedDatabase().catch(console.error);