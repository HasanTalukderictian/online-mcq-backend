import "../css/topics.css";

const youtubeId = (url) => {
    if (!url) return "";
    const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/);
    return m ? m[1] : "";
};

function VideoEmbed({ url, title }) {
    if (!url) return null;
    const id = youtubeId(url);

    if (id) {
        return (
            <div className="tpc-video">
                <iframe
                    src={"https://www.youtube-nocookie.com/embed/" + id}
                    title={title || "Video"}
                    loading="lazy"
                    allow="encrypted-media; picture-in-picture"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                />
            </div>
        );
    }

    return (
        <a className="tpc-vlink" href={url} target="_blank" rel="noopener noreferrer">▶ Watch video</a>
    );
}

export default VideoEmbed;