// Reusable image-upload control for the admin panel.
// - Drag & drop OR click to browse
// - Shows preview, file size, and a "Remove" button
// - Auto-resizes huge images on the client (max 1600px) before storing
// - Uses window.PortfolioDB.uploadImage(file) — returns either a public URL (remote) or data URL (local)
//
// Usage:
//   <ImageUpload value={proj.image} onChange={url => updateProj({...proj, image: url})} accent="#E89B3C" />

const MAX_DIM = 1600;
const MAX_LOCAL_BYTES = 800 * 1024; // 800KB cap when storing as data URL inside localStorage

async function downscaleImage(file, maxDim = MAX_DIM) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      // try jpeg with decreasing quality until under cap (only matters in local mode)
      const isRemote = window.PortfolioDB && window.PortfolioDB.mode === "remote";
      const isPng = /png/i.test(file.type);
      c.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("toBlob failed"));
          // wrap in File so name+type survive
          const out = new File([blob], file.name.replace(/\.[^.]+$/, "") + (isPng ? ".png" : ".jpg"), { type: blob.type });
          resolve(out);
        },
        isPng ? "image/png" : "image/jpeg",
        isRemote ? 0.92 : 0.82
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("invalid image")); };
    img.src = url;
  });
}

function ImageUpload({ value, onChange, accent = "#E89B3C", label = "Зображення", aspect = "16/10" }) {
  const [busy, setBusy] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [drag, setDrag] = React.useState(false);
  const inputRef = React.useRef(null);
  const isRemote = !!(window.PortfolioDB && window.PortfolioDB.mode === "remote");

  const handleFile = async (file) => {
    if (!file) return;
    if (!/^image\//.test(file.type)) { setErr("Тільки зображення"); return; }
    setErr(""); setBusy(true);
    try {
      const downscaled = await downscaleImage(file);
      // warn if base64 will be huge in local mode
      if (!isRemote && downscaled.size > MAX_LOCAL_BYTES) {
        setErr(`Файл ${(downscaled.size/1024).toFixed(0)}KB — у локальному режимі краще <800KB. Збережено все одно.`);
      }
      const url = await window.PortfolioDB.uploadImage(downscaled);
      onChange(url);
    } catch (ex) {
      setErr(ex.message || "Помилка завантаження");
    }
    setBusy(false);
  };

  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation(); setDrag(false);
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  return (
    <div style={{ marginTop: 8 }}>
      {label && <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", letterSpacing: "0.1em", marginBottom: 6 }}>{label.toUpperCase()}</div>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleFile(e.target.files[0])} />

      {value ? (
        <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", border: "1px solid #232327", background: "#0E0E10" }}>
          <div style={{ aspectRatio: aspect, width: "100%", background: `url(${value}) center/cover no-repeat #0E0E10` }} />
          <div style={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 6 }}>
            <button type="button" onClick={() => inputRef.current && inputRef.current.click()} disabled={busy} style={{ padding: "6px 10px", background: "rgba(14,14,16,0.85)", border: `1px solid ${accent}55`, color: accent, fontSize: 11, fontFamily: "JetBrains Mono, monospace", borderRadius: 6, cursor: "pointer", backdropFilter: "blur(8px)" }}>{busy ? "..." : "ЗАМІНИТИ"}</button>
            <button type="button" onClick={() => onChange("")} style={{ padding: "6px 10px", background: "rgba(14,14,16,0.85)", border: "1px solid #E87C5A55", color: "#E87C5A", fontSize: 11, fontFamily: "JetBrains Mono, monospace", borderRadius: 6, cursor: "pointer", backdropFilter: "blur(8px)" }}>×</button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current && inputRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          style={{
            aspectRatio: aspect,
            width: "100%",
            border: `2px dashed ${drag ? accent : "#2A2A2E"}`,
            background: drag ? `${accent}11` : "#0E0E10",
            borderRadius: 10,
            display: "grid", placeItems: "center",
            cursor: busy ? "wait" : "pointer",
            transition: "border-color .2s, background .2s",
            color: "#8B8982",
            textAlign: "center",
            padding: 20,
          }}>
          <div>
            <div style={{ fontSize: 32, marginBottom: 8, color: drag ? accent : "#3A3A3E" }}>↑</div>
            <div style={{ fontSize: 13, marginBottom: 4 }}>{busy ? "Завантаження..." : "Перетягни картинку або натисни"}</div>
            <div style={{ fontFamily: "JetBrains Mono, monospace", fontSize: 10, color: "#5E5B54", letterSpacing: "0.05em" }}>
              {isRemote ? "→ SUPABASE STORAGE" : "→ LOCAL (BASE64)"} · MAX 1600PX
            </div>
          </div>
        </div>
      )}
      {err && <div style={{ color: "#E87C5A", fontSize: 12, marginTop: 8 }}>{err}</div>}
    </div>
  );
}

window.ImageUpload = ImageUpload;
