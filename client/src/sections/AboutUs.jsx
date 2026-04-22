import React from "react";

const stats = [
  { number: "16+", label: "Years crafting" },
  { number: "85k", label: "Happy customers" },
  { number: "120", label: "Styles available" },
  { number: "34",  label: "Countries shipped" },
];

const features = [
  {
    title: "Premium materials",
    desc: "Full-grain leather, breathable mesh, and recycled soles — sourced responsibly.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B45A30" strokeWidth="1.5">
        <path d="M2 10 C4 6 12 6 14 10" strokeLinecap="round" />
        <circle cx="8" cy="7" r="2" />
      </svg>
    ),
  },
  {
    title: "Artisan crafted",
    desc: "Hand-finished by skilled cobblers with decades of experience.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B45A30" strokeWidth="1.5">
        <path d="M8 2L9.5 6H14L10.5 8.5L12 13L8 10.5L4 13L5.5 8.5L2 6H6.5Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Comfort guaranteed",
    desc: "Ergonomic insoles and flexible construction for all-day wearability.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B45A30" strokeWidth="1.5">
        <path d="M3 8L6 11L13 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Free returns",
    desc: "30-day hassle-free returns — if it doesn't fit perfectly, we'll fix it.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#B45A30" strokeWidth="1.5">
        <circle cx="8" cy="8" r="5.5" />
        <path d="M6 8L7.5 9.5L10.5 6.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

const team = [
  { initials: "ML", name: "Maria Lima",  role: "Co-founder & CEO",   color: "coral" },
  { initials: "JA", name: "João Alves",  role: "Head of Design",     color: "teal"  },
  { initials: "SC", name: "Sofia Costa", role: "Materials Director",  color: "blue"  },
  { initials: "RN", name: "Rui Neves",   role: "Master Cobbler",     color: "amber" },
];

const values = [
  "Sustainable sourcing",
  "Fair trade certified",
  "Vegan options",
  "Carbon-neutral shipping",
  "B Corp member",
];

const avatarStyles = {
  coral: { background: "#FAECE7", color: "#993C1D" },
  teal:  { background: "#E1F5EE", color: "#0F6E56" },
  blue:  { background: "#E6F1FB", color: "#185FA5" },
  amber: { background: "#FAEEDA", color: "#854F0B" },
};

const styles = {
  wrap: {
    fontFamily: "'DM Sans', sans-serif",
    maxWidth: 860,
    margin: "0 auto",
    padding: "2rem 1.5rem 3rem",
    color: "#1a1a1a",
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "#888",
    marginBottom: "1rem",
  },
  h1: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "clamp(2.2rem, 5vw, 3.6rem)",
    fontWeight: 700,
    lineHeight: 1.1,
    marginBottom: "1.4rem",
  },
  accent: { fontStyle: "italic", color: "#B45A30" },
  divider: { width: 48, height: 2, background: "#B45A30", marginBottom: "1.4rem" },
  sub: {
    fontSize: "1rem",
    fontWeight: 300,
    color: "#666",
    lineHeight: 1.8,
    maxWidth: 520,
    marginBottom: "2.5rem",
  },
  statsRow: { display: "flex", gap: "1.25rem", flexWrap: "wrap", marginBottom: "3rem" },
  statCard: {
    background: "#f8f7f5",
    border: "0.5px solid #e0ddd6",
    borderRadius: 8,
    padding: "0.9rem 1.1rem",
    flex: 1,
    minWidth: 100,
  },
  statNum: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.8rem",
    fontWeight: 700,
    color: "#B45A30",
    lineHeight: 1,
    marginBottom: 3,
  },
  statLbl: { fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em" },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 1,
    border: "0.5px solid #e0ddd6",
    borderRadius: 12,
    overflow: "hidden",
    background: "#e0ddd6",
    marginBottom: "3rem",
  },
  featItem: { background: "#fff", padding: "1.4rem 1.1rem" },
  featIcon: {
    width: 34, height: 34,
    borderRadius: "50%",
    background: "#FAECE7",
    display: "flex", alignItems: "center", justifyContent: "center",
    marginBottom: "0.7rem",
  },
  featTitle: { fontWeight: 500, fontSize: 13.5, marginBottom: 4 },
  featDesc:  { fontSize: 12, color: "#888", lineHeight: 1.6 },
  storyGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "2.5rem",
    marginBottom: "3rem",
    alignItems: "start",
  },
  storyH2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.55rem",
    fontWeight: 700,
    marginBottom: "0.9rem",
  },
  storyP: { fontSize: "0.875rem", fontWeight: 300, color: "#666", lineHeight: 1.85, marginBottom: "0.8rem" },
  visual: {
    background: "#f8f7f5",
    border: "0.5px solid #e0ddd6",
    borderRadius: 12,
    padding: "2rem",
    textAlign: "center",
  },
  visualCaption: { fontSize: 12, color: "#888", marginTop: "0.8rem" },
  pillsRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: "3rem" },
  pill: {
    fontSize: 12.5,
    padding: "7px 15px",
    borderRadius: 999,
    border: "0.5px solid #ccc",
    color: "#1a1a1a",
    background: "#f8f7f5",
  },
  teamH2: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.55rem",
    fontWeight: 700,
    marginBottom: 4,
  },
  teamSub:  { fontSize: 13, color: "#888", marginBottom: "1.4rem" },
  teamGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
    gap: 12,
    marginBottom: "3rem",
  },
  teamCard: {
    background: "#fff",
    border: "0.5px solid #e0ddd6",
    borderRadius: 12,
    padding: "1rem",
    textAlign: "center",
  },
  avatar: {
    width: 42, height: 42,
    borderRadius: "50%",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 500, fontSize: 13,
    margin: "0 auto 0.5rem",
  },
  teamName: { fontSize: 13, fontWeight: 500, marginBottom: 2 },
  teamRole: { fontSize: 11, color: "#888" },
  cta: {
    border: "0.5px solid #ccc",
    borderRadius: 12,
    padding: "1.75rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "1rem",
    flexWrap: "wrap",
  },
  ctaH3: {
    fontFamily: "'Playfair Display', serif",
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: 4,
  },
  ctaP:   { fontSize: 12.5, color: "#888" },
  ctaBtn: {
    background: "#B45A30",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    padding: "10px 22px",
    fontSize: 13,
    fontWeight: 500,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
  },
};

