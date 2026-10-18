import { useEffect, useState } from "react";
import { apiRequest, getData } from "../../adminpanel/api";
import { fmtDate } from "../../utils/dates"; 

import RichText from "./RichText";
import "../../adminpanel/css/pyq.css";
import VideoEmbed from "../VideoEmbed";

const NO_FILTER = { subject: "", exam: "", topic: "", q: "" };

function PyqScreen({ onBack, user, onLogin }) {
    const [f, setF] = useState(NO_FILTER);
    const [qInput, setQInput] = useState("");
    const [page, setPage] = useState(1);
    const [data, setData] = useState({ 
        loading: true, 
        error: "", 
        items: [], 
        last: 1, 
        total: 0, 
        subjects: [], 
        exams: [] 
    });
    const [open, setOpen] = useState({});
    const [zoom, setZoom] = useState("");

    // 🔒 লগইন চেক
    const loggedIn = !!user;

    useEffect(() => {
        // 🚫 লগইন না থাকলে API কল হবে না
        if (!loggedIn) return;

        let alive = true;
        setData((d) => ({ ...d, loading: true, error: "" }));

        const qs = new URLSearchParams({ page: String(page) });
        if (f.subject) qs.set("subject_id", f.subject);
        if (f.exam) qs.set("exam", f.exam);
        if (f.topic) qs.set("topic", f.topic);
        if (f.q) qs.set("q", f.q);

        apiRequest("/public/pyq?" + qs.toString())
            .then((b) => {
                if (!alive) return;
                const d = getData(b) || {};
                setData({
                    loading: false,
                    error: "",
                    items: d.items || [],
                    last: d.last_page || 1,
                    total: d.total || 0,
                    subjects: d.subjects || [],
                    exams: d.exams || [],
                });
                setOpen({});
            })
            .catch((err) => {
                if (alive) setData((x) => ({ ...x, loading: false, error: err.message, items: [] }));
            });

        return () => {
            alive = false;
        };
    }, [f, page, loggedIn]);

    // close the image viewer with Escape
    useEffect(() => {
        if (!zoom) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") setZoom("");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [zoom]);

    const change = (patch) => {
        setPage(1);
        setF((x) => ({ ...x, ...patch }));
    };

    const submitSearch = (e) => {
        e.preventDefault();
        change({ q: qInput.trim() });
    };

    const clearAll = () => {
        setQInput("");
        setPage(1);
        setF(NO_FILTER);
    };

    const goPage = (p) => {
        setPage(p);
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const toggle = (id) => {
        setOpen((o) => {
            const isCurrentlyOpen = !!o[id];
            return isCurrentlyOpen ? {} : { [id]: true };
        });
    };

    const filtered = !!(f.subject || f.exam || f.topic || f.q);

    // =========================================================
    // 🔒 লগইন না থাকলে এই স্ক্রিনটা দেখাবে
    // =========================================================
    if (!loggedIn) {
        return (
            <section className="pq-wrap">
                <header className="pq-head">
                    <span className="eyebrow">Study material</span>
                    <h1>Previous Year Solutions</h1>
                    <p>Exam-wise previous year questions with solutions, reference images and video tutorials.</p>
                </header>

                <div className="panel loading-box" style={{ textAlign: "center", padding: "40px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "52px", lineHeight: 1 }} aria-hidden="true">🔒</span>
                    <h2 style={{ margin: 0 }}>Login required</h2>
                    <p style={{ maxWidth: "420px", margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
                        Previous year solutions are available for logged-in students only. Please sign in to continue.
                    </p>
                    <div style={{ marginTop: "10px", display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center" }}>
                        <button type="button" className="btn" onClick={() => onLogin && onLogin("login")}>
                            Login
                        </button>
                        <button type="button" className="btn ghost" onClick={() => onLogin && onLogin("register")}>
                            Register
                        </button>
                    </div>
                </div>
            </section>
        );
    }

    // =========================================================
    // ✅ লগইন থাকলে নরমাল ভিউ
    // =========================================================
    return (
        <section className="pq-wrap">
            <header className="pq-head">
                <span className="eyebrow">Study material</span>
                <h1>Previous Year Solutions</h1>
                <p>Exam-wise previous year questions with solutions, reference images and video tutorials.</p>
            </header>

            <div className="pq-filters">
                <select value={f.exam} onChange={(e) => change({ exam: e.target.value })} aria-label="Exam">
                    <option value="">All exams</option>
                    {data.exams.map((x) => (
                        <option key={x.exam_name} value={x.exam_name}>
                            {x.exam_name}
                            {x.exam_date ? " · " + fmtDate(x.exam_date) : ""} ({x.total})
                        </option>
                    ))}
                </select>

                <form className="pq-search" onSubmit={submitSearch}>
                    <input type="search" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder="Search question or solution" />
                    <button type="submit" className="btn">Search</button>
                </form>
            </div>

            {filtered && (
                <div className="pq-active">
                    <span>Filters:</span>
                    {f.topic && <span className="pq-chip on">Topic: {f.topic}</span>}
                    {f.q && <span className="pq-chip on">“{f.q}”</span>}
                    <button type="button" className="btn ghost sm" onClick={clearAll}>Clear all</button>
                </div>
            )}

            {data.loading && <div className="panel loading-box">Loading solutions...</div>}

            {data.error && (
                <div className="panel loading-box">
                    <p>Could not load the solutions: {data.error}</p>
                    <button type="button" className="btn" onClick={() => setF({ ...f })}>Try again</button>
                </div>
            )}

            {!data.loading && !data.error && data.items.length === 0 && (
                <div className="panel loading-box">
                    <h2>{filtered ? "No matching solution" : "No solution yet"}</h2>
                    <p>{filtered ? "Try a different filter or search." : "Solutions will be added soon."}</p>
                    {filtered && <button type="button" className="btn" onClick={clearAll}>Clear filters</button>}
                </div>
            )}

            {!data.loading && data.items.length > 0 && (
                <>
                    <div className="pq-count">{data.total} solution(s)</div>

                    {data.items.map((it) => {
                        const isOpen = !!open[it.id];
                        const hasSolution = !!(it.answer || it.solution || (it.images && it.images.length) || it.video_url);
                        return (
                            <article className="pq-card" key={it.id}>
                                <div className="pq-meta">
                                    {it.q_no && <span className="pq-num">Q. {it.q_no}</span>}
                                    <button type="button" className="pq-tag" onClick={() => change({ exam: it.exam_name })} title="Show this exam only">
                                        {it.exam_name}
                                    </button>
                                    {it.exam_date && <span className="pq-tag static">📅 {fmtDate(it.exam_date)}</span>}
                                    {it.subject && <span className="pq-tag static">{it.subject.icon} {it.subject.name}</span>}
                                </div>

                                <RichText text={it.question} className="pq-q" />

                                <button type="button" className="btn ghost" onClick={() => toggle(it.id)} aria-expanded={isOpen}>
                                    {isOpen ? "Hide solution" : "Show solution"}
                                </button>

                                {isOpen && (
                                    <div className="pq-sol">
                                        {it.answer && (
                                            <div className="pq-ans">✅ <b>Answer:</b> {it.answer}</div>
                                        )}

                                        {it.solution && (
                                            <div>
                                                <b>Solution</b>
                                                <RichText text={it.solution} />
                                            </div>
                                        )}

                                        {it.topics && it.topics.length > 0 && (
                                            <div className="pq-topics">
                                                <b>Topics:</b>
                                                {it.topics.map((t) => (
                                                    <button key={t} type="button" className="pq-chip" onClick={() => change({ topic: t })} title="Show all solutions of this topic">
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {it.images && it.images.length > 0 && (
                                            <div>
                                                <b>Reference images</b>
                                                <div className="pq-thumbs">
                                                    {it.images.map((src, i) => (
                                                        <button key={i} type="button" className="pq-thumb" onClick={() => setZoom(src)} aria-label={"Open reference image " + (i + 1)}>
                                                            <img
                                                                src={src}
                                                                alt={"Reference " + (i + 1)}
                                                                loading="lazy"
                                                                referrerPolicy="no-referrer"
                                                                onError={(e) => {
                                                                    const b = e.currentTarget.closest("button");
                                                                    if (b) b.style.display = "none";
                                                                }}
                                                            />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {it.video_url && (
                                            <div>
                                                <b>Video tutorial</b>
                                                <VideoEmbed url={it.video_url} title="Video tutorial" />
                                            </div>
                                        )}

                                        {!hasSolution && <p className="pq-muted">The solution will be added soon.</p>}
                                    </div>
                                )}
                            </article>
                        );
                    })}

                    {data.last > 1 && (
                        <div className="pq-pager">
                            <button type="button" className="btn ghost" disabled={page <= 1} onClick={() => goPage(page - 1)}>← Previous</button>
                            <span>Page {page} of {data.last}</span>
                            <button type="button" className="btn ghost" disabled={page >= data.last} onClick={() => goPage(page + 1)}>Next →</button>
                        </div>
                    )}
                </>
            )}

            {zoom && (
                <div className="pq-zoom" onClick={() => setZoom("")} role="dialog" aria-modal="true" aria-label="Reference image">
                    <button type="button" className="pq-zoom-x" onClick={() => setZoom("")} aria-label="Close">✕</button>
                    <img src={zoom} alt="Reference" referrerPolicy="no-referrer" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </section>
    );
}

export default PyqScreen;