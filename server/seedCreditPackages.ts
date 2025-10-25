import { storage } from "./storage";

const creditPackages = [
  {
    name: "Starter Pack",
    credits: "100",
    priceUSD: "10",
    description: "Perfect for trying out additional content transformations",
    isActive: "true",
  },
  {
    name: "Creator Pack",
    credits: "500",
    priceUSD: "40",
    description: "Great value for regular content creators - save $10",
    isActive: "true",
  },
  {
    name: "Pro Pack",
    credits: "1000",
    priceUSD: "75",
    description: "Best value for power users - save $25",
    isActive: "true",
  },
  {
    name: "Enterprise Pack",
    credits: "3000",
    priceUSD: "180",
    description: "Maximum credits for high-volume content production - save $120",
    isActive: "true",
  },
];

async function seedCreditPackages() {
  console.log("Seeding credit packages...");
  
  try {
    const existingPackages = await storage.getCreditPackages();
    
    if (existingPackages.length > 0) {
      console.log(`Found ${existingPackages.length} existing credit packages. Skipping seed.`);
      return;
    }

    for (const pkg of creditPackages) {
      const created = await storage.createCreditPackage(pkg);
      console.log(`Created package: ${created.name} - ${created.credits} credits for $${created.priceUSD}`);
    }

    console.log("✓ Credit packages seeded successfully!");
  } catch (error) {
    console.error("Error seeding credit packages:", error);
    throw error;
  }
}

seedCreditPackages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
