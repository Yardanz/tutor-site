"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Props = {
  id: number;
};

export function DeletePostButton({ id }: Props) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onDelete() {
    if (!confirm("Удалить материал? Это действие необратимо.")) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Не удалось удалить материал.");
      router.refresh();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Ошибка удаления.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="destructive" onClick={onDelete} disabled={loading} type="button">
      {loading ? "Удаление..." : "Удалить"}
    </Button>
  );
}
