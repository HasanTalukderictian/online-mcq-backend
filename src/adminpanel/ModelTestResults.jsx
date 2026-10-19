import { useEffect, useState } from "react";
import { apiRequest, getData } from "./api";
import { fmtTime } from "./ui";
import "../css/topics.css";
import "../css/modeltest.css";

function ModelTestResults({ test, token, onBack, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", info: test, rows: [] });

    // 👇 Custom delete-confirm modal state
    const [toDelete, setToDelete] = useState(null);   // the row being confirmed
    const [deleting, setDeleting] = useState(false);  // busy flag
    const [deleteError, setDeleteError] = useState("");

    const load = () => {
        setState((s) => ({ ...s, loading: true, error: "" }));
        apiRequest("/admin/model-tests/" + test.id + "/results", { token })
            .then((b) => {
                const d = getData(b) || {};
                setState({ loading: false, error: "", info: d.test || test, rows: d.results || [] });
            })
            .catch((err) => {
                if (err.status === 401) onUnauthorized();
                else setState((s) => ({ ...s, loading: false, error: err.message }));
            });
    };

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

    const openDelete = (r) => {
        setDeleteError("");
        setToDelete(r);
    };

    const closeDelete = () => {
        if (deleting) return;
        setToDelete(null);
        setDeleteError("");
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        setDeleting(true);
        setDeleteError("");
        try {
            await apiRequest("/admin/model-test-attempts/" + toDelete.id, { method: "DELETE", token });
            setToDelete(null);
            load();
        } catch (err) {
            if (err.status === 401) {
                onUnauthorized();
                return;
            }
            setDeleteError(err.message || "Could not delete this attempt.");
        }
        setDeleting(false);
    };

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
                                    <th>Actions</th>
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
                                        <td>
                                            <button
                                                type="button"
                                                className="btn bad sm"
                                                onClick={() => openDelete(r)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ============ DELETE CONFIRM MODAL ============ */}
            {toDelete && (
                <div className="mt-overlay" onClick={closeDelete}>
                    <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="mt-modal-icon">🗑️</div>

                        <h2 className="mt-modal-title">Delete this attempt?</h2>

                        <div className="mt-modal-body">
                            <p>
                                You are about to delete the model-test attempt of <b>{toDelete.name}</b>
                                {toDelete.email ? " (" + toDelete.email + ")" : ""}.
                            </p>
                            <ul className="mt-modal-list">
                                <li>Their <b>marks, rank and answer review</b> for this test will be removed.</li>
                                <li>The student will be able to <b>take this test again</b> if the exam is still open.</li>
                                <li>This action <b>cannot be undone</b>.</li>
                            </ul>

                            {deleteError && <div className="mt-note bad" style={{ marginTop: 12 }}>{deleteError}</div>}
                        </div>

                        <div className="mt-modal-foot">
                            <button type="button" className="btn ghost" disabled={deleting} onClick={closeDelete}>
                                Cancel
                            </button>
                            <button type="button" className="btn bad" disabled={deleting} onClick={confirmDelete}>
                                {deleting ? "Deleting..." : "Yes, delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ModelTestResults;