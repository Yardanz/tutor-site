"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Ошибка входа.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } catch {
      setError("Ошибка сети.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container-page py-14">
      <div className="card mx-auto max-w-md p-6">
        <h1 className="text-2xl font-extrabold">Вход в админку</h1>
        <p className="mt-2 text-sm text-slate-500">Только для владельца сайта</p>
        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <label>
            <p className="mb-1 text-sm font-medium">Email</p>
            <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label>
            <p className="mb-1 text-sm font-medium">Пароль</p>
            <input className="input" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Входим..." : "Войти"}
          </Button>
        </form>
      </div>
    </main>
  );
}
