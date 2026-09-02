import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Home,
  Menu,
  MessageSquareText,
  X,
} from "lucide-react";

const assetRoot = "/assets/garbo-reference";

const gallery = Array.from({ length: 6 }, (_, index) => ({
  src: `${assetRoot}/gallery-0${index + 1}.jpg`,
  alt: `Luxury clear shot glass product view ${index + 1}`,
}));

const categories = [
  "Glass Cups",
  "Engraved Glass Cups",
  "Shot Glass",
  "Glass Mugs",
  "Glass Pitchers & Teapot",
  "Glass Decanters",
];

const summary = [
  ["Item No.", "GB070103H"],
  ["Material", "Glass, Soda-lime Glass"],
  ["Package", "12PCS/BOX"],
  ["Usage", "Beer, Tequila"],
  ["Capacity", "70ML"],
  ["Size", "51mm*88mm*34mm"],
];

const details = [
  "The shot glass cup is designed with a sturdy base to prevent tipping and enhance durability.",
  "We have various color and size of glass cup for you to choose, then the glass cup can be tailored in different colors, such as clear, amber, or smoky grey.",
  "The glass cup is perfect for various drinks, including whiskey, tequila, espresso shots, or mini desserts.",
  "The shot cup is easy to carry and store, ideal for home and professional bar settings.",
  "The minimalist yet stylish design of glass cup adds sophistication to any occasion.",
  "The factory is suitable for large orders, ensuring on-time delivery for events or commercial purposes.",
  "The factory offers excellent value for the quality, ideal for businesses and individuals.",
  "The high-quality material ensures the glass remains crystal clear over time.",
];

const specs = [
  ["Item No.", "GB070103H"],
  ["Top Dia.", "51mm"],
  ["Height", "88mm"],
  ["Bottom Dia.", "34mm"],
  ["Capacity", "70ml"],
  ["Package", "12pcs/box"],
  ["Delivery time", "Within 35 days after the sample and order are confirmed"],
  ["Certificate", "ASTM; SGS; ISO9001"],
];

