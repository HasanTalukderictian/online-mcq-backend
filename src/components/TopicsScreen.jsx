import { useEffect, useState } from "react";
import { apiRequest, getData } from "../adminpanel/api";
import "../css/topics.css";

const KEY = "topics_view_v1";
const LETTERS = "ABCDEF";

const readSaved = () => {
    try {
        return JSON.parse(sessionStorage.getItem(KEY)) || {};
    } catch {
        return {};
    }
};

// YouTube link -> video id
const youtubeId = (url) => {
    if (!url) return "";
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : "";
};

// Helper to strip HTML tags safely for the topic card preview
const stripHtml = (html) => {
    if (!html) return "";
    // Replace block tags with space, then remove remaining tags
    const withSpaces = html.replace(/<\/?(p|div|br|li|ul|ol|h[1-6])[^>]*>/gi, " ");
    const doc = new DOMParser().parseFromString(withSpaces, 'text/html');
    return doc.body.textContent || "";
};

function Video({ url, title }) {
    if (!url) return null;
    const id = youtubeId(url);
    if (id) {
        return (
            <div className="tpc-video">
                <iframe
                    src={"https://www.youtube-nocookie.com/embed/" + id}
                    title={title || "Video"}
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            </div>
        );
    }
    return (
        <a className="tpc-vlink" href={url} target="_blank" rel="noopener noreferrer">▶ Watch video</a>
    );
}

