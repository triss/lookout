// Share media files via the Web Share API, falling back to individual
// downloads. Shared by the tools that share stills / clips. DOM-coupled (uses
// navigator.share + anchor downloads), so exercised in-browser rather than unit
// tested. Returns "no media" | "shared" | "cancelled" | "downloaded".
//
// records: [{ blob, filename, mime }]
export async function shareOrDownloadMedia(records, title = "lookout stills") {
  if (!records.length) return "no media";
  const canCreateFile = typeof File !== "undefined";
  const files = canCreateFile
    ? records.map((record) => new File([record.blob], record.filename, { type: record.mime }))
    : [];
  if (files.length && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, title });
      return "shared";
    } catch (e) {
      if (e.name === "AbortError") return "cancelled";
      console.warn("Share failed, falling back to download:", e);
    }
  }
  for (const record of records) {
    const url = URL.createObjectURL(record.blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = record.filename;
    a.click();
    URL.revokeObjectURL(url);
  }
  return "downloaded";
}
