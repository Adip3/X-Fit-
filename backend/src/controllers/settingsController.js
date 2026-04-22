import SiteSettings from "../models/SiteSettings.js";

export const getSettings = (req, res) => {
  try { res.json({ success: true, data: SiteSettings.get() }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const getPublicSettings = (req, res) => {
  try {
    const s = SiteSettings.get();
    res.json({ success: true, data: {
      siteEnabled: s.siteEnabled, maintenanceMessage: s.maintenanceMessage, privacyPolicy: s.privacyPolicy,
      heroTitle: s.heroTitle, heroBrand: s.heroBrand, heroSubtitle: s.heroSubtitle, heroTagline: s.heroTagline,
      categories: s.categories || ["Running", "Casual", "Hiking", "Sports", "Formal", "Clothes"],
    }});
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const updateSettings = (req, res) => {
  try { res.json({ success: true, data: SiteSettings.update(req.body) }); }
  catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

export const toggleSite = (req, res) => {
  try {
    const current = SiteSettings.get();
    const updated = SiteSettings.update({ siteEnabled: !current.siteEnabled });
    res.json({ success: true, data: { siteEnabled: updated.siteEnabled }, message: updated.siteEnabled ? "Site is now LIVE" : "Site is now in MAINTENANCE mode" });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};
