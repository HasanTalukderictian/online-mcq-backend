import { useEffect, useState } from "react";
import { apiRequest, pickList, getData } from "../adminpanel/api";
import EfficiencyChart from "./EfficiencyChart";
import ResultScreen from "./ResultScreen";

const fmtT = (s) => Math.floor(s / 60) + "m " + (s % 60) + "s";
const fmtD = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    return (
        d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
};

const getStudentId = (u) => u?.student_id ?? u?.studentId ?? u?.id ?? "";

// Subject exam attempt -> ResultScreen props
const toExamResult = (a) => {
    const items = a.items || [];
    return {
        questions: items.map((i) => ({
            question: i.q,
            answer: i.ans !== null && i.ans !== undefined ? i.ans : i.ok ? i.sel : null,
        })),
        answers: Object.fromEntries(items.map((i, idx) => [idx, i.sel]).filter((p) => p[1])),
        timeUp: !!a.time_up,
        taken: a.time_taken || 0,
        passMark: a.pass_mark || 60,
        serverPercent: a.percent,
        serverPassed: a.passed,
        score: a.score,
        penalty: a.penalty || 0,
        showAnswers: a.show_answers !== false,
        subjectName: (a.subject || "Exam") + " - " + (a.exam || a.name || ""),
    };
};

// Model test attempt -> ResultScreen props
const toModelResult = (a) => {
    const items = a.items || [];
    return {
        questions: items.map((i) => ({ question: i.q, answer: i.ans })),
        answers: Object.fromEntries(items.map((i, idx) => [idx, i.sel]).filter((p) => p[1])),
        timeUp: !!a.time_up,
        taken: a.time_taken || 0,
        passMark: 0,
        serverPercent: a.percent,
        serverPassed: true,
        score: a.score,
        penalty: a.negative_mark || 0,
        showAnswers: true,
        subjectName: "Model Test - " + (a.name || ""),
    };
};

