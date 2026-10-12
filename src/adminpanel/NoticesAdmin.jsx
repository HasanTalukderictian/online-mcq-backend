import { useEffect, useState } from "react";
import { apiRequest, getData } from "./api";
import { fmtDate, todayStr } from "../utils/dates";
import "../css/topics.css";

const EMPTY = { text: "", link_url: "", start_date: "", end_date: "", sort_order: "", active: true };

// Live / Scheduled / Expired / Hidden
function statusOf(n, today) {
    if (!n.active) return { label: "Hidden", cls: "gray" };
    if (n.start_date && n.start_date > today) return { label: "Scheduled", cls: "gray" };
    if (n.end_date && n.end_date < today) return { label: "Expired", cls: "gray" };
    return { label: "Live", cls: "pass" };
}

function NoticesAdmin({ token, onUnauthorized }) {
    const [state, setState] = useState({ loading: true, error: "", rows: [] });
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
            const d = getData(await apiRequest("/notices", { token })) || {};
            setState({ loading: false, error: "", rows: d.notices || [] });
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
        setEditId(null);
        setFormError("");
        setFieldErr({});
        setForm({ ...EMPTY });
    };

    const openEdit = (n) => {
        setEditId(n.id);
        setFormError("");
        setFieldErr({});
        setForm({
            text: n.text || "",
            link_url: n.link_url || "",
            start_date: n.start_date || "",
            end_date: n.end_date || "",
            sort_order: n.sort_order === null || n.sort_order === undefined ? "" : String(n.sort_order),
            active: !!n.active,
        });
    };

    const bodyOf = (f) => ({
        text: f.text.trim(),
        link_url: f.link_url.trim() || null,
        start_date: f.start_date || null,
        end_date: f.end_date || null,
        sort_order: f.sort_order === "" || f.sort_order === null ? null : Number(f.sort_order),
        active: !!f.active,
    });

    const save = async () => {
        if (!form.text.trim()) {
            setFormError("The notice text is required.");
            return;
        }
        if (form.start_date && form.end_date && form.end_date < form.start_date) {
            setFormError("The end date cannot be before the start date.");
            return;
        }

        setSaving(true);
        setFormError("");
        setFieldErr({});
        try {
            await apiRequest(editId ? "/notices/" + editId : "/notices", {
                method: editId ? "PUT" : "POST",
                token,
                body: bodyOf(form),
            });
            setForm(null);
            setNote({ type: "ok", text: editId ? "Notice updated." : "Notice added." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFieldErr(err.errors || {});
            setFormError(err.message);
        }
        setSaving(false);
    };

    const toggle = async (n) => {
        try {
            await apiRequest("/notices/" + n.id, {
                method: "PUT",
                token,
                body: bodyOf({
                    text: n.text,
                    link_url: n.link_url || "",
                    start_date: n.start_date || "",
                    end_date: n.end_date || "",
                    sort_order: n.sort_order,
                    active: !n.active,
                }),
            });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const remove = async (n) => {
        if (!window.confirm("Delete this notice?")) return;
        try {
            await apiRequest("/notices/" + n.id, { method: "DELETE", token });
            setNote({ type: "ok", text: "Notice deleted." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const firstError = (key) => (fieldErr[key] && fieldErr[key][0] ? fieldErr[key][0] : "");
    const today = todayStr();

    return (
        <>
            <div className="adm-top">
                <div>
                    <h2>Notices</h2>
                    <p>These notices scroll in a line just below the banner on the landing page.</p>
                </div>
                <button type="button" className="btn" onClick={openAdd}>＋ Add notice</button>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.rows.length === 0 ? (
                    <p className="adm-muted">No notice yet. The notice line stays hidden until you add one.</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Notice</th>
                                    <th>From</th>
                                    <th>Until</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((n) => {
                                    const st = statusOf(n, today);
                                    return (
                                        <tr key={n.id}>
                                            <td>{n.sort_order}</td>
                                            <td>
                                                <div className="tp-clip">{n.text}</div>
                                                {n.link_url && <small className="adm-muted">🔗 has link</small>}
                                            </td>
                                            <td>{n.start_date ? fmtDate(n.start_date) : "-"}</td>
                                            <td>{n.end_date ? fmtDate(n.end_date) : "-"}</td>
                                            <td><span className={"badge " + st.cls}>{st.label}</span></td>
                                            <td>
                                                <div className="tp-actions">
                                                    <button type="button" className="btn ghost sm" onClick={() => toggle(n)}>{n.active ? "Hide" : "Show"}</button>
                                                    <button type="button" className="btn ghost sm" onClick={() => openEdit(n)}>Edit</button>
                                                    <button type="button" className="btn bad sm" onClick={() => remove(n)}>Delete</button>
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
                        <h3>{editId ? "Edit notice" : "Add notice"}</h3>

                        {formError && <div className="adm-note bad">{formError}</div>}

                        <label className="tp-field">
                            <span>Notice text * ({form.text.length}/300)</span>
                            <textarea
                                className="tp-area"
                                value={form.text}
                                maxLength={300}
                                onChange={(e) => set("text", e.target.value)}
                                placeholder="e.g. Exam routine published. Check your Student Panel."
                            />
                            {firstError("text") && <small className="tp-err">{firstError("text")}</small>}
                        </label>

                        <label className="tp-field">
                            <span>Link (optional, opens when the notice is clicked)</span>
                            <input className="tp-input" value={form.link_url} onChange={(e) => set("link_url", e.target.value)} placeholder="https://..." />
                            {firstError("link_url") && <small className="tp-err">{firstError("link_url")}</small>}
                        </label>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Show from (optional)</span>
                                <input className="tp-input" type="date" value={form.start_date} onChange={(e) => set("start_date", e.target.value)} />
                                {firstError("start_date") && <small className="tp-err">{firstError("start_date")}</small>}
                            </label>
                            <label className="tp-field">
                                <span>Show until (optional)</span>
                                <input className="tp-input" type="date" value={form.end_date} onChange={(e) => set("end_date", e.target.value)} />
                                {firstError("end_date") && <small className="tp-err">{firstError("end_date")}</small>}
                            </label>
                        </div>

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

export default NoticesAdmin;