"use client";

import { useCallback, useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropzoneProps {
  onFilesAdded: (files: File[]) => void;
}

const ACCEPT = "video/*,audio/*,image/*";

export function Dropzone({ onFilesAdded }: DropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList) return;
      const accepted = Array.from(fileList).filter(
        (f) =>
          f.type.startsWith("video/") ||
          f.type.startsWith("audio/") ||
          f.type.startsWith("image/"),
      );
      if (accepted.length) onFilesAdded(accepted);
    },
    [onFilesAdded],
  );

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setDragging(false);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-16 transition-colors",
        dragging
          ? "border-champagne bg-champagne/10"
          : "border-atelier bg-canvas hover:border-atelier hover:bg-surface/50",
      )}
    >
      <UploadCloud
        className={cn(
          "mb-4 h-12 w-12",
          dragging ? "text-champagne" : "text-muted-atelier",
        )}
      />
      <p className="mb-1 text-sm font-medium text-pearl">
        {dragging ? "Drop files here" : "Drag & drop files here"}
      </p>
      <p className="text-xs text-muted-atelier">
        or click to browse · Video, Audio, Image
      </p>

      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={ACCEPT}
        multiple
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
