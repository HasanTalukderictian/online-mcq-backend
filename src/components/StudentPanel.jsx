import { useEffect, useRef, useState } from "react";
import { apiRequest, pickList } from "../adminpanel/api";

const fmtT = (s) => Math.floor((s || 0) / 60) + "m " + ((s || 0) % 60) + "s";
const fmtD = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return (
        d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
};

// Model test list can come as [..], {data:[..]} or {data:{attempts:[..]}}
const modelListOf = (body) => {
    if (Array.isArray(body?.data?.attempts)) return body.data.attempts;
    if (Array.isArray(body?.attempts)) return body.attempts;
    return pickList(body);
};

// Result detail endpoints, tried in order. A URL that 404s, or that returns
// no question list, makes us try the next one.
const MODEL_RESULT_URLS = (r) =>
    [
        `/student/model-attempts/${r.id}`,
        `/student/model-attempts/${r.id}/result`,
        `/student/model-attempts/${r.id}/review`,
        r.model_test_id && `/student/model-tests/${r.model_test_id}/result`,
        r.model_test_id && `/student/model-tests/${r.model_test_id}/review`,
    ].filter(Boolean);
const EXAM_RESULT_URLS = (r) => [
    `/student/attempts/${r.id}`,
    `/student/attempts/${r.id}/result`,
    `/student/results/${r.id}`,
];

/* ---------- question normalizer (handles many API shapes) ---------- */
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
const empty = (v) => v === undefined || v === null || v === "";
const firstDef = (...vals) => vals.find((v) => !empty(v));
const LETTERS = ["A", "B", "C", "D", "E", "F"];

const questionText = (it) => {
    const qq = it.question;
    return firstDef(
        it.q,
        it.question_text,
        typeof qq === "string" ? qq : undefined,
        isObj(qq) ? firstDef(qq.question, qq.question_text, qq.text, qq.title, qq.q) : undefined,
        it.text,
        it.title,
        it.stem
    );
};

const looksLikeQuestion = (x) => isObj(x) && !empty(questionText(x));

// Find the question array anywhere in the response (max depth 4)
const findQuestions = (obj, depth = 0) => {
    if (!obj || depth > 4) return [];
    if (Array.isArray(obj)) return obj.length && obj.some(looksLikeQuestion) ? obj : [];
    if (!isObj(obj)) return [];
    const preferred = ["items", "questions", "answers", "review", "details", "responses", "attempt_answers", "question_answers"];
    for (const k of preferred) {
        const found = findQuestions(obj[k], depth + 1);
        if (found.length) return found;
    }
    for (const k of Object.keys(obj)) {
        if (preferred.includes(k)) continue;
        const found = findQuestions(obj[k], depth + 1);
        if (found.length) return found;
    }
    return [];
};

const optionsOf = (it) => {
    const src = [it, isObj(it.question) ? it.question : null].filter(Boolean);
    for (const s of src) {
        let o = firstDef(s.options, s.choices, s.option_list);
        if (typeof o === "string") {
            try { o = JSON.parse(o); } catch { o = null; }
        }
        if (Array.isArray(o) && o.length) {
            return o.map((x, i) =>
                isObj(x)
                    ? {
                          key: String(firstDef(x.key, x.label, x.letter, LETTERS[i])),
                          id: x.id,
                          text: String(firstDef(x.text, x.option, x.option_text, x.value, x.body, "")),
                          isCorrect: x.is_correct === true || x.is_correct === 1 || x.correct === true,
                      }
                    : { key: LETTERS[i], text: String(x) }
            );
        }
        if (isObj(o)) return Object.entries(o).map(([key, text]) => ({ key, text: String(text) }));
        // option_a, option_b ... or a, b, c, d
        const flat = ["a", "b", "c", "d", "e"]
            .map((l) => ({ key: l.toUpperCase(), text: firstDef(s["option_" + l], s["opt_" + l], s[l]) }))
            .filter((x) => !empty(x.text));
        if (flat.length >= 2) return flat.map((x) => ({ ...x, text: String(x.text) }));
    }
    return [];
};

