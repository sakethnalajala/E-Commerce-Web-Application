/**
 * Seed catalogue. These records are written into MongoDB and then served by the
 * normal API — the application itself never reads from this file at runtime.
 */
export const categories = [
  { name: 'Electronics', description: 'Phones, laptops, audio and everyday smart gear.' },
  { name: 'Fashion', description: 'Clothing, footwear and accessories for every season.' },
  { name: 'Home & Kitchen', description: 'Appliances, cookware and essentials for your home.' },
  { name: 'Sports & Fitness', description: 'Training gear, wearables and outdoor equipment.' },
  { name: 'Books', description: 'Bestsellers, technical titles and timeless classics.' },
  { name: 'Beauty & Personal Care', description: 'Skincare, grooming and wellness products.' },
];

import { productImages } from './productImages.js';

/**
 * Photos are looked up by product name in productImages.js — hand-picked,
 * openly licensed shots of the actual item. Never a random placeholder.
 */
const imagesFor = (name) => {
  const entries = productImages[name];
  if (!entries?.length) throw new Error(`No curated images for seed product "${name}"`);
  return entries.map((entry) => entry.url);
};

export const products = [
  {
    name: 'Aether Pro Wireless Headphones',
    category: 'Electronics',
    brand: 'Aether',
    price: 14999,
    discountPrice: 11499,
    stock: 42,
    isFeatured: true,
    description:
      'Over-ear wireless headphones with adaptive noise cancellation, 40-hour battery life and a lightweight memory-foam headband. Dual-device Bluetooth pairing lets you switch between laptop and phone without reconnecting.',
    images: ['headphones-1', 'headphones-2'],
  },
  {
    name: 'Nimbus 14 Ultrabook',
    category: 'Electronics',
    brand: 'Nimbus',
    price: 89999,
    discountPrice: 79999,
    stock: 12,
    isFeatured: true,
    description:
      'A 14-inch ultrabook weighing just 1.2kg with a 2.8K OLED display, 16GB unified memory and a 1TB NVMe drive. All-day battery with fast charge to 60% in 35 minutes.',
    images: ['laptop-1', 'laptop-2'],
  },
  {
    name: 'Pulse Smartwatch Series 5',
    category: 'Electronics',
    brand: 'Pulse',
    price: 12999,
    discountPrice: 9499,
    stock: 67,
    isFeatured: true,
    description:
      'Fitness-first smartwatch with continuous heart-rate tracking, blood-oxygen sensing, built-in GPS and a 7-day battery. Water resistant to 50m with over 100 workout modes.',
    images: ['smartwatch-1'],
  },
  {
    name: 'Volt 65W GaN Charger',
    category: 'Electronics',
    brand: 'Volt',
    price: 3499,
    discountPrice: 2299,
    stock: 120,
    description:
      'Compact gallium-nitride charger with two USB-C and one USB-A port, delivering up to 65W to a laptop or fast-charging three devices at once. Foldable pins for travel.',
    images: ['charger-1'],
  },
  {
    name: 'Echo Mini Bluetooth Speaker',
    category: 'Electronics',
    brand: 'Echo',
    price: 4999,
    discountPrice: null,
    stock: 8,
    description:
      'Pocket-sized speaker with a passive bass radiator, IPX7 waterproofing and 18 hours of playback. Pair two units for true stereo sound.',
    images: ['speaker-1'],
  },
  {
    name: 'Orbit 4K Action Camera',
    category: 'Electronics',
    brand: 'Orbit',
    price: 24999,
    discountPrice: 19999,
    stock: 0,
    description:
      'Rugged 4K/60fps action camera with six-axis stabilisation, a front-facing preview screen and waterproof housing rated to 10 metres without a case.',
    images: ['camera-1'],
  },
  {
    name: 'Meridian Merino Wool Sweater',
    category: 'Fashion',
    brand: 'Meridian',
    price: 5999,
    discountPrice: 4199,
    stock: 55,
    isFeatured: true,
    description:
      'Fine-gauge merino wool crew neck that regulates temperature in any season. Naturally odour resistant, machine washable and finished with flatlock seams.',
    images: ['sweater-1', 'sweater-2'],
  },
  {
    name: 'Trailhead Everyday Backpack 22L',
    category: 'Fashion',
    brand: 'Trailhead',
    price: 4499,
    discountPrice: 3199,
    stock: 73,
    description:
      'A 22-litre commuter backpack with a padded 16-inch laptop sleeve, water-resistant recycled shell and a luggage pass-through strap for travel days.',
    images: ['backpack-1'],
  },
  {
    name: 'Stride Running Shoes',
    category: 'Fashion',
    brand: 'Stride',
    price: 7999,
    discountPrice: 5999,
    stock: 6,
    description:
      'Neutral daily trainers with a responsive nitrogen-infused foam midsole, engineered knit upper and a 8mm heel-to-toe drop suited to long steady runs.',
    images: ['shoes-1', 'shoes-2'],
  },
  {
    name: 'Linea Leather Card Wallet',
    category: 'Fashion',
    brand: 'Linea',
    price: 2499,
    discountPrice: null,
    stock: 90,
    description:
      'Slim full-grain leather wallet holding six cards plus folded notes. Vegetable-tanned and designed to patina beautifully with daily use.',
    images: ['wallet-1'],
  },
  {
    name: 'Copperline 5-Piece Cookware Set',
    category: 'Home & Kitchen',
    brand: 'Copperline',
    price: 18999,
    discountPrice: 13999,
    stock: 21,
    isFeatured: true,
    description:
      'Tri-ply stainless steel cookware with a copper core for even heat distribution. Oven safe to 260°C, induction ready and backed by a lifetime warranty.',
    images: ['cookware-1', 'cookware-2'],
  },
  {
    name: 'BrewCraft Precision Coffee Maker',
    category: 'Home & Kitchen',
    brand: 'BrewCraft',
    price: 15999,
    discountPrice: 11999,
    stock: 30,
    description:
      'SCA-certified drip brewer with a controlled 30-second bloom, PID-regulated 96°C brew temperature and a thermal carafe that holds heat for four hours.',
    images: ['coffee-1'],
  },
  {
    name: 'Lumen Ambient Floor Lamp',
    category: 'Home & Kitchen',
    brand: 'Lumen',
    price: 8999,
    discountPrice: 6499,
    stock: 4,
    description:
      'Dimmable LED floor lamp with adjustable colour temperature from 2200K to 5000K, an oak stem and a hand-woven linen shade.',
    images: ['lamp-1'],
  },
  {
    name: 'PureAir Compact Air Purifier',
    category: 'Home & Kitchen',
    brand: 'PureAir',
    price: 12499,
    discountPrice: 9999,
    stock: 38,
    description:
      'True-HEPA purifier rated for rooms up to 40m², capturing 99.97% of particles down to 0.3 microns. Auto mode reacts to a built-in particulate sensor.',
    images: ['purifier-1'],
  },
  {
    name: 'Apex Adjustable Dumbbell Pair',
    category: 'Sports & Fitness',
    brand: 'Apex',
    price: 22999,
    discountPrice: 17999,
    stock: 17,
    isFeatured: true,
    description:
      'A pair of dial-adjustable dumbbells replacing 15 sets, ranging from 2.5kg to 24kg each. Steel plates with a knurled handle and a compact storage cradle.',
    images: ['dumbbell-1'],
  },
  {
    name: 'Zenith Cork Yoga Mat',
    category: 'Sports & Fitness',
    brand: 'Zenith',
    price: 4299,
    discountPrice: 3199,
    stock: 64,
    description:
      'Natural cork surface over a recycled rubber base, 5mm thick. Grip improves as you sweat, and the antimicrobial cork needs only a damp wipe to clean.',
    images: ['yogamat-1'],
  },
  {
    name: 'Cascade Insulated Bottle 1L',
    category: 'Sports & Fitness',
    brand: 'Cascade',
    price: 2299,
    discountPrice: 1699,
    stock: 140,
    description:
      'Double-walled vacuum flask keeping drinks cold for 24 hours or hot for 12. Powder-coated 18/8 stainless steel with a leak-proof sports cap.',
    images: ['bottle-1'],
  },
  {
    name: 'Ridge Carbon Trekking Poles',
    category: 'Sports & Fitness',
    brand: 'Ridge',
    price: 6999,
    discountPrice: null,
    stock: 9,
    description:
      'Three-section carbon fibre poles with cork grips, quick-lock levers and interchangeable tips for trail, snow and pavement. 480g for the pair.',
    images: ['poles-1'],
  },
  {
    name: 'Designing Data-Intensive Applications',
    category: 'Books',
    brand: "O'Reilly",
    price: 2999,
    discountPrice: 2199,
    stock: 48,
    isFeatured: true,
    description:
      'A deep guide to the architecture of modern data systems: replication, partitioning, transactions, consistency models and the trade-offs behind each choice.',
    images: ['book-1'],
  },
  {
    name: 'The Pragmatic Programmer, 20th Anniversary Edition',
    category: 'Books',
    brand: 'Addison-Wesley',
    price: 2799,
    discountPrice: 1999,
    stock: 35,
    description:
      'A classic on software craftsmanship, rewritten for the modern era — covering practical techniques, debugging discipline and career-long learning habits.',
    images: ['book-2'],
  },
  {
    name: 'Atomic Habits',
    category: 'Books',
    brand: 'Penguin',
    price: 899,
    discountPrice: 549,
    stock: 200,
    description:
      'An evidence-based framework for building good habits and breaking bad ones, built around small changes that compound into remarkable results.',
    images: ['book-3'],
  },
  {
    name: 'Veda Vitamin C Brightening Serum',
    category: 'Beauty & Personal Care',
    brand: 'Veda',
    price: 1899,
    discountPrice: 1349,
    stock: 85,
    description:
      '15% stabilised vitamin C with ferulic acid and vitamin E, formulated to fade uneven tone and protect against daily environmental stress. Fragrance free.',
    images: ['serum-1'],
  },
  {
    name: 'Grove Sandalwood Beard Kit',
    category: 'Beauty & Personal Care',
    brand: 'Grove',
    price: 2499,
    discountPrice: 1799,
    stock: 3,
    description:
      'A complete grooming kit with beard oil, balm, a pear-wood comb and a boar-bristle brush, scented with sandalwood and cedarwood essential oils.',
    images: ['beardkit-1'],
  },
  {
    name: 'Halcyon Ceramide Night Cream',
    category: 'Beauty & Personal Care',
    brand: 'Halcyon',
    price: 2199,
    discountPrice: null,
    stock: 0,
    description:
      'A rich overnight moisturiser with ceramides, squalane and niacinamide that restores the skin barrier while you sleep. Suitable for sensitive skin.',
    images: ['cream-1'],
  },
].map(({ images: _legacySlugs, ...product }) => ({ ...product, images: imagesFor(product.name) }));

export const reviewTemplates = [
  { rating: 5, comment: 'Exactly as described and the build quality is excellent. Delivery was quick too.' },
  { rating: 4, comment: 'Very good overall — does what I needed. Knocking off a star for the packaging.' },
  { rating: 5, comment: 'Genuinely impressed. I have been using it daily for weeks with no issues at all.' },
  { rating: 3, comment: 'Decent for the price, though I expected slightly better finish on the details.' },
  { rating: 4, comment: 'Solid value. Works well and looks better in person than in the photos.' },
  { rating: 5, comment: 'Second one I have bought. Reliable, well made and worth every rupee.' },
];