const AboutUs = () => (
  <div style={styles.wrap}>
    {/* Google Fonts */}
    <link
      href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=DM+Sans:wght@300;400;500&display=swap"
      rel="stylesheet"
    />

    {/* Hero */}
    <p style={styles.eyebrow}>Our story</p>
    <h1 style={styles.h1}>
      Crafted for <em style={styles.accent}>every</em>
      <br />
      step you take
    </h1>
    <div style={styles.divider} />
    <p style={styles.sub}>
      We are a premium footwear brand that believes great shoes change how you move
      through the world — blending artisan craft with modern design since 2008.
    </p>

    {/* Stats */}
    <div style={styles.statsRow}>
      {stats.map((s) => (
        <div key={s.label} style={styles.statCard}>
          <div style={styles.statNum}>{s.number}</div>
          <div style={styles.statLbl}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* Feature grid */}
    <div style={styles.featureGrid}>
      {features.map((f) => (
        <div key={f.title} style={styles.featItem}>
          <div style={styles.featIcon}>{f.icon}</div>
          <div style={styles.featTitle}>{f.title}</div>
          <div style={styles.featDesc}>{f.desc}</div>
        </div>
      ))}
    </div>

    {/* Story + illustration */}
    <div style={styles.storyGrid}>
      <div>
        <h2 style={styles.storyH2}>From a small workshop to the world</h2>
        <p style={styles.storyP}>
          It started in a tiny workshop in Porto, Portugal — two friends, a stack of
          leather hides, and a belief that well-made shoes should be accessible to everyone.
        </p>
        <p style={styles.storyP}>
          Over sixteen years we've grown from a local boutique to shipping to 34 countries,
          but our core philosophy has never changed: every shoe we make should feel like it
          was made for you specifically.
        </p>
        <p style={styles.storyP}>
          We obsess over the details — the curve of a heel, the flex point of a sole, the
          breathability of a lining — because your feet carry you everywhere.
        </p>
      </div>
      <div style={styles.visual}>
        <svg viewBox="0 0 260 180" width="220" height="150" fill="none" xmlns="http://www.w3.org/2000/svg">
          <ellipse cx="130" cy="155" rx="95" ry="14" fill="#D85A30" opacity="0.12" />
          <path
            d="M45 130 C50 95 70 75 105 68 L165 62 C185 60 210 70 220 95 L230 130 Z"
            fill="#993C1D" opacity="0.12" stroke="#993C1D" strokeWidth="1.5"
          />
          <path d="M105 68 L100 130" stroke="#B45A30" strokeWidth="1" strokeDasharray="3 3" />
          {[80, 92, 104, 116].map((y, i) => (
            <line key={i} x1={102 - i} y1={y} x2="130" y2={y - 4} stroke="#B45A30" strokeWidth="1.5" strokeLinecap="round" />
          ))}
          <path d="M40 138 C60 143 180 143 235 133" stroke="#993C1D" strokeWidth="2" strokeLinecap="round" />
          <rect x="30" y="100" width="18" height="38" rx="4" fill="#B45A30" opacity="0.18" stroke="#B45A30" strokeWidth="1" />
        </svg>
        <p style={styles.visualCaption}>Handcrafted in Porto, Portugal</p>
      </div>
    </div>

    {/* Value pills */}
    <div style={styles.pillsRow}>
      {values.map((v) => (
        <span key={v} style={styles.pill}>{v}</span>
      ))}
    </div>

    {/* Team */}
    <h2 style={styles.teamH2}>The people behind the craft</h2>
    <p style={styles.teamSub}>A small, passionate team united by a love of great footwear.</p>
    <div style={styles.teamGrid}>
      {team.map((m) => (
        <div key={m.name} style={styles.teamCard}>
          <div style={{ ...styles.avatar, ...avatarStyles[m.color] }}>{m.initials}</div>
          <div style={styles.teamName}>{m.name}</div>
          <div style={styles.teamRole}>{m.role}</div>
        </div>
      ))}
    </div>

    {/* CTA */}
    <div style={styles.cta}>
      <div>
        <h3 style={styles.ctaH3}>Ready to find your perfect pair?</h3>
        <p style={styles.ctaP}>Browse 120+ styles — from everyday sneakers to refined dress shoes.</p>
      </div>
      <button style={styles.ctaBtn}>Shop collection →</button>
    </div>
  </div>
);

export default AboutUs;