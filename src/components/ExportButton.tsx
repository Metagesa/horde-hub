import { useRef, useCallback } from "react";
import { toPng } from "html-to-image";
import { Download } from "lucide-react";

interface ExportButtonProps {
  targetRef: React.RefObject<HTMLDivElement>;
  filename: string;
  label: string;
}

export function ExportButton({ targetRef, filename, label }: ExportButtonProps) {
  const handleExport = useCallback(async () => {
    if (!targetRef.current) return;
    try {
      const dataUrl = await toPng(targetRef.current, {
        pixelRatio: 3,
        backgroundColor: "#000",
      });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    }
  }, [targetRef, filename]);

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-3 py-2 bg-secondary text-secondary-foreground font-heading uppercase tracking-widest text-xs hover:bg-secondary/80 transition-colors border border-border"
    >
      <Download className="w-3 h-3" />
      {label}
    </button>
  );
}