// Turn a key / index / id / text into the option's text
const resolveAnswer = (v, opts) => {
    if (empty(v) || typeof v === "boolean") return undefined;
    if (isObj(v)) v = firstDef(v.text, v.option, v.value, v.key, v.id);
    const s = String(v).trim();
    if (!opts.length) return s;
    const hit =
        opts.find((o) => o.key.toLowerCase() === s.toLowerCase()) ||
        opts.find((o) => o.id !== undefined && String(o.id) === s) ||
        opts.find((o) => o.text === s) ||
        opts.find((o) => o.key.toLowerCase() === s.replace(/^option_?/i, "").toLowerCase()) ||
        (/^\d+$/.test(s) && opts[Number(s)]) ||
        null;
    return hit ? hit.text : s;
};

const normalizeQuestion = (it) => {
    const qq = isObj(it.question) ? it.question : {};
    const options = optionsOf(it);
    const selRaw = firstDef(
        it.sel, it.selected, it.selected_option, it.selected_answer, it.student_answer,
        it.your_answer, it.user_answer, it.chosen, it.chosen_option, it.given_answer, it.response
    );
    const ansRaw = firstDef(
        it.ans, it.correct_answer, it.correct_option, it.right_answer,
        typeof it.correct === "boolean" ? undefined : it.correct,
        qq.correct_answer, qq.correct_option, qq.answer, qq.ans,
        options.find((o) => o.isCorrect)?.key
    );
    const sel = resolveAnswer(selRaw, options);
    const ans = resolveAnswer(ansRaw, options);
    const okRaw = firstDef(it.ok, it.is_correct, typeof it.correct === "boolean" ? it.correct : undefined);
    const ok = empty(okRaw) ? !empty(sel) && !empty(ans) && sel === ans : okRaw === true || okRaw === 1 || okRaw === "1";
    return {
        q: questionText(it),
        options,
        sel,
        ans,
        ok,
        exp: firstDef(it.exp, it.explanation, qq.explanation, qq.exp),
    };
};

/* =========================================================
   Result modal for Exam + Model Test
   ========================================================= */
