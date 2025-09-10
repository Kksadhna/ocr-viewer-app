import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText as IconFileText,
  Languages as IconLanguages,
  Upload as IconUpload,
  Download as IconDownload,
  X as IconClose,
  Image as IconImage,
  Copy as IconCopy,
  Trash as IconTrash
} from "lucide-react";
import { Loader as IconLoader } from "lucide-react";
import { Wand as IconWand } from "lucide-react";

export default function OCRApp() {
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [lang, setLang] = useState("eng");

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // Helpers
  const activeItem = items.find((i) => i.id === activeId);

  const handleFilesPicked = (e) => {
    const files = Array.from(e.target.files);
    const newItems = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      url: URL.createObjectURL(file),
      text: "",
      status: "pending",
    }));
    setItems((prev) => [...prev, ...newItems]);
    if (!activeId && newItems.length > 0) {
      setActiveId(newItems[0].id);
    }
  };

  const onPickFiles = () => fileInputRef.current.click();
  const clearAll = () => {
    setItems([]);
    setActiveId(null);
  };

  const removeItem = (id) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (id === activeId) setActiveId(null);
  };

  const copyText = async (text) => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const downloadText = (text, fileName) => {
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 🔹 Connect to Flask Backend (PyTesseract)
  const processItem = async (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, status: "processing" } : it))
    );

    const item = items.find((i) => i.id === id);
    if (!item) return;

    const formData = new FormData();
    formData.append("file", item.file);
    formData.append("lang", lang);

    try {
      const res = await fetch("http://localhost:5001/ocr", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setItems((prev) =>
        prev.map((it) =>
          it.id === id
            ? { 
                ...it, 
                text: data.original, 
                translated: data.translated, 
                status: "done" 
              }
            : it
        )
      );
    } catch (err) {
      setItems((prev) =>
        prev.map((it) =>
          it.id === id ? { ...it, status: "error", text: "" } : it
        )
      );
    }
  };

  const processAll = () => {
    items.forEach((i) => processItem(i.id));
  };

  const speakText = (text, targetLang = lang) => {
    if (!text) return;
    const utterance = new SpeechSynthesisUtterance(text);

    const langMap = {
      en: "en-US",
      hi: "hi-IN",
      ta: "ta-IN",
      te: "te-IN",
      kn: "kn-IN",
      mr: "mr-IN",
    };

    utterance.lang = langMap[targetLang] || "en-US";

    const voices = speechSynthesis.getVoices();
    const matchedVoice = voices.find((v) => v.lang === utterance.lang);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur bg-white/60 border-b border-black/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 grid place-items-center text-white shadow">
              <IconFileText className="size-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
                Pic2Text
              </h1>
              <p className="text-xs sm:text-sm opacity-70">
                Upload images, extract text, copy or download ,text translation.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 mr-2">
              <IconLanguages className="size-4 opacity-70" />
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-indigo-500/50"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="ta">Tamil</option>
                <option value="te">Telugu</option>
                <option value="kn">Kannada</option>
                <option value="mr">Marathi</option>
              </select>
            </div>
            <button
              onClick={processAll}
              disabled={!items.length}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconWand className="size-4" />
              Process all
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Uploader + Gallery */}
        <section className="lg:col-span-5 flex flex-col gap-4">
          {/* Uploader */}
          <div
            ref={dropRef}
            className="rounded-3xl border border-dashed p-6 sm:p-8 bg-white/70 dark:bg-neutral-900/70 hover:bg-white dark:hover:bg-neutral-900 transition shadow-sm"
          >
            <div className="flex flex-col items-center justify-center text-center gap-4">
              <div className="size-14 rounded-2xl grid place-items-center bg-neutral-100 dark:bg-neutral-800">
                <IconUpload className="size-6 opacity-80" />
              </div>
              <div>
                <p className="font-medium">Drag & drop images here</p>
                <p className="text-sm opacity-70">
                  PNG, JPG, JPEG, WebP. You can also paste from clipboard.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  onClick={onPickFiles}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm border bg-neutral-50 dark:bg-neutral-800 hover:shadow-sm"
                >
                  <IconImage className="size-4" />
                  Browse files
                </button>
                <button
                  onClick={clearAll}
                  disabled={!items.length}
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm border hover:shadow-sm disabled:opacity-50"
                >
                  <IconTrash className="size-4" />
                  Clear all
                </button>
                <input
                  ref={fileInputRef}
                  className="hidden"
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFilesPicked}
                />
              </div>
            </div>
          </div>

          {/* Gallery */}
          <div className="rounded-3xl border p-3 sm:p-4 bg-white/80 dark:bg-neutral-900/80 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Images</h2>
              <span className="text-xs opacity-70">{items.length} selected</span>
            </div>
            {items.length === 0 ? (
              <div className="text-sm opacity-70">
                No images yet. Upload to get started.
              </div>
            ) : (
              <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <AnimatePresence>
                  {items.map((it) => (
                    <motion.li
                      key={it.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`group relative rounded-2xl overflow-hidden border cursor-pointer ${
                        activeId === it.id ? "ring-2 ring-indigo-500" : ""
                      }`}
                      onClick={() => setActiveId(it.id)}
                    >
                      <img
                        src={it.url}
                        alt={it?.file?.name || "image"}
                        className="aspect-square object-cover w-full"
                      />
                      <div className="absolute inset-x-0 bottom-0 p-1.5 text-[11px] truncate bg-gradient-to-t from-black/70 to-transparent text-white">
                        {it.file.name}
                      </div>
                      <button
                        className="absolute top-2 right-2 rounded-full bg-black/50 text-white p-1.5 opacity-0 group-hover:opacity-100 transition"
                        title="Remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(it.id);
                        }}
                      >
                        <IconTrash className="size-3.5" />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>
        </section>

        {/* Right column: Preview + Text */}
        <section className="lg:col-span-7 grid grid-rows-[auto_1fr] gap-4 min-h-[60vh]">
          {/* Preview */}
          <div className="rounded-3xl border p-3 sm:p-4 bg-white/80 dark:bg-neutral-900/80 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold">Preview</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 sm:hidden">
                  <IconLanguages className="size-4 opacity-70" />
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border bg-transparent text-sm outline-none focus:ring-2 ring-indigo-500/50"
                  >
                    <option value="eng">English</option>
                    <option value="hin">Hindi</option>
                    <option value="tam">Tamil</option>
                    <option value="tel">Telugu</option>
                    <option value="kan">Kannada</option>
                    <option value="mar">Marathi</option>
                  </select>
                </div>
                <button
                  onClick={() => activeItem && processItem(activeItem.id)}
                  disabled={!activeItem || activeItem.status === "processing"}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border bg-neutral-50 dark:bg-neutral-800 hover:shadow-sm disabled:opacity-50"
                >
                  {activeItem?.status === "processing" ? (
                    <IconLoader className="size-4 animate-spin" />
                  ) : (
                    <IconWand className="size-4" />
                  )}
                  {activeItem?.status === "processing"
                    ? "Processing..."
                    : "Process image"}
                </button>
              </div>
            </div>
            <div className="mt-3 rounded-2xl overflow-hidden border bg-neutral-100 dark:bg-neutral-800 grid place-items-center min-h-50">
              {activeItem ? (
                <img
                  src={activeItem.url}
                  alt={activeItem?.file?.name || "preview image"}
                  className="max-h-[48vh] object-contain"
                />
              ) : (
                <div className="text-sm opacity-70 py-12">
                  Select an image from the gallery
                </div>
              )}
            </div>
          </div>

         {/* Text Output */}
<div className="rounded-3xl border p-3 sm:p-4 bg-white/80 dark:bg-neutral-900/80 shadow-sm">
  <div className="flex items-center justify-between gap-2">
    <h2 className="font-semibold">Extracted Text</h2>
    <div className="flex items-center gap-2">
      <button
        onClick={() => copyText(activeItem?.text || "")}
        disabled={!activeItem || !activeItem.text}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border hover:shadow-sm disabled:opacity-50"
      >
        <IconCopy className="size-4" /> Copy
      </button>

      <button
  onClick={() => speakText(activeItem?.text || "", "en")}
  disabled={!activeItem || !activeItem.text}
  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border hover:shadow-sm disabled:opacity-50"
>
  🔊 Speak
</button>


      <button
        onClick={() => {
          const fileName = activeItem?.file?.name
            ? activeItem.file.name.replace(/\.[^.]+$/, "")
            : "output";
          downloadText(activeItem?.text || "", fileName);
        }}
        disabled={!activeItem || !activeItem.text}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border hover:shadow-sm disabled:opacity-50"
      >
        <IconDownload className="size-4" /> Download
      </button>
    </div>
  </div>

  {/* OCR Result */}
  <div className="flex-1 flex flex-col mt-3">
    <textarea
      value={activeItem?.text || ""}
      readOnly
      className="w-full h-40 mt-2 p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-gray-100 resize-none focus:outline-none"
      placeholder={
        activeItem?.status === "processing"
          ? "Processing..."
          : activeItem?.status === "error"
          ? "❌ Error extracting text"
          : "Extracted text will appear here..."
      }
    />
  </div>
</div>
{/* Translated Text */}
<div className="rounded-3xl border p-3 sm:p-4 bg-white/80 dark:bg-neutral-900/80 shadow-sm">
  <div className="flex items-center justify-between gap-2">
    <h2 className="font-semibold">Translated Text ({lang})</h2>
    <div className="flex items-center gap-2">
      <button
        onClick={() => copyText(activeItem?.translated || "")}
        disabled={!activeItem || !activeItem.translated}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border hover:shadow-sm disabled:opacity-50"
      >
        <IconCopy className="size-4" /> Copy
      </button>

      <button
  onClick={() => speakText(activeItem?.translated || "", lang)}
  disabled={!activeItem || !activeItem.translated}
  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border hover:shadow-sm disabled:opacity-50"
>
  🔊 Speak
</button>


      <button
        onClick={() => {
          const fileName = activeItem?.file?.name
            ? activeItem.file.name.replace(/\.[^.]+$/, "") + "-translated"
            : "output-translated";
          downloadText(activeItem?.translated || "", fileName);
        }}
        disabled={!activeItem || !activeItem.translated}
        className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm border hover:shadow-sm disabled:opacity-50"
      >
        <IconDownload className="size-4" /> Download
      </button>
    </div>
  </div>

  {/* Translation Result */}
  <div className="flex-1 flex flex-col mt-3">
    <textarea
      value={activeItem?.translated || ""}
      readOnly
      className="w-full h-40 mt-2 p-4 rounded-xl border bg-gray-50 dark:bg-gray-900 dark:text-gray-100 resize-none focus:outline-none"
      placeholder="Translation will appear here..."
    />
  </div>
</div>

        </section>
      </main>
    </div>
  );
}
