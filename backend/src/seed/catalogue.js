/**
 * Extended catalogue generator — roughly 90 products per category.
 *
 * Every product is assembled from a *type* (what it is), a brand, a model
 * line and a size/colour/edition variant, so names read like real listings
 * ("Nimbus Air 14 Ultrabook", "Grove Cedar & Sage Beard Oil") and no two are
 * identical. Prices, discounts, stock and descriptions are drawn from ranges
 * that make sense for the type. The generator is deterministic (seeded PRNG),
 * so re-running the seed produces the same catalogue.
 *
 * Photos come from catalogueLibrary.js, keyed by type.
 */
import { photoLibrary } from './catalogueLibrary.js';

/* --------------------------------------------------------------------- */
/* Deterministic PRNG (mulberry32)                                        */
/* --------------------------------------------------------------------- */
const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const pick = (random, list) => list[Math.floor(random() * list.length)];
const between = (random, min, max) => min + random() * (max - min);
const roundPrice = (value) => (value < 1000 ? Math.round(value / 10) * 10 - 1 : Math.round(value / 100) * 100 - 1);

/* --------------------------------------------------------------------- */
/* Product types                                                           */
/* --------------------------------------------------------------------- */
// { noun, photo, brands, lines, variants, price: [min, max], blurb, features }
const TYPES = {
  Electronics: [
    { noun: 'Wireless Headphones', photo: 'headphones', brands: ['Aether', 'Sonique', 'Nimbus Audio', 'Pulse'], lines: ['Pro', 'Studio', 'Air', 'Quiet'], variants: ['', 'Max', 'Lite', '2'], price: [3499, 24999], blurb: 'Over-ear headphones with active noise cancellation, plush memory-foam cups and multipoint Bluetooth.', features: ['up to 40 h battery', 'USB-C fast charge', 'foldable design', 'transparency mode'] },
    { noun: 'Wireless Earbuds', photo: 'earbuds', brands: ['Aether', 'Sonique', 'Pulse', 'Echo'], lines: ['Buds', 'Dots', 'Pods', 'Beans'], variants: ['', 'Pro', 'Sport', 'Mini'], price: [1499, 12999], blurb: 'True wireless earbuds with a pocketable charging case and sweat resistance.', features: ['IPX5 rating', 'touch controls', 'wireless charging case', 'low-latency game mode'] },
    { noun: 'Ultrabook', photo: 'laptop', brands: ['Nimbus', 'Vertex', 'Orbit', 'Halo'], lines: ['Air', 'Book', 'Slim', 'Edge'], variants: ['13', '14', '15', '16'], price: [45999, 149999], blurb: 'A thin-and-light laptop with an all-day battery, a bright display and a quiet fan.', features: ['16 GB RAM', '512 GB SSD', 'backlit keyboard', 'fingerprint reader'] },
    { noun: 'Smartwatch', photo: 'smartwatch', brands: ['Pulse', 'Orbit', 'Halo', 'Vertex'], lines: ['Series', 'Fit', 'Active', 'Ultra'], variants: ['3', '4', '5', '6'], price: [3999, 34999], blurb: 'Fitness and notifications on your wrist with heart-rate, SpO₂ and sleep tracking.', features: ['AMOLED display', '7-day battery', 'GPS', '5 ATM water resistance'] },
    { noun: 'GaN Charger', photo: 'charger', brands: ['Volt', 'Ampere', 'Nimbus', 'Echo'], lines: ['Nano', 'Duo', 'Trio', 'Cube'], variants: ['30W', '45W', '65W', '100W'], price: [999, 5999], blurb: 'Compact gallium-nitride wall charger that powers phones, tablets and laptops from one plug.', features: ['USB-C PD 3.0', 'foldable pins', 'smart power split', 'over-heat protection'] },
    { noun: 'Bluetooth Speaker', photo: 'speaker', brands: ['Echo', 'Sonique', 'Aether', 'Pulse'], lines: ['Mini', 'Go', 'Boom', 'Roam'], variants: ['', '2', 'Plus', 'XL'], price: [1799, 15999], blurb: 'Portable speaker with punchy bass and a rugged, splash-proof shell for the outdoors.', features: ['12 h playtime', 'IP67', 'stereo pairing', 'built-in mic'] },
    { noun: 'Action Camera', photo: 'action-camera', brands: ['Orbit', 'Vertex', 'Halo'], lines: ['Hero', 'Go', 'Dash'], variants: ['4K', '5K', 'Mini', 'Pro'], price: [8999, 39999], blurb: 'Waterproof action camera with stabilised video for bikes, boards and holidays.', features: ['HyperSmooth stabilisation', 'waterproof to 10 m', 'voice control', 'front screen'] },
    { noun: 'Smartphone', photo: 'smartphone', brands: ['Halo', 'Vertex', 'Nimbus', 'Orbit'], lines: ['One', 'Note', 'Edge', 'Prime'], variants: ['128 GB', '256 GB', 'Lite', 'Pro'], price: [11999, 89999], blurb: 'A fast, bright phone with a two-day battery and a camera that shines at night.', features: ['120 Hz display', '5G', '50 MP main camera', 'IP68'] },
    { noun: 'Tablet', photo: 'tablet', brands: ['Nimbus', 'Halo', 'Vertex'], lines: ['Pad', 'Tab', 'Slate'], variants: ['8', '10', '11', '12.9'], price: [12999, 69999], blurb: 'A slim tablet for reading, sketching and streaming with stylus support.', features: ['2K display', 'quad speakers', 'stylus support', '10 h battery'] },
    { noun: 'Mechanical Keyboard', photo: 'keyboard', brands: ['Keystone', 'Vertex', 'Pulse', 'Orbit'], lines: ['K', 'Type', 'Tactile', 'Silent'], variants: ['65', '75', 'TKL', 'Full-size'], price: [2999, 15999], blurb: 'Hot-swappable mechanical keyboard with PBT keycaps and per-key RGB.', features: ['hot-swap switches', 'PBT keycaps', 'USB-C detachable cable', 'gasket mount'] },
    { noun: 'Wireless Mouse', photo: 'mouse', brands: ['Keystone', 'Orbit', 'Pulse', 'Vertex'], lines: ['Glide', 'Point', 'Ergo', 'Swift'], variants: ['', 'Pro', 'Lite', 'Max'], price: [799, 7999], blurb: 'Quiet wireless mouse with a comfortable contour and months of battery life.', features: ['2.4 GHz + Bluetooth', 'silent clicks', 'adjustable DPI', 'USB-C charging'] },
    { noun: 'Monitor', photo: 'monitor', brands: ['Vertex', 'Nimbus', 'Halo'], lines: ['View', 'Vista', 'Studio'], variants: ['24"', '27"', '32"', '34" Ultrawide'], price: [8999, 54999], blurb: 'A colour-accurate monitor with slim bezels and a height-adjustable stand.', features: ['IPS panel', '99% sRGB', 'USB-C 65 W', 'flicker-free'] },
    { noun: 'Power Bank', photo: 'powerbank', brands: ['Volt', 'Ampere', 'Echo', 'Nimbus'], lines: ['Charge', 'Fuel', 'Core', 'Slim'], variants: ['10000 mAh', '20000 mAh', '27000 mAh', '5000 mAh'], price: [999, 6999], blurb: 'Pocket power that refills your phone several times over, with fast charging in and out.', features: ['22.5 W output', 'USB-C in/out', 'LED level display', 'airline safe'] },
    { noun: 'Webcam', photo: 'webcam', brands: ['Orbit', 'Vertex', 'Keystone'], lines: ['Cam', 'Meet', 'Stream'], variants: ['1080p', '2K', '4K'], price: [1499, 12999], blurb: 'A sharp webcam with auto light correction and a privacy shutter for calls and streams.', features: ['autofocus', 'dual mics', 'privacy shutter', 'tripod thread'] },
  ],
  Books: [
    { noun: 'programming book', photo: 'book-programming', kind: 'programming' },
    { noun: 'business book', photo: 'book-hardcover', kind: 'business' },
    { noun: 'self-help book', photo: 'book-reading', kind: 'selfhelp' },
    { noun: 'novel', photo: 'book-paperback', kind: 'fiction' },
    { noun: 'science book', photo: 'book-open', kind: 'science' },
    { noun: 'history book', photo: 'bookshelf', kind: 'history' },
    { noun: 'cookbook', photo: 'book-open', kind: 'cooking' },
    { noun: 'travel book', photo: 'book-stack', kind: 'travel' },
    { noun: 'biography', photo: 'book-hardcover', kind: 'biography' },
    { noun: 'fantasy novel', photo: 'book-paperback', kind: 'fantasy' },
    { noun: 'poetry collection', photo: 'book-reading', kind: 'poetry' },
  ],
  Fashion: [
    { noun: 'Merino Wool Sweater', photo: 'sweater', brands: ['Meridian', 'Northwool', 'Linea', 'Harbour'], lines: ['Crew', 'V-Neck', 'Roll-Neck', 'Cardigan'], variants: ['Charcoal', 'Oatmeal', 'Navy', 'Forest'], price: [2499, 8999], blurb: 'Fine-gauge merino that is warm without bulk and soft enough to wear next to skin.', features: ['100% merino', 'machine washable', 'regular fit', 'ribbed cuffs'] },
    { noun: 'Everyday Backpack', photo: 'backpack', brands: ['Trailhead', 'Harbour', 'Summit', 'Urbane'], lines: ['Daypack', 'Commuter', 'Roll-Top', 'Metro'], variants: ['18L', '22L', '26L', '30L'], price: [1999, 8999], blurb: 'A clean, weatherproof backpack with a padded laptop sleeve and quick-access pockets.', features: ['16" laptop sleeve', 'water-resistant fabric', 'luggage pass-through', 'YKK zips'] },
    { noun: 'Running Shoes', photo: 'running-shoes', brands: ['Stride', 'Velocity', 'Summit', 'Kinetic'], lines: ['Glide', 'Tempo', 'Cloud', 'Sprint'], variants: ['', '2', '3', 'Lite'], price: [2999, 12999], blurb: 'Cushioned daily trainers with a breathable knit upper and a responsive foam midsole.', features: ['responsive foam', 'breathable knit', 'reflective details', '8 mm drop'] },
    { noun: 'Leather Wallet', photo: 'wallet', brands: ['Linea', 'Harbour', 'Urbane', 'Meridian'], lines: ['Card', 'Bifold', 'Slim', 'Zip'], variants: ['Black', 'Tan', 'Brown', 'Oxblood'], price: [999, 4999], blurb: 'Full-grain leather that ages beautifully, with RFID-shielded card slots.', features: ['full-grain leather', 'RFID blocking', '6 card slots', 'gift box'] },
    { noun: 'T-Shirt', photo: 'tshirt', brands: ['Urbane', 'Harbour', 'Kinetic', 'Linea'], lines: ['Essential', 'Heavyweight', 'Pima', 'Organic'], variants: ['White', 'Black', 'Olive', 'Sand'], price: [599, 2499], blurb: 'A cut-and-sewn tee in soft combed cotton that keeps its shape wash after wash.', features: ['combed cotton', 'pre-shrunk', 'tagless', 'ribbed collar'] },
    { noun: 'Jeans', photo: 'jeans', brands: ['Harbour', 'Urbane', 'Meridian', 'Kinetic'], lines: ['Slim', 'Straight', 'Tapered', 'Relaxed'], variants: ['Indigo', 'Mid Wash', 'Black', 'Light Wash'], price: [1499, 5999], blurb: 'Stretch denim with a comfortable rise and reinforced seams for everyday wear.', features: ['2% stretch', 'reinforced pockets', 'button fly', 'mid rise'] },
    { noun: 'Leather Jacket', photo: 'jacket', brands: ['Harbour', 'Meridian', 'Urbane'], lines: ['Biker', 'Bomber', 'Café Racer'], variants: ['Black', 'Brown', 'Tan'], price: [6999, 24999], blurb: 'Supple lambskin with a quilted lining — a jacket you will wear for a decade.', features: ['lambskin leather', 'quilted lining', 'antique hardware', 'interior pockets'] },
    { noun: 'Dress', photo: 'dress', brands: ['Linea', 'Meridian', 'Urbane'], lines: ['Wrap', 'Midi', 'Shirt', 'Slip'], variants: ['Crimson', 'Navy', 'Floral', 'Ivory'], price: [1499, 7999], blurb: 'A flattering, breathable dress that moves from brunch to evenings with ease.', features: ['viscose blend', 'side pockets', 'adjustable tie', 'lined bodice'] },
    { noun: 'Sneakers', photo: 'sneakers', brands: ['Stride', 'Velocity', 'Urbane', 'Kinetic'], lines: ['Court', 'Classic', 'Knit', 'Retro'], variants: ['White', 'Grey', 'Black', 'Navy'], price: [1999, 9999], blurb: 'Clean low-top sneakers with a cushioned insole and a durable rubber cupsole.', features: ['cushioned insole', 'rubber cupsole', 'padded collar', 'vegan option'] },
    { noun: 'Sunglasses', photo: 'sunglasses', brands: ['Linea', 'Summit', 'Urbane'], lines: ['Aviator', 'Wayfarer', 'Round', 'Square'], variants: ['Black', 'Tortoise', 'Gold', 'Matte'], price: [999, 6999], blurb: 'Polarised lenses with full UV400 protection in a lightweight acetate frame.', features: ['polarised', 'UV400', 'acetate frame', 'hard case included'] },
    { noun: 'Wristwatch', photo: 'wristwatch', brands: ['Meridian', 'Linea', 'Harbour', 'Summit'], lines: ['Classic', 'Field', 'Chrono', 'Diver'], variants: ['Steel', 'Leather', 'Gold', 'Two-tone'], price: [2999, 29999], blurb: 'A quartz watch with a sapphire crystal and a case that sits comfortably under a cuff.', features: ['sapphire crystal', '5 ATM', 'Japanese movement', 'quick-release strap'] },
    { noun: 'Leather Belt', photo: 'belt', brands: ['Linea', 'Harbour', 'Meridian'], lines: ['Classic', 'Casual', 'Dress'], variants: ['Black', 'Brown', 'Tan', 'Cognac'], price: [699, 3499], blurb: 'Single-piece leather belt with a solid brass buckle that will not tarnish.', features: ['full-grain leather', 'brass buckle', '35 mm width', 'made to last'] },
    { noun: 'Wool Scarf', photo: 'scarf', brands: ['Northwool', 'Meridian', 'Harbour'], lines: ['Ribbed', 'Striped', 'Herringbone'], variants: ['Camel', 'Grey', 'Burgundy', 'Navy'], price: [899, 3999], blurb: 'A soft lambswool scarf with fringed ends, woven to trap warmth without itch.', features: ['lambswool', 'fringed ends', '180 cm', 'dry clean'] },
    { noun: 'Hoodie', photo: 'hoodie', brands: ['Urbane', 'Kinetic', 'Harbour', 'Stride'], lines: ['Fleece', 'Zip', 'Heavyweight', 'Oversized'], variants: ['Grey', 'Black', 'Cream', 'Olive'], price: [1299, 4999], blurb: 'Brushed-back fleece with a double-layer hood and a kangaroo pocket.', features: ['brushed fleece', 'double hood', 'ribbed hem', 'metal eyelets'] },
    { noun: 'Cap', photo: 'cap', brands: ['Urbane', 'Stride', 'Summit', 'Kinetic'], lines: ['Dad', 'Snapback', 'Trucker', 'Five-Panel'], variants: ['Navy', 'Black', 'Khaki', 'Plaid'], price: [499, 1999], blurb: 'An unstructured cotton cap with a curved brim and an adjustable strap.', features: ['cotton twill', 'adjustable strap', 'curved brim', 'embroidered eyelets'] },
  ],
  'Home & Kitchen': [
    { noun: 'Cookware Set', photo: 'cookware', brands: ['Copperline', 'Hearth', 'Culina', 'Stonehouse'], lines: ['5-Piece', '7-Piece', '10-Piece', 'Starter'], variants: ['Copper', 'Stainless', 'Tri-Ply', 'Non-Stick'], price: [4999, 24999], blurb: 'Even-heating pots and pans with riveted handles, suitable for induction and oven.', features: ['induction ready', 'oven safe to 250°C', 'riveted handles', 'tempered glass lids'] },
    { noun: 'Coffee Maker', photo: 'coffee-maker', brands: ['BrewCraft', 'Hearth', 'Culina', 'Morning'], lines: ['Precision', 'Drip', 'Espresso', 'Pour-Over'], variants: ['', 'Plus', 'Compact', 'Pro'], price: [2999, 29999], blurb: 'Café-style coffee at home with precise temperature control and a thermal carafe.', features: ['thermal carafe', 'programmable timer', 'auto shut-off', 'reusable filter'] },
    { noun: 'Floor Lamp', photo: 'floor-lamp', brands: ['Lumen', 'Hearth', 'Aurora', 'Nordlys'], lines: ['Ambient', 'Arc', 'Tripod', 'Reading'], variants: ['Brass', 'Black', 'Walnut', 'White'], price: [2499, 12999], blurb: 'A sculptural lamp that throws warm, dimmable light across the room.', features: ['dimmable', 'E27 bulb', 'weighted base', 'fabric shade'] },
    { noun: 'Air Purifier', photo: 'air-purifier', brands: ['PureAir', 'Aurora', 'Breeze', 'Hearth'], lines: ['Compact', 'Tower', 'Room', 'Max'], variants: ['', 'Plus', 'H13', 'Smart'], price: [5999, 29999], blurb: 'HEPA filtration that quietly clears dust, pollen and smoke from medium rooms.', features: ['H13 HEPA', 'activated carbon', 'air-quality sensor', 'whisper-quiet night mode'] },
    { noun: 'Blender', photo: 'blender', brands: ['Culina', 'BrewCraft', 'Hearth', 'Morning'], lines: ['Nutri', 'Power', 'Pro', 'Mini'], variants: ['600W', '900W', '1200W', 'Personal'], price: [1999, 12999], blurb: 'A high-torque blender that crushes ice and blends smooth soups and smoothies.', features: ['stainless blades', 'BPA-free jar', 'pulse mode', 'dishwasher-safe parts'] },
    { noun: 'Electric Kettle', photo: 'kettle', brands: ['Morning', 'Culina', 'Hearth', 'BrewCraft'], lines: ['Glass', 'Gooseneck', 'Rapid', 'Classic'], variants: ['1.0L', '1.5L', '1.7L', 'Variable Temp'], price: [999, 6999], blurb: 'Boils fast, pours precisely and switches off automatically.', features: ['auto shut-off', 'boil-dry protection', 'cordless base', 'concealed element'] },
    { noun: 'Toaster', photo: 'toaster', brands: ['Morning', 'Hearth', 'Culina'], lines: ['2-Slice', '4-Slice', 'Long-Slot'], variants: ['White', 'Cream', 'Steel', 'Black'], price: [1299, 6999], blurb: 'Even browning with a bagel setting and a removable crumb tray.', features: ['7 browning levels', 'bagel mode', 'high-lift lever', 'crumb tray'] },
    { noun: 'Knife Set', photo: 'knife-set', brands: ['Culina', 'Stonehouse', 'Hearth'], lines: ['Chef', '3-Piece', '5-Piece', 'Santoku'], variants: ['', 'Damascus', 'German Steel', 'Carbon'], price: [1999, 15999], blurb: 'Forged blades with a full tang and a balanced handle, honed to a razor edge.', features: ['forged steel', 'full tang', 'ergonomic handle', 'wooden block'] },
    { noun: 'Vacuum Cleaner', photo: 'vacuum', brands: ['Breeze', 'Aurora', 'Hearth'], lines: ['Cordless', 'Handheld', 'Stick'], variants: ['', 'Plus', 'Pet', 'Max'], price: [4999, 34999], blurb: 'Cordless cleaning with strong suction and a swivel head that reaches under furniture.', features: ['45-min runtime', 'HEPA filter', 'wall dock', 'LED headlights'] },
    { noun: 'Bedding Set', photo: 'bedding', brands: ['Nordlys', 'Hearth', 'Stonehouse'], lines: ['Percale', 'Sateen', 'Linen', 'Bamboo'], variants: ['Single', 'Double', 'Queen', 'King'], price: [1999, 9999], blurb: 'Crisp, breathable sheets that get softer with every wash.', features: ['300 thread count', 'deep-pocket fitted sheet', 'OEKO-TEX certified', 'two pillowcases'] },
    { noun: 'Pillow', photo: 'pillow', brands: ['Nordlys', 'Hearth', 'Stonehouse'], lines: ['Memory Foam', 'Down Alternative', 'Cooling', 'Latex'], variants: ['Standard', 'Queen', 'King', 'Twin Pack'], price: [899, 4999], blurb: 'Supportive yet plush, with a washable cover and a shape that holds all night.', features: ['washable cover', 'hypoallergenic', 'medium firm', 'breathable'] },
    { noun: 'Dinnerware Set', photo: 'dinnerware', brands: ['Stonehouse', 'Culina', 'Hearth'], lines: ['Stoneware', 'Porcelain', 'Rustic'], variants: ['12-Piece', '16-Piece', '18-Piece', '24-Piece'], price: [1999, 12999], blurb: 'Chip-resistant plates and bowls with a glaze that looks hand-thrown.', features: ['dishwasher safe', 'microwave safe', 'chip resistant', 'service for 4'] },
    { noun: 'Storage Jars', photo: 'storage-jars', brands: ['Stonehouse', 'Culina', 'Morning'], lines: ['Glass', 'Airtight', 'Pantry'], variants: ['Set of 3', 'Set of 4', 'Set of 6', '1L'], price: [499, 2999], blurb: 'Airtight glass jars that keep flour, pulses and coffee fresh — and look good on the shelf.', features: ['airtight seal', 'borosilicate glass', 'stackable', 'wide mouth'] },
    { noun: 'Table Lamp', photo: 'table-lamp', brands: ['Lumen', 'Aurora', 'Nordlys'], lines: ['Bedside', 'Desk', 'Accent', 'Touch'], variants: ['Brass', 'White', 'Black', 'Ceramic'], price: [999, 6999], blurb: 'Soft, glare-free light for reading and winding down.', features: ['touch dimmer', 'E14 bulb', 'fabric shade', 'USB port'] },
    { noun: 'Dining Chair', photo: 'chair', brands: ['Stonehouse', 'Nordlys', 'Hearth'], lines: ['Ladder-Back', 'Windsor', 'Spindle'], variants: ['Oak', 'Walnut', 'Set of 2', 'Set of 4'], price: [3999, 19999], blurb: 'Solid-wood chairs with a woven seat, built with traditional joinery.', features: ['solid hardwood', 'woven rush seat', 'traditional joinery', 'easy assembly'] },
  ],
  'Sports & Fitness': [
    { noun: 'Adjustable Dumbbells', photo: 'dumbbells', brands: ['Apex', 'Ironclad', 'Kinetic', 'Summit'], lines: ['Pair', 'Single', 'Pro', 'Compact'], variants: ['2–12 kg', '2–24 kg', '5–32 kg', '10 kg'], price: [2999, 24999], blurb: 'Replace a rack of weights with one quick-adjust pair.', features: ['quick-adjust dial', 'knurled grip', 'storage tray', 'compact footprint'] },
    { noun: 'Yoga Mat', photo: 'yoga-mat', brands: ['Zenith', 'Kinetic', 'Balance', 'Summit'], lines: ['Cork', 'Pro', 'Travel', 'Align'], variants: ['4 mm', '5 mm', '6 mm', 'Extra Long'], price: [999, 5999], blurb: 'Grippy, cushioned and free of PVC — a mat that stays put in sweaty flows.', features: ['non-slip', 'PVC-free', 'alignment lines', 'carry strap'] },
    { noun: 'Insulated Bottle', photo: 'water-bottle', brands: ['Cascade', 'Summit', 'Kinetic', 'Trailhead'], lines: ['Flask', 'Trail', 'Sport', 'Daily'], variants: ['500 ml', '750 ml', '1L', '1.2L'], price: [699, 3499], blurb: 'Double-wall steel keeps drinks cold for 24 hours and hot for 12.', features: ['double-wall vacuum', 'leak-proof lid', 'BPA-free', 'fits cup holders'] },
    { noun: 'Trekking Poles', photo: 'trekking-poles', brands: ['Ridge', 'Summit', 'Trailhead'], lines: ['Carbon', 'Alloy', 'Folding'], variants: ['Pair', 'Ultralight', 'Cork Grip', 'Pro'], price: [1999, 9999], blurb: 'Light, collapsible poles that save your knees on long descents.', features: ['carbon fibre', 'quick locks', 'cork grips', 'tungsten tips'] },
    { noun: 'Kettlebell', photo: 'kettlebell', brands: ['Ironclad', 'Apex', 'Kinetic'], lines: ['Cast Iron', 'Competition', 'Vinyl'], variants: ['8 kg', '12 kg', '16 kg', '20 kg', '24 kg'], price: [1299, 6999], blurb: 'A single-cast kettlebell with a smooth, wide handle for swings and cleans.', features: ['single cast', 'wide handle', 'flat base', 'powder coat'] },
    { noun: 'Resistance Bands', photo: 'resistance-bands', brands: ['Kinetic', 'Balance', 'Apex', 'Zenith'], lines: ['Loop', 'Tube', 'Fabric', 'Power'], variants: ['Set of 3', 'Set of 5', 'Heavy', 'Light'], price: [399, 2499], blurb: 'Five resistance levels for warm-ups, glute work and full-body training anywhere.', features: ['5 resistance levels', 'non-roll fabric', 'carry pouch', 'exercise guide'] },
    { noun: 'Treadmill', photo: 'treadmill', brands: ['Apex', 'Kinetic', 'Ironclad'], lines: ['Folding', 'Walk', 'Run'], variants: ['', 'Plus', 'Pro', 'Compact'], price: [24999, 89999], blurb: 'A quiet, foldable treadmill with incline and app-connected workouts.', features: ['12% incline', 'folds flat', 'Bluetooth app', 'cushioned deck'] },
    { noun: 'Road Bicycle', photo: 'bicycle', brands: ['Ridge', 'Velocity', 'Summit'], lines: ['Sprint', 'Endurance', 'Gravel'], variants: ['S', 'M', 'L', 'XL'], price: [24999, 149999], blurb: 'An aluminium frame with a carbon fork and reliable disc brakes for fast weekend rides.', features: ['carbon fork', 'disc brakes', '2×11 speed', '700c wheels'] },
    { noun: 'Camping Tent', photo: 'tent', brands: ['Trailhead', 'Summit', 'Ridge'], lines: ['Dome', 'Trail', 'Base'], variants: ['2-Person', '3-Person', '4-Person', 'Ultralight'], price: [3999, 24999], blurb: 'Pitches in minutes, sheds rain and vents well on warm nights.', features: ['3000 mm waterproof', 'colour-coded poles', 'mesh vents', 'footprint included'] },
    { noun: 'Football', photo: 'football', brands: ['Kinetic', 'Velocity', 'Apex'], lines: ['Match', 'Training', 'Street'], variants: ['Size 3', 'Size 4', 'Size 5'], price: [499, 3999], blurb: 'Thermally bonded panels for a true flight and a soft touch on any surface.', features: ['thermal bonding', 'butyl bladder', 'textured PU', 'FIFA-basic quality'] },
    { noun: 'Badminton Racket', photo: 'badminton', brands: ['Velocity', 'Kinetic', 'Zenith'], lines: ['Carbon', 'Power', 'Control'], variants: ['', 'Lite', 'Pro', 'Set of 2'], price: [999, 8999], blurb: 'A head-light graphite racket for fast, controlled net play.', features: ['graphite frame', 'isometric head', 'pre-strung', 'full cover'] },
    { noun: 'Cricket Bat', photo: 'cricket-bat', brands: ['Apex', 'Velocity', 'Summit'], lines: ['English Willow', 'Kashmir Willow', 'Tennis Ball'], variants: ['Short Handle', 'Harrow', 'Size 6', 'Long Blade'], price: [1499, 19999], blurb: 'Hand-pressed willow with thick edges and a mid-to-low sweet spot.', features: ['hand pressed', 'thick edges', 'toe guard', 'cover included'] },
    { noun: 'Foam Roller', photo: 'foam-roller', brands: ['Balance', 'Zenith', 'Kinetic'], lines: ['Textured', 'Smooth', 'Vibrating'], variants: ['30 cm', '45 cm', '60 cm', 'Travel'], price: [499, 4999], blurb: 'A firm roller that eases tight calves, quads and backs after a run.', features: ['high-density foam', 'textured zones', 'lightweight', 'holds shape'] },
  ],
  'Beauty & Personal Care': [
    { noun: 'Vitamin C Serum', photo: 'serum', brands: ['Veda', 'Halcyon', 'Botanic', 'Lumière'], lines: ['Brightening', 'Glow', 'Radiance', 'Daily'], variants: ['10%', '15%', '20%', '30 ml'], price: [499, 2999], blurb: 'A lightweight serum that evens tone and fades dark spots within weeks.', features: ['stabilised vitamin C', 'hyaluronic acid', 'fragrance-free', 'dermatologist tested'] },
    { noun: 'Beard Kit', photo: 'beard-kit', brands: ['Grove', 'Barbershop', 'Cedar & Co'], lines: ['Sandalwood', 'Cedar & Sage', 'Citrus', 'Unscented'], variants: ['Kit', 'Oil', 'Balm', 'Wash'], price: [399, 2499], blurb: 'Softens, conditions and tames — with a scent that stays subtle.', features: ['argan & jojoba oils', 'no synthetic fragrance', 'boar-bristle brush', 'travel pouch'] },
    { noun: 'Night Cream', photo: 'night-cream', brands: ['Halcyon', 'Veda', 'Lumière', 'Botanic'], lines: ['Ceramide', 'Retinol', 'Peptide', 'Hydra'], variants: ['30 ml', '50 ml', 'Sensitive', 'Rich'], price: [599, 3999], blurb: 'Repairs the skin barrier overnight so mornings start plump and calm.', features: ['ceramides', 'niacinamide', 'non-comedogenic', 'paraben-free'] },
    { noun: 'Shampoo', photo: 'shampoo', brands: ['Botanic', 'Grove', 'Lumière', 'Halcyon'], lines: ['Nourishing', 'Anti-Dandruff', 'Volume', 'Colour Care'], variants: ['250 ml', '400 ml', '1L', 'Travel'], price: [249, 1499], blurb: 'Sulphate-free cleansing that leaves hair soft, shiny and easy to style.', features: ['sulphate-free', 'pH balanced', 'plant keratin', 'vegan'] },
    { noun: 'Sunscreen', photo: 'sunscreen', brands: ['Veda', 'Halcyon', 'Botanic'], lines: ['Sheer Touch', 'Mineral', 'Sport', 'Tinted'], variants: ['SPF 30', 'SPF 50', 'SPF 50+', '80 ml'], price: [349, 1999], blurb: 'Broad-spectrum protection that sinks in without a white cast.', features: ['broad spectrum', 'no white cast', 'water resistant', 'reef safe'] },
    { noun: 'Lipstick', photo: 'lipstick', brands: ['Lumière', 'Halcyon', 'Rouge'], lines: ['Velvet Matte', 'Satin', 'Sheer', 'Liquid'], variants: ['Ruby', 'Nude Rose', 'Brick', 'Berry'], price: [349, 2499], blurb: 'Saturated colour with a comfortable, non-drying finish that lasts through lunch.', features: ['long wear', 'non-drying', 'cruelty-free', 'moisturising oils'] },
    { noun: 'Eau de Parfum', photo: 'perfume', brands: ['Lumière', 'Rouge', 'Halcyon', 'Grove'], lines: ['Alive', 'Noir', 'Bloom', 'Amber'], variants: ['30 ml', '50 ml', '100 ml', 'Intense'], price: [1499, 9999], blurb: 'A layered fragrance that opens bright and settles into warm woods.', features: ['long-lasting', 'glass bottle', 'gift box', 'IFRA compliant'] },
    { noun: 'Sheet Mask', photo: 'face-mask', brands: ['Veda', 'Botanic', 'Halcyon'], lines: ['Hydrating', 'Brightening', 'Calming', 'Overnight'], variants: ['Single', 'Pack of 5', 'Pack of 10', 'Pack of 3'], price: [99, 1499], blurb: 'Fifteen minutes to a plumper, calmer complexion.', features: ['biodegradable sheet', 'hyaluronic acid', 'no alcohol', 'single use'] },
    { noun: 'Hair Dryer', photo: 'hair-dryer', brands: ['Lumière', 'Halcyon', 'Aurora'], lines: ['Ionic', 'Pro', 'Travel', 'Salon'], variants: ['1600W', '2000W', '2200W', 'Foldable'], price: [1299, 12999], blurb: 'Fast, frizz-free drying with three heat settings and a cool shot.', features: ['ionic', 'cool shot', 'concentrator nozzle', 'overheat protection'] },
    { noun: 'Trimmer', photo: 'trimmer', brands: ['Grove', 'Barbershop', 'Halcyon'], lines: ['Beard', 'Body', 'All-in-One', 'Precision'], variants: ['', 'Plus', 'Pro', 'Travel'], price: [999, 7999], blurb: 'Skin-friendly blades and 20 length settings for a precise, even trim.', features: ['20 length settings', 'washable', '90-min runtime', 'USB-C charging'] },
    { noun: 'Body Lotion', photo: 'body-lotion', brands: ['Botanic', 'Veda', 'Grove', 'Halcyon'], lines: ['Shea', 'Cocoa', 'Aloe', 'Oat'], variants: ['200 ml', '400 ml', '1L', 'Unscented'], price: [249, 1499], blurb: 'Fast-absorbing hydration that lasts 48 hours without any greasy feel.', features: ['48 h hydration', 'non-greasy', 'dermatologist tested', 'pump bottle'] },
    { noun: 'Nail Polish', photo: 'nail-polish', brands: ['Rouge', 'Lumière', 'Halcyon'], lines: ['Gel-Effect', 'Quick Dry', 'Breathable'], variants: ['Coral', 'Cherry', 'Mint', 'Nude', 'Teal'], price: [149, 799], blurb: 'Glossy, chip-resistant colour that dries in under a minute.', features: ['10-free formula', 'chip resistant', 'wide brush', 'vegan'] },
    { noun: 'Electric Toothbrush', photo: 'toothbrush', brands: ['Halcyon', 'Aurora', 'Grove'], lines: ['Sonic', 'Clean', 'Whitening'], variants: ['', 'Plus', 'Pro', 'Travel'], price: [999, 7999], blurb: 'Sonic vibrations remove more plaque with a two-minute timer and pressure alert.', features: ['2-min timer', 'pressure sensor', '30-day battery', 'travel case'] },
    { noun: 'Makeup Brush Set', photo: 'makeup-brushes', brands: ['Lumière', 'Rouge', 'Halcyon'], lines: ['Essential', 'Pro', 'Face', 'Eye'], variants: ['5-Piece', '8-Piece', '12-Piece', 'Travel'], price: [499, 3999], blurb: 'Dense, soft synthetic bristles that pick up powder and blend cream flawlessly.', features: ['synthetic bristles', 'cruelty-free', 'roll-up case', 'ferrules that do not shed'] },
  ],
};

