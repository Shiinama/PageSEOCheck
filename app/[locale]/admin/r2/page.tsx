import { R2ImageUploader } from '@/components/admin/r2-image-uploader'

export default function R2AdminPage() {
  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">R2 图片管理</h1>

      <div className="mb-8">
        <h2 className="mb-4 text-xl font-semibold">上传新图片</h2>
        <R2ImageUploader />
      </div>
    </div>
  )
}
