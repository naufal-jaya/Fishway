"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import Container from "@/components/Container";
import { createClient } from "@/utils/supabase/supabaseClient";

export default function AddProductPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    jenis: "",
    condition: "",
    origin: "",
    food: "",
    price: "",
    unit: "",
    stock: "",
  });
  
  const [productType, setProductType] = useState<0 | 1>(0);
  const [variants, setVariants] = useState([{ label: "", price: "", stock: "" }]);

  const [file, setFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { label: "", price: "", stock: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const parseStock = (value: string) => {
    const stock = Number(value);
    return Number.isInteger(stock) && stock >= 0 ? stock : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const stockValue = productType === 0 ? parseStock(formData.stock) : null;
      const variantStockValues = productType === 1
        ? variants.map((variant) => parseStock(variant.stock))
        : [];

      if (productType === 0 && stockValue === null) {
        throw new Error("Stok harus berupa angka bulat minimal 0");
      }

      if (productType === 1 && variantStockValues.some((stock) => stock === null)) {
        throw new Error("Stok varian harus berupa angka bulat minimal 0");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Get the store_id for the user
      const { data: store } = await supabase
        .from("stores")
        .select("id")
        .eq("seller_id", user.id)
        .single();
        
      if (!store) throw new Error("Store not found for this user");

      // 2. Upload image to Supabase Storage if file exists
      let imageUrl = "/images/default.png";
      
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("product-images")
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
      }

      // 3. Insert product into database
      const productPayload = {
        store_id: store.id,
        name: formData.name,
        category: formData.category,
        description: formData.description,
        jenis: formData.jenis,
        condition: formData.condition,
        origin: formData.origin,
        food: formData.food,
        type: productType,
        gambar: imageUrl,
        image: imageUrl,
        ...(productType === 0 ? {
          price: parseInt(formData.price) || 0,
          unit: formData.unit,
          stock: stockValue,
        } : {
          price: null,
          unit: null,
          stock: null,
        })
      };

      const { data: newProduct, error: insertError } = await supabase
        .from("products")
        .insert(productPayload)
        .select()
        .single();

      if (insertError) throw insertError;

      // 4. Insert variants if type === 1
      if (productType === 1 && newProduct) {
        const variantsPayload = variants.map((v, index) => ({
          product_id: newProduct.id,
          label: v.label,
          price: parseInt(v.price) || 0,
          stock: variantStockValues[index],
        }));
        
        const { error: variantError } = await supabase
          .from("price_options")
          .insert(variantsPayload);
          
        if (variantError) throw variantError;
      }

      alert("Produk berhasil ditambahkan!");
      router.push("/products");
      router.refresh();
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan saat menambahkan produk");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-2xl mx-auto py-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Tambah Produk Baru</h1>
          
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
              <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full border rounded-lg p-2" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full border rounded-lg p-2">
                <option value="">Pilih Kategori...</option>
                <option value="Ikan Air Tawar">Ikan Air Tawar</option>
                <option value="Ikan Laut">Ikan Laut</option>
                <option value="Seafood">Seafood</option>
                <option value="Ikan Hias">Ikan Hias</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto Produk</label>
              <input type="file" accept="image/*" onChange={handleFileChange} className="w-full border rounded-lg p-2" />
            </div>

            <div className="border-b pb-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Produk</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="productType" 
                    checked={productType === 0} 
                    onChange={() => setProductType(0)} 
                    className="accent-primary"
                  />
                  <span>Berdasarkan Berat (Satuan)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="radio" 
                    name="productType" 
                    checked={productType === 1} 
                    onChange={() => setProductType(1)} 
                    className="accent-primary"
                  />
                  <span>Buat Kategori (Varian)</span>
                </label>
              </div>
            </div>

            {productType === 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                    <input required type="number" name="price" value={formData.price} onChange={handleChange} className="w-full border rounded-lg p-2" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Satuan (mis. kg, ekor)</label>
                    <input required type="text" name="unit" value={formData.unit} onChange={handleChange} className="w-full border rounded-lg p-2" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stok Total</label>
                  <input required type="number" min="0" step="1" name="stock" value={formData.stock} onChange={handleChange} className="w-full border rounded-lg p-2" />
                </div>
              </>
            ) : (
              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border">
                <h3 className="font-semibold text-gray-800">Varian Produk</h3>
                {variants.map((variant, index) => (
                  <div key={index} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Nama Varian (mis. 1 Ons)</label>
                      <input required type="text" value={variant.label} onChange={(e) => handleVariantChange(index, 'label', e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Harga (Rp)</label>
                      <input required type="number" value={variant.price} onChange={(e) => handleVariantChange(index, 'price', e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                    <div className="w-24">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Stok</label>
                      <input required type="number" min="0" step="1" value={variant.stock} onChange={(e) => handleVariantChange(index, 'stock', e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                    </div>
                    {variants.length > 1 && (
                      <button type="button" onClick={() => removeVariant(index)} className="mt-6 text-red-500 p-2 hover:bg-red-50 rounded-lg">
                        X
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addVariant} className="text-sm font-semibold text-primary hover:underline">
                  + Tambah Varian
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                <input type="text" name="jenis" value={formData.jenis} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi (mis. Segar, Hidup)</label>
                <input type="text" name="condition" value={formData.condition} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Asal</label>
                <input type="text" name="origin" value={formData.origin} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pakan (jika ada)</label>
                <input type="text" name="food" value={formData.food} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={4} className="w-full border rounded-lg p-2"></textarea>
            </div>

            <button disabled={loading} type="submit" className="w-full btn-primary py-3 rounded-xl mt-4">
              {loading ? "Menyimpan..." : "Simpan Produk"}
            </button>
          </form>
        </div>
      </Container>
    </div>
  );
}