function TopicsScreen({ initialSubjectId, onBack }) {
    const saved = readSaved();
    const [list, setList] = useState({ loading: true, error: "", subjects: [] });
    const [subjectId, setSubjectId] = useState(initialSubjectId || saved.subjectId || null);
    const [topicId, setTopicId] = useState(initialSubjectId ? null : saved.topicId || null);
    const [detail, setDetail] = useState({ loading: false, error: "", topic: null, questions: [] });
    const [shown, setShown] = useState({});

    useEffect(() => {
        try {
            sessionStorage.setItem(KEY, JSON.stringify({ subjectId: subjectId, topicId: topicId }));
        } catch {}
    }, [subjectId, topicId]);

    const loadList = () => {
        setList((l) => ({ ...l, loading: true, error: "" }));
        apiRequest("/public/topics")
            .then((b) => {
                const d = getData(b) || {};
                setList({ loading: false, error: "", subjects: d.subjects || [] });
            })
            .catch((err) => setList({ loading: false, error: err.message, subjects: [] }));
    };

    useEffect(() => {
        loadList();
    }, []);

    useEffect(() => {
        if (!topicId) return;
        setDetail({ loading: true, error: "", topic: null, questions: [] });
        setShown({});
        window.scrollTo({ top: 0 });
        apiRequest("/public/topics/" + topicId)
            .then((b) => {
                const d = getData(b) || {};
                setDetail({ loading: false, error: "", topic: d.topic || null, questions: d.questions || [] });
            })
            .catch((err) => setDetail({ loading: false, error: err.message, topic: null, questions: [] }));
    }, [topicId]);

    const subj = list.subjects.find((s) => String(s.id) === String(subjectId)) || list.subjects[0];

    const toggle = (id) => setShown((s) => ({ ...s, [id]: !s[id] }));
    const showAll = () => setShown(Object.fromEntries(detail.questions.map((q) => [q.id, true])));
    const hideAll = () => setShown({});

    /* ---------- one topic (ARTICLE VIEW) ---------- */
    if (topicId) {
        const t = detail.topic;
        return (
            <section className="tpc-wrap tpc-article-wrap">
                <button
                    type="button"
                    className="btn ghost tpc-back-btn"
                    onClick={() => setTopicId(null)}
                >
                    ← Back to topics
                </button>

                {detail.loading && <div className="panel loading-box">Loading topic...</div>}

                {detail.error && (
                    <div className="panel loading-box">
                        <p>Could not load this topic: {detail.error}</p>
                        <button type="button" className="btn" onClick={() => setTopicId(null)}>Back to topics</button>
                    </div>
                )}

                {t && (
                    <article className="tpc-article">
                        {/* Article Header - AI style */}
                        <header className="tpc-article-head">
                            <span className="tpc-eyebrow">{t.icon} {t.subject}</span>
                            <h1 className="tpc-title">{t.title}</h1>
                            <div className="tpc-meta">
                                <span>Last Updated: Today</span>
                                <div className="tpc-meta-actions">
                                    <span title="Comments">💬</span>
                                    <span title="Edit">✏️</span>
                                    <span title="More">⋮</span>
                                </div>
                            </div>
                        </header>

                        <div className="tpc-divider" />

                        {/* Article Body */}
                        <div className="tpc-content">
                            {t.video_url && <Video url={t.video_url} title={t.title} />}
                            
                            {t.description && (
                                <div 
                                    className="tpc-rich-text" 
                                    dangerouslySetInnerHTML={{ __html: t.description }} 
                                />
                            )}
                        </div>

                        <div className="tpc-divider" />

                        {/* Questions Section */}
                        <div className="tpc-questions-section">
                            {detail.questions.length === 0 ? (
                                <div className="tpc-muted">Questions will be added soon.</div>
                            ) : (
                                <>
                                    <div className="tpc-tools">
                                        <h2>{detail.questions.length} Previous Year Questions</h2>
                                        <span className="tpc-tool-btns">
                                            <button type="button" className="btn ghost sm" onClick={showAll}>Show all</button>{" "}
                                            <button type="button" className="btn ghost sm" onClick={hideAll}>Hide all</button>
                                        </span>
                                    </div>

                                    <div className="tpc-q-list">
                                        {detail.questions.map((q, i) => {
                                            const open = !!shown[q.id];
                                            return (
                                                <div className="tpc-q" key={q.id}>
                                                    <div className="tpc-q-head">
                                                        <span className="tpc-num">{i + 1}</span>
                                                        <div className="tpc-q-tags">
                                                            {q.source && <span className="tpc-tag">{q.source}</span>}
                                                            {q.year && <span className="tpc-tag year">{q.year}</span>}
                                                        </div>
                                                    </div>

                                                    <p className="tpc-q-text">{q.question}</p>

                                                    {q.options && q.options.length > 0 && (
                                                        <ul className="tpc-opts">
                                                            {q.options.map((o, k) => (
                                                                <li key={k} className={open && q.answer === o ? "right" : ""}>
                                                                    <b>{LETTERS[k]}</b>
                                                                    <span>{o}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}

                                                    <button type="button" className="btn ghost sm" onClick={() => toggle(q.id)}>
                                                        {open ? "Hide answer & solution" : "Show answer & solution"}
                                                    </button>

                                                    {open && (
                                                        <div className="tpc-sol">
                                                            {q.answer && (
                                                                <div className="tpc-ans">✅ <b>Answer:</b> {q.answer}</div>
                                                            )}
                                                            {q.solution && (
                                                                <div className="tpc-sol-text">
                                                                    <b>Solution</b>
                                                                    <p>{q.solution}</p>
                                                                </div>
                                                            )}
                                                            <Video url={q.video_url} title="Solution video" />
                                                            {!q.answer && !q.solution && !q.video_url && (
                                                                <p className="tpc-muted">The solution will be added soon.</p>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </div>
                    </article>
                )}
            </section>
        );
    }

    /* ---------- topic list ---------- */
    return (
        <section className="tpc-wrap">
            <header className="tpc-head">
                <span className="eyebrow">Study material</span>
                <h1>Important Topics</h1>
                <p>Pick a subject and open a topic to see previous year questions with solutions and videos.</p>
            </header>

            {list.loading && <div className="panel loading-box">Loading topics...</div>}

            {list.error && (
                <div className="panel loading-box">
                    <p>Could not load the topics: {list.error}</p>
                    <button type="button" className="btn" onClick={loadList}>Try again</button>
                </div>
            )}

            {!list.loading && !list.error && list.subjects.length === 0 && (
                <div className="panel loading-box">
                    <h2>No topics yet</h2>
                    <p>Important topics will be added soon.</p>
                </div>
            )}

            {list.subjects.length > 0 && (
                <>
                    <div className="subjects tpc-subjects">
                        {list.subjects.map((s) => (
                            <button
                                key={s.id}
                                type="button"
                                className={"subj " + (subj && subj.id === s.id ? "on" : "")}
                                style={{ "--c": s.color }}
                                onClick={() => setSubjectId(s.id)}
                            >
                                <span>{s.icon}</span>{s.name}
                            </button>
                        ))}
                    </div>

                    <div className="tpc-grid">
                        {subj && subj.topics.map((t) => (
                            <button type="button" key={t.id} className="tpc-card" onClick={() => setTopicId(t.id)}>
                                <b>{t.title}</b>
                                {/* Use stripHtml to cleanly show text preview */}
                                {t.description && <small className="tpc-desc">{stripHtml(t.description)}</small>}
                                <small>
                                    {t.questions_count} question(s){t.has_video ? " · 🎥 video" : ""}
                                </small>
                                <span className="tpc-go">Open →</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

export default TopicsScreen;