import { useEffect, useState } from "react";
import { apiRequest, getData } from "../adminpanel/api";
import "../css/notice.css";

function Item({ n, hidden, isLast }) {
    return (
        <span className="nb-item">
            {n.link_url ? (
                <a
                    href={n.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    tabIndex={hidden ? -1 : undefined}
                >
                    {n.text}
                </a>
            ) : (
                <span>{n.text}</span>
            )}
            {!isLast && (
                <i className="nb-sep" aria-hidden="true">
                    ●
                </i>
            )}
        </span>
    );
}

function NoticeBar() {
    const [items, setItems] = useState([]);
    const [paused, setPaused] = useState(false);

    useEffect(() => {
        let alive = true;
        apiRequest("/public/notices")
            .then((b) => {
                const d = getData(b) || {};
                if (alive && Array.isArray(d.notices)) setItems(d.notices);
            })
            .catch(() => {});
        return () => {
            alive = false;
        };
    }, []);

    if (!items.length) return null;

    // longer text = longer time, so the speed feels the same
    const chars = items.reduce((sum, n) => sum + n.text.length, 0);
    const seconds = Math.max(20, Math.round(chars * 0.22));

    return (
        <section className="nb" aria-label="Notices">
            <div className="nb-in">
                <span className="nb-label">
                    <span aria-hidden="true">📢</span>
                    <b>Notice</b>
                </span>

                <div className="nb-view">
                    <div
                        className={"nb-track" + (paused ? " paused" : "")}
                        style={{ animationDuration: seconds + "s" }}
                    >
                        <div className="nb-group">
                            {items.map((n, i) => (
                                <Item
                                    key={n.id}
                                    n={n}
                                    isLast={i === items.length - 1}
                                />
                            ))}
                        </div>
                        <div className="nb-group" aria-hidden="true">
                            {items.map((n, i) => (
                                <Item
                                    key={"c" + n.id}
                                    n={n}
                                    hidden
                                    isLast={i === items.length - 1}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    type="button"
                    className="nb-toggle"
                    onClick={() => setPaused(!paused)}
                    aria-label={
                        paused ? "Resume scrolling notices" : "Pause scrolling notices"
                    }
                    title={paused ? "Play" : "Pause"}
                >
                    {paused ? "▶" : "⏸"}
                </button>
            </div>
        </section>
    );
}

export default NoticeBar;