/* Books get real-sounding titles per genre rather than brand/model names. */
const BOOK_TITLES = {
  programming: ['Clean Architecture in Practice', 'The Art of Readable Code', 'Distributed Systems Explained', 'Effective TypeScript Patterns', 'Refactoring for Humans', 'Database Internals Illustrated', 'Pragmatic Testing', 'Building Resilient APIs', 'The Kubernetes Handbook', 'Functional Thinking', 'Modern Concurrency', 'Security by Design'],
  business: ['The Lean Advantage', 'Scaling Small Teams', 'Pricing with Confidence', 'Founder Mindset', 'The Marketplace Playbook', 'Negotiation Without Fear', 'Cash Flow First', 'Brand in a Sentence', 'Operations That Scale', 'The Customer Loop'],
  selfhelp: ['Small Wins Every Day', 'The Quiet Focus Method', 'Habits That Stick', 'Deep Rest', 'The Calm Ambition', 'Start Before You Are Ready', 'Attention Is a Choice', 'The Sleep Protocol', 'Kind to Yourself', 'One Thing at a Time'],
  fiction: ['The Lighthouse Keeper\'s Daughter', 'Monsoon Letters', 'A Map of Missing Streets', 'The Last Train to Haridwar', 'Salt and Cinnamon', 'The Glassmaker\'s Apprentice', 'Winter in Ranikhet', 'The Paper Bridge', 'Where the River Bends', 'The Night Bakery'],
  science: ['The Weather Machine', 'Atoms and Empires', 'A Short History of Light', 'The Microbiome Within', 'Why Bridges Stand', 'The Mathematics of Everyday Things', 'Ocean Engines', 'Signals from the Deep Sky', 'The Cell\'s Clock', 'Fire, Ice and Everything Between'],
  history: ['Empires of the Monsoon', 'The Silk Road Merchants', 'A People\'s History of Tea', 'The Great Survey', 'Cities of Salt and Stone', 'The Printing Revolution', 'Voices from the Partition', 'The Age of Steam', 'Kingdoms of the Deccan', 'The Spice Wars'],
  cooking: ['The Weeknight Wok', 'Slow Sundays', 'Bread at Home', 'The Dal Book', 'Coastal Kitchen', 'One-Pot Wonders', 'The Fermentation Handbook', 'Street Food at Home', 'Seasonal Vegetarian', 'Cakes Without Fuss'],
  travel: ['Himalayan Trails', 'Coast to Coast by Train', 'The Backwaters Guide', 'Cities on Foot', 'Deserts and Dunes', 'A Weekend in Every State', 'The Great Tea Route', 'Islands of the Andaman', 'Hidden Hill Stations', 'The Slow Travel Manual'],
  biography: ['The Engineer Who Lit the City', 'Letters from a Botanist', 'The Spinner\'s Daughter', 'A Cricketer\'s Summer', 'The Mathematician\'s Garden', 'Notes of a Wandering Doctor', 'The Cartographer', 'A Life in Type', 'The Ferry Captain', 'The Last Telegraphist'],
  fantasy: ['The Ember Court', 'Daughters of the Storm Gate', 'The Cartographer of Dreams', 'Ashen Crown', 'The Tidebound', 'A Choir of Ravens', 'The Lantern Wars', 'Godsmith', 'The Hollow King', 'Songs of the Iron Wood'],
  poetry: ['Monsoon Fragments', 'Small Hours', 'The Weight of Light', 'Field Notes in Verse', 'Salt Psalms', 'Letters to the Rain', 'A Grammar of Leaving', 'Night Orchard', 'The Kite Season', 'Blue Ink'],
};
const AUTHORS = ['Ananya Rao', 'Daniel Mercer', 'Priya Venkatesh', 'Tomás Herrera', 'Meera Iyer', 'Jonah Whitfield', 'Kavya Nair', 'Elena Rossi', 'Arjun Sethi', 'Grace Okafor', 'Rohan Desai', 'Hannah Lindqvist', 'Vikram Malhotra', 'Sofia Almeida', 'Ishaan Bhat', 'Leila Haddad'];
const PUBLISHERS = ['Penguin', 'O\'Reilly', 'Addison-Wesley', 'HarperCollins', 'Bloomsbury', 'Manning', 'Hachette', 'Vintage', 'Rupa', 'Juggernaut'];
const FORMATS = ['Paperback', 'Hardcover', 'Paperback', 'Kindle & Paperback Bundle'];

