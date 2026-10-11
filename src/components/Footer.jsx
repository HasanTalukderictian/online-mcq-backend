import '../css/footer.css'

function Footer({ site }) {
    const year = new Date().getFullYear();

    return (
        <footer className="site-footer">
            <div className="site-footer-in">
                {/* Left: Brand + tagline */}
                <div className="ft-col ft-brand">
                    <h3 className="ft-logo">{site.site_name}</h3>
                    {site.site_tagline && <p className="ft-tagline">{site.site_tagline}</p>}
                    {site.footer_text && <p className="ft-desc">{site.footer_text}</p>}
                </div>

                {/* Middle: Quick contact */}
                <div className="ft-col ft-contact">
                    <h4 className="ft-title">Contact</h4>
                    <ul className="ft-list">
                        {site.contact_email && (
                            <li>
                                <a href={"mailto:" + site.contact_email}>
                                    📧 {site.contact_email}
                                </a>
                            </li>
                        )}
                        {site.contact_phone && (
                            <li>
                                <a href={"tel:" + site.contact_phone}>
                                    📞 {site.contact_phone}
                                </a>
                            </li>
                        )}
                        {!site.contact_email && !site.contact_phone && (
                            <li className="ft-muted">No contact info</li>
                        )}
                    </ul>
                </div>

                {/* Right: Dev credit */}
                <div className="ft-col ft-credit">
                    <h4 className="ft-title">Developed by</h4>
                    <a
                        className="dev-link"
                        href="https://hasan-portfilo.netlify.app/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Hasan Talukder
                    </a>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="ft-bottom">
                <span>
                    © {year} {site.site_name}. All rights reserved.
                </span>
                <span className="ft-muted">
                    Built with <span className="ft-heart">♥</span> for learners
                </span>
            </div>
        </footer>
    );
}

export default Footer;