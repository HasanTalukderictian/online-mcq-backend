import { useEffect, useState } from "react";
import { apiRequest, getData } from "./api";
import { fmtDate, addDays } from "../utils/dates";
import ModelTestQuestions from "./ModelTestQuestions";
import ModelTestResults from "./ModelTestResults";
import "../css/topics.css";
import "../css/modeltest.css";

const EMPTY = { name: "", duration: "90", negative_mark: "0.25", start_date: "", window_days: "5" };
const PHASE = { upcoming: ["Upcoming", "gray"], open: ["Open now", "pass"], closed: ["Ended", "gray"] };

function ModelTestsAdmin({ token, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", rows: [], min: 80, max: 100 });
    const [view, setView] = useState(null); // { type: "questions" | "results", test }
    const [form, setForm] = useState(null);
    const [editRow, setEditRow] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErr, setFieldErr] = useState({});
    const [note, setNote] = useState(null);

    // 👇 Custom Delete Modal State
    const [toDelete, setToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const unauthorized = (err) => {
        if (err.status === 401) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    const load = async () => {
        try {
            const d = getData(await apiRequest("/admin/model-tests", { token })) || {};
            setState({ loading: false, error: "", rows: d.tests || [], min: d.min || 80, max: d.max || 100 });
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
    }, []);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const openAdd = () => {
        setEditRow(null);
        setFormError("");
        setFieldErr({});
        setForm({ ...EMPTY });
    };

    const openEdit = (t) => {
        setEditRow(t);
        setFormError("");
        setFieldErr({});
        setForm({
            name: t.name,
            duration: String(t.duration),
            negative_mark: String(t.negative_mark),
            start_date: t.start_date,
            window_days: String(t.window_days),
        });
    };

    const save = async () => {
        if (!form.name.trim()) return setFormError("The test name is required.");
        if (!form.start_date) return setFormError("Please choose the start date.");

        setSaving(true);
        setFormError("");
        setFieldErr({});
        try {
            await apiRequest(editRow ? "/admin/model-tests/" + editRow.id : "/admin/model-tests", {
                method: editRow ? "PUT" : "POST",
                token,
                body: {
                    name: form.name.trim(),
                    duration: Number(form.duration),
                    negative_mark: Number(form.negative_mark),
                    start_date: form.start_date,
                    window_days: Number(form.window_days),
                },
            });
            setForm(null);
            setNote({
                type: "ok",
                text: editRow ? "Model test updated." : "Model test created. Now add 80 to 100 questions, then turn it On.",
            });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFieldErr(err.errors || {});
            setFormError(err.message);
        }
        setSaving(false);
    };

    const toggle = async (t) => {
        try {
            await apiRequest("/admin/model-tests/" + t.id + "/active", { method: "PUT", token, body: { active: !t.active } });
            setNote({ type: "ok", text: t.active ? "Turned Off. Students cannot see it now." : "Turned On. Students can see it." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    // 👇 Modal Open & Delete Logic
    const openDelete = (t) => {
        setDeleteError("");
        setToDelete(t);
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
            await apiRequest("/admin/model-tests/" + toDelete.id, { method: "DELETE", token });
            setToDelete(null);
            setNote({ type: "ok", text: "Model test deleted." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setDeleteError(err.message || "Could not delete this model test.");
        }
        setDeleting(false);
    };

    const firstError = (key) => (fieldErr[key] && fieldErr[key][0] ? fieldErr[key][0] : "");

    // 👇 Results অথবা Questions ভিউ রেন্ডার
    if (view && view.type === "questions" && view.test) {
        return (
            <ModelTestQuestions
                test={view.test}
                token={token}
                onUnauthorized={onUnauthorized}
                onBack={() => {
                    setView(null);
                    load();
                }}
            />
        );
    }
    
    if (view && view.type === "results" && view.test) {
        return (
            <ModelTestResults 
                test={view.test} 
                token={token} 
                onUnauthorized={onUnauthorized} 
                onBack={() => setView(null)} 
            />
        );
    }

    const lockedEdit = !!(editRow && editRow.started_count > 0);
    const endPreview = form && form.start_date && Number(form.window_days) > 0 ? addDays(form.start_date, Number(form.window_days) - 1) : "";
    const publishPreview = form && form.start_date && Number(form.window_days) > 0 ? addDays(form.start_date, Number(form.window_days)) : "";

    return (
        <>
            <div className="adm-top">
                <div>
                    <h2>Model tests</h2>
                    <p>
                        Each test has {state.min} to {state.max} questions, a fixed start date and an exam period (default 5 days). Marks are shown to students after the period ends.
                    </p>
                </div>
                <button type="button" className="btn" onClick={openAdd}>＋ New model test</button>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.rows.length === 0 ? (
                    <p className="adm-muted">No model test yet. Click "New model test".</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>Test</th>
                                    <th>Exam period</th>
                                    <th>Questions</th>
                                    <th>Taken</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((t) => {
                                    const inRange = t.questions_count >= state.min && t.questions_count <= state.max;
                                    const ph = PHASE[t.phase] || PHASE.upcoming;
                                    return (
                                        <tr key={t.id}>
                                            <td>
                                                <b>{t.name}</b>
                                                <br />
                                                <small className="adm-muted">{t.duration} min · −{t.negative_mark} per wrong</small>
                                            </td>
                                            <td>
                                                {fmtDate(t.start_date)} → {fmtDate(t.end_date)}
                                                <br />
                                                <small className="adm-muted">{t.window_days} day(s) · marks on {fmtDate(t.publish_on)}</small>
                                            </td>
                                            <td>
                                                <span className={"mt-prog " + (inRange ? "ok" : "no")}>
                                                    {t.questions_count} / {state.min}–{state.max}
                                                </span>
                                            </td>
                                            <td>
                                                {t.submitted_count}
                                                {t.started_count > t.submitted_count ? " (+" + (t.started_count - t.submitted_count) + " running)" : ""}
                                            </td>
                                            <td>
                                                <span className={"badge " + (t.active ? "pass" : "gray")}>{t.active ? "On" : "Off"}</span>{" "}
                                                <span className={"badge " + ph[1]}>{ph[0]}</span>
                                            </td>
                                            <td>
                                                <div className="tp-actions">
                                                    <button type="button" className="btn sm" onClick={() => toggle(t)}>{t.active ? "Turn Off" : "Turn On"}</button>
                                                    <button type="button" className="btn ghost sm" onClick={() => setView({ type: "questions", test: t })}>Questions</button>
                                                    <button type="button" className="btn ghost sm" onClick={() => setView({ type: "results", test: t })}>Results</button>
                                                    <button type="button" className="btn ghost sm" onClick={() => openEdit(t)}>Edit</button>
                                                    <button type="button" className="btn bad sm" onClick={() => openDelete(t)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {form && (
                <div className="tp-overlay" onClick={() => !saving && setForm(null)}>
                    <div className="tp-modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>{editRow ? "Edit model test" : "New model test"}</h3>

                        {formError && <div className="adm-note bad">{formError}</div>}
                        {lockedEdit && (
                            <div className="mt-help">Students have already started this test, so the duration and negative mark are locked.</div>
                        )}

                        <label className="tp-field">
                            <span>Exam name *</span>
                            <input className="tp-input" value={form.name} maxLength={150} onChange={(e) => set("name", e.target.value)} placeholder="e.g. BCS Model Test 05" />
                            {firstError("name") && <small className="tp-err">{firstError("name")}</small>}
                        </label>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Time (minutes) *</span>
                                <input className="tp-input" type="number" min="10" max="300" value={form.duration} disabled={lockedEdit} onChange={(e) => set("duration", e.target.value)} />
                                {firstError("duration") && <small className="tp-err">{firstError("duration")}</small>}
                            </label>
                            <label className="tp-field">
                                <span>Negative mark per wrong answer *</span>
                                <input className="tp-input" type="number" min="0" max="1" step="0.05" value={form.negative_mark} disabled={lockedEdit} onChange={(e) => set("negative_mark", e.target.value)} />
                                {firstError("negative_mark") && <small className="tp-err">{firstError("negative_mark")}</small>}
                            </label>
                        </div>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Start date *</span>
                                <input className="tp-input" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                                {firstError("start_date") && <small className="tp-err">{firstError("start_date")}</small>}
                            </label>
                            <label className="tp-field">
                                <span>Open for (days) *</span>
                                <input className="tp-input" type="number" min="1" max="30" value={form.window_days} onChange={(e) => set("window_days", e.target.value)} />
                                {firstError("window_days") && <small className="tp-err">{firstError("window_days")}</small>}
                            </label>
                        </div>

                        {endPreview && (
                            <div className="mt-help">
                                Students can take it from <b>{fmtDate(form.start_date)}</b> to <b>{fmtDate(endPreview)}</b>. Marks are published on <b>{fmtDate(publishPreview)}</b>.
                                <br />
                                Each correct answer = 1 mark. Each wrong answer = −{form.negative_mark || 0}. Unanswered = 0.
                            </div>
                        )}

                        <div className="tp-foot">
                            <button type="button" className="btn ghost" disabled={saving} onClick={() => setForm(null)}>Cancel</button>
                            <button type="button" className="btn" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============ DELETE CONFIRM MODAL ============ */}
            {toDelete && (
                <div className="mt-overlay" onClick={closeDelete}>
                    <div className="mt-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="mt-modal-icon">🗑️</div>

                        <h2 className="mt-modal-title">Delete model test?</h2>

                        <div className="mt-modal-body">
                            <p>
                                You are about to delete <b>{toDelete.name}</b>.
                            </p>
                            <ul className="mt-modal-list">
                                {toDelete.started_count > 0 ? (
                                    <li>This test has <b>{toDelete.started_count} student attempt(s)</b>. Deleting will remove the test, its questions, and ALL attempts and marks.</li>
                                ) : (
                                    <li>This will remove the test and all its questions.</li>
                                )}
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

export default ModelTestsAdmin;