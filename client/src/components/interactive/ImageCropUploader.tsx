import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Crop, ImagePlus, Upload, X } from 'lucide-react';
import Button from '@/components/common/Button';
import { APP_CONFIG } from '@/constants/config';
import { apiClient, extractApiErrorMessage } from '@/services/api';
import { useToast } from '@/stores/uiStore';

interface ImageCropUploaderProps {
  onUploaded?: (fileUrl: string, fileId: number) => void;
  aspect?: number;
}

async function getCroppedImageBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D недоступний');

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('Не вдалося сформувати зображення'));
        else resolve(blob);
      },
      'image/jpeg',
      0.9
    );
  });
}

export default function ImageCropUploader({
  onUploaded,
  aspect = 16 / 9,
}: ImageCropUploaderProps) {
  const toast = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('resource-photo.jpg');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Оберіть файл зображення (JPG, PNG або GIF)');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setFileName(file.name.replace(/\.[^.]+$/, '') + '.jpg');
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const onCropComplete = useCallback((_croppedArea: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleUploadCropped = async () => {
    if (!previewUrl || !croppedAreaPixels) return;
    setIsUploading(true);
    try {
      const blob = await getCroppedImageBlob(previewUrl, croppedAreaPixels);
      const formData = new FormData();
      formData.append('file', blob, fileName);

      const res = await apiClient.post<{
        file: { id: number; filename: string };
      }>('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = `${APP_CONFIG.uploadsUrl}/${res.data.file.filename}`;
      setUploadedPreview(uploadedUrl);
      toast.success('Зображення обрізано та завантажено на сервер');
      onUploaded?.(uploadedUrl, res.data.file.id);
      setPreviewUrl(null);
    } catch (err) {
      toast.error(extractApiErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Crop className="h-4 w-4 text-primary-600" />
            Зображення ресурсу (попередній перегляд та обрізання)
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Підтримуються JPG, PNG, GIF до 5 МБ
          </p>
        </div>

        <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
          <ImagePlus className="h-4 w-4" />
          <span>Обрати фото</span>
          <input type="file" accept="image/jpeg,image/png,image/gif" onChange={handleFileSelect} className="hidden" />
        </label>
      </div>

      {previewUrl && (
        <div className="space-y-3">
          <div className="relative h-64 w-full overflow-hidden rounded-xl bg-slate-950">
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
              <span>Масштаб:</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="accent-primary-600"
              />
            </label>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPreviewUrl(null)}
              >
                <X className="h-3.5 w-3.5" />
                Скасувати
              </Button>
              <Button
                type="button"
                size="sm"
                isLoading={isUploading}
                onClick={handleUploadCropped}
              >
                <Upload className="h-3.5 w-3.5" />
                Обрізати та завантажити
              </Button>
            </div>
          </div>
        </div>
      )}

      {uploadedPreview && !previewUrl && (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <img
            src={uploadedPreview}
            alt="Завантажене зображення ресурсу"
            className="max-h-56 w-full object-cover"
          />
        </div>
      )}
    </div>
  );
}