/* --------------------------------------------------------------------- */
/* Generation                                                              */
/* --------------------------------------------------------------------- */
const describe = (type, name, random) => {
  const feats = [...type.features].sort(() => random() - 0.5).slice(0, 3);
  return `${name} — ${type.blurb} Highlights: ${feats.join(', ')}. Backed by a 12-month warranty and free returns within 7 days.`;
};

const generateGoods = (category, types, target, random) => {
  const products = [];
  const seen = new Set();
  let guard = 0;
  while (products.length < target && guard < target * 40) {
    guard += 1;
    const type = types[products.length % types.length];
    const brand = pick(random, type.brands);
    const line = pick(random, type.lines);
    const variant = pick(random, type.variants);
    const name = [brand, line, variant, type.noun].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (seen.has(name)) continue;
    seen.add(name);

    const price = roundPrice(between(random, type.price[0], type.price[1]));
    const onOffer = random() < 0.45;
    const discountPrice = onOffer ? roundPrice(price * between(random, 0.7, 0.92)) : null;
    const stockRoll = random();
    const stock = stockRoll < 0.06 ? 0 : stockRoll < 0.2 ? Math.floor(between(random, 1, 8)) : Math.floor(between(random, 12, 160));

    products.push({
      name,
      category,
      brand,
      price,
      discountPrice: discountPrice && discountPrice < price ? discountPrice : null,
      stock,
      isFeatured: random() < 0.05,
      description: describe(type, name, random),
      photo: type.photo,
    });
  }
  return products;
};