function StudentPanel({ user, token, onStart, onLogin, onUnauthorized }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(!!token);
    const [error, setError] = useState("");
    const [subject, setSubject] = useState("all");

    const [detail, setDetail] = useState(null);
    const [opening, setOpening] = useState(null); // "model-12" / "exam-34"

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            const examBody = await apiRequest("/student/attempts", { token });
            const examList = pickList(examBody) || [];
            const formattedExams = examList.map((r) => ({
                ...r,
                isModel: false,
                subject: r.subject || "Subject Exam",
            }));

            const modelBody = await apiRequest("/student/model-attempts", { token });
            const modelList = modelBody?.data?.attempts || pickList(modelBody) || [];
            const formattedModels = modelList.map((r) => ({
                ...r,
                isModel: true,
                exam: r.name,
                subject: "Model Test",
                icon: "🏅",
                color: "#3346c9",
                passed: r.published ? r.percent >= 40 : false,
                show_answers: r.published,
            }));

            const combined = [...formattedExams, ...formattedModels].sort((a, b) => {
                const dateA = new Date(a.date || a.submitted_at || 0);
                const dateB = new Date(b.date || b.submitted_at || 0);
                return dateB - dateA;
            });

            setRecords(combined);
        } catch (err) {
            if (err.status === 401 && onUnauthorized) onUnauthorized();
            else setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (token) load();
    }, [token]);

    // View button: panel nijei API call kore result dekhay
    const openDetail = async (id, isModel) => {
        const key = (isModel ? "model-" : "exam-") + id;
        const endpoint = isModel ? "/student/model-attempts/" + id : "/student/attempts/" + id;
        setOpening(key);
        try {
            const body = await apiRequest(endpoint, { token });
            const resData = getData(body) || body?.data || body;
            if (!resData) throw new Error("Empty response from server");

            const att = resData.attempt || resData;
            const items = resData.items || att.items || [];
            const merged = { ...resData, ...att, items };

            setDetail(isModel ? toModelResult(merged) : toExamResult(merged));
            window.scrollTo({ top: 0 });
        } catch (err) {
            console.error("openDetail failed:", endpoint, err.status, err.message, err);
            window.alert("Failed: " + endpoint + "\nStatus: " + (err.status || "n/a") + "\n" + (err.message || "Unknown error"));
        }
        setOpening(null);
    };

    // Result detail screen
    if (detail) {
        return (
            <ResultScreen
                {...detail}
                candidate={user ? user.name : ""}
                onRestart={() => setDetail(null)}
                restartLabel="Back to Student Panel"
            />
        );
    }

    if (!user && !token) {
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

    if (error) {
        return (
            <div className="sp">
                <div className="panel sp-empty">
                    <p>Could not load your results: {error}</p>
                    <button className="btn" onClick={load}>Try again</button>
                </div>
            </div>
        );
    }

    if (!records.length) {
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

    const subjectNames = [...new Set(records.map((r) => r.subject))];
    const list = records.filter((r) => subject === "all" || r.subject === subject);
    const publishedRecords = list.filter((r) => !r.isModel || r.published);

    const n = publishedRecords.length;
    const avg = n ? Math.round(publishedRecords.reduce((a, r) => a + r.percent, 0) / n) : 0;
    const best = n ? Math.max(...publishedRecords.map((r) => r.percent)) : 0;
    const passRate = n ? Math.round((publishedRecords.filter((r) => r.passed).length / n) * 100) : 0;

    const chartData = [...publishedRecords]
        .sort((a, b) => new Date(a.date || a.submitted_at) - new Date(b.date || b.submitted_at))
        .slice(-10)
        .map((r, i) => ({
            label: "Ex " + (i + 1),
            value: r.percent || 0,
            title: (r.isModel ? "Model Test: " : "") + (r.exam || r.name),
        }));

    const bySubject = Object.values(
        publishedRecords.reduce((m, r) => {
            const x = m[r.subject] || (m[r.subject] = { name: r.subject, icon: r.icon || "📘", color: r.color || "#3346c9", n: 0, sum: 0 });
            x.n++;
            x.sum += r.percent || 0;
            return m;
        }, {})
    );

    const modelOnlyList = list.filter((r) => r.isModel);
    const examOnlyList = list.filter((r) => !r.isModel);

    return (
        <div className="sp">
            <div className="sp-head">
                <div>
                    <h1>Student Panel</h1>
                    <p className="sub" style={{ margin: 0 }}>
                        Results of <b>{user ? user.name : ""}</b>
                    </p>
                    <p className="sub" style={{ marginTop: 4 }}>
                        Student ID: {getStudentId(user)}
                    </p>
                </div>
                <div className="sp-filters">
                    <select className="field" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
                        <option value="all">All Subjects & Tests</option>
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

            {chartData.length > 0 && <EfficiencyChart data={chartData} threshold={60} />}

            <div style={{ display: "flex", gap: "20px", overflowX: "auto", marginBottom: "20px", alignItems: "flex-start" }}>
                <div className="panel" style={{ flex: 1, minWidth: "350px" }}>
                    <h3 style={{ margin: "0 0 14px" }}>Subject-wise performance</h3>
                    {bySubject.length > 0 ? (
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
                    ) : (
                        <p className="adm-muted">No performance data yet.</p>
                    )}
                </div>

                <div className="panel" style={{ flex: 1, minWidth: "350px" }}>
                    <h3 style={{ margin: "0 0 14px" }}>🏅 Model Test history ({modelOnlyList.length})</h3>
                    {modelOnlyList.length === 0 ? (
                        <p className="adm-muted">No model test history yet.</p>
                    ) : (
                        <div style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "5px" }}>
                            {modelOnlyList.map((r) => (
                                <div className="rec" key={"m" + r.id} style={{ minWidth: "280px" }}>
                                    <div className="rec-main">
                                        <b>🏅 {r.name}</b>
                                        <small>
                                            {r.submitted_at ? fmtD(r.submitted_at) : "Not submitted"} · {fmtT(r.time_taken || 0)}
                                        </small>
                                    </div>
                                    <div className="rec-score">
                                        {r.published ? (
                                            <>
                                                <b>{r.correct}/{r.total}</b>
                                                <span className={"badge " + (r.passed ? "pass" : "fail")}>
                                                    {r.percent}% {r.rank ? `· Rank ${r.rank}` : ""}
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
                                            <button
                                                className="btn"
                                                disabled={opening === "model-" + r.id}
                                                onClick={() => openDetail(r.id, true)}
                                            >
                                                {opening === "model-" + r.id ? "..." : "View"}
                                            </button>
                                        ) : (
                                            <button className="btn ghost" disabled>Wait</button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="panel">
                <h3 style={{ margin: "0 0 12px" }}>📘 Exam history ({examOnlyList.length})</h3>
                {examOnlyList.length === 0 ? (
                    <p className="adm-muted">No exam history yet.</p>
                ) : (
                    examOnlyList.map((r) => (
                        <div className="rec" key={"e" + r.id}>
                            <div className="rec-main">
                                <b>{r.icon || "📘"} {r.subject} · {r.exam}</b>
                                <small>
                                    {r.date ? fmtD(r.date) : (r.submitted_at ? fmtD(r.submitted_at) : "Not submitted")} · {fmtT(r.time_taken || 0)}
                                </small>
                            </div>
                            <div className="rec-score">
                                <b>{r.correct}/{r.total}</b>
                                <span className={"badge " + (r.passed ? "pass" : "fail")}>{r.percent}%</span>
                            </div>
                            <div className="rec-act">
                                <button
                                    className="btn"
                                    disabled={opening === "exam-" + r.id}
                                    onClick={() => openDetail(r.id, false)}
                                >
                                    {opening === "exam-" + r.id ? "..." : "View"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default StudentPanel;