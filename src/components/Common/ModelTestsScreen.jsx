import { useEffect, useState } from "react";
import { apiRequest, getData } from "../../adminpanel/api";
import { fmtDate } from "../../utils/dates"; 
import "../../css/modeltest.css";

function ModelTestsScreen({ token, user, notice, error, startingId, onStart, onLogin, onPanel, onBack }) {
    const [data, setData] = useState({ loading: true, error: "", tests: [] });
    
    // 👇 Custom Modal state
    const [confirmTest, setConfirmTest] = useState(null);

    const load = () => {
        setData((d) => ({ ...d, loading: true, error: "" }));
        apiRequest("/public/model-tests", { token })
            .then((b) => {
                const d = getData(b) || {};
                setData({ loading: false, error: "", tests: d.tests || [] });
            })
            .catch((err) => setData({ loading: false, error: err.message, tests: [] }));
    };

    useEffect(() => {
        load();
    }, [token, notice]);

    // 👇 Alert er bodole modal open korbe
    const begin = (t) => {
        if (!user) {
            onLogin();
            return;
        }
        setConfirmTest(t); // modal open
    };

    const confirmStart = () => {
        if (confirmTest) {
            onStart(confirmTest.id);
            setConfirmTest(null);
        }
    };

    return (
        <section className="mt-wrap">
            

            <header className="mt-head">
                <span className="eyebrow">Practice like the real exam</span>
                <h1>🏅 Model Test</h1>
                <p>Full-length model tests with negative marking. Each test is open for a fixed number of days. Your marks and rank are published after the exam period ends.</p>
            </header>

            {notice && (
                <div className="mt-note ok" role="status">
                    ✅ <b>{notice.title}</b> submitted.{" "}
                    {notice.message}
                    {" "}
                    <button type="button" className="link-btn" onClick={onPanel}>Open Student Panel</button>
                </div>
            )}
            {error && <div className="mt-note bad" role="alert">{error}</div>}
            {!user && <div className="mt-note">🔒 Please log in to take a model test. You can look at the schedule without an account.</div>}

            <div className="mt-rules">
                <b>How it works</b>
                <ul>
                    <li>Each correct answer = 1 mark. Each wrong answer deducts the negative mark shown on the test. Skipped questions = 0.</li>
                    <li>You can take a test once, on any day while it is open.</li>
                    <li>If you leave or refresh during the exam, your time keeps running. Open the test again to continue.</li>
                    <li>Your marks, rank and answer review appear in the Student Panel after the exam period ends.</li>
                </ul>
            </div>

            {data.loading && <div className="panel loading-box">Loading model tests...</div>}

            {data.error && (
                <div className="panel loading-box">
                    <p>Could not load the model tests: {data.error}</p>
                    <button type="button" className="btn" onClick={load}>Try again</button>
                </div>
            )}

            {!data.loading && !data.error && data.tests.length === 0 && (
                <div className="panel loading-box">
                    <h2>No model test yet</h2>
                    <p>New model tests will be announced soon.</p>
                </div>
            )}

            <div className="mt-list">
                {data.tests.map((t) => {
                    let action;
                    if (t.mine === "submitted") {
                        action = t.results_published ? (
                            <button type="button" className="btn" onClick={onPanel}>View my result</button>
                        ) : (
                            <div className="mt-wait">✅ Submitted. Result on <b>{fmtDate(t.publish_on)}</b></div>
                        );
                    } else if (t.mine === "in_progress") {
                        action = (
                            <button type="button" className="btn" disabled={startingId === t.id} onClick={() => begin(t)}>
                                {startingId === t.id ? "Loading..." : "Resume test"}
                            </button>
                        );
                    } else if (t.phase === "upcoming") {
                        action = <button type="button" className="btn" disabled>Opens {fmtDate(t.start_date)}</button>;
                    } else if (t.phase === "open") {
                        action = (
                            <button type="button" className="btn" disabled={startingId === t.id} onClick={() => begin(t)}>
                                {startingId === t.id ? "Loading..." : user ? "Start test" : "Login to start"}
                            </button>
                        );
                    } else {
                        action = <div className="mt-wait">The exam period is over.</div>;
                    }

                    const label = { upcoming: "Upcoming", open: "Open now", closed: "Ended" }[t.phase];

                    return (
                        <article className="mt-card" key={t.id}>
                            <div className="mt-top">
                                <h3>{t.name}</h3>
                                <span className={"mt-badge " + t.phase}>{label}</span>
                            </div>

                            <div className="mt-facts">
                                <div><small>Exam period</small><b>{fmtDate(t.start_date)} → {fmtDate(t.end_date)}</b></div>
                                <div><small>Time</small><b>{t.duration} min</b></div>
                                <div><small>Questions</small><b>{t.questions_count}</b></div>
                                <div><small>Wrong answer</small><b>−{t.negative_mark}</b></div>
                            </div>

                            <div className="mt-action">{action}</div>
                        </article>
                    );
                })}
            </div>

            {/* ================= CUSTOM CONFIRM MODAL ================= */}
            {confirmTest && (
                <div className="mt-overlay" onClick={() => setConfirmTest(null)}>
                    <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="mt-modal-icon">
                            {confirmTest.mine === "in_progress" ? "⏳" : "🏅"}
                        </div>
                        
                        <h2 className="mt-modal-title">
                            {confirmTest.mine === "in_progress" ? "Resume Model Test?" : "Start Model Test?"}
                        </h2>
                        
                        <div className="mt-modal-body">
                            <p>
                                {confirmTest.mine === "in_progress" ? (
                                    <>You are about to resume <b>{confirmTest.name}</b>. Your time keeps running while you are away.</>
                                ) : (
                                    <>You are about to start <b>{confirmTest.name}</b>.</>
                                )}
                            </p>
                            {confirmTest.mine !== "in_progress" && (
                                <ul className="mt-modal-list">
                                    <li>The <b>{confirmTest.duration}-minute</b> timer starts immediately.</li>
                                    <li>You can take this test <b>only once</b>.</li>
                                    <li>You will lose marks for wrong answers (−{confirmTest.negative_mark}).</li>
                                </ul>
                            )}
                        </div>

                        <div className="mt-modal-foot">
                            <button type="button" className="btn ghost" onClick={() => setConfirmTest(null)}>
                                Cancel
                            </button>
                            <button type="button" className="btn" disabled={startingId === confirmTest.id} onClick={confirmStart}>
                                {startingId === confirmTest.id ? "Loading..." : (confirmTest.mine === "in_progress" ? "Resume Test" : "Start Now")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

export default ModelTestsScreen;