import { PostEditorForm } from "@/components/admin/PostEditorForm";

export default function AdminNewPostPage() {
  return (
    <main className="container-page py-8">
      <h1 className="mb-4 text-3xl font-extrabold">Новый материал</h1>
      <div className="card p-5">
        <PostEditorForm mode="create" />
      </div>
    </main>
  );
}
