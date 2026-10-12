import { useEffect, useState } from "react";
import { apiRequest, getData } from "../adminpanel/api";
import "../css/pages.css";

const initials = (name) =>
    String(name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("");

// Round photo; falls back to initials if no URL or image fails to load.
function Avatar({ url, name, size, ring }) {
    const [failed, setFailed] = useState(false);
    const style = {
        width: size,
        height: size,
        fontSize: Math.round(size / 2.6),
    };

    if (url && !failed) {
        const img = (
            <img
                className="av"
                style={style}
                src={url}
                alt={name}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setFailed(true)}
            />
        );
        return ring ? <span className="av-wrap">{img}</span> : img;
    }

    const fallback = (
        <span className="av av-fallback" style={style} aria-hidden="true">
            {initials(name)}
        </span>
    );
    return ring ? <span className="av-wrap">{fallback}</span> : fallback;
}

const LINKS = [
    { key: "linkedin_url", label: "LinkedIn" },
    { key: "github_url", label: "GitHub" },
    { key: "website_url", label: "Website" },
];

function AboutScreen({ site, onBack, onContact }) {
    const [data, setData] = useState({
        loading: true,
        error: "",
        speeches: [],
        team: [],
    });

    const load = () => {
        setData((d) => ({ ...d, loading: true, error: "" }));
        apiRequest("/public/about")
            .then((b) => {
                const d = getData(b) || {};
                setData({
                    loading: false,
                    error: "",
                    speeches: d.speeches || [],
                    team: d.team || [],
                });
            })
            .catch((err) =>
                setData({
                    loading: false,
                    error: err.message,
                    speeches: [],
                    team: [],
                })
            );
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const name = (site && site.site_name) || "our portal";

    return (
        <section className="pg-wrap about-page">
           

            {/* ===== HERO ===== */}
            <header className="ab-hero">
                <span className="eyebrow">About us</span>
                <h1>
                    About <span className="ab-grad">{name}</span>
                </h1>
                <p>
                    {(site && site.site_tagline) ||
                        "We help students practise subject-wise MCQ exams, learn from previous year questions and track their progress, all for free."}
                </p>
            </header>

            {data.loading && <div className="panel loading-box">Loading…</div>}

            {data.error && (
                <div className="panel loading-box">
                    <p>Could not load this page: {data.error}</p>
                    <button type="button" className="btn" onClick={load}>
                        Try again
                    </button>
                </div>
            )}

            {/* ===== SPEECHES ===== */}
            {data.speeches.length > 0 && (
                <div className="ab-speeches">
                    {data.speeches.map((s) => (
                        <article className="ab-speech" key={s.id}>
                            <div className="ab-speech-photo">
                                <Avatar
                                    url={s.photo_full_url || s.photo_url}
                                    name={s.name}
                                    size={140}
                                    ring
                                />
                            </div>

                            <div className="ab-speech-body">
                                <span className="ab-mark" aria-hidden="true">
                                    “
                                </span>
                                <p className="ab-text">{s.speech}</p>
                                <div className="ab-by">
                                    <b>{s.name}</b>
                                    <small>{s.role}</small>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {/* ===== TEAM ===== */}
            {data.team.length > 0 && (
                <div className="ab-team-section">
                    <div className="pg-head ab-center">
                        <span className="eyebrow">The people</span>
                        <h2>Meet the team</h2>
                        <p>The people behind the portal.</p>
                    </div>

                    <div className="ab-grid">
                        {data.team.map((m) => (
                            <article className="ab-card" key={m.id}>
                                <div className="ab-card-photo">
                                    <Avatar
                                        url={m.photo_full_url || m.photo_url}
                                        name={m.name}
                                        size={104}
                                    />
                                </div>

                                <b className="ab-card-name">{m.name}</b>
                                <span className="ab-role">{m.role}</span>

                                {m.bio && <p className="ab-bio">{m.bio}</p>}

                                <div className="ab-links">
                                    {LINKS.filter((l) => m[l.key]).map((l) => (
                                        <a
                                            key={l.key}
                                            href={m[l.key]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={m.name + " on " + l.label}
                                        >
                                            {l.label}
                                        </a>
                                    ))}
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

           
            
        </section>
    );
}

export default AboutScreen;