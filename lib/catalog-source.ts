import { ProductCategory } from "@prisma/client";

export type CatalogSourceItem = {
  name: string;
  unitLabel: string;
  basePrice: number;
};

export type CatalogSourceSection = {
  enumValue: ProductCategory;
  label: string;
  items: CatalogSourceItem[];
};

const dollars = (value: number) => Math.round(value * 100);

export const CATALOG_SOURCE: CatalogSourceSection[] = [
  {
    enumValue: ProductCategory.FRUIT_AND_VEGETABLES,
    label: "Fruit & Vegetables",
    items: [
      { name: "Apples", basePrice: dollars(4.8), unitLabel: "per kg" },
      { name: "Bananas", basePrice: dollars(4.2), unitLabel: "per kg" },
      { name: "Oranges", basePrice: dollars(4.5), unitLabel: "per kg" },
      { name: "Carrots", basePrice: dollars(2.9), unitLabel: "per kg" },
      { name: "Tomatoes", basePrice: dollars(5.8), unitLabel: "per kg" },
      { name: "Potatoes", basePrice: dollars(3.1), unitLabel: "per kg" },
      { name: "Onions", basePrice: dollars(2.4), unitLabel: "per kg" },
      { name: "Lettuce", basePrice: dollars(2.7), unitLabel: "each" },
      { name: "Broccoli", basePrice: dollars(3.9), unitLabel: "each" },
      { name: "Spinach", basePrice: dollars(3), unitLabel: "per bunch" },
      { name: "Cucumbers", basePrice: dollars(2.8), unitLabel: "each" },
      { name: "Capsicum", basePrice: dollars(3.2), unitLabel: "each" },
      { name: "Zucchini", basePrice: dollars(3.3), unitLabel: "per kg" },
      { name: "Eggplant", basePrice: dollars(4.1), unitLabel: "each" },
      { name: "Garlic", basePrice: dollars(1.8), unitLabel: "each" },
      { name: "Ginger", basePrice: dollars(3.6), unitLabel: "per kg" },
    ],
  },
  {
    enumValue: ProductCategory.BAKERY_AND_GRAINS,
    label: "Bakery & Grains",
    items: [
      { name: "Bread", basePrice: dollars(2.4), unitLabel: "each" },
      { name: "Rice", basePrice: dollars(3.99), unitLabel: "per kg" },
      { name: "Pasta", basePrice: dollars(1.1), unitLabel: "per 500g" },
      { name: "Flour", basePrice: dollars(1.3), unitLabel: "per kg" },
      { name: "Oats", basePrice: dollars(3.2), unitLabel: "per kg" },
    ],
  },
  {
    enumValue: ProductCategory.PANTRY_AND_COOKING,
    label: "Pantry & Cooking",
    items: [
      { name: "Sugar", basePrice: dollars(1.8), unitLabel: "per kg" },
      { name: "Salt", basePrice: dollars(1), unitLabel: "per kg" },
      { name: "Cooking Oil", basePrice: dollars(4.8), unitLabel: "per L" },
      { name: "Honey", basePrice: dollars(6.2), unitLabel: "per kg" },
      { name: "Jam", basePrice: dollars(3.9), unitLabel: "per jar" },
      { name: "Peanut Butter", basePrice: dollars(5.2), unitLabel: "per jar" },
    ],
  },
  {
    enumValue: ProductCategory.DRINKS,
    label: "Drinks",
    items: [
      { name: "Water", basePrice: dollars(1.8), unitLabel: "per L" },
      { name: "Juice", basePrice: dollars(3.8), unitLabel: "per L" },
      { name: "Milk", basePrice: dollars(1.6), unitLabel: "per L" },
      { name: "Soda", basePrice: dollars(2.9), unitLabel: "per L" },
      { name: "Coffee", basePrice: dollars(5.9), unitLabel: "per pack" },
      { name: "Tea", basePrice: dollars(3.8), unitLabel: "per box" },
      { name: "Energy Drink", basePrice: dollars(3.9), unitLabel: "each" },
      { name: "Sparkling Water", basePrice: dollars(2.7), unitLabel: "per L" },
      { name: "Chocolate Milk", basePrice: dollars(3.9), unitLabel: "per L" },
    ],
  },
  {
    enumValue: ProductCategory.MEAT_DAIRY_AND_PROTEIN,
    label: "Meat, Dairy & Protein",
    items: [
      { name: "Eggs", basePrice: dollars(6.5), unitLabel: "per dozen" },
      { name: "Chicken", basePrice: dollars(13.7), unitLabel: "per kg" },
      { name: "Beef", basePrice: dollars(21.99), unitLabel: "per kg" },
      { name: "Fish", basePrice: dollars(15.4), unitLabel: "per kg" },
      { name: "Cheese", basePrice: dollars(9.9), unitLabel: "per kg" },
      { name: "Yogurt", basePrice: dollars(4.8), unitLabel: "per tub" },
      { name: "Butter", basePrice: dollars(4.9), unitLabel: "per pack" },
      { name: "Sausages", basePrice: dollars(8.2), unitLabel: "per kg" },
      { name: "Lamb", basePrice: dollars(11), unitLabel: "per kg" },
      { name: "Tofu", basePrice: dollars(4.2), unitLabel: "per pack" },
    ],
  },
  {
    enumValue: ProductCategory.SNACKS_AND_SWEETS,
    label: "Snacks & Sweets",
    items: [
      { name: "Chips", basePrice: dollars(2.8), unitLabel: "per pack" },
      { name: "Biscuits", basePrice: dollars(2.5), unitLabel: "per pack" },
      { name: "Crackers", basePrice: dollars(2.9), unitLabel: "per pack" },
      { name: "Instant Noodles", basePrice: dollars(1.9), unitLabel: "per pack" },
      { name: "Chocolate", basePrice: dollars(2.9), unitLabel: "per bar" },
      { name: "Candy", basePrice: dollars(2.2), unitLabel: "per pack" },
      { name: "Ice Cream", basePrice: dollars(5.8), unitLabel: "per tub" },
      { name: "Cake", basePrice: dollars(7.9), unitLabel: "each" },
      { name: "Cookies", basePrice: dollars(3.9), unitLabel: "per pack" },
      { name: "Brownies", basePrice: dollars(4.8), unitLabel: "per pack" },
      { name: "Muffins", basePrice: dollars(3.9), unitLabel: "per pack" },
      { name: "Donuts", basePrice: dollars(3.8), unitLabel: "per pack" },
      { name: "Lollies", basePrice: dollars(2.4), unitLabel: "per 100g" },
      { name: "Popcorn", basePrice: dollars(1.8), unitLabel: "per pack" },
    ],
  },
  {
    enumValue: ProductCategory.KITCHEN_AND_COOKWARE,
    label: "Kitchen & Cookware",
    items: [
      { name: "Plates", basePrice: dollars(10), unitLabel: "each" },
      { name: "Bowls", basePrice: dollars(8), unitLabel: "each" },
      { name: "Cups", basePrice: dollars(6), unitLabel: "each" },
      { name: "Spoons", basePrice: dollars(5), unitLabel: "per set" },
      { name: "Forks", basePrice: dollars(5), unitLabel: "per set" },
      { name: "Knives", basePrice: dollars(7), unitLabel: "per set" },
      { name: "Pots", basePrice: dollars(20), unitLabel: "each" },
      { name: "Pans", basePrice: dollars(25), unitLabel: "each" },
      { name: "Cutting Board", basePrice: dollars(12), unitLabel: "each" },
      { name: "Measuring Cups", basePrice: dollars(10), unitLabel: "per set" },
    ],
  },
  {
    enumValue: ProductCategory.CLEANING_AND_PERSONAL_CARE,
    label: "Cleaning & Personal Care",
    items: [
      { name: "Soap", basePrice: dollars(1.9), unitLabel: "each" },
      { name: "Shampoo", basePrice: dollars(5.5), unitLabel: "each" },
      { name: "Conditioner", basePrice: dollars(5.5), unitLabel: "each" },
      { name: "Toothpaste", basePrice: dollars(2.8), unitLabel: "each" },
      { name: "Toothbrush", basePrice: dollars(2.9), unitLabel: "each" },
      { name: "Tissues", basePrice: dollars(2.8), unitLabel: "per box" },
      { name: "Detergent", basePrice: dollars(9.9), unitLabel: "per L" },
      { name: "Dishwashing Liquid", basePrice: dollars(3.8), unitLabel: "per L" },
      { name: "Deodorant", basePrice: dollars(4.9), unitLabel: "each" },
      { name: "Hand Sanitizer", basePrice: dollars(2.9), unitLabel: "each" },
    ],
  },
  {
    enumValue: ProductCategory.CLOTHING,
    label: "Clothing",
    items: [
      { name: "T-Shirts", basePrice: dollars(14.99), unitLabel: "each" },
      { name: "Pants", basePrice: dollars(29.99), unitLabel: "each" },
      { name: "Shorts", basePrice: dollars(19.99), unitLabel: "each" },
      { name: "Hoodies", basePrice: dollars(39.99), unitLabel: "each" },
      { name: "Jackets", basePrice: dollars(59.99), unitLabel: "each" },
      { name: "Socks", basePrice: dollars(9.99), unitLabel: "per pack" },
      { name: "Hats", basePrice: dollars(11.99), unitLabel: "each" },
      { name: "Sweaters", basePrice: dollars(34.99), unitLabel: "each" },
    ],
  },
  {
    enumValue: ProductCategory.HOME_AND_STORAGE,
    label: "Home & Storage",
    items: [
      { name: "Towels", basePrice: dollars(14.99), unitLabel: "each" },
      { name: "Blankets", basePrice: dollars(39.99), unitLabel: "each" },
      { name: "Pillows", basePrice: dollars(19.99), unitLabel: "each" },
      { name: "Storage Boxes", basePrice: dollars(11.99), unitLabel: "each" },
      { name: "Hangers", basePrice: dollars(7.99), unitLabel: "per pack" },
    ],
  },
  {
    enumValue: ProductCategory.ELECTRONICS,
    label: "Electronics",
    items: [
      { name: "Phone", basePrice: dollars(799), unitLabel: "each" },
      { name: "Tablet", basePrice: dollars(499), unitLabel: "each" },
      { name: "Laptop", basePrice: dollars(1199), unitLabel: "each" },
      { name: "Headphones", basePrice: dollars(99), unitLabel: "each" },
      { name: "Charger", basePrice: dollars(19.99), unitLabel: "each" },
    ],
  },
  {
    enumValue: ProductCategory.SCHOOL_AND_MISC,
    label: "School & Misc",
    items: [
      { name: "Notebook", basePrice: dollars(2.9), unitLabel: "each" },
      { name: "Pen", basePrice: dollars(1.8), unitLabel: "each" },
      { name: "Pencil", basePrice: dollars(1), unitLabel: "each" },
      { name: "Eraser", basePrice: dollars(1), unitLabel: "each" },
      { name: "Backpack", basePrice: dollars(24.99), unitLabel: "each" },
      { name: "Bottle", basePrice: dollars(9.99), unitLabel: "each" },
      { name: "Umbrella", basePrice: dollars(14.99), unitLabel: "each" },
      { name: "Shopping Bag", basePrice: dollars(4.99), unitLabel: "each" },
      { name: "Lunch Box", basePrice: dollars(11.99), unitLabel: "each" },
    ],
  },
];