const generateBooks = (category, types, target, random) => {
  const products = [];
  const seen = new Set();
  const pools = Object.fromEntries(types.map((type) => [type.kind, [...BOOK_TITLES[type.kind]]]));
  let index = 0;
  while (products.length < target) {
    const type = types[index % types.length];
    index += 1;
    const pool = pools[type.kind];
    if (!pool.length) continue;
    const title = pool.shift();
    const author = pick(random, AUTHORS);
    const format = pick(random, FORMATS);
    const edition = random() < 0.25 ? ' (2nd Edition)' : '';
    const name = `${title}${edition}`;
    if (seen.has(name)) continue;
    seen.add(name);

    const price = roundPrice(between(random, 299, 2499));
    const onOffer = random() < 0.5;
    const discountPrice = onOffer ? roundPrice(price * between(random, 0.7, 0.9)) : null;
    products.push({
      name,
      category,
      brand: pick(random, PUBLISHERS),
      price,
      discountPrice: discountPrice && discountPrice < price ? discountPrice : null,
      stock: Math.floor(between(random, 5, 120)),
      isFeatured: random() < 0.05,
      description: `${title} by ${author}. ${format}. A ${type.noun} readers keep recommending — clear, well paced and worth revisiting. Ships in protective packaging.`,
      photo: type.photo,
    });
    if (Object.values(pools).every((list) => list.length === 0)) break;
  }
  return products;
};

/**
 * Returns the generated products for every category, keyed by category name.
 * `target` is per category; existing products in the database count toward it
 * (the seed script subtracts them).
 */
export const generateCatalogue = ({ target = 90 } = {}) => {
  const result = {};
  Object.entries(TYPES).forEach(([category, types], categoryIndex) => {
    const random = rng(1000 + categoryIndex * 7919);
    result[category] = category === 'Books'
      ? generateBooks(category, types, target, random)
      : generateGoods(category, types, target, random);
  });
  return result;
};

/** Every photo key referenced by the generator must exist in the library. */
export const assertLibraryCoverage = () => {
  const missing = new Set();
  Object.values(TYPES).flat().forEach((type) => {
    if (!photoLibrary[type.photo]?.length) missing.add(type.photo);
  });
  if (missing.size) throw new Error(`Photo library is missing: ${[...missing].join(', ')}`);
};

export default generateCatalogue;
