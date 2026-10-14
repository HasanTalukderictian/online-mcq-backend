import { useEffect, useState } from "react";
import { apiRequest, getData, apiUpload } from "./api";
import "../css/topics.css";

const EMPTY = {
    name: "",
    role: "",
    bio: "",
    photo_url: "",
    photo: null,          // File object (only when user picks a new file)
    photoPreview: "",     // local blob URL or existing remote URL
    linkedin_url: "",
    github_url: "",
    website_url: "",
    speech: "",
    is_speaker: false,
    sort_order: "",
    active: true,
};

const initials = (name) =>
    String(name || "?")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((w) => w.charAt(0).toUpperCase())
        .join("");

function TeamAdmin({ token, onUnauthorized }) {
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
            const d = getData(await apiRequest("/team-members", { token })) || {};
            setState({ loading: false, error: "", rows: d.members || [] });
        } catch (err) {
            if (unauthorized(err)) return;
            setState((s) => ({ ...s, loading: false, error: err.message }));
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Revoke blob preview URL when it changes / unmounts
    useEffect(() => {
        return () => {
            if (form?.photoPreview?.startsWith("blob:")) {
                URL.revokeObjectURL(form.photoPreview);
            }
        };
    }, [form?.photoPreview]);

    const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

    const openAdd = () => {
        setEditId(null);
        setFormError("");
        setFieldErr({});
        setForm({ ...EMPTY });
    };

    const openEdit = (m) => {
        setEditId(m.id);
        setFormError("");
        setFieldErr({});
        setForm({
            name: m.name || "",
            role: m.role || "",
            bio: m.bio || "",
            photo_url: m.photo_url || "",
            photo: null,
            photoPreview: m.photo_full_url || m.photo_url || "",
            linkedin_url: m.linkedin_url || "",
            github_url: m.github_url || "",
            website_url: m.website_url || "",
            speech: m.speech || "",
            is_speaker: !!m.is_speaker,
            sort_order:
                m.sort_order === null || m.sort_order === undefined
                    ? ""
                    : String(m.sort_order),
            active: !!m.active,
        });
    };

    const onPhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (form.photoPreview && form.photoPreview.startsWith("blob:")) {
            URL.revokeObjectURL(form.photoPreview);
        }

        setForm((f) => ({
            ...f,
            photo: file,
            photoPreview: URL.createObjectURL(file),
        }));
        setFieldErr((fe) => ({ ...fe, photo: undefined }));
    };

    const save = async () => {
        if (!form.name.trim()) {
            setFormError("The name is required.");
            return;
        }
        if (!form.role.trim()) {
            setFormError("The role is required (e.g. Software Engineer).");
            return;
        }
        if (form.is_speaker && !form.speech.trim()) {
            setFormError('"Show as speech" is ticked, so please write the speech text too.');
            return;
        }

        setSaving(true);
        setFormError("");
        setFieldErr({});

        try {
            const isEdit = !!editId;
            const endpoint = isEdit ? "/team-members/" + editId : "/team-members";
            const hasFile = !!form.photo;

            if (hasFile) {
                // ---------- multipart branch ----------
                const fd = new FormData();
                fd.append("name", form.name.trim());
                fd.append("role", form.role.trim());
                fd.append("bio", form.bio.trim());
                fd.append("photo", form.photo);
                fd.append("photo_url", form.photo_url.trim());
                fd.append("linkedin_url", form.linkedin_url.trim());
                fd.append("github_url", form.github_url.trim());
                fd.append("website_url", form.website_url.trim());
                fd.append("speech", form.speech.trim());
                fd.append("is_speaker", form.is_speaker ? "1" : "0");
                fd.append("active", form.active ? "1" : "0");
                if (form.sort_order !== "" && form.sort_order !== null) {
                    fd.append("sort_order", String(form.sort_order));
                }

                if (isEdit) {
                    // PUT + FormData is unreliable → POST with _method=PUT
                    fd.append("_method", "PUT");
                }

                await apiUpload(endpoint, fd, token);
            } else {
                // ---------- JSON branch ----------
                const body = {
                    name: form.name.trim(),
                    role: form.role.trim(),
                    bio: form.bio.trim() || null,
                    photo_url: form.photo_url.trim() || null,
                    linkedin_url: form.linkedin_url.trim() || null,
                    github_url: form.github_url.trim() || null,
                    website_url: form.website_url.trim() || null,
                    speech: form.speech.trim() || null,
                    is_speaker: !!form.is_speaker,
                    sort_order:
                        form.sort_order === "" || form.sort_order === null
                            ? null
                            : Number(form.sort_order),
                    active: !!form.active,
                };

                await apiRequest(endpoint, {
                    method: isEdit ? "PUT" : "POST",
                    token,
                    body,
                });
            }

            setForm(null);
            setNote({ type: "ok", text: isEdit ? "Member updated." : "Member added." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setFieldErr(err.errors || {});
            setFormError(err.message);
        }
        setSaving(false);
    };

    const toggle = async (m) => {
        try {
            await apiRequest("/team-members/" + m.id, {
                method: "PUT",
                token,
                body: {
                    name: m.name,
                    role: m.role,
                    bio: m.bio || null,
                    photo_url: m.photo_url || null,
                    linkedin_url: m.linkedin_url || null,
                    github_url: m.github_url || null,
                    website_url: m.website_url || null,
                    speech: m.speech || null,
                    is_speaker: !!m.is_speaker,
                    sort_order: m.sort_order ?? null,
                    active: !m.active,
                },
            });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const remove = async (m) => {
        if (!window.confirm('Delete "' + m.name + '" from the team?')) return;
        try {
            await apiRequest("/team-members/" + m.id, { method: "DELETE", token });
            setNote({ type: "ok", text: "Member deleted." });
            load();
        } catch (err) {
            if (unauthorized(err)) return;
            setNote({ type: "bad", text: err.message });
        }
    };

    const firstError = (key) =>
        fieldErr[key] && fieldErr[key][0] ? fieldErr[key][0] : "";

    return (
        <>
            <div className="adm-top">
                <div>
                    <h2>Team</h2>
                    <p>Team members and the speech shown on the About page.</p>
                </div>
                <button type="button" className="btn" onClick={openAdd}>
                    ＋ Add member
                </button>
            </div>

            {note && <div className={"adm-note " + note.type}>{note.text}</div>}
            {state.error && <div className="adm-note bad">{state.error}</div>}

            <div className="adm-card">
                {state.loading ? (
                    <p className="adm-muted">Loading...</p>
                ) : state.rows.length === 0 ? (
                    <p className="adm-muted">No member yet. Click "Add member".</p>
                ) : (
                    <div className="adm-tbl-wrap">
                        <table className="adm-tbl">
                            <thead>
                                <tr>
                                    <th>Order</th>
                                    <th>Member</th>
                                    <th>Role</th>
                                    <th>Speech</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {state.rows.map((m) => (
                                    <tr key={m.id}>
                                        <td>{m.sort_order}</td>
                                        <td>
                                            <div
                                                className="tp-person"
                                                style={{ display: "flex", alignItems: "center", gap: 10 }}
                                            >
                                                {m.photo_full_url || m.photo_url ? (
                                                    <img
                                                        src={m.photo_full_url || m.photo_url}
                                                        alt=""
                                                        loading="lazy"
                                                        referrerPolicy="no-referrer"
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            minWidth: 40,
                                                            maxWidth: 40,
                                                            borderRadius: "50%",
                                                            objectFit: "cover",
                                                            objectPosition: "center top",
                                                            flex: "none",
                                                        }}
                                                    />
                                                ) : (
                                                    <span
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            minWidth: 40,
                                                            borderRadius: "50%",
                                                            flex: "none",
                                                            display: "grid",
                                                            placeItems: "center",
                                                            background: "var(--primary)",
                                                            color: "#fff",
                                                            fontSize: 13,
                                                            fontWeight: 800,
                                                        }}
                                                    >
                                                        {initials(m.name)}
                                                    </span>
                                                )}
                                                <b>{m.name}</b>
                                            </div>
                                        </td>
                                        <td>{m.role}</td>
                                        <td>{m.is_speaker ? "🎤 Shown" : "-"}</td>
                                        <td>
                                            <span
                                                className={
                                                    "badge " + (m.active ? "pass" : "gray")
                                                }
                                            >
                                                {m.active ? "Shown" : "Hidden"}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="tp-actions">
                                                <button
                                                    type="button"
                                                    className="btn ghost sm"
                                                    onClick={() => toggle(m)}
                                                >
                                                    {m.active ? "Hide" : "Show"}
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn ghost sm"
                                                    onClick={() => openEdit(m)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn bad sm"
                                                    onClick={() => remove(m)}
                                                >
                                                    Delete
                                                </button>
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
                    <div
                        className="tp-modal wide"
                        role="dialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3>{editId ? "Edit member" : "Add member"}</h3>

                        {formError && <div className="adm-note bad">{formError}</div>}

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Name *</span>
                                <input
                                    className="tp-input"
                                    value={form.name}
                                    maxLength={100}
                                    onChange={(e) => set("name", e.target.value)}
                                />
                                {firstError("name") && (
                                    <small className="tp-err">{firstError("name")}</small>
                                )}
                            </label>
                            <label className="tp-field">
                                <span>Role *</span>
                                <input
                                    className="tp-input"
                                    value={form.role}
                                    maxLength={100}
                                    onChange={(e) => set("role", e.target.value)}
                                    placeholder="e.g. Software Engineer"
                                />
                                {firstError("role") && (
                                    <small className="tp-err">{firstError("role")}</small>
                                )}
                            </label>
                        </div>

                        <label className="tp-field">
                            <span>Short bio ({form.bio.length}/600)</span>
                            <textarea
                                className="tp-area"
                                value={form.bio}
                                maxLength={600}
                                onChange={(e) => set("bio", e.target.value)}
                            />
                        </label>

                        <div className="tp-field">
                            <span>Photo (JPG / PNG / WebP, max 2 MB)</span>

                            <div className="tp-photo-row">
                                {form.photoPreview ? (
                                    <img
                                        className="tp-photo-preview"
                                        src={form.photoPreview}
                                        alt=""
                                    />
                                ) : (
                                    <div className="tp-photo-preview tp-photo-empty">
                                        {initials(form.name)}
                                    </div>
                                )}

                                <input
                                    className="tp-input"
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={onPhotoChange}
                                />
                            </div>

                            {form.photo && (
                                <small className="tp-muted">
                                    New file: {form.photo.name} (
                                    {(form.photo.size / 1024).toFixed(0)} KB)
                                </small>
                            )}

                            {firstError("photo") && (
                                <small className="tp-err">{firstError("photo")}</small>
                            )}

                            <span style={{ marginTop: 8, fontSize: 12 }}>
                                …or paste a URL instead:
                            </span>
                            <input
                                className="tp-input"
                                value={form.photo_url}
                                onChange={(e) => set("photo_url", e.target.value)}
                                placeholder="https://..."
                            />
                            {firstError("photo_url") && (
                                <small className="tp-err">{firstError("photo_url")}</small>
                            )}
                        </div>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>LinkedIn link</span>
                                <input
                                    className="tp-input"
                                    value={form.linkedin_url}
                                    onChange={(e) => set("linkedin_url", e.target.value)}
                                    placeholder="https://linkedin.com/in/..."
                                />
                                {firstError("linkedin_url") && (
                                    <small className="tp-err">
                                        {firstError("linkedin_url")}
                                    </small>
                                )}
                            </label>
                            <label className="tp-field">
                                <span>GitHub link</span>
                                <input
                                    className="tp-input"
                                    value={form.github_url}
                                    onChange={(e) => set("github_url", e.target.value)}
                                    placeholder="https://github.com/..."
                                />
                                {firstError("github_url") && (
                                    <small className="tp-err">
                                        {firstError("github_url")}
                                    </small>
                                )}
                            </label>
                        </div>

                        <label className="tp-field">
                            <span>Website / portfolio link</span>
                            <input
                                className="tp-input"
                                value={form.website_url}
                                onChange={(e) => set("website_url", e.target.value)}
                                placeholder="https://..."
                            />
                            {firstError("website_url") && (
                                <small className="tp-err">{firstError("website_url")}</small>
                            )}
                        </label>

                        <label className="tp-field">
                            <span>Speech ({form.speech.length}/3000)</span>
                            <textarea
                                className="tp-area tall"
                                value={form.speech}
                                maxLength={3000}
                                onChange={(e) => set("speech", e.target.value)}
                                placeholder="A message to the students (optional)"
                            />
                            {firstError("speech") && (
                                <small className="tp-err">{firstError("speech")}</small>
                            )}
                        </label>

                        <label className="tp-check">
                            <input
                                type="checkbox"
                                checked={form.is_speaker}
                                onChange={(e) => set("is_speaker", e.target.checked)}
                            />
                            <span>Show this speech at the top of the About page</span>
                        </label>

                        <div className="tp-row2">
                            <label className="tp-field">
                                <span>Order (optional)</span>
                                <input
                                    className="tp-input"
                                    type="number"
                                    min="0"
                                    value={form.sort_order}
                                    onChange={(e) => set("sort_order", e.target.value)}
                                />
                            </label>
                            <label className="tp-check">
                                <input
                                    type="checkbox"
                                    checked={form.active}
                                    onChange={(e) => set("active", e.target.checked)}
                                />
                                <span>Show on website</span>
                            </label>
                        </div>

                        <div className="tp-foot">
                            <button
                                type="button"
                                className="btn ghost"
                                disabled={saving}
                                onClick={() => setForm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn"
                                disabled={saving}
                                onClick={save}
                            >
                                {saving ? "Saving..." : "Save"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TeamAdmin;