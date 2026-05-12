"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff, Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Помилка входу");
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      setError("Помилка з'єднання");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <div className="relative w-[150px] h-[38px]">
            <Image src="/TM.webp" alt="Oh My Grant" fill sizes="150px" className="object-contain brightness-0 invert" />
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-[14px] bg-white/[0.06] border border-white/[0.08] mx-auto mb-6">
            <Lock size={20} className="text-white/60" />
          </div>
          <h1 className="text-white text-[22px] font-bold text-center mb-1">Адмін-панель</h1>
          <p className="text-white/35 text-[13px] text-center mb-7">Oh My Grant</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-white/50 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ohmygrant.com"
                className="w-full h-11 px-3.5 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-white/50 mb-1.5">Пароль</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 pr-10 rounded-[10px] bg-white/[0.06] border border-white/[0.1] text-white text-[14px] placeholder:text-white/20 focus:outline-none focus:border-[#00D4AA]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[13px] text-center bg-red-400/10 rounded-lg py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-[10px] bg-[#00D4AA] text-[#0B1120] font-semibold text-[15px] hover:bg-[#00D4AA]/90 transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? "Вхід..." : "Увійти"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
