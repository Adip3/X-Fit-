import { useState, useEffect } from "react";
import { settingsAPI } from "../api";

const Legal = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const fetchLegal = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔄 Fetching legal info from /settings/public...");
      const response = await settingsAPI.getPublic();
      console.log("✅ Legal info loaded successfully:", response.data);
      setContent(response.data.data.privacyPolicy || "<p>No privacy policy configured.</p>");
    } catch (err) {
      console.error("❌ Error fetching legal info:", {
        message: err.message,
        code: err.code,
        response: err.response?.status,
        url: err.config?.url,
        method: err.config?.method,
      });
      setError(err.message || "Failed to load legal info");
      setContent("<p>Unable to load legal info at this time.</p>");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLegal();
  }, [retryCount]);

  const handleRetry = () => {
    console.log("🔁 Retrying request...");
    setRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <section className="pt-28 padding-x pb-16 max-container">
        <div className="animate-pulse space-y-4">
          <div className="h-10 w-64 bg-gray-200 rounded-lg" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="pt-28 padding-x pb-16 max-container">
      <div className="mb-10">
        <h1 className="font-palanquin text-4xl md:text-5xl font-bold text-gray-900">
          Privacy <span className="text-coral-red">Policy</span>
        </h1>
      </div>
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 font-semibold">⚠️ Error Loading Content</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <p className="text-red-600 text-xs mt-2">Check the browser console for more details.</p>
          <button
            onClick={handleRetry}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            🔄 Retry
          </button>
        </div>
      )}
      <div
        className="prose prose-lg max-w-none font-montserrat text-gray-700 leading-relaxed [&_h2]:font-palanquin [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-palanquin [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:text-base"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
};
export default Legal;