function InquiryPanel({ onClose }) {
  return (
    <div className="inquiry-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="inquiry-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="icon-button inquiry-close" type="button" onClick={onClose} aria-label="Close inquiry form">
          <X size={22} />
        </button>
        <p className="panel-kicker">Request a quote</p>
        <h2 id="inquiry-title">Tell us what you need</h2>
        <p className="panel-copy">Ask about price, customization, samples, packaging, or delivery for GB070103H.</p>
        <form className="inquiry-form" onSubmit={(event) => event.preventDefault()}>
          <label>
            Name
            <input type="text" placeholder="Your name" />
          </label>
          <label>
            Work email
            <input type="email" placeholder="name@company.com" />
          </label>
          <label>
            Quantity
            <input type="text" placeholder="e.g. 5,000 pcs" />
          </label>
          <label>
            Message
            <textarea rows="5" defaultValue="I would like a quote for GB070103H." />
          </label>
          <button className="primary-action" type="submit">
            Prepare inquiry <ArrowRight size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}

export function App() {
  const [activeImage, setActiveImage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);

  function moveGallery(direction) {
    setActiveImage((current) => (current + direction + gallery.length) % gallery.length);
  }

  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a className="brand" href="#top" aria-label="Glarivo Glassware home">
            <img src={`${assetRoot}/glarivo-logo-blue.png`} alt="Glarivo Glassware" />
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="#top">Home</a>
            <a className="active" href="#product">Products</a>
            <a href="#details">Blog</a>
            <a href="#footer">About</a>
          </nav>
          <a className="catalog-link" href="#product">View catalog <ArrowRight size={17} /></a>
          <button className="mobile-menu-button" type="button" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen} aria-label="Toggle navigation">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {menuOpen ? (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <a href="#top" onClick={() => setMenuOpen(false)}>Home</a>
            <a href="#product" onClick={() => setMenuOpen(false)}>Products</a>
            <a href="#details" onClick={() => setMenuOpen(false)}>Blog</a>
            <a href="#footer" onClick={() => setMenuOpen(false)}>About</a>
          </nav>
        ) : null}
      </header>

      <main id="top">
        <section className="category-hero" aria-labelledby="category-title">
          <div className="hero-overlay" />
          <div className="hero-content">
            <h1 id="category-title">Shot Glass</h1>
            <p><Home size={16} /> <span>Home</span><ChevronRight size={15} /><span>Products</span><ChevronRight size={15} /><strong>Shot Glass</strong></p>
          </div>
        </section>

        <section className="product-shell" id="product">
          <aside className="category-sidebar" aria-label="Product categories">
            <h2>Product Categories</h2>
            <nav>
              {categories.map((category) => (
                <a key={category} className={category === "Shot Glass" ? "selected" : ""} href="#product">
                  <span>{category}</span>
                  {category.startsWith("Glass ") && category !== "Glass Cups" ? <ChevronRight size={17} /> : null}
                </a>
              ))}
            </nav>
          </aside>

          <div className="product-main">
            <div className="gallery-column">
              <div className="main-image-frame">
                <img src={gallery[activeImage].src} alt={gallery[activeImage].alt} />
                <button className="gallery-arrow previous" type="button" onClick={() => moveGallery(-1)} aria-label="Previous product image"><ChevronLeft size={29} /></button>
                <button className="gallery-arrow next" type="button" onClick={() => moveGallery(1)} aria-label="Next product image"><ChevronRight size={29} /></button>
              </div>
              <div className="thumbnail-row" aria-label="Product image thumbnails">
                {gallery.map((image, index) => (
                  <button key={image.src} className={index === activeImage ? "active" : ""} type="button" onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`}>
                    <img src={image.src} alt="" />
                  </button>
                ))}
              </div>
            </div>

            <article className="product-summary">
              <h2>Luxury shot glass cup for tequila and Vokda</h2>
              <div className="share-row" aria-label="Share product">
                <a href="#product" aria-label="Share on Facebook"><img src={`${assetRoot}/share-facebook.webp`} alt="" /></a>
                <a href="#product" aria-label="Share on X"><img src={`${assetRoot}/share-twitter.webp`} alt="" /></a>
                <a href="#product" aria-label="Share on Pinterest"><img src={`${assetRoot}/share-pinterest.webp`} alt="" /></a>
              </div>
              <dl className="summary-list">
                {summary.map(([label, value]) => (
                  <div key={label}>
                    <dt><ChevronRight size={15} fill="currentColor" />{label}:</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="product-actions">
                <button className="primary-action" type="button" onClick={() => setInquiryOpen(true)}>
                  <MessageSquareText size={19} /> Inquire now
                </button>
                <a className="secondary-action" href="#details">View details <ArrowRight size={18} /></a>
              </div>
            </article>
          </div>
        </section>

        <section className="content-shell" id="details">
          <aside className="desktop-content-aside">
            <div className="aside-card">
              <p>Need a custom glass?</p>
              <h2>Talk to our sourcing team</h2>
              <button type="button" onClick={() => setInquiryOpen(true)}>Send inquiry <ArrowRight size={17} /></button>
            </div>
          </aside>

          <article className="product-content">
            <section className="content-section">
              <h2 className="section-heading">Details</h2>
              <ul className="detail-list">
                {details.map((detail) => <li key={detail}><Check size={17} /> <span>{detail}</span></li>)}
              </ul>
            </section>

            <section className="content-section">
              <h2 className="section-heading long">Specification of classic hot selling shot glasses vodka glass liquor tequila</h2>
              <div className="table-wrap">
                <table>
                  <tbody>
                    {specs.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{value}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="visual-section">
              <h2>Classic hot selling shot glasses vodka glass liquor tequila</h2>
              <img src={`${assetRoot}/detail-01.jpg`} alt="Clear shot glasses on a reflective surface" />
            </section>
            <section className="visual-section more-size-section">
              <h2>More Size</h2>
              <img src={`${assetRoot}/detail-03.jpg`} alt="Available shot glass sizes and glass construction details" />
            </section>
            <section className="visual-section">
              <h2>OEM and ODM</h2>
              <div className="image-stack">
                <img src={`${assetRoot}/detail-02.jpg`} alt="Custom printed shot glass examples" />
                <img src={`${assetRoot}/detail-04.jpg`} alt="Custom mold and sustainable glassware development" />
              </div>
            </section>
            <section className="visual-section">
              <h2>Production Processing</h2>
              <img src={`${assetRoot}/detail-05.jpg`} alt="Eight-step shot glass production process" />
            </section>
            <section className="visual-section">
              <h2>Different Package</h2>
              <img src={`${assetRoot}/detail-06.jpg`} alt="Available product packaging styles" />
            </section>
          </article>
        </section>
      </main>

      <footer id="footer">
        <div className="footer-inner">
          <img src={`${assetRoot}/glarivo-logo-blue.png`} alt="Glarivo Glassware" />
          <p>Clear glassware collections and practical product information for confident sourcing.</p>
          <span>© 2026 Glarivo Glassware</span>
        </div>
      </footer>

      {inquiryOpen ? <InquiryPanel onClose={() => setInquiryOpen(false)} /> : null}
    </>
  );
}