function ResultView({ record, token, urls, isModel, onBack }) {
    const [data, setData] = useState(record);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let alive = true;
        (async () => {
            let best = null;
            let lastErr = null;
            for (const url of urls) {
                try {
                    const body = await apiRequest(url, { token });
                    console.log("[ResultView]", url, "→", body);
                    const root = body?.data ?? body;
                    // merge every level so sibling keys (e.g. data.questions next to data.attempt) are kept
                    const merged = {
                        ...record,
                        ...(isObj(root) ? root : {}),
                        ...(isObj(root?.result) ? root.result : {}),
                        ...(isObj(root?.attempt) ? root.attempt : {}),
                    };
                    merged.__questions = findQuestions(body);
                    if (!best) best = merged;
                    if (merged.__questions.length) {
                        best = merged;
                        break;
                    }
                } catch (err) {
                    lastErr = err;
                    if (err.status !== 404) break;
                }
            }
            if (!alive) return;
            if (best) setData(best);
            else if (lastErr) setError(lastErr.message || "Could not load result details");
            setLoading(false);
        })();
        return () => { alive = false; };
    }, [record.id, token]);

    // Esc closes the modal + lock page scroll while open
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onBack();
        document.addEventListener("keydown", onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = prev;
        };
    }, []);

    const d = data;
    const questions = (d.__questions || []).map(normalizeQuestion);
    const percent = d.percent ?? d.percentage ?? 0;
    const passed = d.passed ?? percent >= (d.pass_mark ?? 40);
    const name = (v) => (isObj(v) ? firstDef(v.name, v.title) : v);
    const title = isModel
        ? firstDef(d.name, name(d.model_test), "Model Test")
        : [name(d.subject), name(d.exam)].filter(Boolean).join(" · ");
    const answersHidden = d.show_answers === false || d.published === false;

    const box = (bg) => ({ padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", background: bg });

    return (
        <div className="sp-modal-backdrop" style={modalStyles.backdrop} onClick={onBack}>
            <div
                className="panel sp-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Exam result"
                style={modalStyles.box}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={modalStyles.head}>
                    <div style={{ minWidth: 0 }}>
                        <h2 style={{ margin: 0 }}>{isModel ? "🏅" : d.icon || "📘"} {title || "Result"}</h2>
                        <p className="sub" style={{ margin: "4px 0 0" }}>
                            {fmtD(d.submitted_at || d.date)} · {fmtT(d.time_taken)}
                        </p>
                    </div>
                    <button type="button" className="btn ghost" onClick={onBack} aria-label="Close">✕</button>
                </div>

                {loading && <p className="sub" style={{ textAlign: "center", padding: "30px 0" }}>Loading result...</p>}

                {!loading && (
                    <>
                        {error && (
                            <div className="panel" style={{ borderLeft: "4px solid #e5484d", marginBottom: 16 }}>
                                Details could not be loaded: {error}
                            </div>
                        )}

                        <div className="stats panel">
                            <div><b>{d.correct ?? 0}/{d.total ?? 0}</b><small>Correct</small></div>
                            {d.wrong !== undefined && <div><b style={{ color: "#e5484d" }}>{d.wrong}</b><small>Wrong</small></div>}
                            {d.skipped !== undefined && <div><b>{d.skipped}</b><small>Skipped</small></div>}
                            {isModel && d.negative !== undefined && <div><b>{d.negative}</b><small>Negative</small></div>}
                            <div><b style={{ color: passed ? "var(--ok)" : "#e5484d" }}>{percent}%</b><small>Score</small></div>
                            {isModel && <div><b>{d.rank ?? "-"}</b><small>Rank</small></div>}
                            <div>
                                <b style={{ color: passed ? "var(--ok)" : "#e5484d" }}>{passed ? "Passed" : "Failed"}</b>
                                <small>{d.pass_mark ? `Pass mark ${d.pass_mark}%` : "Status"}</small>
                            </div>
                        </div>
                        {d.time_up && <p className="sub" style={{ margin: "0 0 16px" }}>⏰ Time was up — exam auto-submitted.</p>}

                        {answersHidden && questions.length === 0 && (
                            <p className="sub">Answers are not available for this exam yet.</p>
                        )}

                        {!answersHidden && questions.length === 0 && !error && (
                            <p className="sub">
                                The server did not send the question list for this result. Open the browser console (F12) and
                                check the <code>[ResultView]</code> line to see what came back.
                            </p>
                        )}

                        {questions.length > 0 && (
                            <div className="panel">
                                <h3 style={{ margin: "0 0 14px" }}>Answers ({questions.length})</h3>
                                {questions.map((q, qi) => {
                                    const skipped = empty(q.sel);
                                    return (
                                        <div key={qi} style={{ padding: "12px 0", borderBottom: "1px solid #eee" }}>
                                            <b>{qi + 1}. {q.q}</b>

                                            {q.options.length > 0 ? (
                                                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                                                    {q.options.map((o) => {
                                                        const isCor = !empty(q.ans) && o.text === q.ans;
                                                        const isSel = !skipped && o.text === q.sel;
                                                        return (
                                                            <div
                                                                key={o.key}
                                                                style={box(isCor ? "#e6f7ec" : isSel ? "#fdeaea" : "transparent")}
                                                            >
                                                                <b>{o.key}.</b> {o.text}{" "}
                                                                {isCor && "✅"} {isSel && !isCor && "❌"}
                                                                {isSel && <small> (your answer)</small>}
                                                            </div>
                                                        );
                                                    })}
                                                    {skipped && <small className="sub">⏭️ You skipped this question.</small>}
                                                </div>
                                            ) : (
                                                <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                                                    <div style={box(q.ok ? "#e6f7ec" : skipped ? "#f4f4f5" : "#fdeaea")}>
                                                        Your answer: <b>{skipped ? "Skipped" : q.sel}</b>{" "}
                                                        {q.ok ? "✅" : skipped ? "⏭️" : "❌"}
                                                    </div>
                                                    {!q.ok && !empty(q.ans) && (
                                                        <div style={box("#e6f7ec")}>
                                                            Correct answer: <b>{q.ans}</b> ✅
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {q.exp && <small className="sub">💡 {q.exp}</small>}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

const modalStyles = {
    backdrop: {
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(15, 23, 42, 0.55)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 16px",
        overflowY: "auto",
    },
    box: {
        width: "100%",
        maxWidth: 760,
        maxHeight: "calc(100vh - 80px)",
        overflowY: "auto",
        margin: 0,
        boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
    },
    head: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 16,
    },
};

/* =========================================================
   Student Panel
   ========================================================= */
function StudentPanel({ user, token, onOpen, onStart, onLogin, onUnauthorized }) {
    const [records, setRecords] = useState([]); // subject exams (same as before)
    const [models, setModels] = useState([]);   // model tests
    const [loading, setLoading] = useState(!!token);
    const [error, setError] = useState("");
    const [modelError, setModelError] = useState("");
    const [subject, setSubject] = useState("all");
    const [opened, setOpened] = useState(null); // { record, isModel }

    // Remember the logged-in user so a short re-render without `user` never shows the login screen
    const lastUser = useRef(user);
    if (user) lastUser.current = user;
    const me = user || lastUser.current;

    const load = async () => {
        setLoading(true);
        setError("");
        setModelError("");

        // 1. Subject exams: exactly the same as your old code
        try {
            const body = await apiRequest("/student/attempts", { token });
            setRecords(pickList(body));
        } catch (err) {
            if (err.status === 401) {
                onUnauthorized();
                setLoading(false);
                return;
            }
            setError(err.message);
        }

        // 2. Model tests: separate, so an error here never hides the exam history
        try {
            const body = await apiRequest("/student/model-attempts", { token });
            setModels(modelListOf(body));
        } catch (err) {
            setModels([]);
            setModelError(err.message);
        }

        setLoading(false);
    };

    useEffect(() => {
        if (token) load();
    }, [token]);

    if (!me && !token) {
        return (
            <div className="sp">
                <div className="panel sp-empty">
                    <div style={{ fontSize: 48 }}>🔒</div>
                    <h2>Please log in</h2>
                    <p className="sub">Log in to see your exam results and progress.</p>
                    <button className="btn" onClick={onLogin}>Login</button>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="sp"><div className="panel sp-empty">Loading your results...</div></div>;
    }

    if (error && !models.length) {
        return (
            <div className="sp">
                <div className="panel sp-empty">
                    <p>Could not load your results: {error}</p>
                    <button className="btn" onClick={load}>Try again</button>
                </div>
            </div>
        );
    }

    if (!records.length && !models.length) {
        return (
            <div className="sp">
                <div className="panel sp-empty">
                    <div style={{ fontSize: 48 }}>📊</div>
                    <h2>No exam records yet</h2>
                    <p className="sub">Your results will appear here after you finish an exam.</p>
                    <button className="btn" onClick={onStart}>Start an exam</button>
                </div>
            </div>
        );
    }

    // ---- Subject exams (same logic as before) ----
    const subjectNames = [...new Set(records.map((r) => r.subject))];
    const list = records.filter((r) => subject === "all" || r.subject === subject);
    const n = list.length;
    const avg = n ? Math.round(list.reduce((a, r) => a + r.percent, 0) / n) : 0;
    const best = n ? Math.max(...list.map((r) => r.percent)) : 0;
    const passRate = n ? Math.round((list.filter((r) => r.passed).length / n) * 100) : 0;

    const bySubject = Object.values(
        list.reduce((m, r) => {
            const x = m[r.subject] || (m[r.subject] = { name: r.subject, icon: r.icon, color: r.color, n: 0, sum: 0 });
            x.n++;
            x.sum += r.percent;
            return m;
        }, {})
    );

    // ---- Model tests ----
    const publishedModels = models.filter((m) => m.published);
    if (subject === "all" && publishedModels.length) {
        bySubject.push({
            name: "Model Test",
            icon: "🏅",
            color: "#3346c9",
            n: publishedModels.length,
            sum: publishedModels.reduce((a, m) => a + (m.percent || 0), 0),
        });
    }

    return (
        <div className="sp">
            <div className="sp-head">
                <div>
                    <h1>Student Panel</h1>
                    <p className="sub" style={{ margin: 0 }}>Results of {me?.name || "Student"}</p>
                </div>
                <div className="sp-filters">
                    <select className="field" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
                        <option value="all">All subjects</option>
                        {subjectNames.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                </div>
            </div>

            <div className="stats panel">
                <div><b>{n}</b><small>Exams taken</small></div>
                <div><b>{avg}%</b><small>Average score</small></div>
                <div><b style={{ color: "var(--ok)" }}>{best}%</b><small>Best score</small></div>
                <div><b>{passRate}%</b><small>Pass rate</small></div>
            </div>

            {/* Subject-wise performance (left) + Model Test history (right) */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, marginBottom: 20, alignItems: "flex-start" }}>
                <div className="panel" style={{ flex: "1 1 320px", minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 14px" }}>Subject-wise performance</h3>
                    {bySubject.length === 0 ? (
                        <p className="sub">No performance data yet.</p>
                    ) : (
                        bySubject.map((s) => {
                            const p = Math.round(s.sum / s.n);
                            return (
                                <div className="perf" key={s.name}>
                                    <span className="perf-name">{s.icon} {s.name} <small>({s.n})</small></span>
                                    <div className="perf-bar"><div style={{ width: p + "%", background: s.color }} /></div>
                                    <b>{p}%</b>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="panel" style={{ flex: "1 1 320px", minWidth: 0 }}>
                    <h3 style={{ margin: "0 0 14px" }}>🏅 Model Test history ({models.length})</h3>
                    {modelError && (
                        <p className="sub" style={{ color: "#e5484d" }}>Could not load model tests: {modelError}</p>
                    )}
                    {models.length === 0 && !modelError ? (
                        <p className="sub">No model test history yet.</p>
                    ) : (
                        <div style={{ maxHeight: 350, overflowY: "auto", paddingRight: 5 }}>
                            {models.map((r) => {
                                const passed = r.published && r.percent >= 40;
                                return (
                                    <div className="rec" key={"m-" + r.id}>
                                        <div className="rec-main">
                                            <b>🏅 {r.name}</b>
                                            <small>
                                                {r.submitted_at ? fmtD(r.submitted_at) : "Not submitted"} · {fmtT(r.time_taken)}
                                            </small>
                                        </div>
                                        <div className="rec-score">
                                            {r.published ? (
                                                <>
                                                    <b>{r.correct}/{r.total}</b>
                                                    <span className={"badge " + (passed ? "pass" : "fail")}>
                                                        {r.percent}%{r.rank ? ` · Rank ${r.rank}` : ""}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="badge gray">
                                                    {r.status === "in_progress" ? "In Progress" : "Result Pending"}
                                                </span>
                                            )}
                                        </div>
                                        <div className="rec-act">
                                            {r.published ? (
                                                <button type="button" className="btn" onClick={() => setOpened({ record: r, isModel: true })}>View</button>
                                            ) : (
                                                <button type="button" className="btn ghost" disabled>Wait</button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Exam history (same as before) */}
            <div className="panel">
                <h3 style={{ margin: "0 0 12px" }}>📘 Exam history ({n})</h3>
                {error && <p className="sub" style={{ color: "#e5484d" }}>Could not load exam history: {error}</p>}
                {n === 0 && !error && <p className="sub">No exam history yet.</p>}
                {list.map((r) => (
                    <div className="rec" key={"e-" + r.id}>
                        <div className="rec-main">
                            <b>{r.icon} {r.subject} · {r.exam}</b>
                            <small>{fmtD(r.date)} · {fmtT(r.time_taken)}</small>
                        </div>
                        <div className="rec-score">
                            <b>{r.correct}/{r.total}</b>
                            <span className={"badge " + (r.passed ? "pass" : "fail")}>
                                {r.percent}% · {r.passed ? "Passed" : "Failed"}
                            </span>
                        </div>
                        <div className="rec-act">
                            <button type="button" className="btn" onClick={() => setOpened({ record: r, isModel: false })}>View</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Result modal: the page stays underneath */}
            {opened && token && (
                <ResultView
                    key={(opened.isModel ? "m-" : "e-") + opened.record.id}
                    record={opened.record}
                    token={token}
                    isModel={opened.isModel}
                    urls={opened.isModel ? MODEL_RESULT_URLS(opened.record) : EXAM_RESULT_URLS(opened.record)}
                    onBack={() => setOpened(null)}
                />
            )}
        </div>
    );
}

export default StudentPanel;
