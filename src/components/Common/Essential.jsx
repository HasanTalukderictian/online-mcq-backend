import React, { useEffect, useState } from "react";

import autofill1 from "../../assets/autofill (1).png";
import autofill3 from "../../assets/autofill (3).png";
import Applyhistory from "../../assets/Apply history.png";
import developer from "../../assets/DeveloperMood.jfif";
import fillupload from "../../assets/file upload.jfif";

import "../../css/Essential.css";

const DOWNLOAD_URL = "https://drive.google.com/file/d/1CbSg5TSpLOdMhsdU2r1kHH8MCMTkpNMf/view?usp=sharing";

const WHY = [
    { icon: "⌨️", title: "বারবার একই তথ্য টাইপ", text: "প্রতিটি আবেদনে নাম, ঠিকানা, শিক্ষাগত যোগ্যতা একই তথ্য হাতে লিখতে হয়।" },
    { icon: "❌", title: "টাইপিংয়ে ভুলের ঝুঁকি", text: "তাড়াহুড়োয় ভুল তথ্য গেলে আবেদনে সমস্যা হতে পারে।" },
    { icon: "🖼️", title: "ছবি ও সিগনেচারের সাইজ", text: "Teletalk-এর নির্দিষ্ট Format/Size মিলিয়ে ছবি বানাতে সময় লাগে।" },
    { icon: "🗂️", title: "কোথায় কবে আবেদন করেছেন", text: "অনেক চাকরিতে আবেদনের পর হিসাব রাখা কঠিন হয়ে যায়।" },
];

const FEATURES = [
    "যেকোনো সাইজের ছবি ও Signature Image-কে Teletalk-এর প্রয়োজনীয় Format/Size অনুযায়ী প্রস্তুত করে",
    "Saved Profile Information ব্যবহার করে আবেদন ফর্ম দ্রুত পূরণ করে",
    "একাধিক Profile Information সেভ করা যায়",
    "বারবার একই তথ্য টাইপ করার প্রয়োজন কমায়",
    "টাইপিংয়ের ভুল ও সময়, দুটিই কমায়",
    "কোন চাকরিতে কবে আবেদন করেছেন তার Record/History সংরক্ষণ করে",
    "সম্পূর্ণ ফ্রি ব্যবহার করা যায়",
];

const STEPS = [
    {
        title: "Extension Download করুন",
        text: "নিচের Download বাটন থেকে ফাইলটি Download করুন।",
        link: true,
    },
    {
        title: "Unzip করুন",
        text: "Download করা ZIP ফাইলটি Unzip (Extract) করে একটি Folder বানিয়ে নিন।",
    },
    {
        title: "Developer Mode চালু করুন",
        text: "Chrome-এর Extensions list-এ গিয়ে (chrome://extensions) Developer mode ON করে দিন।",
        img: developer,
        alt: "Chrome Developer mode",
    },
    {
        title: "Folder Upload করুন",
        text: "Load unpacked-এ ক্লিক করে Unzip করা Folder-টি সিলেক্ট করুন। Extension চালু হয়ে যাবে।",
        img: fillupload,
        alt: "Load unpacked folder",
    },
    {
        title: "Profile-এ তথ্য Save করুন",
        text: "প্রথমবার আবেদনের সময় প্রয়োজনীয় তথ্যগুলো Extension-এর Profile-এ একবার Save করে রাখুন।",
    },
    {
        title: "Autofill ব্যবহার করুন",
        text: "পরের যেকোনো আবেদনে Saved Profile দিয়ে ফর্ম পূরণ করুন, আর ছবি ও Signature প্রস্তুত করে নিন।",
    },
];

const SHOTS = [
    { src: autofill1, caption: "Autofill" },
    { src: autofill3, caption: "Autofill Profile" },
    { src: Applyhistory, caption: "Apply History" },
];

const Essential = ({ onBack }) => {
    const [zoom, setZoom] = useState("");

    useEffect(() => {
        if (!zoom) return undefined;
        const onKey = (e) => {
            if (e.key === "Escape") setZoom("");
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [zoom]);

    return (
        <section className="es-wrap">
            <header className="es-head">
                <span className="eyebrow">Study material</span>
                <h1>Essential Tools</h1>
                <p>Useful tools and resources to help you prepare for your exams.</p>
            </header>

            {/* Hero */}
            <div className="es-card es-hero">
                <div className="es-hero-top">
                    <span className="es-ico" aria-hidden="true">🧩</span>
                    <div>
                        <h2>Job Apply Autofill Extension</h2>
                        <div className="es-badges">
                            <span className="es-badge">Chrome Extension</span>
                            <span className="es-badge ok">100% Free</span>
                            <span className="es-badge">Teletalk Jobs</span>
                        </div>
                    </div>
                </div>
                <p className="es-lead">
                    সরকারি চাকরির অনলাইন আবেদন প্রক্রিয়াকে আরও সহজ ও দ্রুত করার জন্য তৈরি। বিশেষ করে Teletalk-এর সরকারি চাকরির
                    ওয়েবসাইটগুলোতে আবেদন করার সময় অনেকটাই সহযোগিতা করবে।
                </p>
                <div className="es-actions">
                    <a className="btn" href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                        ⬇ Download Extension
                    </a>
                    <a className="btn ghost" href="#es-how">কীভাবে ব্যবহার করবেন</a>
                </div>
            </div>

            {/* Why */}
            <div className="es-block">
                <h2>একজন Job Candidate-এর কেন দরকার</h2>
                <div className="es-why">
                    {WHY.map((w) => (
                        <div className="es-card es-why-item" key={w.title}>
                            <span className="es-why-ico" aria-hidden="true">{w.icon}</span>
                            <h3>{w.title}</h3>
                            <p>{w.text}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Features */}
            <div className="es-block">
                <h2>Features</h2>
                <div className="es-card">
                    <ul className="es-feat">
                        {FEATURES.map((f) => (
                            <li key={f}>
                                <span className="es-tick" aria-hidden="true">✅</span>
                                <span>{f}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Screenshots */}
            <div className="es-block">
                <h2>Screenshots</h2>
                <div className="es-shots">
                    {SHOTS.map((s) => (
                        <button type="button" className="es-shot" key={s.caption} onClick={() => setZoom(s.src)} aria-label={"Open " + s.caption}>
                            <img src={s.src} alt={s.caption} loading="lazy" />
                            <span>{s.caption}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* How to use */}
            <div className="es-block" id="es-how">
                <h2>কীভাবে ব্যবহার করবেন</h2>
                <ol className="es-steps">
                    {STEPS.map((s, i) => (
                        <li className="es-card es-step" key={s.title}>
                            <span className="es-num">{i + 1}</span>
                            <div className="es-step-body">
                                <h3>{s.title}</h3>
                                <p>{s.text}</p>
                                {s.link && (
                                    <a className="btn sm" href={DOWNLOAD_URL} target="_blank" rel="noopener noreferrer">
                                        ⬇ Download Extension
                                    </a>
                                )}
                                {s.img && (
                                    <button type="button" className="es-step-img" onClick={() => setZoom(s.img)} aria-label={"Open " + s.alt}>
                                        <img src={s.img} alt={s.alt} loading="lazy" />
                                    </button>
                                )}
                            </div>
                        </li>
                    ))}
                </ol>
            </div>

           

            {zoom && (
                <div className="es-zoom" onClick={() => setZoom("")} role="dialog" aria-modal="true" aria-label="Screenshot">
                    <button type="button" className="es-zoom-x" onClick={() => setZoom("")} aria-label="Close">✕</button>
                    <img src={zoom} alt="Screenshot" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </section>
    );
};

export default Essential;