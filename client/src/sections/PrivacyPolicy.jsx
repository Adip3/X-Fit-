import { useState, useEffect } from "react";
import { settingsAPI } from "../api";

const PrivacyPolicy = () => {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    settingsAPI.getPublic().then(r => setContent(r.data.data.privacyPolicy || "")).catch(() => setContent("<p>Unable to load.</p>")).finally(() => setLoading(false));
  }, []);
  if (loading) return <section className="pt-28 padding-x pb-16 max-container"><div className="animate-pulse space-y-4"><div className="h-10 w-64 bg-gray-200 rounded-lg" /><div className="h-4 w-full bg-gray-100 rounded" /></div></section>;
  return (
    <section className="pt-28 padding-x pb-16 max-container">
      <div className="mb-10"><h1 className="font-palanquin text-4xl md:text-5xl font-bold text-gray-900">Privacy <span className="text-coral-red">Policy</span></h1></div>
      <div className="prose prose-lg max-w-none font-montserrat text-gray-700 leading-relaxed [&_h2]:font-palanquin [&_h2]:text-3xl [&_h2]:font-bold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:font-palanquin [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:mb-4 [&_p]:text-base" dangerouslySetInnerHTML={{ __html: content }} />
    </section>
  );
};
export default PrivacyPolicy;
