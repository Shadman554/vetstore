import { useRef, useState } from "react";
import { ImagePlus, X, Loader2, Cloud, HardDrive } from "lucide-react";
import { getAdminToken } from "@/lib/admin-auth";

interface MultiImageUploadProps {
  values: string[];
  onChange: (values: string[]) => void;
  label?: string;
  productName?: string;
  productCode?: string;
}

async function uploadToR2(
  file: File,
  productName?: string,
  productCode?: string,
  imageIndex?: number,
): Promise<string | null> {
  const token = getAdminToken();
  if (!token) return null;

  try {
    const formData = new FormData();
    formData.append("file", file);
    if (productName?.trim()) formData.append("productName", productName.trim());
    if (productCode?.trim()) formData.append("productCode", productCode.trim());
    if (imageIndex != null) formData.append("imageIndex", String(imageIndex));

    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!res.ok) return null;
    const data = await res.json() as {
      available: boolean;
      fileUrl?: string;
      originalKB?: number;
      compressedKB?: number;
    };

    return data.available && data.fileUrl ? data.fileUrl : null;
  } catch {
    return null;
  }
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function MultiImageUpload({
  values: valuesProp,
  onChange,
  label,
  productName,
  productCode,
}: MultiImageUploadProps) {
  const values = Array.isArray(valuesProp) ? valuesProp : [];
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [useR2, setUseR2] = useState<boolean | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    e.target.value = "";
    setUploading(true);

    const results: string[] = [];
    const startIndex = values.length + 1;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const imageIndex = startIndex + i;
      const r2Url = await uploadToR2(file, productName, productCode, imageIndex);
      if (r2Url) {
        if (useR2 === null) setUseR2(true);
        results.push(r2Url);
      } else {
        if (useR2 === null) setUseR2(false);
        const dataUrl = await readAsDataURL(file);
        results.push(dataUrl);
      }
    }

    onChange([...values, ...results]);
    setUploading(false);
  };

  const handleRemove = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium leading-none">{label}</div>
          {useR2 !== null && (
            <div className={`flex items-center gap-1 text-xs font-semibold ${useR2 ? "text-green-600" : "text-muted-foreground"}`}>
              {useR2 ? <Cloud className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
              {useR2 ? "R2 Cloud" : "Local"}
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="grid grid-cols-3 gap-2">
        {values.map((src, i) => (
          <div key={i} className="relative rounded-xl overflow-hidden border-2 border-border aspect-square group">
            <img src={src} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={(e) => handleRemove(i, e)}
              className="absolute top-1 right-1 w-6 h-6 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1 text-muted-foreground hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <ImagePlus className="w-6 h-6" />
              <span className="text-xs font-semibold">Add</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

interface ImageUploadProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  productName?: string;
  productCode?: string;
}

export function ImageUpload({ value, onChange, label, productName, productCode }: ImageUploadProps) {
  return (
    <MultiImageUpload
      values={value ? [value] : []}
      onChange={(vals) => onChange(vals[0] ?? "")}
      label={label}
      productName={productName}
      productCode={productCode}
    />
  );
}
