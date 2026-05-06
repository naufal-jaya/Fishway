export type PriceOption = {
  id?: string;
  label: string;
  price: number;
  stock: number;
};

type BaseProduct = {
  id: string;
  name: string;
  category: string;
  seller: string;
  location: string;
  description: string;
  gambar: string;
  jenis: string;
  condition: string;
  origin: string;
  food: string;
  image: string;
};

export type Product =
  | (BaseProduct & {
      type: 0;
      price: number;
      unit: string;
      stock: number;
    })
  | (BaseProduct & {
      type: 1;
      priceOptions: PriceOption[];
    });

export type CartItem = Product & {
  qty: number;
  selectedOption?: PriceOption;
};

export const PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Ikan bebek Segar",
    price: 85000,
    unit: "kg",
    stock: 20,
    category: "Ikan Laut",
    seller: "Pak Budi",
    location: "Jakarta Utara",
    description:
      "Salmon segar impor langsung dari nelayan, cocok untuk sashimi atau dibakar.",
    gambar: "/images/default.png",
    jenis: "Salmon",
    condition: "Segar (Fresh)",
    origin: "Norwegia",
    food: "Pelet",
    image: "/images/default.png",
    type: 0,
  },
  {
    id: "2",
    name: "Udang Windu",
    price: 120000,
    unit: "kg",
    stock: 15,
    category: "Udang",
    seller: "Bu Sari",
    location: "Surabaya",
    description: "Udang windu besar segar, cocok untuk berbagai masakan.",
    gambar: "/images/default.png",
    jenis: "Windu",
    condition: "Beku (Frozen)",
    origin: "Tambak Sidoarjo",
    food: "Alami",
    image: "/images/default.png",
    type: 0,
  },
  {
    id: "3",
    name: "Cumi-cumi Segar",
    price: 65000,
    unit: "kg",
    stock: 30,
    category: "Cumi",
    seller: "Pak Hendra",
    location: "Makassar",
    description: "Cumi segar tangkapan hari ini, daging tebal dan kenyal.",
    gambar: "/images/default.png",
    jenis: "Cumi Biasa",
    condition: "Segar (Fresh)",
    origin: "Selat Makassar",
    food: "Ikan Kecil",
    image: "/images/default.png",
    type: 0,
  },
  {
    id: "4",
    name: "Ikan Kerapu",
    price: 150000,
    unit: "kg",
    stock: 10,
    category: "Ikan Laut",
    seller: "Pak Budi",
    location: "Jakarta Utara",
    description: "Kerapu premium, dagingnya putih dan lembut.",
    gambar: "/images/default.png",
    jenis: "Kerapu Macan",
    condition: "Hidup (Live)",
    origin: "Kepulauan Seribu",
    food: "Udang",
    image: "/images/default.png",
    type: 0,
  },
  {
    id: "5",
    name: "Kepiting Bakau",
    price: 200000,
    unit: "kg",
    stock: 8,
    category: "Kepiting",
    seller: "Ibu Dewi",
    location: "Balikpapan",
    description: "Kepiting bakau betina bertelur, segar dari tambak.",
    gambar: "/images/default.png",
    jenis: "Kepiting Bakau",
    condition: "Hidup (Live)",
    origin: "Kalimantan",
    food: "Kerang",
    image: "/images/default.png",
    type: 0,
  },
  {
    id: "6",
    name: "Lele Dumbo",
    price: 25000,
    unit: "kg",
    stock: 50,
    category: "Ikan Air Tawar",
    seller: "Pak Santoso",
    location: "Bogor",
    description: "Lele dumbo segar dari kolam, ukuran konsumsi.",
    gambar: "/images/default.png",
    jenis: "Lele",
    condition: "Hidup (Live)",
    origin: "Bogor",
    food: "Pelet",
    image: "/images/default.png",
    type: 0,
  },
  {
    id: "7",
    name: "Ikan Koki",
    category: "Ikan Air Tawar",
    seller: "Pak Budi",
    location: "Magetan",
    description: "Ikan koki hias langsung dari peternak Magetan.",
    gambar: "/images/default.png",
    jenis: "Ikan Hias",
    condition: "Hidup (Live)",
    origin: "Magetan",
    food: "Pelet Halus",
    image: "/images/default.png",
    type: 1,
    priceOptions: [
      { label: "1 ons", price: 5000, stock: 5 },
      { label: "5 ons", price: 22000, stock: 6 },
      { label: "1 kg", price: 40000, stock: 10 },
    ],
  },
];

export const DUMMY_CART: CartItem[] = [
  { ...PRODUCTS[0], qty: 2 },
  { ...PRODUCTS[1], qty: 1 },
];

export function getCartItemPrice(item: CartItem) {
  return item.type === 0
    ? item.price
    : item.selectedOption?.price || item.priceOptions[0]?.price || 0;
}

export function getCartItemUnit(item: CartItem) {
  return item.type === 0
    ? item.unit
    : item.selectedOption?.label || item.priceOptions[0]?.label || "varian";
}

export const DUMMY_USER = {
  name: "Andi Pratama",
  email: "andi@email.com",
  phone: "08123456789",
  address: "Jl. Merdeka No. 10, Bogor, Jawa Barat",
  joined: "Januari 2024",
  orders: 12,
  avatar: "🧑‍💼",
};

export const DUMMY_ORDERS = [
  {
    id: "ORD-001",
    buyer: "Andi Pratama",
    product: "Ikan Salmon Segar",
    qty: 2,
    total: 170000,
    status: "Diproses",
    date: "2024-07-20",
  },
  {
    id: "ORD-002",
    buyer: "Bela Sari",
    product: "Udang Windu",
    qty: 1,
    total: 120000,
    status: "Dikirim",
    date: "2024-07-19",
  },
  {
    id: "ORD-003",
    buyer: "Citra Dewi",
    product: "Kepiting Bakau",
    qty: 3,
    total: 600000,
    status: "Selesai",
    date: "2024-07-18",
  },
];

export function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(price);
}
