import { useEffect, useState } from "react";
import { apiRequest, pickList } from "../adminpanel/api";
import EfficiencyChart from "./EfficiencyChart";

const fmtT = (s) => Math.floor(s / 60) + "m " + (s % 60) + "s";
const fmtD = (iso) => {
    const d = new Date(iso);
    return (
        d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) +
        ", " +
        d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    );
};

const getStudentId = (u) => u?.student_id ?? u?.studentId ?? u?.id ?? "";

function StudentPanel({ user, token, onOpen, onStart, onLogin, onUnauthorized }) {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(!!token);
    const [error, setError] = useState("");
    const [subject, setSubject] = useState("all");

    const load = async () => {
        setLoading(true);
        setError("");
        try {
            // 👇 এখানে মডেল টেস্টের হিস্ট্রি এন্ডপয়েন্ট ব্যবহার করা হলো
            const body = await apiRequest("/student/model-attempts", { token });
            // pickList আপনার utils এ থাকলে ভালো, না থাকলে body.data.attempts ব্যবহার করুন
            const list = body?.data?.attempts || pickList(body) || [];
            setRecords(list);
        } catch (err) {
            if (err.status === 401) onUnauthorized();
            else setError(err.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (token) load();
    }, [token]);

    if (!user) {
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

    // ফিল্টার লজিক
    const subjectNames = [...new Set(records.map((r) => r.name))]; // মডেল টেস্টে subject এর বদলে name
    const list = records.filter((r) => subject === "all" || r.name === subject);
    
    // শুধুমাত্র পাবলিশড রেজাল্টগুলো ফিল্টার করে নেওয়া
    const publishedRecords = list.filter((r) => r.published);
    
    const n = publishedRecords.length;
    const avg = n ? Math.round(publishedRecords.reduce((a, r) => a + r.percent, 0) / n) : 0;
    const best = n ? Math.max(...publishedRecords.map((r) => r.percent)) : 0;
    const passRate = n ? Math.round((publishedRecords.filter((r) => r.percent >= 40).length / n) * 100) : 0; // ধরে নিচ্ছি ৪০% পাশ মার্ক

    // Chart Data
    const chartData = [...publishedRecords]
        .sort((a, b) => new Date(a.submitted_at) - new Date(b.submitted_at))
        .slice(-10)
        .map((r, i) => ({
            label: "Test " + (i + 1),
            value: r.percent || 0,
            title: r.name,
        }));

    // Subject-wise performance (মডেল টেস্টে যেহেতু একক বিষয় থাকে, তাই নাম দিয়েই গ্রুপ করা হলো)
    const bySubject = Object.values(
        publishedRecords.reduce((m, r) => {
            const x = m[r.name] || (m[r.name] = { name: r.name, icon: "🏅", color: "#3346c9", n: 0, sum: 0 });
            x.n++;
            x.sum += r.percent || 0;
            return m;
        }, {})
    );

    return (
        <div className="sp">
            <div className="sp-head">
                <div>
                    <h1>Student Panel</h1>
                    <p className="sub" style={{ margin: 0 }}>
                        Results of <b>{user.name}</b>
                    </p>
                    <p className="sub" style={{marginTop: 4}}>
                       Student ID: {getStudentId(user)}
                    </p>
                </div>
                <div className="sp-filters">
                    <select className="field" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
                        <option value="all">All Tests</option>
                        {subjectNames.map((x) => <option key={x} value={x}>{x}</option>)}
                    </select>
                </div>
            </div>

            <div className="stats panel">
                <div><b>{n}</b><small>Tests taken</small></div>
                <div><b>{avg}%</b><small>Average score</small></div>
                <div><b style={{ color: "var(--ok)" }}>{best}%</b><small>Best score</small></div>
                <div><b>{passRate}%</b><small>Pass rate</small></div>
            </div>

            {chartData.length > 0 && <EfficiencyChart data={chartData} threshold={60} />}

            {bySubject.length > 0 && (
                <div className="panel" style={{ marginBottom: 20 }}>
                    <h3 style={{ margin: "0 0 14px" }}>Subject-wise performance</h3>
                    {bySubject.map((s) => {
                        const p = Math.round(s.sum / s.n);
                        return (
                            <div className="perf" key={s.name}>
                                <span className="perf-name">{s.icon} {s.name} <small>({s.n})</small></span>
                                <div className="perf-bar"><div style={{ width: p + "%", background: s.color }} /></div>
                                <b>{p}%</b>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="panel">
                <h3 style={{ margin: "0 0 12px" }}>Exam history ({n})</h3>
                {list.map((r) => (
                    <div className="rec" key={r.id}>
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
                                    <span className={"badge pass"}>
                                        {r.percent}% · Rank {r.rank} 
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
                                <button className="btn" onClick={() => onOpen(r.id)}>View</button>
                            ) : (
                                <button className="btn ghost" disabled>Wait</button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default StudentPanel;