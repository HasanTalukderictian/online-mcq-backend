import { useEffect, useState } from "react";
import { apiRequest, getData } from "./api";
import "../css/topics.css";

const blank = () => ({
    question: "",
    options: ["", "", "", ""],
    answer: "",
    solution: "",
    video_url: "",
    source: "",
    year: "",
    sort_order: "",
    active: true,
});

function TopicQuestions({ topic, token, onBack, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", info: topic, questions: [] });
    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErr, setFieldErr] = useState({});
    const [note, setNote] = useState(null);

    const unauthorized = (err) => {
        if (err.status === 401) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    const load = async () => {
        try {
            const d = getData(await apiRequest("/topic-questions?topic_id=" + topic.id, { token })) || {};
            setState({ loading: false, error: "", info: d.topic || topic, questions: d.questions || [] });
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
    }, [topic.id]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));
    const setOption = (i, value) => setForm((f) => ({ ...f, options: f.options.map((o, k) => (k === i ? value : o)) }));

    const openAdd = () => {
        setEditId(null);
        setFormError("");
        setFieldErr({});
        setForm(blank());
    };

    const openEdit = (q) => {
        const opts = Array.isArray(q.options) ? [...q.options] : [];
        while (opts.length < 4) opts.push("");
        setEditId(q.id);
        setFormError("");
        setFieldErr({});
        setForm({
            question: q.question || "",
            options: opts,
            answer: q.answer || "",
            solution: q.solution || "",
            video_url: q.video_url || "",
            source: q.source || "",
            year: q.year ? String(q.year) : "",
            sort_order: q.sort_order === null || q.sort_order === undefined ? "" : String(q.sort_order),
            active: !!q.active,
        });
    };

    const filled = form ? form.options.map((o) => o.trim()).filter((o) => o !== "") : [];
    const hasOptions = filled.length >= 2;

    const save = async () => {
        if (!form.question.trim()) {
            setFormError("The question is required.");
            return;
        }
        if (filled.length === 1) {
            setFormError("Add at least 2 options, or leave all options empty for a written question.");
            return;
        }
        if (hasOptions && form.answer && !filled.includes(form.answer.trim())) {
            setFormError("The selected answer is not one of the options. Please choose the answer again.");
            return;
        }

        setSaving(true);
        setFormError("");
        setFieldErr({});

        const body = {
            question: form.question.trim(),
            options: hasOptions ? filled : [],
            answer: form.answer.trim() || null,
            solution: form.solution.trim() || null,
            video_url: form.video_url.trim() || null,
            source: form.source.trim() || null,
            year: form.year === "" ? null : Number(form.year),
            sort_order: form.sort_order === "" ? null : Number(form.sort_order),
            active: !!form.active,
        };
        if (!editId) body.topic_id = topic.id;

        try {
            await apiRequest(editId ? "/topic-questions/" + editId : "/topic-questions", {
                method: editId ? "PUT" : "POST",
                token,
                body,
            });
            setForm(null);
            setNote({ type: "ok", text: editId ? "Question updated." : "Question added." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFieldErr(err.errors || {});
            setFormError(err.message);
        }
        setSaving(false);
    };

    const remove = async (q) => {
        if (!window.confirm("Delete this question?")) return;
        try {
            await apiRequest("/topic-questions/" + q.id, { method: "DELETE", token });
            setNote({ type: "ok", text: "Question deleted." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const firstError = (key) => (fieldErr[key] && fieldErr[key][0] ? fieldErr[key][0] : "");
    const subjectName = state.info && state.info.subject ? state.info.subject.icon + " " + state.info.subject.name : "";

    return (
        <>
            <div className="adm-top">
                <div>
                    <button type="button" className="btn ghost sm" onClick={onBack}>← Back to topics</button>
                    <h2 style={{ marginTop: 10 }}>{state.info.title}</h2>
                    <p>{subjectName} · Previous year questions, solutions and videos</p>
                </div>
                <button type="button" className="btn" onClick={openAdd}>＋ Add question</button>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.questions.length === 0 ? (
                    <p className="adm-muted">No question yet. Click "Add question".</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Question</th>
                                    <th>Source</th>
                                    <th>Answer</th>
                                    <th>Solution</th>
                                    <th>Video</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.questions.map((q, i) => (
                                    <tr key={q.id}>
                                        <td>{i + 1}</td>
                                        <td><div className="tp-clip">{q.question}</div></td>
                                        <td>{[q.source, q.year].filter(Boolean).join(" · ") || "-"}</td>
                                        <td>{q.answer ? "✓" : "-"}</td>
                                        <td>{q.solution ? "✓" : "-"}</td>
                                        <td>{q.video_url ? "🎥" : "-"}</td>
                                        <td>
                                            <span className={"badge " + (q.active ? "pass" : "gray")}>{q.active ? "Active" : "Hidden"}</span>
                                        </td>
                                        <td>
                                            <div className="tp-actions">
                                                <button type="button" className="btn ghost sm" onClick={() => openEdit(q)}>Edit</button>
                                                <button type="button" className="btn bad sm" onClick={() => remove(q)}>Delete</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {form && (
                <div className="tp-overlay" onClick={() => !saving && setForm(null)}>
                    <div className="tp-modal wide" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
                        <h3>{editId ? "Edit question" : "Add question"}</h3>

                        {formError && <div className="adm-note bad">{formError}</div>}

                        <label className="tp-field">
                            <span>Question *</span>
                            <textarea className="tp-area" value={form.question} maxLength={3000} onChange={(e) => set("question", e.target.value)} />
                            {firstError("question") && <small className="tp-err">{firstError("question")}</small>}
                        </label>

                        <div className="tp-field">
                            <span>Options (optional: leave empty for a written question)</span>
                            {form.options.map((o, i) => (
                                <div className="tp-opt" key={i}>
                                    <b>{"ABCDEF"[i]}</b>
                                    <input className="tp-input" value={o} maxLength={255} onChange={(e) => setOption(i, e.target.value)} />
                                </div>
                            ))}
                            {form.options.length < 6 && (
                                <button type="button" className="btn ghost sm" onClick={() => set("options", [...form.options, ""])}>＋ Add option</button>
                            )}
                            {firstError("options") && <small className="tp-err">{firstError("options")}</small>}
                        </div>

                        <label className="tp-field">
                            <span>Correct answer</span>
                            {hasOptions ? (
                                <select className="tp-select" value={form.answer} onChange={(e) => set("answer", e.target.value)}>
                                    <option value="">No answer</option>
                                    {filled.map((o, i) => (
                                        <option key={i} value={o}>{o}</option>
                                    ))}
                                </select>
                            ) : (
                                <input className="tp-input" value={form.answer} maxLength={255} onChange={(e) => set("answer", e.target.value)} placeholder="Short answer (optional)" />
                            )}
                            {firstError("answer") && <small className="tp-err">{firstError("answer")}</small>}
                        </label>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Source (exam name)</span>
                                <input className="tp-input" value={form.source} maxLength={150} onChange={(e) => set("source", e.target.value)} placeholder="e.g. BCS 38th" />
                            </label>
                            <label className="tp-field">
                                <span>Year</span>
                                <input className="tp-input" type="number" value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2019" />
                                {firstError("year") && <small className="tp-err">{firstError("year")}</small>}
                            </label>
                        </div>

                        <label className="tp-field">
                            <span>Solution (plain text)</span>
                            <textarea className="tp-area tall" value={form.solution} maxLength={10000} onChange={(e) => set("solution", e.target.value)} />
                        </label>

                        <label className="tp-field">
                            <span>Solution video URL (optional)</span>
                            <input className="tp-input" value={form.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://www.youtube.com/watch?v=..." />
                            {firstError("video_url") && <small className="tp-err">{firstError("video_url")}</small>}
                        </label>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Order (optional)</span>
                                <input className="tp-input" type="number" min="0" value={form.sort_order} onChange={(e) => set("sort_order", e.target.value)} />
                            </label>
                            <label className="tp-check">
                                <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
                                <span>Show on website</span>
                            </label>
                        </div>

                        <div className="tp-foot">
                            <button type="button" className="btn ghost" disabled={saving} onClick={() => setForm(null)}>Cancel</button>
                            <button type="button" className="btn" disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TopicQuestions;