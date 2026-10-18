import { useEffect, useState } from "react";
import { apiRequest, apiUpload, apiDownload, getData } from "./api";
import "../css/topics.css";
import "../css/modeltest.css";

const blank = () => ({ question: "", options: ["", "", "", ""], answer: "", explanation: "" });
const fileMsg = (err) => (err.errors && err.errors.file && err.errors.file[0] ? err.errors.file[0] : err.message);

function ModelTestQuestions({ test, token, onBack, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", info: test, rows: [], min: 80, max: 100, locked: false });
    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [note, setNote] = useState(null);
    const [imp, setImp] = useState(null); // import dialog

    const base = "/admin/model-tests/" + test.id;

    const unauthorized = (err) => {
        if (err.status === 401) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    const load = async () => {
        try {
            const d = getData(await apiRequest(base + "/questions", { token })) || {};
            setState({
                loading: false,
                error: "",
                info: d.test || test,
                rows: d.questions || [],
                min: d.min || 80,
                max: d.max || 100,
                locked: !!d.locked,
            });
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
    }, [test.id]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
    const setOption = (i, value) => setForm((f) => ({ ...f, options: f.options.map((o, k) => (k === i ? value : o)) }));
    const filled = form ? form.options.map((o) => o.trim()).filter((o) => o !== "") : [];

    const openAdd = () => {
        setEditId(null);
        setFormError("");
        setForm(blank());
    };

    const openEdit = (q) => {
        const opts = Array.isArray(q.options) ? [...q.options] : [];
        while (opts.length < 4) opts.push("");
        setEditId(q.id);
        setFormError("");
        setForm({ question: q.question || "", options: opts, answer: q.answer || "", explanation: q.explanation || "" });
    };

    const save = async (addNext) => {
        if (!form.question.trim()) return setFormError("The question is required.");
        if (filled.length < 2) return setFormError("Add at least 2 options.");
        if (new Set(filled.map((o) => o.toLowerCase())).size !== filled.length) return setFormError("Two options are the same.");
        if (!form.answer || !filled.includes(form.answer.trim())) return setFormError("Please choose the correct answer.");

        setSaving(true);
        setFormError("");
        try {
            await apiRequest(editId ? "/admin/model-test-questions/" + editId : base + "/questions", {
                method: editId ? "PUT" : "POST",
                token,
                body: {
                    question: form.question.trim(),
                    options: filled,
                    answer: form.answer.trim(),
                    explanation: form.explanation.trim() || null,
                },
            });
            if (addNext && !editId) {
                setForm(blank());
                setNote({ type: "ok", text: "Saved. Add the next question." });
            } else {
                setForm(null);
                setNote({ type: "ok", text: editId ? "Question updated." : "Question added." });
            }
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFormError(err.message);
        }
        setSaving(false);
    };

    const remove = async (q) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await apiRequest("/admin/model-test-questions/" + q.id, { method: "DELETE", token });
            setNote({ type: "ok", text: "Question deleted." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const clearAll = async () => {
        if (!window.confirm("Delete ALL " + state.rows.length + " questions of this test? The test will be turned Off.")) return;
        try {
            await apiRequest(base + "/questions", { method: "DELETE", token });
            setNote({ type: "ok", text: "All questions deleted." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const template = async () => {
        try {
            await apiDownload("/admin/model-tests/template", token, "model-test-questions-template.xlsx");
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    /* ---- Excel import ---- */
    const sendImport = async (dry) => {
        const fd = new FormData();
        fd.append("file", imp.file);
        fd.append("dry_run", dry ? "1" : "0");
        return getData(await apiUpload(base + "/questions/import", fd, token));
    };

    const pickFile = (f) => {
        if (!f) return;
        if (!/\.(xlsx|xls|csv)$/i.test(f.name)) return setImp((i) => ({ ...i, error: "Please choose an .xlsx, .xls or .csv file." }));
        setImp((i) => ({ ...i, file: f, report: null, error: "" }));
    };

    const checkFile = async () => {
        setImp((i) => ({ ...i, busy: "check", error: "" }));
        try {
            const r = await sendImport(true);
            setImp((i) => ({ ...i, busy: "", report: r }));
        } catch (err) {
            if (unauthorized(err)) return;
            setImp((i) => ({ ...i, busy: "", error: fileMsg(err) }));
        }
    };

    const runImport = async () => {
        setImp((i) => ({ ...i, busy: "import", error: "" }));
        try {
            const r = await sendImport(false);
            setImp(null);
            setNote({ type: "ok", text: r.valid + " question(s) imported." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setImp((i) => ({ ...i, busy: "", error: fileMsg(err) }));
        }
    };

    const n = state.rows.length;
    const inRange = n >= state.min && n <= state.max;
    const full = n >= state.max;

    return (
        <>
            <div className="adm-top">
                <div>
                    <button type="button" className="btn ghost sm" onClick={onBack}>← Back to model tests</button>
                    <h2 style={{ marginTop: 10 }}>{state.info.name}</h2>
                    <p>
                        <span className={"mt-prog " + (inRange ? "ok" : "no")}>{n} / {state.min}–{state.max} questions</span>{" "}
                        {inRange ? "Ready. You can turn the test On." : "Add " + (n < state.min ? state.min - n + " more " : "") + "to reach " + state.min + " to " + state.max + " questions."}
                    </p>
                </div>
                <div className="tp-actions">
                    <button type="button" className="btn ghost" onClick={template}>⬇ Template</button>
                    <button type="button" className="btn ghost" disabled={state.locked || full} onClick={() => setImp({ file: null, report: null, busy: "", error: "" })}>⬆ Import Excel</button>
                    <button type="button" className="btn" disabled={state.locked || full} onClick={openAdd}>＋ Add question</button>
                </div>
            </div>

            {state.locked && (
                <div className="adm-note bad">Students have already started this test, so the questions are locked.</div>
            )}
            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : n === 0 ? (
                    <p className="adm-muted">No question yet. Use "Import Excel" for many questions at once, or "Add question".</p>
                ) : (
                    <>
                        <div className="adm-tbl-wrap">
                            <table className="adm-tbl">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>Question</th>
                                        <th>Options</th>
                                        <th>Answer</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {state.rows.map((q, i) => (
                                        <tr key={q.id}>
                                            <td>{i + 1}</td>
                                            <td><div className="tp-clip">{q.question}</div></td>
                                            <td>{Array.isArray(q.options) ? q.options.length : 0}</td>
                                            <td><div className="tp-clip" style={{ maxWidth: 180 }}>{q.answer}</div></td>
                                            <td>
                                                <div className="tp-actions">
                                                    <button type="button" className="btn ghost sm" disabled={state.locked} onClick={() => openEdit(q)}>Edit</button>
                                                    <button type="button" className="btn bad sm" disabled={state.locked} onClick={() => remove(q)}>Delete</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {!state.locked && (
                            <div style={{ marginTop: 14 }}>
                                <button type="button" className="btn bad sm" onClick={clearAll}>Delete all questions</button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {form && (
                <div className="tp-overlay" onClick={() => !saving && setForm(null)}>
                    <div className="tp-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>{editId ? "Edit question" : "Add question"}</h3>
                        {formError && <div className="adm-note bad">{formError}</div>}

                        <label className="tp-field">
                            <span>Question *</span>
                            <textarea className="tp-area" value={form.question} maxLength={2000} onChange={(e) => set("question", e.target.value)} />
                        </label>

                        <div className="tp-field">
                            <span>Options * (at least 2)</span>
                            {form.options.map((o, i) => (
                                <div className="tp-opt" key={i}>
                                    <b>{"ABCDEF"[i]}</b>
                                    <input className="tp-input" value={o} maxLength={255} onChange={(e) => setOption(i, e.target.value)} />
                                </div>
                            ))}
                            {form.options.length < 6 && (
                                <button type="button" className="btn ghost sm" style={{ alignSelf: "flex-start" }} onClick={() => set("options", [...form.options, ""])}>＋ Add option</button>
                            )}
                        </div>

                        <label className="tp-field">
                            <span>Correct answer *</span>
                            <select className="tp-select" value={form.answer} onChange={(e) => set("answer", e.target.value)}>
                                <option value="">Choose the correct option</option>
                                {filled.map((o, i) => (
                                    <option key={i} value={o}>{o}</option>
                                ))}
                            </select>
                        </label>

                        <label className="tp-field">
                            <span>Explanation (optional, students see it after the result)</span>
                            <textarea className="tp-area" value={form.explanation} maxLength={3000} onChange={(e) => set("explanation", e.target.value)} />
                        </label>

                        <div className="tp-foot" style={{ flexWrap: "wrap" }}>
                            <button type="button" className="btn ghost" disabled={saving} onClick={() => setForm(null)}>Cancel</button>
                            {!editId && <button type="button" className="btn ghost" disabled={saving} onClick={() => save(true)}>Save & add next</button>}
                            <button type="button" className="btn" disabled={saving} onClick={() => save(false)}>{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}

            {imp && (
                <div className="tp-overlay" onClick={() => !imp.busy && setImp(null)}>
                    <div className="tp-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>Import questions from Excel</h3>
                        <div className="mt-help">
                            Columns: <b>Question, Option A, Option B, Option C, Option D, Option E, Option F, Correct answer, Explanation</b>. Download the template to see the format. You can add up to {state.max - n} more question(s).
                        </div>

                        {imp.error && <div className="adm-note bad">{imp.error}</div>}

                        <input type="file" accept=".xlsx,.xls,.csv" onChange={(e) => { pickFile(e.target.files[0]); e.target.value = ""; }} />

                        {imp.report && (
                            <div className="mt-report">
                                <b>{imp.report.valid}</b> valid question(s) found. {imp.report.errors_count > 0 && <>{imp.report.errors_count} row(s) have a problem and will be left out.</>}
                                {imp.report.too_many && <div className="tp-err">Too many: only {imp.report.room} more question(s) fit in this test.</div>}
                                {imp.report.errors_count > 0 && (
                                    <ul className="mt-errs">
                                        {imp.report.errors.map((e, i) => (
                                            <li key={i}><b>Row {e.row}:</b> {e.message}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}

                        <div className="tp-foot" style={{ flexWrap: "wrap" }}>
                            <button type="button" className="btn ghost" disabled={!!imp.busy} onClick={() => setImp(null)}>Close</button>
                            <button type="button" className="btn ghost" disabled={!imp.file || !!imp.busy} onClick={checkFile}>{imp.busy === "check" ? "Checking..." : "1. Check file"}</button>
                            <button type="button" className="btn" disabled={!imp.report || imp.report.valid === 0 || imp.report.too_many || !!imp.busy} onClick={runImport}>
                                {imp.busy === "import" ? "Importing..." : "2. Import" + (imp.report ? " " + imp.report.valid : "")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ModelTestQuestions;