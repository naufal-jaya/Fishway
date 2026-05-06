"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/supabaseClient";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePassword = (value: string) => value.length >= 8;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const hashString = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;
    const hashParams = new URLSearchParams(hashString);
    const combinedParams = new URLSearchParams();

    searchParams.forEach((value, key) => combinedParams.set(key, value));
    hashParams.forEach((value, key) => combinedParams.set(key, value));

    const hasAccessToken = combinedParams.has("access_token");
    const isRecovery = combinedParams.get("type") === "recovery";
    const errorDescription =
      combinedParams.get("error_description") || combinedParams.get("error");

    if (hasAccessToken || isRecovery) {
      setMode("reset");
      setError("");
      setSuccess("");
      return;
    }

    if (errorDescription) {
      setMode("request");
      setError(errorDescription.replace(/\+/g, " "));
    }
  }, []);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Email tidak boleh kosong");
      return;
    }

    if (!validateEmail(email)) {
      setError("Format email tidak valid");
      return;
    }

    try {
      setIsLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/forgot-password`,
        },
      );

      if (resetError) {
        setError(resetError.message || "Gagal mengirim email reset password");
      } else {
        setSuccess(
          "Email reset password telah dikirim. Periksa kotak masuk Anda untuk melanjutkan.",
        );
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan, coba lagi nanti");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!newPassword) {
      setError("Password baru tidak boleh kosong");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Password minimal 8 karakter");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Password konfirmasi tidak cocok");
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setError(updateError.message || "Gagal mereset password");
        return;
      }

      setSuccess("Password berhasil direset. Silakan masuk kembali.");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan, coba lagi nanti");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex bg-[#F7FBFF] min-h-screen lg:overflow-hidden">
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

      <div className="flex-1 min-h-screen flex items-center justify-center px-8 py-10 z-30">
        <div className="w-full bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.25)] my-auto py-6 px-6 sm:py-10 sm:px-16 max-w-[300px] sm:max-w-[480px]">
          <div className="flex justify-center mb-2">
            <Image
              src="/images/logo2_blue.png"
              alt="Fishway"
              width={140}
              height={44}
            />
          </div>

          <div className="text-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800 sm:text-2xl">
              {mode === "reset" ? "Reset Password" : "Lupa Password?"}
            </h2>
            <p className="text-gray-400 text-sm mt-1">
              {mode === "reset"
                ? "Masukkan password baru Anda untuk menyelesaikan reset."
                : "Masukkan email Anda untuk menerima tautan reset password."}
            </p>
          </div>

          {success && (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-sm text-green-700 mb-4">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-sm text-red-700 mb-4">
              {error}
            </div>
          )}

          <form
            onSubmit={
              mode === "reset" ? handleResetSubmit : handleRequestSubmit
            }
            noValidate
            className="space-y-4"
          >
            {mode === "request" ? (
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
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Masukkan email Anda"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white text-xs sm:text-sm outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password baru
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru"
                    className="w-full pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white text-xs sm:text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Konfirmasi password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru"
                    className="w-full pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white text-xs sm:text-sm outline-none"
                  />
                </div>
              </>
            )}

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
                  {mode === "reset" ? "Memperbarui..." : "Mengirim..."}
                </span>
              ) : mode === "reset" ? (
                "Reset Password"
              ) : (
                "Kirim Email Reset"
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            <Link
              href="/login"
              className="font-semibold text-[#568EC5] hover:underline"
            >
              Kembali ke halaman login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
