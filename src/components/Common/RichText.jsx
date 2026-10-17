import "../../css/richtext.css";

// ==highlighted text==  and  **bold text**
const TOKEN = /(==[^=]+?==|\*\*[^*]+?\*\*)/;

function RichText({ text, className }) {
    const parts = String(text || "").split(TOKEN);

    return (
        <div className={"rt" + (className ? " " + className : "")}>
            {parts.map((p, i) => {
                if (p.length > 4 && p.startsWith("==") && p.endsWith("==")) {
                    return <mark key={i}>{p.slice(2, -2)}</mark>;
                }
                if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) {
                    return <strong key={i}>{p.slice(2, -2)}</strong>;
                }
                return p;
            })}
        </div>
    );
}

export default RichText;