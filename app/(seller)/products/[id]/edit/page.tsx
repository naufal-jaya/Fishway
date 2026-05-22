"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Container from "@/components/Container";
import ProductImageManager, { MAX_PRODUCT_IMAGE_SIZE_BYTES, ProductImageItem } from "@/components/ProductImageManager";
import { createClient } from "@/utils/supabase/supabaseClient";
import { ChevronLeft } from "lucide-react";

const MAX_PRODUCT_IMAGES = 10;

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

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
  const [variants, setVariants] = useState([{ id: "", label: "", price: "", stock: "" }]);
  const [existingImage, setExistingImage] = useState("");
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const imagesRef = useRef<ProductImageItem[]>([]);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      imagesRef.current.forEach((image) => {
        if (image.file) {
          URL.revokeObjectURL(image.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      const { data, error } = await supabase
        .from("products")
        .select("*, price_options(*), product_images(*)")
        .eq("id", params.id)
        .single();

      if (data && !error) {
        setFormData({
          name: data.name || "",
          category: data.category || "",
          description: data.description || "",
          jenis: data.jenis || "",
          condition: data.condition || "",
          origin: data.origin || "",
          food: data.food || "",
          price: data.price?.toString() || "",
          unit: data.unit || "",
          stock: data.stock?.toString() || "",
        });
        setProductType(data.type as 0 | 1);
        setExistingImage(data.gambar || "");

        const productImages = Array.isArray(data.product_images)
          ? [...data.product_images].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
          : [];

        if (productImages.length > 0) {
          setImages(productImages.map((image: any) => ({
            id: image.id,
            url: image.url,
            previewUrl: image.url,
            caption: image.caption || "",
            sortOrder: image.sort_order || 0,
          })));
        } else if (data.gambar && data.gambar !== "/images/default.png") {
          setImages([{
            url: data.gambar,
            previewUrl: data.gambar,
            caption: "",
            sortOrder: 0,
          }]);
        }

        if (data.type === 1 && data.price_options?.length > 0) {
          setVariants(data.price_options.map((v: any) => ({
            id: v.id,
            label: v.label,
            price: v.price?.toString() || "",
            stock: v.stock?.toString() || ""
          })));
        }
      }
      setFetching(false);
    }
    fetchProduct();
  }, [params.id, supabase]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index: number, field: string, value: string) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { id: "", label: "", price: "", stock: "" }]);
  };

  const removeVariant = async (index: number) => {
    if (variants.length > 1) {
      const variantToRemove = variants[index];
      if (variantToRemove.id) {
        // Hapus dari database jika sudah ada
        await supabase.from("price_options").delete().eq("id", variantToRemove.id);
      }
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleAddImages = (files: File[]) => {
    if (files.length === 0) return;

    setImages((currentImages) => {
      const remainingSlots = MAX_PRODUCT_IMAGES - currentImages.length;
      if (remainingSlots <= 0) {
        alert("Maksimal 10 foto produk");
        return currentImages;
      }

      if (files.length > remainingSlots) {
        alert(`Maksimal 10 foto produk. Hanya ${remainingSlots} foto yang ditambahkan.`);
      }

      const nextImages = files.slice(0, remainingSlots).map((file) => ({
        file,
        previewUrl: URL.createObjectURL(file),
        caption: "",
      }));

      return [...currentImages, ...nextImages];
    });
  };

  const handleCaptionChange = (index: number, caption: string) => {
    setImages((currentImages) =>
      currentImages.map((image, imageIndex) =>
        imageIndex === index ? { ...image, caption } : image
      )
    );
  };

  const handleRemoveImage = (index: number) => {
    setImages((currentImages) => {
      const image = currentImages[index];
      if (image?.file) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return currentImages.filter((_, imageIndex) => imageIndex !== index);
    });
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

      if (images.some((image) => image.file && image.file.size > MAX_PRODUCT_IMAGE_SIZE_BYTES)) {
        throw new Error("Ukuran setiap foto maksimal 10 MB");
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const savedImages = [];

      for (const [index, image] of images.entries()) {
        if (image.file) {
          const fileExt = image.file.name.split(".").pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;
          const filePath = `${user.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("product-images")
            .upload(filePath, image.file);

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from("product-images")
            .getPublicUrl(filePath);

          savedImages.push({
            url: publicUrl,
            caption: image.caption.trim() || null,
            sort_order: index,
          });
        } else if (image.url) {
          savedImages.push({
            url: image.url,
            caption: image.caption.trim() || null,
            sort_order: index,
          });
        }
      }

      const imageUrl = savedImages[0]?.url || "/images/default.png";

      // Update product
      const productPayload = {
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

      const { error: updateError } = await supabase
        .from("products")
        .update(productPayload)
        .eq("id", params.id);

      if (updateError) throw updateError;

      await supabase.from("product_images").delete().eq("product_id", params.id);

      if (savedImages.length > 0) {
        const { error: imageError } = await supabase
          .from("product_images")
          .insert(savedImages.map((image) => ({
            product_id: params.id,
            ...image,
          })));

        if (imageError) throw imageError;
      }

      // Update/Insert variants if type === 1
      if (productType === 1) {
        // To keep it simple, we could delete existing and insert new, or upsert.
        // Let's use delete and insert if no ID, or just upsert
        for (const [index, v] of variants.entries()) {
          if (v.id) {
            await supabase.from("price_options").update({
              label: v.label,
              price: parseInt(v.price) || 0,
              stock: variantStockValues[index],
            }).eq("id", v.id);
          } else {
            await supabase.from("price_options").insert({
              product_id: params.id,
              label: v.label,
              price: parseInt(v.price) || 0,
              stock: variantStockValues[index],
            });
          }
        }
      } else {
        // If changed to type 0, delete all price options
        await supabase.from("price_options").delete().eq("product_id", params.id);
      }

      alert("Produk berhasil diperbarui!");
      router.push("/products");
      router.refresh();
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan saat memperbarui produk");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="text-center py-20">Memuat data produk...</div>;
  }

  return (
    <div>
      <Navbar />
      <Container>
        <div className="max-w-6xl mx-auto relative min-h-screen">
          <div
            className="fixed top-0 left-0 h-full pointer-events-none z-0"
            style={{
              backgroundImage: "url('/images/latar.png')",
              backgroundRepeat: "no-repeat",
              backgroundSize: "contain",
              backgroundPosition: "left center",
              width: "1300px",
              opacity: 1,
            }}
          />
          <div className="relative z-10">
            <div className="mb-6">
              <Link href="/products" className="inline-flex items-center text-gray-400 hover:text-[#407BB5]">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold text-gray-800 mt-1">Edit Produk</h1>
            </div>
          
          <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr] items-start">
            <ProductImageManager
              images={images}
              onAdd={handleAddImages}
              onCaptionChange={handleCaptionChange}
              onRemove={handleRemoveImage}
              maxImages={MAX_PRODUCT_IMAGES}
            />

            <div className="card p-6 space-y-4">
            
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

            <div className="border-b pb-4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipe Produk</label>
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
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
                <div className="grid gap-4 sm:grid-cols-2">
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
                  <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-start">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
                <input type="text" name="jenis" value={formData.jenis} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kondisi (mis. Segar, Hidup)</label>
                <input type="text" name="condition" value={formData.condition} onChange={handleChange} className="w-full border rounded-lg p-2" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
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
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            </div>
          </form>
          </div>
        </div>
      </Container>
    </div>
  );
}
