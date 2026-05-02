"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleGoogleLogin = async () => {
    setErrors({});
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
      },
    });

    if (error) {
      setErrors({ email: error.message });
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "Email tidak boleh kosong";
    } else if (!validateEmail(email)) {
      newErrors.email = "Format email tidak valid";
    }

    if (!password) {
      newErrors.password = "Password tidak boleh kosong";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setIsLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrors({
          email: "Email atau password salah",
        });
        return;
      }

      if (!data.session) {
        setErrors({
          email: "Gagal login, coba lagi",
        });
        return;
      }

      console.log("login success", data);

      router.replace("/");
    } catch (err) {
      console.error(err);
      setErrors({
        email: "Terjadi kesalahan, coba lagi",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-[#F7FBFF] h-screen lg:overflow-hidden ">
      <div className="fixed inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full z-0"
          viewBox="0 0 1440 320"
        >
          <path
            d="M0.000942231 37.2993C0.000942231 37.2993 113.811 -42.2906 166.552 73.4664C219.293 189.223 310.822 105.64 400.046 118.997C489.27 132.353 510.174 197.15 613.941 172.5C730.392 144.837 741.455 276.583 861.631 198.5C962.441 133 1001.02 211.058 1101.94 198.5C1201.03 186.17 1216.93 115.986 1324.94 172.5C1432.95 229.014 1445.94 -6.95959e-05 1523.26 0C1536.06 248.051 1524.08 261.374 1523.26 420C1523.26 420 -0.00114292 865.966 6.43158e-10 394.983C0.00114292 -76.0001 0.739034 205.986 0.000766754 88L0.000942231 37.2993Z"
            fill="#A2D2FF"
            fillOpacity="0.4"
          />
        </svg>

        <svg
          className="absolute -bottom-20 left-0 w-full z-10"
          viewBox="0 0 1440 320"
        >
          <path
            d="M0.000175476 37.2993C0.000175476 37.2993 0.458678 36.9786 1.33097 36.4076C1.50784 23.4542 1.66758 18.8862 1.79234 36.1075C16.4791 26.6079 117.706 -33.7407 166.551 73.4664C219.293 189.223 310.822 105.64 400.046 118.997C489.269 132.353 510.173 197.15 613.941 172.5C746.545 118.997 813.15 115.182 1004.05 188.841C1097.21 224.788 1193.53 116.326 1301.55 172.841C1409.56 229.355 1445.94 -6.95959e-05 1523.26 0C1536.06 248.051 1525.37 175.214 1525.32 252.925C1489.5 297.14 338.341 292.79 2.06249 252.925C2.06281 120.752 1.95866 59.0663 1.79234 36.1075C1.62759 36.214 1.47374 36.3142 1.33097 36.4076C0.903387 67.7215 0.37568 148.039 0 88L0.000175476 37.2993Z"
            fill="#A2D2FF"
            fillOpacity="0.5"
          />
        </svg>

        <svg
          className="absolute -bottom-[180px] left-0 w-full z-20"
          viewBox="0 0 1440 320"
        >
          <path
            d="M0.000175476 9.72022C0.000175476 9.72022 130.14 -31.7798 226.14 56.7202C322.14 145.22 442.416 53.3636 531.64 66.7202C620.863 80.0768 667.372 135.87 771.14 111.22C903.744 57.7167 885.744 48.061 1076.64 121.72C1169.8 157.667 1193.53 73.312 1301.55 129.826C1409.56 186.341 1454.83 46.7201 1532.15 46.7202C1532.15 140.001 1532.16 158.393 1532.16 160.017C1532.17 152.921 1532.17 161.242 1532.16 160.017C1532.16 163.428 1532.15 170.404 1532.15 183.72H3.20655C3.20606 145.826 0.738267 230.206 0 112.22L0.000175476 9.72022Z"
            fill="#689DD1"
          />
        </svg>
      </div>

      <div className="hidden lg:flex flex-col w-[45%] items-center relative overflow-hidden p-12 z-30">
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

      {/* Right panel */}
      <div className="flex-1 min-h-screen flex items-center justify-center px-8 py-10 z-30">
        <div className="w-full bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.25)] my-auto py-6 px-6 sm:py-10 sm:px-16 max-w-[300px] sm:max-w-[480px]">
          {/* Logo mobile */}
          <div className="flex justify-center mb-2 lg:hidden">
            <Image
              src="/images/logo2_blue.png"
              alt="Fishway"
              width={100}
              height={32}
            />
          </div>

          {/* Logo desktop */}
          <div className="hidden lg:flex justify-center mb-2">
            <Image
              src="/images/logo2_blue.png"
              alt="Fishway"
              width={140}
              height={44}
            />
          </div>

          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-gray-800 sm:text-2xl">
              Masuk ke Fishway
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              Silahkan masuk untuk melanjutkan
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-2">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email)
                      setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="Masukkan email Anda"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border text-xs sm:text-sm outline-none transition-all ${
                    errors.email
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password)
                      setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Masukkan password Anda"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl border text-xs sm:text-sm outline-none transition-all ${
                    errors.password
                      ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
                      : "border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#568EC5] transition-colors"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
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
                      className="w-4 h-4"
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
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>
              )}
            </div>

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-[#568EC5] hover:underline"
              >
                Lupa Password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
              style={{ background: isLoading ? "#7aaed4" : "#568EC5" }}
              onMouseEnter={(e) =>
                !isLoading &&
                ((e.target as HTMLButtonElement).style.background = "#4578b0")
              }
              onMouseLeave={(e) =>
                !isLoading &&
                ((e.target as HTMLButtonElement).style.background = "#568EC5")
              }
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Memproses...
                </span>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400">atau masuk dengan</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Social login */}
          <div className="flex gap-3 justify-center">
            {[
              {
                label: "Google",
                icon: (
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
                ),
              },
            ].map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex items-center justify-center w-16 h-12 rounded-xl border border-gray-200 hover:border-[#568EC5] hover:bg-blue-50 transition-all duration-150"
                aria-label={s.label}
              >
                {s.icon}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mt-3">
            Belum punya akun?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#568EC5] hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
