import { useEffect, useState } from "react";
import { apiRequest, getData } from "../adminpanel/api";
import "../css/modeltestsection.css";

function ModelTestSection({ token, onParticipate }) {
    const [state, setState] = useState({ loading: true, error: false, tests: [] });

    useEffect(() => {
        let alive = true;
        apiRequest("/public/model-tests", { token })
            .then((b) => {
                const d = getData(b) || {};
                if (alive) setState({ loading: false, error: false, tests: d.tests || [] });
            })
            .catch(() => alive && setState({ loading: false, error: true, tests: [] }));
        return () => { alive = false; };
    }, [token]);

    const { loading, error, tests } = state;
    const running = tests.filter((t) => t.phase === "open");
    const upcoming = tests.filter((t) => t.phase === "upcoming");
    const total = tests.length;
    const hasRunning = running.length > 0;

    let headline;
    let sub;
    if (loading) {
        headline = "Loading model tests...";
        sub = "";
    } else if (error) {
        headline = "Model tests are available";
        sub = "Open the Model Test page to see the latest schedule.";
    } else if (hasRunning) {
        headline = "A model test is running right now!";
        sub = "Join now, take the test once, and see where you stand among all participants.";
    } else if (upcoming.length) {
        headline = "Next model test is coming soon";
        sub = "Check the schedule and get ready for the real exam experience.";
    } else {
        headline = "New model tests will be announced soon";
        sub = "Stay tuned for full-length tests with negative marking.";
    }

    return (
        <section className="mts">
            <div className="mts-glow" aria-hidden="true" />

            <div className="mts-main">
                <span className="mts-eyebrow">
                    {hasRunning && <i className="mts-dot" />}
                    🏅 Model Test
                </span>

                <h2 className="mts-title">{headline}</h2>
                {sub && <p className="mts-sub">{sub}</p>}

                {!loading && !error && (
                    <div className="mts-info">
                        <div className="mts-chip">
                            <small>Current running</small>
                            <b>
                                {hasRunning
                                    ? running.map((t) => t.name).join(", ")
                                    : "No test running"}
                            </b>
                        </div>
                        <div className="mts-chip">
                            <small>Total model tests</small>
                            <b>{total}</b>
                        </div>
                    </div>
                )}
            </div>

            <div className="mts-side">
                <button type="button" className="mts-btn" onClick={onParticipate}>
                    Be a participant <span aria-hidden="true">→</span>
                </button>
                <small>Marks &amp; rank published after the exam period</small>
            </div>
        </section>
    );
}

export default ModelTestSection;