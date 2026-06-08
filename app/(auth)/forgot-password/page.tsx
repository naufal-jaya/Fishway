"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/supabaseClient";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<"request" | "verify" | "reset">("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const validatePassword = (value: string) => value.length >= 8;

  // Reset mode if email changes
  useEffect(() => {
    if (mode === "verify" || mode === "reset") {
      // Keep state
    }
  }, [mode]);

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
      const cleanEmail = email.trim().toLowerCase();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        cleanEmail
      );

      if (resetError) {
        setError(resetError.message || "Gagal mengirim email reset password");
      } else {
        setSuccess(
          "Kode OTP telah dikirim ke email Anda. Silakan masukkan kode tersebut di bawah ini.",
        );
        setMode("verify");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan, coba lagi nanti");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.length < 6) {
      setError("Masukkan 6 digit kode OTP");
      return;
    }

    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: cleanEmail,
        token: otp,
        type: "recovery",
      });

      if (verifyError) {
        setError(verifyError.message || "Kode OTP tidak valid atau kedaluwarsa");
      } else {
        setMode("reset");
        setSuccess("Kode OTP berhasil diverifikasi. Silakan masukkan password baru Anda.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat verifikasi OTP");
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

      setSuccess("Password berhasil direset. Mengalihkan ke halaman login...");
      setNewPassword("");
      setConfirmPassword("");
      
      // Auto redirect after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan, coba lagi nanti");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen lg:h-screen lg:overflow-hidden">
      <div className="flex-1 min-h-screen flex items-center justify-center px-4 sm:px-8 py-10 z-30">
        <div className="w-full bg-white rounded-3xl shadow-[0_1px_3px_rgba(0,0,0,0.25)] my-auto py-6 px-4 sm:py-10 sm:px-16 max-w-[300px] sm:max-w-[480px]">
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
              {mode === "request"
                ? "Masukkan email Anda untuk menerima kode OTP reset password."
                : mode === "verify"
                ? "Masukkan 6 digit kode yang kami kirimkan ke email Anda."
                : "Masukkan password baru Anda untuk menyelesaikan reset."}
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
              mode === "request" 
                ? handleRequestSubmit 
                : mode === "verify" 
                ? handleVerifySubmit 
                : handleResetSubmit
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
            ) : mode === "verify" ? (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Kode OTP
                </label>
                <p className="text-[10px] text-gray-400 mb-2">Dikirim ke: <span className="font-semibold">{email}</span></p>
                <input
                  type="text"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="Masukkan 6 digit kode"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white text-center text-lg tracking-[0.5em] font-bold outline-none"
                />
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white text-xs sm:text-sm outline-none"
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:border-[#568EC5] focus:ring-2 focus:ring-blue-100 focus:bg-white text-xs sm:text-sm outline-none"
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
                  {mode === "reset" ? "Memperbarui..." : mode === "verify" ? "Verifikasi..." : "Mengirim..."}
                </span>
              ) : mode === "reset" ? (
                "Reset Password"
              ) : mode === "verify" ? (
                "Verifikasi OTP"
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
