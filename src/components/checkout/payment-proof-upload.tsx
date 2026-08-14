"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon } from "lucide-react";

type PaymentProofUploadProps = {
  onReceiptChange: (file: File | null) => void;
  onTransactionRefChange: (ref: string) => void;
  labels: {
    uploadReceipt: string;
    uploadReceiptHint: string;
    transactionRef: string;
    transactionRefHint: string;
  };
};

export function PaymentProofUpload({
  onReceiptChange,
  onTransactionRefChange,
  labels,
}: PaymentProofUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only accept images
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    setFileName(file.name);
    onReceiptChange(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setFileName(null);
    onReceiptChange(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {/* Receipt upload */}
      <div>
        <label
          htmlFor="receipt-upload"
          className="mb-2 block text-sm font-medium"
        >
          {labels.uploadReceipt}
        </label>
        <p className="mb-3 text-sm text-muted-foreground">
          {labels.uploadReceiptHint}
        </p>

        {preview ? (
          <div className="relative overflow-hidden rounded-lg border border-border bg-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Receipt preview"
              className="h-48 w-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur-sm transition-colors hover:bg-background"
            >
              <X className="size-4" />
            </button>
            <div className="border-t border-border bg-muted/50 px-3 py-2">
              <p className="truncate text-sm text-muted-foreground">
                {fileName}
              </p>
            </div>
          </div>
        ) : (
          <label
            htmlFor="receipt-upload"
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 transition-colors hover:border-primary/50 hover:bg-muted/50"
          >
            <ImageIcon className="mb-3 size-10 text-muted-foreground" />
            <p className="mb-1 text-sm font-medium">
              <span className="text-primary">Click to upload</span> or drag and
              drop
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG up to 5MB</p>
          </label>
        )}

        <input
          ref={inputRef}
          id="receipt-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      {/* Transaction reference */}
      <div>
        <label
          htmlFor="transaction-ref"
          className="mb-2 block text-sm font-medium"
        >
          {labels.transactionRef}
        </label>
        <input
          id="transaction-ref"
          type="text"
          placeholder={labels.transactionRefHint}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onTransactionRefChange(e.target.value)
          }
          className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring font-mono"
        />
      </div>
    </div>
  );
}
