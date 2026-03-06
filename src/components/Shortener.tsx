import { useState } from "react";
import api from "../api/axios";
import axios from "axios";

interface ShortenResponse {
  short_url: string;
}

const Shortener = () => {
  const [url, setUrl] = useState("");
  const [custom, setCustom] = useState("");
  const [shortCode, setShortCode] = useState("");
  const [hitCount, setHitCount] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchStats = async (code: string) => {
    try {
      const stats = await api.get(`/stats/${code}`);
      setHitCount(stats.data.hit_count);
    } catch (err) {
      console.error("Failed to fetch stats", err);
    }
  };

  const handleSubmit = async () => {
    try {
      setError("");
      setShortCode("");
      setHitCount(null);
      setLoading(true);

      const res = await api.post<ShortenResponse>("/shorten", {
        url,
        alias: custom || "",
      });

      const code = res.data.short_url;
      setShortCode(code);

      await fetchStats(code);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Server error");
      } else {
        setError("Unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      const fullUrl = `${import.meta.env.VITE_API_URL}/${shortCode}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("Failed to copy link");
    }
  };

  const handleDownloadQR = async () => {
    try {
      setDownloading(true);
      const qrUrl = `${import.meta.env.VITE_API_URL}/qr/${shortCode}`;

      const response = await fetch(qrUrl);
      const blob = await response.blob();

      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `qr-${shortCode}.png`;

      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      setError("Failed to download QR");
    } finally {
      setDownloading(false);
    }
  };

  const fullShortUrl = `${import.meta.env.VITE_API_URL}/${shortCode}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-400 via-blue-500 to-blue-600 px-4 py-10">
      <div className="bg-white/95 backdrop-blur-md p-8 rounded-4xl shadow-2xl w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-black text-neutral-800">
            URL Shortener & QR Generator
          </h1>
          <p className="text-gray-500 text-sm text mt-3">
            Simple and Fast URL Shortener
          </p>
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />

          <input
            type="text"
            placeholder="Custom (optional)"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`w-full p-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 ${
              loading ? "bg-gray-400" : "bg-blue-500 hover:brightness-110"
            }`}
          >
            {loading ? "Processing..." : "Shorten"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
            {error}
          </div>
        )}

        {shortCode && (
          <div className="mt-8 pt-6 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="rounded-2xl p-5 border border-blue-100 text-center">
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-3">
                Short Link
              </p>

              <div className="flex flex-col gap-2 bg-white p-3 rounded-xl border border-blue-200 shadow-sm mb-4">
                <a
                  href={fullShortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 font-bold text-base break-all"
                >
                  {fullShortUrl}
                </a>

                <button
                  onClick={handleCopy}
                  className={`w-full cursor-pointer py-2 mt-2 rounded-lg font-bold text-xs transition-all ${
                    copied
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
              </div>

              <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-blue-50 mb-4">
                <div className="text-left">
                  <p className="text-[10px] text-gray-400 font-bold uppercase">
                    Hit Counter
                  </p>
                  <p className="text-xl font-black text-black leading-none">
                    {hitCount ?? 0}
                  </p>
                </div>
                <button
                  onClick={() => fetchStats(shortCode)}
                  className="p-2 cursor-pointer hover:bg-blue-50 rounded-full transition-colors text-blue-600"
                >
                  Refresh
                </button>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-50 inline-block">
                <p className="text-10px text-gray-400 font-bold uppercase mb-2">
                  Scan QR Code
                </p>

                <img
                  src={`${import.meta.env.VITE_API_URL}/qr/${shortCode}`}
                  alt="QR Code"
                  className="w-50 h-50 mx-auto"
                />

                <button
                  onClick={handleDownloadQR}
                  disabled={downloading}
                  className={`mt-3 w-full py-2 text-xs cursor-pointer font-bold rounded-lg text-white transition-all ${
                    downloading
                      ? "bg-gray-400"
                      : "bg-blue-500 hover:brightness-110"
                  }`}
                >
                  {downloading ? "Downloading..." : "Download QR"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shortener;
