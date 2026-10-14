import { useMemo } from "react";

// Priority order: ei subject gula sobar age dekhabe
const PRIORITY_SUBJECTS = [
    "Bangla Literature",
    "Bangla Grammar",
    "English Literature",
    "English Grammar",
    "Mental Ability",
    "General Math",
];

const normalize = (str) => (str || "").trim().toLowerCase();

const PRIORITY_INDEX = new Map(
    PRIORITY_SUBJECTS.map((name, i) => [normalize(name), i])
);

function sortSubjects(subjects) {
    return [...subjects].sort((a, b) => {
        const ai = PRIORITY_INDEX.has(normalize(a.name))
            ? PRIORITY_INDEX.get(normalize(a.name))
            : Infinity;
        const bi = PRIORITY_INDEX.has(normalize(b.name))
            ? PRIORITY_INDEX.get(normalize(b.name))
            : Infinity;

        // Dui tai priority list e thakle list er order e
        if (ai !== bi) return ai - bi;

        // Baki gula (IT etc.) alphabetically
        return (a.name || "").localeCompare(b.name || "");
    });
}

function SubjectShowcase({ subjects, loading, error, stats, onPick }) {
    // Hook ta shob somoy early return er upore thakte hobe
    const sortedSubjects = useMemo(() => sortSubjects(subjects || []), [subjects]);

    // StartScreen already shows the error message
    if (error) return null;
    if (!loading && !sortedSubjects.length) return null;

    let sub = "Loading the latest exams...";
    if (stats) {
        sub =
            stats.exams + " exams and " + stats.questions.toLocaleString() + " questions are ready. " +
            stats.attempts.toLocaleString() + " exams have been taken so far.";
    }

    return (
        <section className="subj-sec" id="subjects-showcase">
            <div className="feat-head">
                <span className="eyebrow">Explore subjects</span>
                <h2>Pick a subject and start practising</h2>
                <p>{sub}</p>
            </div>

            <div className="subj-grid">
                {loading && !sortedSubjects.length
                    ? [0, 1, 2, 3].map((i) => <div className="skel" key={i} />)
                    : sortedSubjects.map((s) => (
                          <button
                              type="button"
                              key={s.id}
                              className="subj-card"
                              style={{ "--c": s.color }}
                              onClick={() => onPick(s.id)}
                          >
                              <span className="subj-ico">{s.icon}</span>
                              <b>{s.name}</b>
                              <small>
                                  {s.exams_count} {s.exams_count === 1 ? "exam" : "exams"} · {s.questions_count.toLocaleString()} questions
                              </small>
                              <span className="subj-go">View exams →</span>
                          </button>
                      ))}
            </div>
        </section>
    );
}

export default SubjectShowcase;