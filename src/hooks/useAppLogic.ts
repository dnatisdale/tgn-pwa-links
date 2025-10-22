// Line 1
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";

console.log("DevTools test: PWA loaded");

// 🔹 Type for each link row
export type Row = { id: string; name: string; language: string; url: string };

// 🔹 Date helpers
export function pacificLongDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Los_Angeles",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function pacificShortTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatLastLoginPacific(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${pacificLongDate(d)} — ${pacificShortTime(d)} PT`;
}

// 🔹 Main logic hook
export function useAppLogic() {
  const [lang, setLang] = useState<"en" | "th">("en");
  const [user, setUser] = useState<any>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filterThai, setFilterThai] = useState(false);
  const [textPx, setTextPx] = useState<number>(16);
  const [qrEnlargedId, setQrEnlargedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastLogin, setLastLogin] = useState<string | null>(null);
  const [route, setRoute] = useState<string>(window.location.hash || "#/browse");
  const [showUpdate, setShowUpdate] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<Event | null>(null);

  const isBrowse = route.startsWith("#/browse");
  const isAdd = route.startsWith("#/add");
  const isImport = route.startsWith("#/import");
  const isExport = route.startsWith("#/export");
  const isAbout = route.startsWith("#/about");

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);
  useEffect(() => {
    const iso = localStorage.getItem("tgnLastLoginISO");
    if (iso) setLastLogin(iso);
  }, []);
  useEffect(() => {
    document.documentElement.style.setProperty("--base", `${textPx}px`);
  }, [textPx]);
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash || "#/browse");
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  useEffect(() => {
    const onNeed = () => setShowUpdate(true);
    window.addEventListener("pwa:need-refresh", onNeed);
    return () => window.removeEventListener("pwa:need-refresh", onNeed);
  }, []);

  // 🔹 PWA Install Prompt Support
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); // Prevent automatic prompt
      setInstallPromptEvent(e); // Save for later
      console.log("Install prompt event saved");
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const showInstallPrompt = async () => {
    if (installPromptEvent && typeof (installPromptEvent as any).prompt === "function") {
      (installPromptEvent as any).prompt();
      const result = await (installPromptEvent as any).userChoice;
      console.log("User choice:", result.outcome);
      setInstallPromptEvent(null); // Clear after use
    } else {
      console.log("No install prompt available");
    }
  };

  useEffect(() => {
    if (!user) {
      setRows([]);
      return;
    }
    const col = collection(db, "users", user.uid, "links");
    const qry = query(col, orderBy("name"));
    const off = onSnapshot(qry, (snap) => {
      const list: Row[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setRows(list);
      setSelectedIds((prev) => {
        const next = new Set<string>();
        for (const id of prev) if (list.find((r) => r.id === id)) next.add(id);
        return next;
      });
    });
    return () => off();
  }, [user]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = rows.filter((row) => {
      if (
        filterThai &&
        row.language?.toLowerCase() !== "thai" &&
        row.language?.toLowerCase() !== "ไทย"
      )
        return false;
      if (!needle) return true;
      return (
        (row.name || "").toLowerCase().includes(needle) ||
        (row.language || "").toLowerCase().includes(needle) ||
        (row.url || "").toLowerCase().includes(needle)
      );
    });
    out.sort(
      (a, b) =>
        (a.language || "").localeCompare(b.language || "") ||
        (a.name || "").localeCompare(b.name || "")
    );
    return out;
  }, [rows, q, filterThai]);

  const allVisibleIds = filtered.map((r) => r.id);
  const selectedRows = filtered.filter((r) => selectedIds.has(r.id));
  const firstSelected = selectedRows[0];
  const allSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.has(id));

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const toggleSelectAll = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) for (const id of allVisibleIds) next.delete(id);
      else for (const id of allVisibleIds) next.add(id);
      return next;
    });

  const copySelectedLinks = async () => {
    const urls = selectedRows.map((r) => r.url).filter(Boolean);
    if (!urls.length) {
      alert("Select at least one item");
      return;
    }
    try {
      await navigator.clipboard.writeText(urls.join("\n"));
    } catch {
      alert("Copy failed");
    }
  };

  const batchDownload = async () => {
    if (!selectedRows.length) {
      alert("Select at least one item");
      return;
    }
    const mod = await import("../qrCard");
    for (const r of selectedRows) {
      await mod.downloadQrCard({
        qrCanvasId: `qr-${r.id}`,
        url: r.url,
        name: r.name,
        title: "Thai Good News",
      });
    }
  };

  return {
    lang,
    setLang,
    user,
    rows,
    q,
    setQ,
    filterThai,
    setFilterThai,
    textPx,
    setTextPx,
    qrEnlargedId,
    setQrEnlargedId,
    selectedIds,
    setSelectedIds,
    lastLogin,
    route,
    setRoute,
    showUpdate,
    setShowUpdate,
    isBrowse,
    isAdd,
    isImport,
    isExport,
    isAbout,
    filtered,
    selectedRows,
    firstSelected,
    allSelected,
    toggleSelect,
    toggleSelectAll,
    copySelectedLinks,
    batchDownload,
    showInstallPrompt, // 🔹 Add this to your UI to trigger the install prompt
  };
}