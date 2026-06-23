"use client";
import { useState, useRef, useEffect, useCallback } from "react";

const SEARCH_API = "https://api.nexray.eu.cc/search/spotify?q=";
const DOWNLOAD_API = "https://api.nexray.eu.cc/downloader/spotify?url=";

// normalize durasi "4:22" -> detik
function parseDuration(d) {
  if (!d) return 0;
  if (typeof d === "number") return Math.floor(d / 1000); // duration_ms fallback
  const parts = String(d).split(":").map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  return 0;
}

function formatTime(s) {
  if (!s || isNaN(s)) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Normalize track dari format Nexray search response
function normalizeTrack(track) {
  return {
    id: track.url || track.id || Math.random().toString(),
    name: track.title || track.name || "Unknown",
    artist: typeof track.artist === "string"
      ? track.artist
      : Array.isArray(track.artists)
        ? track.artists.map(a => a.name || a).join(", ")
        : "Unknown",
    album: typeof track.album === "string" ? track.album : (track.album?.name || ""),
    image: track.thumbnail || track.album?.images?.[0]?.url || track.image || null,
    spotify_url: track.url || track.external_urls?.spotify || null,
    duration: parseDuration(track.duration || track.duration_ms),
  };
}

function SpotifyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  );
}
function PlayIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>; }
function PauseIcon() { return <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>; }
function SearchIcon({ size = 16 }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>; }
function SunIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>; }
function MoonIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>; }
function SkipBackIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function SkipForwardIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>; }
function VolumeIcon({ level }) {
  if (level === 0) return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>;
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>{level > 0.3 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}{level > 0.6 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}</svg>;
}
function ShuffleIcon({ active }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={active ? 1 : 0.4}><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>; }
function RepeatIcon({ active }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity={active ? 1 : 0.4}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>; }
function HeartIcon({ liked }) { return <svg width="16" height="16" viewBox="0 0 24 24" fill={liked ? "#1db954" : "none"} stroke={liked ? "#1db954" : "currentColor"} strokeWidth="2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>; }

export default function App() {
  const [dark, setDark] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [queue, setQueue] = useState([]);
  const [queueIdx, setQueueIdx] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [loadingTrack, setLoadingTrack] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState({});
  const [view, setView] = useState("search");
  const audioRef = useRef(null);
  const progressRef = useRef(null);
  const playNextRef = useRef(null);

  const t = dark
    ? { bg: "#121212", sidebar: "#000", card: "#181818", hover: "#282828", text: "#fff", sub: "#b3b3b3", border: "#282828", input: "#242424", accent: "#1db954" }
    : { bg: "#f0f0f0", sidebar: "#fff", card: "#fff", hover: "#e8e8e8", text: "#121212", sub: "#535353", border: "#e0e0e0", input: "#e8e8e8", accent: "#1db954" };

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  const loadAndPlay = useCallback(async (track, idx, trackList) => {
    const norm = normalizeTrack(track);
    setLoadingTrack(true);
    setCurrentTrack({ ...norm, url: null, error: null });
    setView("player");
    try {
      if (!norm.spotify_url) throw new Error("URL Spotify tidak ditemukan");

      const res = await fetch(DOWNLOAD_API + encodeURIComponent(norm.spotify_url));
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

      // Nexray download response: data.result.url
      const dlUrl = data?.result?.url || data?.result?.download_url || data?.download_url || data?.url;
      if (!dlUrl) throw new Error("Link audio tidak tersedia di response");

      const fullTrack = { ...norm, url: dlUrl };
      setCurrentTrack(fullTrack);
      setQueue(trackList || [track]);
      setQueueIdx(idx || 0);
      setProgress(0);
      setDuration(0);
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.load();
          audioRef.current.play().catch(() => {});
        }
      }, 80);
    } catch (e) {
      setCurrentTrack(prev => ({ ...prev, error: e.message }));
    }
    setLoadingTrack(false);
  }, []);

  const playNext = useCallback(() => {
    setQueue(q => {
      setQueueIdx(idx => {
        if (!q.length) return idx;
        const next = shuffle ? Math.floor(Math.random() * q.length) : (idx + 1) % q.length;
        loadAndPlay(q[next], next, q);
        return next;
      });
      return q;
    });
  }, [shuffle, loadAndPlay]);

  useEffect(() => { playNextRef.current = playNext; }, [playNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setProgress(audio.currentTime);
    const onDur = () => setDuration(audio.duration || 0);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => {
      if (repeat) { audio.currentTime = 0; audio.play(); return; }
      playNextRef.current?.();
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onDur);
    audio.addEventListener("durationchange", onDur);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onDur);
      audio.removeEventListener("durationchange", onDur);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, [repeat]);

  useEffect(() => { if (audioRef.current) audioRef.current.volume = muted ? 0 : volume; }, [volume, muted]);

  const search = async () => {
    if (!query.trim() || searching) return;
    setSearching(true); setSearchErr(""); setResults([]);
    try {
      const res = await fetch(SEARCH_API + encodeURIComponent(query));
      if (!res.ok) throw new Error(`Search API error: ${res.status}`);
      const data = await res.json();
      // Nexray search: data.result adalah array
      const items = Array.isArray(data?.result) ? data.result
        : Array.isArray(data) ? data
        : data?.results || data?.data || [];
      if (!items.length) throw new Error("Lagu tidak ditemukan");
      setResults(items);
      setView("search");
    } catch (e) { setSearchErr(e.message); }
    setSearching(false);
  };

  const playPrev = () => {
    if (progress > 3 && audioRef.current) { audioRef.current.currentTime = 0; return; }
    setQueue(q => {
      setQueueIdx(idx => {
        if (!q.length) return idx;
        const prev = (idx - 1 + q.length) % q.length;
        loadAndPlay(q[prev], prev, q);
        return prev;
      });
      return q;
    });
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack?.url) return;
    if (playing) audioRef.current.pause(); else audioRef.current.play().catch(() => {});
  };

  const seek = (e) => {
    if (!audioRef.current || !duration || !progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = ratio * duration;
    setProgress(ratio * duration);
  };

  const s = {
    root: { fontFamily: "system-ui,-apple-system,sans-serif", background: t.bg, color: t.text, minHeight: "100vh", display: "flex", flexDirection: "column", transition: "background 0.3s,color 0.3s", userSelect: "none" },
    topBar: { background: t.sidebar, borderBottom: `1px solid ${t.border}`, padding: "0 16px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", position: "sticky", top: 0, zIndex: 100 },
    logo: { display: "flex", alignItems: "center", gap: "7px", color: t.accent, fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.02em", flexShrink: 0 },
    searchBar: { display: "flex", alignItems: "center", background: t.input, border: `1px solid ${t.border}`, borderRadius: "500px", padding: "0 14px", gap: "8px", flex: 1, maxWidth: "460px", height: "40px" },
    searchInput: { background: "transparent", border: "none", outline: "none", color: t.text, fontSize: "0.875rem", flex: 1, fontFamily: "inherit" },
    themeBtn: { background: t.hover, border: `1px solid ${t.border}`, borderRadius: "50%", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: t.sub, flexShrink: 0 },
    main: { flex: 1, padding: "20px 16px", maxWidth: "900px", width: "100%", margin: "0 auto", paddingBottom: currentTrack ? "110px" : "20px" },
    tabs: { display: "flex", gap: "6px", marginBottom: "20px", flexWrap: "wrap" },
    tab: (a) => ({ padding: "7px 16px", borderRadius: "500px", fontWeight: 700, fontSize: "0.78rem", cursor: "pointer", background: a ? t.text : "transparent", color: a ? (dark ? "#000" : "#fff") : t.sub, border: `1px solid ${a ? t.text : t.border}`, transition: "all 0.2s" }),
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(min(100%,160px),1fr))", gap: "12px" },
    card: (active) => ({ background: active ? (dark ? "#282828" : "#e8f5e9") : t.card, border: `1px solid ${active ? t.accent : "transparent"}`, borderRadius: "8px", padding: "12px", cursor: "pointer", transition: "background 0.15s" }),
    cardImg: { width: "100%", aspectRatio: "1", borderRadius: "4px", objectFit: "cover", marginBottom: "10px", background: t.hover, display: "block" },
    cardName: { fontSize: "0.82rem", fontWeight: 700, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px" },
    cardArtist: { fontSize: "0.72rem", color: t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", color: t.sub, gap: "12px", textAlign: "center" },
    playerWrap: { display: "flex", flexDirection: "column", alignItems: "center", gap: "22px", paddingTop: "10px" },
    albumArt: { width: "min(260px,68vw)", height: "min(260px,68vw)", borderRadius: "8px", objectFit: "cover", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" },
    playerInfo: { width: "100%", maxWidth: "360px", display: "flex", flexDirection: "column", gap: "10px" },
    playerName: { fontSize: "1.25rem", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    playerArtist: { fontSize: "0.875rem", color: t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
    progressTrack: { flex: 1, height: "4px", background: dark ? "#535353" : "#d0d0d0", borderRadius: "2px", cursor: "pointer", position: "relative", overflow: "hidden" },
    progressFill: { position: "absolute", top: 0, left: 0, height: "100%", background: t.accent, borderRadius: "2px", width: `${pct}%`, transition: "width 0.1s linear" },
    timeLabel: { fontSize: "0.65rem", color: t.sub, minWidth: "30px", textAlign: "center" },
    controlBtns: { display: "flex", alignItems: "center", gap: "18px", color: t.sub },
    playBtn: { width: "40px", height: "40px", borderRadius: "50%", background: t.text, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: dark ? "#000" : "#fff" },
    iconBtn: { background: "none", border: "none", cursor: "pointer", color: "inherit", display: "flex", alignItems: "center", padding: "4px", borderRadius: "4px" },
    barWrap: { position: "fixed", bottom: 0, left: 0, right: 0, background: dark ? "#181818" : "#fff", borderTop: `1px solid ${t.border}`, padding: "0 16px", height: "88px", display: "flex", alignItems: "center", gap: "10px", zIndex: 200 },
    barLeft: { display: "flex", alignItems: "center", gap: "10px", width: "200px", minWidth: 0, flexShrink: 0 },
    barMiniArt: { width: "46px", height: "46px", borderRadius: "4px", objectFit: "cover", flexShrink: 0, background: t.hover },
    barCenter: { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "5px", minWidth: 0 },
    barRight: { display: "flex", alignItems: "center", gap: "8px", width: "150px", justifyContent: "flex-end", flexShrink: 0, color: t.sub },
    rowItem: (active) => ({ display: "flex", alignItems: "center", gap: "12px", padding: "8px 10px", borderRadius: "4px", cursor: "pointer", background: active ? (dark ? "#282828" : "#e8f5e9") : "transparent", transition: "background 0.15s" }),
  };

  const Tabs = () => (
    <div style={s.tabs}>
      <span style={s.tab(view === "search")} onClick={() => setView("search")}>🔍 Cari</span>
      {currentTrack && <span style={s.tab(view === "player")} onClick={() => setView("player")}>▶ Now Playing</span>}
      {queue.length > 1 && <span style={s.tab(view === "queue")} onClick={() => setView("queue")}>☰ Antrian ({queue.length})</span>}
    </div>
  );

  const MusicNote = ({ style: st }) => (
    <div style={{ ...st, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={t.sub} strokeWidth="1"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
    </div>
  );

  const Spinner = ({ size = 36 }) => (
    <div style={{ width: size, height: size, border: `${size > 20 ? 3 : 2}px solid ${t.border}`, borderTopColor: t.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
  );

  return (
    <div style={s.root}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        input[type=range]{-webkit-appearance:none;height:4px;border-radius:2px;background:${dark?"#535353":"#d0d0d0"};outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:${dark?"#fff":"#121212"};cursor:pointer}
        input[type=range]:hover::-webkit-slider-thumb{background:#1db954}
        @media(max-width:580px){.bar-right{display:none!important}.bar-left{width:140px!important}}
      `}</style>

      {/* Topbar */}
      <div style={s.topBar}>
        <div style={s.logo}><SpotifyIcon /><span>KennMusic</span></div>
        <div style={s.searchBar}>
          <span style={{ color: t.sub, flexShrink: 0 }}><SearchIcon /></span>
          <input
            style={s.searchInput}
            placeholder="Cari lagu, artis..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
          />
          {searching
            ? <Spinner size={15} />
            : query.trim()
              ? <button style={{ ...s.iconBtn, color: t.accent }} onClick={search}><SearchIcon size={14} /></button>
              : null}
        </div>
        <button style={s.themeBtn} onClick={() => setDark(d => !d)}>{dark ? <SunIcon /> : <MoonIcon />}</button>
      </div>

      {/* Main */}
      <div style={s.main}>

        {/* SEARCH VIEW */}
        {view === "search" && (
          <div>
            <Tabs />
            {searching && <div style={s.empty}><Spinner /><span style={{ fontSize: "0.9rem" }}>Mencari...</span></div>}
            {searchErr && !searching && (
              <div style={{ ...s.empty, color: "#e25d5d" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{searchErr}</span>
              </div>
            )}
            {!searching && !searchErr && results.length === 0 && (
              <div style={s.empty}>
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={t.border} strokeWidth="0.8"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                <p style={{ fontSize: "1.05rem", fontWeight: 700, color: t.text }}>Temukan lagu favoritmu</p>
                <p style={{ fontSize: "0.82rem" }}>Ketik nama lagu atau artis lalu tekan Enter</p>
              </div>
            )}
            {!searching && results.length > 0 && (
              <>
                <p style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "12px" }}>
                  Hasil <span style={{ color: t.sub, fontWeight: 400, fontSize: "0.8rem" }}>({results.length} lagu)</span>
                </p>
                <div style={s.grid}>
                  {results.map((track, i) => {
                    const norm = normalizeTrack(track);
                    const isActive = currentTrack?.id === norm.id;
                    return (
                      <div key={norm.id} style={s.card(isActive)}
                        onClick={() => loadAndPlay(track, i, results)}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.hover; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = t.card; }}>
                        <div style={{ position: "relative" }}>
                          {norm.image
                            ? <img src={norm.image} alt={norm.name} style={s.cardImg} />
                            : <MusicNote style={{ ...s.cardImg, background: t.hover }} />}
                          {isActive && (
                            <div style={{ position: "absolute", bottom: "6px", right: "6px", background: t.accent, borderRadius: "50%", width: "26px", height: "26px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {playing ? <PauseIcon /> : <PlayIcon />}
                            </div>
                          )}
                        </div>
                        <p style={s.cardName}>{norm.name}</p>
                        <p style={s.cardArtist}>{norm.artist}</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* PLAYER VIEW */}
        {view === "player" && currentTrack && (
          <div>
            <Tabs />
            <div style={s.playerWrap}>
              {currentTrack.image
                ? <img src={currentTrack.image} alt={currentTrack.name} style={{ ...s.albumArt, transform: playing ? "scale(1.03)" : "scale(1)", transition: "transform 0.3s" }} />
                : <MusicNote style={{ ...s.albumArt, background: t.hover }} />}
              <div style={s.playerInfo}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ minWidth: 0, flex: 1, marginRight: "10px" }}>
                    <p style={s.playerName}>{currentTrack.name}</p>
                    <p style={s.playerArtist}>{currentTrack.artist}</p>
                    {currentTrack.album && <p style={{ ...s.playerArtist, fontSize: "0.72rem", marginTop: "2px" }}>{currentTrack.album}</p>}
                  </div>
                  <button style={{ ...s.iconBtn, color: liked[currentTrack.id] ? t.accent : t.sub }}
                    onClick={() => setLiked(l => ({ ...l, [currentTrack.id]: !l[currentTrack.id] }))}>
                    <HeartIcon liked={liked[currentTrack.id]} />
                  </button>
                </div>

                {loadingTrack ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: t.sub, fontSize: "0.8rem" }}>
                    <Spinner size={14} /> Memuat audio...
                  </div>
                ) : currentTrack.error ? (
                  <p style={{ color: "#e25d5d", fontSize: "0.8rem" }}>⚠ {currentTrack.error}</p>
                ) : (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={s.timeLabel}>{formatTime(Math.floor(progress))}</span>
                      <div ref={progressRef} style={s.progressTrack} onClick={seek}>
                        <div style={s.progressFill} />
                      </div>
                      <span style={s.timeLabel}>
                        {duration > 0 ? formatTime(Math.floor(duration)) : formatTime(currentTrack.duration)}
                      </span>
                    </div>
                    <div style={{ ...s.controlBtns, justifyContent: "center" }}>
                      <button style={{ ...s.iconBtn, color: shuffle ? t.accent : t.sub }} onClick={() => setShuffle(v => !v)}><ShuffleIcon active={shuffle} /></button>
                      <button style={s.iconBtn} onClick={playPrev}><SkipBackIcon /></button>
                      <button style={s.playBtn} onClick={togglePlay}>{playing ? <PauseIcon /> : <PlayIcon />}</button>
                      <button style={s.iconBtn} onClick={() => playNextRef.current?.()}><SkipForwardIcon /></button>
                      <button style={{ ...s.iconBtn, color: repeat ? t.accent : t.sub }} onClick={() => setRepeat(v => !v)}><RepeatIcon active={repeat} /></button>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                      <button style={{ ...s.iconBtn, color: t.sub }} onClick={() => setMuted(m => !m)}><VolumeIcon level={muted ? 0 : volume} /></button>
                      <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
                        onChange={e => { setVolume(+e.target.value); setMuted(false); }}
                        style={{ width: "90px", accentColor: t.accent }} />
                    </div>
                  </>
                )}

                {currentTrack.spotify_url && (
                  <a href={currentTrack.spotify_url} target="_blank" rel="noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: "6px", color: t.sub, fontSize: "0.72rem", textDecoration: "none", marginTop: "2px" }}>
                    <SpotifyIcon /> Buka di Spotify
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* QUEUE VIEW */}
        {view === "queue" && (
          <div>
            <Tabs />
            <p style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "14px" }}>Antrian Putar</p>
            {queue.map((track, i) => {
              const norm = normalizeTrack(track);
              const isActive = i === queueIdx;
              return (
                <div key={i} style={s.rowItem(isActive)}
                  onClick={() => loadAndPlay(track, i, queue)}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = t.hover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}>
                  <span style={{ width: "20px", textAlign: "center", color: isActive ? t.accent : t.sub, fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>
                    {isActive ? "♪" : i + 1}
                  </span>
                  {norm.image
                    ? <img src={norm.image} alt={norm.name} style={{ width: "40px", height: "40px", borderRadius: "4px", objectFit: "cover", flexShrink: 0 }} />
                    : <div style={{ width: "40px", height: "40px", borderRadius: "4px", background: t.hover, flexShrink: 0 }} />}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ fontSize: "0.83rem", fontWeight: isActive ? 700 : 500, color: isActive ? t.accent : t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{norm.name}</p>
                    <p style={{ fontSize: "0.72rem", color: t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{norm.artist}</p>
                  </div>
                  <span style={{ fontSize: "0.72rem", color: t.sub, flexShrink: 0 }}>{formatTime(norm.duration)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Bottom Player Bar */}
      {currentTrack && (
        <div style={s.barWrap}>
          <div className="bar-left" style={s.barLeft}>
            {currentTrack.image
              ? <img src={currentTrack.image} alt="" style={s.barMiniArt} />
              : <div style={{ ...s.barMiniArt, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.sub} strokeWidth="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                </div>}
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.name}</p>
              <p style={{ fontSize: "0.65rem", color: t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{currentTrack.artist}</p>
            </div>
          </div>

          <div style={s.barCenter}>
            <div style={{ ...s.controlBtns, gap: "14px" }}>
              <button style={{ ...s.iconBtn, color: shuffle ? t.accent : t.sub }} onClick={() => setShuffle(v => !v)}><ShuffleIcon active={shuffle} /></button>
              <button style={s.iconBtn} onClick={playPrev}><SkipBackIcon /></button>
              <button style={{ ...s.playBtn, width: "36px", height: "36px" }} onClick={togglePlay} disabled={loadingTrack}>
                {loadingTrack
                  ? <Spinner size={16} />
                  : playing ? <PauseIcon /> : <PlayIcon />}
              </button>
              <button style={s.iconBtn} onClick={() => playNextRef.current?.()}><SkipForwardIcon /></button>
              <button style={{ ...s.iconBtn, color: repeat ? t.accent : t.sub }} onClick={() => setRepeat(v => !v)}><RepeatIcon active={repeat} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", width: "100%", maxWidth: "440px" }}>
              <span style={s.timeLabel}>{formatTime(Math.floor(progress))}</span>
              <div ref={progressRef} style={s.progressTrack} onClick={seek}>
                <div style={s.progressFill} />
              </div>
              <span style={s.timeLabel}>{duration > 0 ? formatTime(Math.floor(duration)) : formatTime(currentTrack.duration)}</span>
            </div>
          </div>

          <div className="bar-right" style={s.barRight}>
            <button style={{ ...s.iconBtn, color: t.sub }} onClick={() => setMuted(m => !m)}><VolumeIcon level={muted ? 0 : volume} /></button>
            <input type="range" min="0" max="1" step="0.01" value={muted ? 0 : volume}
              onChange={e => { setVolume(+e.target.value); setMuted(false); }}
              style={{ width: "80px", accentColor: t.accent }} />
          </div>
        </div>
      )}

      <audio ref={audioRef} src={currentTrack?.url || ""} style={{ display: "none" }} />
    </div>
  );
}
