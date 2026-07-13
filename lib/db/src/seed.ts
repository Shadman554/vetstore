import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db, vendorsTable, categoriesTable, productsTable } from "./index";

const BCRYPT_ROUNDS = 10;

async function main() {
  console.log("Seeding demo marketplace data...");

  // ---- Categories ----
  const categoryDefs = [
    { slug: "food", name: "Food & Nutrition" },
    { slug: "medicine", name: "Medicine & Health" },
    { slug: "grooming", name: "Grooming" },
    { slug: "accessories", name: "Accessories" },
    { slug: "farm", name: "Farm & Livestock" },
  ];

  const categoryIds: Record<string, string> = {};
  for (const c of categoryDefs) {
    const id = randomUUID();
    categoryIds[c.slug] = id;
    await db.insert(categoriesTable).values({ id, slug: c.slug, name: c.name }).onConflictDoNothing();
  }

  // ---- Vendors ----
  const vendorDefs = [
    {
      slug: "healthy-paws-clinic",
      name: "Healthy Paws Clinic",
      email: "contact@healthypaws.example",
      description: "Licensed veterinary clinic specializing in preventive care and nutrition.",
      logoUrl: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=200&h=200&fit=crop",
    },
    {
      slug: "petcare-pharmacy",
      name: "PetCare Pharmacy",
      email: "hello@petcarepharmacy.example",
      description: "Trusted pharmacy for prescription medicine and health supplies.",
      logoUrl: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=200&h=200&fit=crop",
    },
    {
      slug: "the-groom-room",
      name: "The Groom Room",
      email: "info@groomroom.example",
      description: "Professional grooming products and accessories for happy pets.",
      logoUrl: "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=200&h=200&fit=crop",
    },
    {
      slug: "farm-vet-supply",
      name: "Farm Vet Supply",
      email: "sales@farmvetsupply.example",
      description: "Livestock health and farm animal care essentials.",
      logoUrl: "https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=200&h=200&fit=crop",
    },
  ];

  const vendorIds: Record<string, string> = {};
  const passwordHash = await bcrypt.hash("Vendor123!", BCRYPT_ROUNDS);
  for (const v of vendorDefs) {
    const id = randomUUID();
    vendorIds[v.slug] = id;
    await db
      .insert(vendorsTable)
      .values({
        id,
        slug: v.slug,
        name: v.name,
        email: v.email,
        passwordHash,
        description: v.description,
        logoUrl: v.logoUrl,
        status: "approved",
      })
      .onConflictDoNothing();
  }

  // ---- Products ----
  const productDefs = [
    {
      vendor: "healthy-paws-clinic",
      category: "food",
      species: "dog",
      name: "Premium Grain-Free Dog Food",
      description: "Clinician-approved, protein-rich kibble for dogs of all breeds. Made with real chicken and no fillers.",
      price: 34.99,
      salePrice: 29.99,
      stock: 42,
      images: ["https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=600&h=600&fit=crop"],
    },
    {
      vendor: "healthy-paws-clinic",
      category: "food",
      species: "cat",
      name: "Veterinary Diet Cat Food",
      description: "Balanced nutrition formulated with vets for adult cats with sensitive stomachs.",
      price: 27.5,
      stock: 30,
      images: ["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600&h=600&fit=crop"],
    },
    {
      vendor: "petcare-pharmacy",
      category: "medicine",
      species: "dog",
      name: "Flea & Tick Prevention Chewables",
      description: "Fast-acting monthly chewable that kills fleas and ticks within 24 hours.",
      price: 45.0,
      salePrice: 38.0,
      stock: 60,
      images: ["https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=600&h=600&fit=crop"],
    },
    {
      vendor: "petcare-pharmacy",
      category: "medicine",
      species: "cat",
      name: "Joint Support Supplement",
      description: "Glucosamine and chondroitin blend to support mobility in senior pets.",
      price: 19.99,
      stock: 75,
      images: ["https://images.unsplash.com/photo-1584362917165-526a968579e8?w=600&h=600&fit=crop"],
    },
    {
      vendor: "the-groom-room",
      category: "grooming",
      species: "dog",
      name: "Oatmeal Shampoo for Sensitive Skin",
      description: "Soothing, hypoallergenic shampoo formulated for dogs with sensitive or itchy skin.",
      price: 14.99,
      stock: 90,
      images: ["https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=600&h=600&fit=crop"],
    },
    {
      vendor: "the-groom-room",
      category: "accessories",
      species: "dog",
      name: "Adjustable Nylon Dog Collar",
      description: "Durable, comfortable collar with quick-release buckle, available in multiple sizes.",
      price: 12.5,
      stock: 120,
      images: ["https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=600&h=600&fit=crop"],
    },
    {
      vendor: "the-groom-room",
      category: "accessories",
      species: "cat",
      name: "Interactive Feather Wand Toy",
      description: "Keep your cat active and entertained with this durable feather teaser toy.",
      price: 8.99,
      stock: 150,
      images: ["https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=600&h=600&fit=crop"],
    },
    {
      vendor: "farm-vet-supply",
      category: "farm",
      species: "farm",
      name: "Livestock Multivitamin Drench",
      description: "Broad-spectrum vitamin supplement for cattle, sheep, and goats.",
      price: 52.0,
      stock: 25,
      images: ["https://images.unsplash.com/photo-1500595046743-cd271d694d30?w=600&h=600&fit=crop"],
    },
  ];

  for (const p of productDefs) {
    const slug = p.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    await db
      .insert(productsTable)
      .values({
        id: randomUUID(),
        vendorId: vendorIds[p.vendor],
        slug,
        categoryId: categoryIds[p.category],
        species: p.species,
        name: p.name,
        description: p.description,
        images: p.images,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock,
        status: "active",
      })
      .onConflictDoNothing();
  }

  console.log(`Seeded ${categoryDefs.length} categories, ${vendorDefs.length} vendors, ${productDefs.length} products.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
