"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/supabaseClient";

type AccountType = "buyer" | "seller";

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>("buyer");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [storeName, setStoreName] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [isProfileStep, setIsProfileStep] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const [{ data: buyer }, { data: seller }] = await Promise.all([
        supabase.from("buyers").select("id").eq("id", user.id).maybeSingle(),
        supabase.from("sellers").select("id").eq("id", user.id).maybeSingle(),
      ]);

      if (buyer || seller) {
        router.replace("/");
        return;
      }

      setFullName(
        user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "",
      );
      setIsProfileStep(true);
    };

    loadUser();
  }, [router, supabase]);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePhone = (value: string) =>
    /^(\+62|62|0)[0-9]{8,13}$/.test(value.replace(/\s/g, ""));

  const handleGoogleSignup = async () => {
    setErrors({});
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/signup`,
      },
    });

    if (error) {
      setErrors({ email: error.message });
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!email) nextErrors.email = "Email tidak boleh kosong";
    else if (!validateEmail(email))
      nextErrors.email = "Format email tidak valid";

    if (!password) nextErrors.password = "Password tidak boleh kosong";
    else if (password.length < 8)
      nextErrors.password = "Password minimal 8 karakter";

    if (!confirmPassword)
      nextErrors.confirmPassword = "Konfirmasi password tidak boleh kosong";
    else if (password !== confirmPassword)
      nextErrors.confirmPassword = "Password tidak cocok";

    if (!agree) nextErrors.agree = "Anda harus menyetujui syarat & ketentuan";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setErrors({ email: error.message });
        return;
      }

      if (!data.session) {
        alert("Akun berhasil dibuat. Cek email Anda untuk konfirmasi login.");
        router.replace("/login");
        return;
      }

      setFullName(email.split("@")[0]);
      setIsProfileStep(true);
    } catch (err) {
      console.error(err);
      setErrors({ email: "Terjadi kesalahan, coba lagi" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: Record<string, string> = {};

    if (!fullName.trim())
      nextErrors.fullName = "Nama lengkap tidak boleh kosong";
    if (!phone) nextErrors.phone = "Nomor telepon tidak boleh kosong";
    else if (!validatePhone(phone))
      nextErrors.phone = "Format nomor telepon tidak valid";
    if (accountType === "seller" && !storeName.trim())
      nextErrors.storeName = "Nama toko tidak boleh kosong";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    try {
      setIsLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setErrors({ fullName: "Session login tidak ditemukan" });
        return;
      }

      const { error: accountError } = await supabase.from("accounts").upsert(
        {
          id: user.id,
          name: fullName.trim(),
          address: null,
        },
        { onConflict: "id" },
      );

      if (accountError) {
        console.error(accountError);
        setErrors({ fullName: "Gagal menyimpan data akun" });
        return;
      }

      if (accountType === "buyer") {
        const { error: buyerError } = await supabase.from("buyers").upsert(
          {
            id: user.id,
            phone,
          },
          { onConflict: "id" },
        );

        if (buyerError) {
          console.error(buyerError);
          setErrors({ phone: "Gagal menyimpan data pembeli" });
          return;
        }
      } else {
        const { error: sellerError } = await supabase.from("sellers").upsert(
          {
            id: user.id,
          },
          { onConflict: "id" },
        );

        if (sellerError) {
          console.error(sellerError);
          setErrors({ storeName: "Gagal menyimpan data penjual" });
          return;
        }

        const { error: storeError } = await supabase.from("stores").upsert(
          {
            seller_id: user.id,
            name: storeName.trim(),
            description: storeDescription.trim() || null,
            phone,
          },
          { onConflict: "seller_id" },
        );

        if (storeError) {
          console.error(storeError);
          setErrors({ storeName: "Gagal menyimpan data toko" });
          return;
        }
      }

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error(err);
      setErrors({ fullName: "Terjadi kesalahan, coba lagi" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelProfile = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
      router.replace("/login");
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );

  const EyeIcon = ({ open }: { open: boolean }) =>
    open ? (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
        />
      </svg>
    ) : (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    );

  return (
    <div className="flex bg-[#F7FBFF] h-screen overflow-hidden">
      <div className="fixed inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full z-0"
          viewBox="0 0 1440 320"
        >
          <path
            d="M0 37C0 37 114 -42 167 73C219 189 311 106 400 119C489 132 510 197 614 173C730 145 741 277 862 199C962 133 1001 211 1102 199C1201 186 1217 116 1325 173C1433 229 1446 0 1523 0V420H0V37Z"
            fill="#A2D2FF"
            fillOpacity="0.4"
          />
        </svg>
        <svg
          className="absolute -bottom-20 left-0 w-full z-10"
          viewBox="0 0 1440 320"
        >
          <path
            d="M0 37C0 37 118 -34 167 73C219 189 311 106 400 119C489 132 510 197 614 173C747 119 813 115 1004 189C1097 225 1194 116 1302 173C1410 229 1446 0 1523 0V253H0V37Z"
            fill="#A2D2FF"
            fillOpacity="0.5"
          />
        </svg>
        <svg
          className="absolute -bottom-[180px] left-0 w-full z-20"
          viewBox="0 0 1440 320"
        >
          <path
            d="M0 10C0 10 130 -32 226 57C322 145 442 53 532 67C621 80 667 136 771 111C904 58 886 48 1077 122C1170 158 1194 73 1302 130C1410 186 1455 47 1532 47V184H3L0 10Z"
            fill="#689DD1"
          />
        </svg>
      </div>

      <div className="hidden lg:flex flex-col w-[45%] items-center relative p-12 z-30">
        <div className="relative mt-36 z-10">
          <h1 className="text-4xl font-bold text-[#3E6BAF] leading-tight mb-4">
            Belanja Ikan Segar
            <br />
            Mudah & Terpercaya
          </h1>
          <p className="text-[#3E6BAF] text-lg leading-relaxed">
            Fishway hadir untuk memberikan
            <br />
            ikan terbaik untuk Anda
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-screen flex items-center justify-center px-8 py-10 z-30">
        <div className="w-full bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.25)] my-auto py-6 px-6 sm:py-10 sm:px-16 max-w-[300px] sm:max-w-[480px]">
          <div className="flex justify-center mb-2">
            <Image
              src="/images/logo2_blue.png"
              alt="Fishway"
              width={100}
              height={32}
              className ="sm:w-[140px] sm:h-[44px]"
            />
          </div>

          <div className="text-center mb-2">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-800">
              {isProfileStep ? "Lengkapi Profil" : "Buat Akun"}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {isProfileStep
                ? "Pilih jenis akun dan isi data yang dibutuhkan"
                : "Buat akun dulu, lalu lengkapi profil Anda"}
            </p>
          </div>

          {isProfileStep ? (
            <form
              onSubmit={handleProfileSubmit}
              noValidate
              className="space-y-1 sm:space-y-4"
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountType("buyer")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    accountType === "buyer"
                      ? "border-[#568EC5] bg-[#568EC5] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#568EC5]"
                  }`}
                >
                  Pembeli
                </button>
                <button
                  type="button"
                  onClick={() => setAccountType("seller")}
                  className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                    accountType === "seller"
                      ? "border-[#568EC5] bg-[#568EC5] text-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#568EC5]"
                  }`}
                >
                  Penjual
                </button>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Masukkan nama lengkap Anda"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                    errors.fullName
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {accountType === "seller" ? "Telepon Toko" : "No. Telepon"}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Masukkan nomor telepon"
                  className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                    errors.phone
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
                {errors.phone && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.phone}</p>
                )}
              </div>

              {accountType === "seller" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nama Toko
                    </label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="Masukkan nama toko"
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                        errors.storeName
                          ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                      }`}
                    />
                    {errors.storeName && (
                      <p className="text-red-500 text-xs mt-1.5">
                        {errors.storeName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Deskripsi Toko
                    </label>
                    <textarea
                      value={storeDescription}
                      onChange={(e) => setStoreDescription(e.target.value)}
                      placeholder="Tambahkan deskripsi toko (opsional)"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition-all focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                    />
                  </div>
                </>
              )}

              <div className="grid gap-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#568EC5] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#4578b0] active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoading ? "Menyimpan..." : "Simpan dan lanjut"}
                </button>
                <button
                  type="button"
                  onClick={handleCancelProfile}
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm transition-all duration-200 hover:border-[#568EC5] hover:text-[#568EC5] disabled:opacity-70"
                >
                  Batalkan registrasi
                </button>
              </div>
            </form>
          ) : (
            <>
              <form
                onSubmit={handleSignupSubmit}
                noValidate
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email)
                        setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="Masukkan email Anda"
                    className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all ${
                      errors.email
                        ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                        : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                    }`}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password)
                          setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      placeholder="Buat password"
                      className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all ${
                        errors.password
                          ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#568EC5]"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >
                      <EyeIcon open={showPassword} />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.password}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword)
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                          }));
                      }}
                      placeholder="Konfirmasi password Anda"
                      className={`w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-all ${
                        errors.confirmPassword
                          ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                          : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-[#568EC5]"
                      aria-label={
                        showConfirmPassword
                          ? "Sembunyikan konfirmasi password"
                          : "Tampilkan konfirmasi password"
                      }
                    >
                      <EyeIcon open={showConfirmPassword} />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1.5">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agree}
                      onChange={(e) => {
                        setAgree(e.target.checked);
                        if (errors.agree)
                          setErrors((prev) => ({ ...prev, agree: "" }));
                      }}
                      className="mt-0.5 w-4 h-4 rounded accent-[#568EC5]"
                    />
                    <span className="text-sm text-gray-600">
                      Saya setuju dengan{" "}
                      <Link
                        href="/syarat-ketentuan"
                        className="text-[#568EC5] font-medium hover:underline"
                      >
                        Syarat & Ketentuan
                      </Link>{" "}
                      dan{" "}
                      <Link
                        href="/kebijakan-privasi"
                        className="text-[#568EC5] font-medium hover:underline"
                      >
                        Kebijakan Privasi
                      </Link>
                    </span>
                  </label>
                  {errors.agree && (
                    <p className="text-red-500 text-xs mt-1.5 ml-6">
                      {errors.agree}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-[#568EC5] text-white font-semibold text-sm transition-all duration-200 hover:bg-[#4578b0] active:scale-[0.98] disabled:opacity-70"
                >
                  {isLoading ? "Memproses..." : "Buat akun"}
                </button>
              </form>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">
                  atau daftar dengan
                </span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                  className="flex items-center justify-center w-16 h-12 rounded-xl border border-gray-200 hover:border-[#568EC5] hover:bg-blue-50 transition-all duration-150 disabled:opacity-70"
                  aria-label="Google"
                >
                  <GoogleIcon />
                </button>
              </div>

              <p className="text-center text-sm text-gray-500 mt-2">
                Sudah punya akun?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#568EC5] hover:underline"
                >
                  Masuk sekarang
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
