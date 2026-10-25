import { useEffect, useState, useRef } from "react";
import { apiRequest, getData } from "./api";
import TopicQuestions from "./TopicQuestions";
import "../css/topics.css";

const EMPTY = { subject_id: "", title: "", description: "", video_url: "", sort_order: "", active: true };

function Topics({ token, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", topics: [], subjects: [] });
    const [subjectFilter, setSubjectFilter] = useState("");
    const [form, setForm] = useState(null);
    const [editId, setEditId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState("");
    const [fieldErr, setFieldErr] = useState({});
    const [note, setNote] = useState(null);
    const [openTopic, setOpenTopic] = useState(null);
    
    const textareaRef = useRef(null);

    const unauthorized = (err) => {
        if (err.status === 401) {
            onUnauthorized();
            return true;
        }
        return false;
    };

    const load = async () => {
        setState((s) => ({ ...s, loading: true, error: "" }));
        try {
            const q = subjectFilter ? "?subject_id=" + subjectFilter : "";
            const d = getData(await apiRequest("/topics" + q, { token })) || {};
            setState({ loading: false, error: "", topics: d.topics || [], subjects: d.subjects || [] });
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
    }, [subjectFilter]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const openAdd = () => {
        setEditId(null);
        setFormError("");
        setFieldErr({});
        setForm({ ...EMPTY, subject_id: subjectFilter || "" });
    };

    const openEdit = (t) => {
        setEditId(t.id);
        setFormError("");
        setFieldErr({});
        setForm({
            subject_id: String(t.subject_id),
            title: t.title || "",
            description: t.description || "",
            video_url: t.video_url || "",
            sort_order: t.sort_order === null || t.sort_order === undefined ? "" : String(t.sort_order),
            active: !!t.active,
        });
    };

    const save = async () => {
        if (!form.subject_id) {
            setFormError("Please choose a subject.");
            return;
        }
        if (!form.title.trim()) {
            setFormError("Topic title is required.");
            return;
        }

        setSaving(true);
        setFormError("");
        setFieldErr({});
        const body = {
            subject_id: Number(form.subject_id),
            title: form.title.trim(),
            description: form.description.trim() || null,
            video_url: form.video_url.trim() || null,
            sort_order: form.sort_order === "" ? null : Number(form.sort_order),
            active: !!form.active,
        };

        try {
            await apiRequest(editId ? "/topics/" + editId : "/topics", {
                method: editId ? "PUT" : "POST",
                token,
                body,
            });
            setForm(null);
            setNote({ type: "ok", text: editId ? "Topic updated." : "Topic added." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFieldErr(err.errors || {});
            setFormError(err.message);
        }
        setSaving(false);
    };

    const remove = async (t) => {
        if (!window.confirm('Delete "' + t.title + '" and its ' + t.questions_count + " question(s)?")) return;
        try {
            await apiRequest("/topics/" + t.id, { method: "DELETE", token });
            setNote({ type: "ok", text: "Topic deleted." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const firstError = (key) => (fieldErr[key] && fieldErr[key][0] ? fieldErr[key][0] : "");

    // Helper function to inject HTML tags via toolbar
    const insertTag = (startTag, endTag = "") => {
        const el = textareaRef.current;
        if (!el) return;
        const start = el.selectionStart;
        const end = el.selectionEnd;
        const text = el.value;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end, text.length);
        
        const newValue = before + startTag + selected + endTag + after;
        set("description", newValue);
        
        // Refocus and set cursor
        setTimeout(() => {
            el.focus();
            el.setSelectionRange(start + startTag.length, end + startTag.length);
        }, 0);
    };

    if (openTopic) {
        return (
            <TopicQuestions
                topic={openTopic}
                token={token}
                onUnauthorized={onUnauthorized}
                onBack={() => {
                    setOpenTopic(null);
                    load();
                }}
            />
        );
    }

    return (
        <>
            <div className="adm-top">
                <div>
                    <h2>Important topics</h2>
                    <p>Add important topics under a subject, then add previous year questions, solutions and videos.</p>
                </div>
                <button type="button" className="btn" onClick={openAdd}>＋ Add topic</button>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                <div className="tp-bar">
                    <select className="tp-select" value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)}>
                        <option value="">All subjects</option>
                        {state.subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                        ))}
                    </select>
                    <span className="adm-muted">{state.topics.length} topic(s)</span>
                </div>

                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.topics.length === 0 ? (
                    <p className="adm-muted">No topic yet. Click "Add topic" to create the first one.</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>Subject</th>
                                    <th>Topic</th>
                                    <th>Questions</th>
                                    <th>Video</th>
                                    <th>Order</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.topics.map((t) => (
                                    <tr key={t.id}>
                                        <td>{t.subject ? t.subject.icon + " " + t.subject.name : "-"}</td>
                                        <td><b>{t.title}</b></td>
                                        <td>{t.questions_count}</td>
                                        <td>{t.video_url ? "🎥" : "-"}</td>
                                        <td>{t.sort_order}</td>
                                        <td>
                                            <span className={"badge " + (t.active ? "pass" : "gray")}>{t.active ? "Active" : "Hidden"}</span>
                                        </td>
                                        <td>
                                            <div className="tp-actions">
                                                <button type="button" className="btn sm" onClick={() => setOpenTopic(t)}>Questions</button>
                                                <button type="button" className="btn ghost sm" onClick={() => openEdit(t)}>Edit</button>
                                                <button type="button" className="btn bad sm" onClick={() => remove(t)}>Delete</button>
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
                        <h3>{editId ? "Edit topic" : "Add topic"}</h3>

                        {formError && <div className="adm-note bad">{formError}</div>}

                        <label className="tp-field">
                            <span>Subject *</span>
                            <select className="tp-select" value={form.subject_id} onChange={(e) => set("subject_id", e.target.value)}>
                                <option value="">Choose a subject</option>
                                {state.subjects.map((s) => (
                                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                                ))}
                            </select>
                            {firstError("subject_id") && <small className="tp-err">{firstError("subject_id")}</small>}
                        </label>

                        <label className="tp-field">
                            <span>Topic title *</span>
                            <input className="tp-input" value={form.title} maxLength={150} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Number System" />
                            {firstError("title") && <small className="tp-err">{firstError("title")}</small>}
                        </label>

                        <div className="tp-field">
                            <span>Description (Rich Text) *</span>
                            {/* Rich Text Toolbar */}
                            <div className="tp-toolbar">
                                <button type="button" onClick={() => insertTag("<b>", "</b>")} title="Bold"><b>B</b></button>
                                <button type="button" onClick={() => insertTag("<i>", "</i>")} title="Italic"><i>I</i></button>
                                <button type="button" onClick={() => insertTag("<h3>", "</h3>")} title="Heading">H3</button>
                                <button type="button" onClick={() => insertTag("<ul>\n  <li>", "</li>\n</ul>")} title="Bullet List">• List</button>
                                <button type="button" onClick={() => insertTag("<p>", "</p>")} title="Paragraph">¶</button>
                                <button type="button" onClick={() => insertTag("\n")} title="Line Break">↵</button>
                            </div>
                            <textarea 
                                ref={textareaRef}
                                className="tp-area tall" 
                                value={form.description} 
                                onChange={(e) => set("description", e.target.value)} 
                                placeholder="Write content here. Use toolbar for bold, lists, etc."
                            />
                        </div>

                        <label className="tp-field">
                            <span>Topic video URL (optional)</span>
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

export default Topics;