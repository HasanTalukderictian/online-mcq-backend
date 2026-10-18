import { useEffect, useState } from "react";
import { apiRequest, getData } from "../../adminpanel/api";
import { fmtDate } from "../../utils/dates";

import "../../css/topics.css";
import "../../css/modeltest.css";
import { fmtTime } from "../../adminpanel/ui";

function ModelHistory({ token, onUnauthorized, onOpenModel }) {
    const [data, setData] = useState({ loading: true, error: "", rows: [] });
    const [view, setView] = useState(null); // { loading, error, attempt, items }
    const [filter, setFilter] = useState("all");

    useEffect(() => {
        let alive = true;
        apiRequest("/student/model-attempts", { token })
            .then((b) => {
                const d = getData(b) || {};
                if (alive) setData({ loading: false, error: "", rows: d.attempts || [] });
            })
            .catch((err) => {
                if (err.status === 401) onUnauthorized();
                else if (alive) setData({ loading: false, error: err.message, rows: [] });
            });
        return () => {
            alive = false;
        };
    }, [token]);

    const open = (a) => {
        setFilter("all");
        setView({ loading: true, error: "", attempt: a, items: [] });
        apiRequest("/student/model-attempts/" + a.id, { token })
            .then((b) => {
                const d = getData(b) || {};
                setView({ loading: false, error: "", attempt: d.attempt || a, items: d.items || [] });
            })
            .catch((err) => {
                if (err.status === 401) onUnauthorized();
                else setView({ loading: false, error: err.message, attempt: a, items: [] });
            });
    };

    const shown = view ? view.items.map((it, i) => ({ ...it, n: i + 1 })).filter((it) => (filter === "all" ? true : filter === "wrong" ? it.ok === false : filter === "skipped" ? it.ok === null : it.ok === true)) : [];

    return (
        <section className="mh-wrap">
            <header className="mh-head">
                <h2>🏅 Model test history</h2>
                <p>All the model tests you have taken. Marks appear after the exam period of each test ends.</p>
            </header>

            {data.loading && <div className="mh-wait">Loading...</div>}
            {data.error && <div className="mt-note bad">{data.error}</div>}

            {!data.loading && !data.error && data.rows.length === 0 && (
                <div className="mh-card">
                    <p style={{ margin: 0 }}>You have not taken any model test yet.</p>
                    <button type="button" className="btn" style={{ alignSelf: "flex-start" }} onClick={onOpenModel}>See model tests →</button>
                </div>
            )}

            {data.rows.map((a) => (
                <article className="mh-card" key={a.id}>
                    <div className="mh-top">
                        <div>
                            <div className="mh-name">{a.name}</div>
                            <div className="mh-sub">Exam period: {fmtDate(a.start_date)} → {fmtDate(a.end_date)}</div>
                        </div>
                        {a.published && a.rank && <span className="mt-badge open">Rank {a.rank} of {a.participants}</span>}
                    </div>

                    {a.published ? (
                        <>
                            <div className="mh-stats">
                                <div className="mh-stat"><b>{a.score}</b><small>Marks / {a.total}</small></div>
                                <div className="mh-stat"><b>{a.correct}</b><small>Correct</small></div>
                                <div className="mh-stat"><b>{a.wrong}</b><small>Wrong</small></div>
                                <div className="mh-stat"><b>{a.skipped}</b><small>Skipped</small></div>
                                <div className="mh-stat"><b>{a.deduction > 0 ? "−" + a.deduction : "0"}</b><small>Negative</small></div>
                                <div className="mh-stat"><b>{a.percent}%</b><small>Score</small></div>
                                <div className="mh-stat"><b>{fmtTime(a.time_taken)}</b><small>Time</small></div>
                            </div>
                            <button type="button" className="btn ghost" style={{ alignSelf: "flex-start" }} onClick={() => open(a)}>View answers & explanation</button>
                        </>
                    ) : a.status === "in_progress" ? (
                        <div className="mh-wait">⏳ You started this test but have not submitted it yet. Open Model Test to continue.</div>
                    ) : (
                        <div className="mh-wait">✅ Submitted. Your marks will be published on <b>{fmtDate(a.publish_on)}</b>, after the exam period ends.</div>
                    )}
                </article>
            ))}

            {view && (
                <div className="tp-overlay" onClick={() => setView(null)}>
                    <div className="tp-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>{view.attempt.name}</h3>

                        {view.loading && <p className="mh-sub">Loading...</p>}
                        {view.error && <div className="mt-note bad">{view.error}</div>}

                        {!view.loading && !view.error && (
                            <>
                                <div className="mh-filter">
                                    {[["all", "All"], ["correct", "Correct"], ["wrong", "Wrong"], ["skipped", "Skipped"]].map((f) => (
                                        <button key={f[0]} type="button" className={filter === f[0] ? "on" : ""} onClick={() => setFilter(f[0])}>{f[1]}</button>
                                    ))}
                                </div>

                                {shown.length === 0 && <p className="mh-sub">No question in this filter.</p>}

                                {shown.map((it) => (
                                    <div className="mh-q" key={it.n}>
                                        <p className="mh-qt"><b>{it.n}.</b> {it.q}</p>
                                        <ul className="mh-opts">
                                            {(it.opts || []).map((o, k) => {
                                                const right = o === it.ans;
                                                const bad = o === it.sel && !right;
                                                return (
                                                    <li key={k} className={right ? "right" : bad ? "bad" : ""}>
                                                        <b>{"ABCDEF"[k]}</b>
                                                        <span>{o}</span>
                                                        {right && <em>✓ Correct</em>}
                                                        {bad && <em>✗ Your answer</em>}
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                        {it.ok === null && <p className="mh-sub">You skipped this question. Correct answer: <b>{it.ans}</b></p>}
                                        {it.exp && <p className="mh-exp"><b>Explanation:</b> {it.exp}</p>}
                                    </div>
                                ))}
                            </>
                        )}

                        <div className="tp-foot">
                            <button type="button" className="btn" onClick={() => setView(null)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default ModelHistory;