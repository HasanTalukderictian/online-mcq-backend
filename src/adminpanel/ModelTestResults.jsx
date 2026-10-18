import { useEffect, useState } from "react";
import { apiRequest, getData } from "./api";
import { fmtTime } from "./ui";
import "../css/topics.css";
import "../css/modeltest.css";

function ModelTestResults({ test, token, onBack, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", info: test, rows: [] });

    useEffect(() => {
        let alive = true;
        apiRequest("/admin/model-tests/" + test.id + "/results", { token })
            .then((b) => {
                const d = getData(b) || {};
                if (alive) setState({ loading: false, error: "", info: d.test || test, rows: d.results || [] });
            })
            .catch((err) => {
                if (err.status === 401) onUnauthorized();
                else if (alive) setState((s) => ({ ...s, loading: false, error: err.message }));
            });
        return () => {
            alive = false;
        };
    }, [test.id]);

    return (
        <>
            <div className="adm-top">
                <div>
                    <button type="button" className="btn ghost sm" onClick={onBack}>← Back to model tests</button>
                    <h2 style={{ marginTop: 10 }}>{state.info.name}: results</h2>
                    <p>
                        {state.rows.length} student(s) submitted. Students see their marks {state.info.results_published ? "now (the exam period is over)." : "after the exam period ends."}
                    </p>
                </div>
            </div>

            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.rows.length === 0 ? (
                    <p className="adm-muted">No student has submitted yet.</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>Rank</th>
                                    <th>Student</th>
                                    <th>Correct</th>
                                    <th>Wrong</th>
                                    <th>Skipped</th>
                                    <th>Negative</th>
                                    <th>Marks</th>
                                    <th>%</th>
                                    <th>Time</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((r) => (
                                    <tr key={r.id}>
                                        <td><b>{r.rank}</b></td>
                                        <td>
                                            {r.name}
                                            <br />
                                            <small className="adm-muted">{r.email}{r.phone ? " · " + r.phone : ""}</small>
                                        </td>
                                        <td>{r.correct}</td>
                                        <td>{r.wrong}</td>
                                        <td>{r.skipped}</td>
                                        <td>{r.deduction > 0 ? "−" + r.deduction : "0"}</td>
                                        <td><b>{r.score}</b> / {r.total}</td>
                                        <td>{r.percent}%</td>
                                        <td>{fmtTime(r.time_taken)}{r.time_up ? " ⏰" : ""}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default ModelTestResults;