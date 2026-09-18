import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Admin123!", 10);

  const restaurant = await prisma.restaurant.upsert({
    where: { slug: "demo-restaurant" },
    update: {},
    create: {
      slug: "demo-restaurant",
      name: "Demo Restaurant",
      themeColor: "#E63946",
      themeColorDark: "#1D1D1D",
      contactPhone: "+60 12-345 6789",
      contactEmail: "hello@demorestaurant.com",
      address: "123 Jalan Bukit Bintang, Kuala Lumpur",
      currency: "MYR",
      operatingHours: {
        mon: { open: "09:00", close: "22:00", closed: false },
        tue: { open: "09:00", close: "22:00", closed: false },
        wed: { open: "09:00", close: "22:00", closed: false },
        thu: { open: "09:00", close: "22:00", closed: false },
        fri: { open: "09:00", close: "23:00", closed: false },
        sat: { open: "09:00", close: "23:00", closed: false },
        sun: { open: "10:00", close: "22:00", closed: false },
      },
      socialLinks: {
        instagram: "https://instagram.com/demorestaurant",
        whatsapp: "https://wa.me/60123456789",
        facebook: "",
        tiktok: "",
      },
      adminUsers: {
        create: {
          name: "Restaurant Owner",
          email: "owner@demorestaurant.com",
          passwordHash,
          role: "OWNER",
        },
      },
    },
  });

  const categoryData = [
    { name: "Food", icon: "🍔", slug: "food", sortOrder: 0 },
    { name: "Drinks", icon: "🥤", slug: "drinks", sortOrder: 1 },
    { name: "Desserts", icon: "🍰", slug: "desserts", sortOrder: 2 },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoryData) {
    const cat = await prisma.category.upsert({
      where: { restaurantId_slug: { restaurantId: restaurant.id, slug: c.slug } },
      update: {},
      create: { ...c, restaurantId: restaurant.id },
    });
    categories[c.slug] = cat.id;
  }

  const items = [
    {
      categoryId: categories.food,
      name: "Nasi Lemak Special",
      description: "Fragrant coconut rice with sambal, fried chicken, egg, and peanuts.",
      price: 15.9,
      isHot: true,
      isBestseller: true,
      sortOrder: 0,
    },
    {
      categoryId: categories.food,
      name: "Grilled Chicken Chop",
      description: "Char-grilled chicken thigh with black pepper sauce and fries.",
      price: 22.0,
      discountedPrice: 18.9,
      isNew: true,
      sortOrder: 1,
    },
    {
      categoryId: categories.drinks,
      name: "Iced Teh Tarik",
      description: "Malaysian pulled milk tea, served over ice.",
      price: 6.5,
      isBestseller: true,
      sortOrder: 0,
    },
    {
      categoryId: categories.drinks,
      name: "Fresh Watermelon Juice",
      description: "No added sugar, blended to order.",
      price: 8.0,
      sortOrder: 1,
    },
    {
      categoryId: categories.desserts,
      name: "Cendol",
      description: "Shaved ice, coconut milk, palm sugar, and green rice jelly.",
      price: 9.5,
      isHot: true,
      sortOrder: 0,
    },
    {
      categoryId: categories.desserts,
      name: "Chocolate Lava Cake",
      description: "Warm molten chocolate cake with vanilla ice cream.",
      price: 12.9,
      isAvailable: false,
      sortOrder: 1,
    },
  ];

  for (const item of items) {
    await prisma.menuItem.create({ data: { ...item, restaurantId: restaurant.id } });
  }

  console.log("✅ Seed complete.");
  console.log("   Admin login: owner@demorestaurant.com / Admin123!");
  console.log(`   Menu URL: /menu/${restaurant.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
