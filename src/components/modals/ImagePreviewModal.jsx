import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FiChevronLeft, FiChevronRight, FiX } from "react-icons/fi";

export default function ImagePreviewModal({
  open,
  images,
  startIndex = 0,
  title,
  onClose,
}) {
  const safeImages = Array.isArray(images)
    ? images.map((img) => (typeof img === "string" ? img : img.url))
    : [];

  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    if (!open) return;
    setIdx(
      Math.min(Math.max(0, startIndex), Math.max(0, safeImages.length - 1)),
    );
  }, [open, startIndex, safeImages.length]);

  useEffect(() => {
    if (!open) return;

    function onKey(e) {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") setIdx((v) => Math.max(0, v - 1));
      if (e.key === "ArrowRight")
        setIdx((v) => Math.min(safeImages.length - 1, v + 1));
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, safeImages.length]);

  const has = safeImages.length > 0;
  const canPrev = idx > 0;
  const canNext = idx < safeImages.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial="hidden"
          animate="show"
          exit="exit"
        >
          <motion.button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-lg"
            onClick={onClose}
            aria-label="Close modal overlay"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { duration: 0.2 } },
              exit: { opacity: 0, transition: { duration: 0.15 } },
            }}
          />

          <div className="absolute inset-0 flex items-end sm:items-center justify-center p-3 sm:p-6">
            <motion.div
              role="dialog"
              aria-modal="true"
              className="
                w-full max-w-3xl rounded-2xl 
                bg-white
                shadow-2xl border border-gray-200 overflow-hidden
              "
              variants={{
                hidden: { opacity: 0, y: 28, scale: 0.98 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    stiffness: 520,
                    damping: 35,
                    mass: 0.9,
                  },
                },
                exit: {
                  opacity: 0,
                  y: 18,
                  scale: 0.985,
                  transition: { duration: 0.16 },
                },
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="
                px-6 py-5 border-b border-gray-200 
                flex items-center justify-between
                bg-gray-50
              "
              >
                <div className="text-lg font-bold text-gray-900">
                  {title || "Room Images"}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="
                    h-10 px-4 rounded-xl 
                    border border-gray-200 
                    bg-white
                    hover:bg-gray-50
                    text-sm font-medium text-gray-700
                    transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5
                    active:translate-y-0
                    flex items-center gap-2
                  "
                >
                  <FiX /> Close
                </button>
              </div>

              <div className="p-6">
                {!has ? (
                  <div className="text-sm text-gray-600">
                    No images to preview.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl border border-gray-200 bg-gray-900 overflow-hidden">
                      <div className="aspect-[16/9] w-full">
                        <img
                          src={safeImages[idx]}
                          alt={`Preview ${idx + 1}`}
                          className="h-full w-full object-contain bg-gray-900"
                        />
                      </div>

                      <div
                        className="
                        absolute left-4 top-4 rounded-xl 
                        bg-black/60 
                        text-white text-xs px-3 py-1.5 backdrop-blur-sm
                      "
                      >
                        {idx + 1} / {safeImages.length}
                      </div>

                      <div className="absolute inset-0 flex items-center justify-between px-4">
                        <button
                          type="button"
                          disabled={!canPrev}
                          onClick={() => setIdx((v) => Math.max(0, v - 1))}
                          className={`
                            h-12 w-12 rounded-xl grid place-items-center border
                            transition-all duration-200
                            ${
                              canPrev
                                ? "bg-white/90 hover:bg-white border-gray-300 hover:shadow-lg hover:-translate-x-0.5"
                                : "bg-white/40 border-gray-200/50 cursor-not-allowed"
                            }
                          `}
                          aria-label="Previous image"
                          title="Previous"
                        >
                          <FiChevronLeft
                            className={
                              canPrev ? "text-gray-700" : "text-gray-400"
                            }
                          />
                        </button>

                        <button
                          type="button"
                          disabled={!canNext}
                          onClick={() =>
                            setIdx((v) =>
                              Math.min(safeImages.length - 1, v + 1),
                            )
                          }
                          className={`
                            h-12 w-12 rounded-xl grid place-items-center border
                            transition-all duration-200
                            ${
                              canNext
                                ? "bg-white/90 hover:bg-white border-gray-300 hover:shadow-lg hover:translate-x-0.5"
                                : "bg-white/40 border-gray-200/50 cursor-not-allowed"
                            }
                          `}
                          aria-label="Next image"
                          title="Next"
                        >
                          <FiChevronRight
                            className={
                              canNext ? "text-gray-700" : "text-gray-400"
                            }
                          />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 overflow-auto pb-2">
                      {safeImages.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          onClick={() => setIdx(i)}
                          className={`
                            shrink-0 h-20 w-28 rounded-xl overflow-hidden border
                            transition-all duration-200
                            ${
                              i === idx
                                ? "border-[#0c2bfc] ring-2 ring-[#0c2bfc]/20 shadow-md"
                                : "border-gray-200 hover:border-gray-300"
                            }
                          `}
                          title={`Image ${i + 1}`}
                        >
                          <img
                            src={src}
                            alt={`Thumb ${i + 1}`}
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>

                    <div
                      className="
                      text-xs text-gray-600 
                      bg-gray-50
                      rounded-xl p-3 border border-gray-200
                    "
                    >
                      Tip: Use ← → arrow keys to navigate, Esc to close.
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
