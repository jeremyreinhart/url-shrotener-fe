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

      // Ambil hit counter awal
      const stats = await api.get(`/stats/${code}`);
      setHitCount(stats.data.hit_count);
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

      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  const fullShortUrl = `${import.meta.env.VITE_API_URL}/${shortCode}`;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-2xl font-bold mb-6">URL Shortener</h1>

        <input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border p-3 rounded-lg mb-3 focus:ring-2 focus:ring-green-500 outline-none"
        />

        <input
          type="text"
          placeholder="Custom alias (optional)"
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          className="w-full border p-3 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full p-3 rounded-lg text-white transition ${
            loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Processing..." : "Shorten"}
        </button>

        {error && <p className="text-red-500 mt-4 text-sm">{error}</p>}
        {shortCode && (
          <div className="mt-6">
            <p className="font-semibold">Short URL:</p>

            <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
              <a
                href={fullShortUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline break-all"
              >
                {fullShortUrl}
              </a>

              <button
                onClick={handleCopy}
                className={`px-3 py-1 rounded-md text-sm transition ${
                  copied
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* HIT COUNTER */}
            <div className="mt-4 text-sm text-gray-700">
              Total Clicks: <span className="font-bold">{hitCount ?? 0}</span>
            </div>

            {/* QR CODE */}
            <div className="mt-4">
              <img
                src={`${import.meta.env.VITE_API_URL}/qr/${shortCode}`}
                alt="QR Code"
                className="mx-auto"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shortener;
