import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

const ADMIN_TOKEN_KEYS = [
  "dlc_admin_token_v1",
  "admin_token",
  "adminToken",
  "dlc_admin_auth_token",
];

const DEFAULT_CONTENT = {
  nav: {
    logo: "/assets/img/dlclogo_long.png",
    logo_alt: "Dhaka Ladies Club Logo",
    links: [],
    booking_button_text: "Book Now",
    booking_button_link: "#calendar-booking",
    login_text: "Login",
    admin_login_text: "Admin Login",
    logout_text: "Logout",
  },
  hero: {
    title: "",
    highlight: "",
    subtitle: "",
    background_image: "",
    primary_button_text: "",
    primary_button_link: "",
    secondary_button_text: "",
    secondary_button_link: "",
  },
  stats: [],
  calendar_section: {
    eyebrow: "",
    title: "",
    description: "",
    loading_text: "",
    button_today: "",
    button_month: "",
    button_year_view: "",
    legend: [],
  },
  our_story: {
    eyebrow: "",
    title: "",
    description: "",
  },
  creating_experiences: {
    image: "",
    image_alt: "",
    badge_text: "",
    eyebrow: "",
    title: "",
    description_1: "",
    description_2: "",
    points: [],
    button_text: "",
    button_link: "",
  },
  gallery: {
    eyebrow: "",
    title: "",
    description: "",
    empty_text: "",
    images: [],
  },
  features_section: {
    eyebrow: "",
    title: "",
    description: "",
    cards: [],
  },
  booking_cta: {
    background_image: "",
    title: "",
    highlight: "",
    title_suffix: "",
    description: "",
    primary_button_text: "",
    primary_button_link: "",
    secondary_button_text: "",
    secondary_button_link: "",
  },
  footer: {
    logo: "/assets/img/dlclogo_long.png",
    logo_alt: "Dhaka Ladies Club",
    description: "",
    quick_links_title: "Quick Links",
    quick_links: [],
    contact_title: "Contact",
    address: "",
    phone: "",
    email: "",
    copyright: "",
    copyright_brand: "Dhaka Ladies Club",
    tagline: "",
  },
};

function getAdminToken() {
  for (const key of ADMIN_TOKEN_KEYS) {
    const token = localStorage.getItem(key);
    if (token) return token;
  }

  return "";
}

function getJsonHeaders() {
  const token = getAdminToken();

  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function getFormHeaders() {
  const token = getAdminToken();

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function apiUrl(endpoint) {
  return `${API_BASE_URL}${endpoint}`;
}

async function apiJson(endpoint, options = {}) {
  const response = await fetch(apiUrl(endpoint), {
    ...options,
    headers: {
      ...getJsonHeaders(),
      ...(options.headers || {}),
    },
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Request failed");
  }

  return payload;
}

async function apiForm(endpoint, formData) {
  const response = await fetch(apiUrl(endpoint), {
    method: "POST",
    headers: getFormHeaders(),
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Upload failed");
  }

  return payload;
}

function deepMergeContent(content) {
  return {
    ...DEFAULT_CONTENT,
    ...(content || {}),
    nav: { ...DEFAULT_CONTENT.nav, ...(content?.nav || {}) },
    hero: { ...DEFAULT_CONTENT.hero, ...(content?.hero || {}) },
    calendar_section: {
      ...DEFAULT_CONTENT.calendar_section,
      ...(content?.calendar_section || {}),
    },
    our_story: { ...DEFAULT_CONTENT.our_story, ...(content?.our_story || {}) },
    creating_experiences: {
      ...DEFAULT_CONTENT.creating_experiences,
      ...(content?.creating_experiences || {}),
    },
    gallery: { ...DEFAULT_CONTENT.gallery, ...(content?.gallery || {}) },
    features_section: {
      ...DEFAULT_CONTENT.features_section,
      ...(content?.features_section || {}),
    },
    booking_cta: {
      ...DEFAULT_CONTENT.booking_cta,
      ...(content?.booking_cta || {}),
    },
    footer: { ...DEFAULT_CONTENT.footer, ...(content?.footer || {}) },
    stats: Array.isArray(content?.stats) ? content.stats : DEFAULT_CONTENT.stats,
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function resolveAssetUrl(url) {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return url;
  return `/${url}`;
}

function getValueByPath(object, path) {
  return path.split(".").reduce((current, key) => current?.[key], object);
}

function setValueByPath(object, path, value) {
  const keys = path.split(".");
  const cloned = structuredClone(object);
  let current = cloned;

  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      current[key] = value;
      return;
    }

    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }

    current = current[key];
  });

  return cloned;
}

function AdminInput({ label, value, onChange, placeholder = "", type = "text" }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input
        type={type}
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function AdminTextarea({ label, value, onChange, rows = 4, placeholder = "" }) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <textarea
        rows={rows}
        value={value || ""}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export default function AdminHomepageContentPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("hero");
  const [content, setContent] = useState(DEFAULT_CONTENT);
  const [galleryFiles, setGalleryFiles] = useState([]);
  const [selectedGalleryUrls, setSelectedGalleryUrls] = useState([]);
  const [advancedJson, setAdvancedJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedCount = selectedGalleryUrls.length;

  const galleryPreviewImages = useMemo(() => {
    return selectedGalleryUrls
      .map((url) => galleryFiles.find((file) => file.url === url))
      .filter(Boolean);
  }, [galleryFiles, selectedGalleryUrls]);

  function updateField(path, value) {
    setContent((previous) => setValueByPath(previous, path, value));
  }

  function updateArrayItem(path, index, key, value) {
    setContent((previous) => {
      const cloned = structuredClone(previous);
      const array = normalizeArray(getValueByPath(cloned, path));

      if (!array[index]) return cloned;

      array[index][key] = value;

      return setValueByPath(cloned, path, array);
    });
  }

  function addArrayItem(path, item) {
    setContent((previous) => {
      const array = normalizeArray(getValueByPath(previous, path));
      return setValueByPath(previous, path, [...array, item]);
    });
  }

  function removeArrayItem(path, index) {
    setContent((previous) => {
      const array = normalizeArray(getValueByPath(previous, path));
      return setValueByPath(
        previous,
        path,
        array.filter((_, itemIndex) => itemIndex !== index)
      );
    });
  }

  async function loadEditorData() {
    setLoading(true);

    try {
      const payload = await apiJson(`/admin/homepage-content?t=${Date.now()}`, {
        method: "GET",
      });

      const nextContent = deepMergeContent(payload?.data?.content || payload?.data || {});
      const nextGalleryFiles = payload?.data?.gallery_files || [];

      setContent(nextContent);
      setGalleryFiles(nextGalleryFiles);
      setSelectedGalleryUrls(normalizeArray(nextContent.gallery.images).map((image) => image.url));
      setAdvancedJson(JSON.stringify(nextContent, null, 2));
    } catch (error) {
      alert(error.message || "Failed to load homepage content.");
    } finally {
      setLoading(false);
    }
  }

  async function saveContent(customContent = content) {
    setSaving(true);

    try {
      const payload = await apiJson("/admin/homepage-content", {
        method: "PUT",
        body: JSON.stringify(customContent),
      });

      const nextContent = deepMergeContent(payload.data);

      setContent(nextContent);
      setSelectedGalleryUrls(normalizeArray(nextContent.gallery.images).map((image) => image.url));
      setAdvancedJson(JSON.stringify(nextContent, null, 2));

      alert("Homepage content saved successfully.");
    } catch (error) {
      alert(error.message || "Failed to save homepage content.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadSectionImage(target, file) {
    if (!file) return;

    const formData = new FormData();
    formData.append("target", target);
    formData.append("image", file);

    setSaving(true);

    try {
      const payload = await apiForm("/admin/homepage-content/upload-section-image", formData);
      const nextContent = deepMergeContent(payload.data);

      setContent(nextContent);
      setAdvancedJson(JSON.stringify(nextContent, null, 2));

      alert("Image uploaded successfully.");
    } catch (error) {
      alert(error.message || "Failed to upload image.");
    } finally {
      setSaving(false);
    }
  }

  async function uploadGalleryImages(files) {
    if (!files || files.length === 0) return;

    const formData = new FormData();

    Array.from(files).forEach((file) => {
      formData.append("images[]", file);
    });

    setSaving(true);

    try {
      const payload = await apiForm("/admin/homepage-content/gallery/upload", formData);

      setGalleryFiles(payload.gallery_files || []);

      alert("Gallery images uploaded successfully. Now select the images you want to show on homepage.");
    } catch (error) {
      alert(error.message || "Failed to upload gallery images.");
    } finally {
      setSaving(false);
    }
  }

  async function saveGallerySelection() {
    setSaving(true);

    try {
      const payload = await apiJson("/admin/homepage-content/gallery/select", {
        method: "POST",
        body: JSON.stringify({
          selected_urls: selectedGalleryUrls,
        }),
      });

      const nextContent = deepMergeContent(payload.data);

      setContent(nextContent);
      setGalleryFiles(payload.gallery_files || galleryFiles);
      setSelectedGalleryUrls(normalizeArray(nextContent.gallery.images).map((image) => image.url));
      setAdvancedJson(JSON.stringify(nextContent, null, 2));

      alert("Homepage gallery selection saved successfully.");
    } catch (error) {
      alert(error.message || "Failed to save gallery selection.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteGalleryFile(file) {
    const confirmed = window.confirm(
      `Delete ${file.name} from hosting server and remove it from homepage JSON?`
    );

    if (!confirmed) return;

    setSaving(true);

    try {
      const payload = await apiJson("/admin/homepage-content/gallery/file", {
        method: "DELETE",
        body: JSON.stringify({
          url: file.url,
        }),
      });

      const nextContent = deepMergeContent(payload.data);

      setContent(nextContent);
      setGalleryFiles(payload.gallery_files || []);
      setSelectedGalleryUrls(normalizeArray(nextContent.gallery.images).map((image) => image.url));
      setAdvancedJson(JSON.stringify(nextContent, null, 2));

      alert("Gallery file deleted successfully.");
    } catch (error) {
      alert(error.message || "Failed to delete gallery image.");
    } finally {
      setSaving(false);
    }
  }

  function toggleGallerySelection(url) {
    setSelectedGalleryUrls((previous) => {
      if (previous.includes(url)) {
        return previous.filter((item) => item !== url);
      }

      return [...previous, url];
    });
  }

  function applyAdvancedJson() {
    try {
      const parsed = JSON.parse(advancedJson);
      setContent(deepMergeContent(parsed));
      alert("JSON applied locally. Click Save All Changes to update hosting JSON.");
    } catch {
      alert("Invalid JSON format.");
    }
  }

  useEffect(() => {
    loadEditorData();
  }, []);

  useEffect(() => {
    setAdvancedJson(JSON.stringify(content, null, 2));
  }, [content]);

  if (loading) {
    return (
      <div className="admin-homepage-page">
        <style>{adminPageStyles}</style>
        <div className="admin-loading-card">Loading homepage editor...</div>
      </div>
    );
  }

  return (
    <div className="admin-homepage-page">
      <style>{adminPageStyles}</style>

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-brand-mark">DLC</div>
          <div>
            <h2>Dhaka Ladies Club</h2>
            <p>Admin Panel</p>
          </div>
        </div>

        <nav className="admin-menu">
          <Link to="/admin-dashboard">Dashboard</Link>
          <Link to="/admin-bookings">Bookings</Link>
          <Link to="/admin-manual-booking">Manual Booking</Link>
          <Link to="/admin-homepage-content" className="active">
            Homepage Content
          </Link>
          <Link to="/" target="_blank">
            View Website
          </Link>
        </nav>

        <button
          type="button"
          className="admin-logout"
          onClick={() => navigate("/admin-login")}
        >
          Back to Login
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-eyebrow">Website Content Manager</p>
            <h1>Homepage Content Editor</h1>
            <span>Edit homepage text and images without database changes.</span>
          </div>

          <button
            type="button"
            className="primary-btn"
            disabled={saving}
            onClick={() => saveContent()}
          >
            {saving ? "Saving..." : "Save All Changes"}
          </button>
        </header>

        <section className="admin-tabs">
          {[
            ["hero", "Hero"],
            ["about", "Story & Experience"],
            ["gallery", "Gallery"],
            ["nav", "Navigation"],
            ["stats", "Stats"],
            ["calendar", "Calendar Text"],
            ["features", "Features"],
            ["cta", "CTA"],
            ["footer", "Footer"],
            ["advanced", "Advanced JSON"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={activeTab === key ? "active" : ""}
              onClick={() => setActiveTab(key)}
            >
              {label}
            </button>
          ))}
        </section>

        {activeTab === "hero" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>Hero Content</h3>

              <AdminInput
                label="Hero Title"
                value={content.hero.title}
                onChange={(value) => updateField("hero.title", value)}
              />

              <AdminInput
                label="Highlighted Text"
                value={content.hero.highlight}
                onChange={(value) => updateField("hero.highlight", value)}
              />

              <AdminTextarea
                label="Hero Subtitle"
                value={content.hero.subtitle}
                onChange={(value) => updateField("hero.subtitle", value)}
              />

              <div className="two-col">
                <AdminInput
                  label="Primary Button Text"
                  value={content.hero.primary_button_text}
                  onChange={(value) => updateField("hero.primary_button_text", value)}
                />
                <AdminInput
                  label="Primary Button Link"
                  value={content.hero.primary_button_link}
                  onChange={(value) => updateField("hero.primary_button_link", value)}
                />
              </div>

              <div className="two-col">
                <AdminInput
                  label="Secondary Button Text"
                  value={content.hero.secondary_button_text}
                  onChange={(value) => updateField("hero.secondary_button_text", value)}
                />
                <AdminInput
                  label="Secondary Button Link"
                  value={content.hero.secondary_button_link}
                  onChange={(value) => updateField("hero.secondary_button_link", value)}
                />
              </div>
            </div>

            <div className="admin-card">
              <h3>Hero Background Image</h3>

              <div className="image-preview hero-preview">
                {content.hero.background_image ? (
                  <img src={resolveAssetUrl(content.hero.background_image)} alt="Hero Background" />
                ) : (
                  <span>No image selected</span>
                )}
              </div>

              <p className="hint">
                Upload location: /uploads/homepage/hero-background.ext
              </p>

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  uploadSectionImage("hero_background", event.target.files?.[0])
                }
              />
            </div>
          </section>
        )}

        {activeTab === "about" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>Our Story Section</h3>

              <AdminInput
                label="Eyebrow"
                value={content.our_story.eyebrow}
                onChange={(value) => updateField("our_story.eyebrow", value)}
              />

              <AdminInput
                label="Title"
                value={content.our_story.title}
                onChange={(value) => updateField("our_story.title", value)}
              />

              <AdminTextarea
                label="Description"
                value={content.our_story.description}
                onChange={(value) => updateField("our_story.description", value)}
              />
            </div>

            <div className="admin-card">
              <h3>Creating Experiences</h3>

              <div className="image-preview">
                {content.creating_experiences.image ? (
                  <img
                    src={resolveAssetUrl(content.creating_experiences.image)}
                    alt="Creating Experiences"
                  />
                ) : (
                  <span>No image selected</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  uploadSectionImage("creating_experiences_image", event.target.files?.[0])
                }
              />

              <AdminInput
                label="Image Alt Text"
                value={content.creating_experiences.image_alt}
                onChange={(value) => updateField("creating_experiences.image_alt", value)}
              />

              <AdminInput
                label="Badge Text"
                value={content.creating_experiences.badge_text}
                onChange={(value) => updateField("creating_experiences.badge_text", value)}
              />

              <AdminInput
                label="Eyebrow"
                value={content.creating_experiences.eyebrow}
                onChange={(value) => updateField("creating_experiences.eyebrow", value)}
              />

              <AdminInput
                label="Title"
                value={content.creating_experiences.title}
                onChange={(value) => updateField("creating_experiences.title", value)}
              />

              <AdminTextarea
                label="Description 1"
                value={content.creating_experiences.description_1}
                onChange={(value) =>
                  updateField("creating_experiences.description_1", value)
                }
              />

              <AdminTextarea
                label="Description 2"
                value={content.creating_experiences.description_2}
                onChange={(value) =>
                  updateField("creating_experiences.description_2", value)
                }
              />

              <div className="two-col">
                <AdminInput
                  label="Button Text"
                  value={content.creating_experiences.button_text}
                  onChange={(value) =>
                    updateField("creating_experiences.button_text", value)
                  }
                />
                <AdminInput
                  label="Button Link"
                  value={content.creating_experiences.button_link}
                  onChange={(value) =>
                    updateField("creating_experiences.button_link", value)
                  }
                />
              </div>
            </div>

            <div className="admin-card full">
              <div className="card-title-row">
                <h3>Experience Points</h3>
                <button
                  type="button"
                  className="small-btn"
                  onClick={() =>
                    addArrayItem("creating_experiences.points", "New Point")
                  }
                >
                  + Add Point
                </button>
              </div>

              {normalizeArray(content.creating_experiences.points).map((point, index) => (
                <div className="list-row" key={`${point}-${index}`}>
                  <input
                    value={point}
                    onChange={(event) => {
                      const points = [...content.creating_experiences.points];
                      points[index] = event.target.value;
                      updateField("creating_experiences.points", points);
                    }}
                  />
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeArrayItem("creating_experiences.points", index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "gallery" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>Gallery Section Text</h3>

              <AdminInput
                label="Eyebrow"
                value={content.gallery.eyebrow}
                onChange={(value) => updateField("gallery.eyebrow", value)}
              />

              <AdminInput
                label="Title"
                value={content.gallery.title}
                onChange={(value) => updateField("gallery.title", value)}
              />

              <AdminTextarea
                label="Description"
                value={content.gallery.description}
                onChange={(value) => updateField("gallery.description", value)}
              />

              <AdminInput
                label="Empty Gallery Text"
                value={content.gallery.empty_text}
                onChange={(value) => updateField("gallery.empty_text", value)}
              />
            </div>

            <div className="admin-card">
              <h3>Upload Gallery Images</h3>

              <p className="hint">
                Images will be stored in /uploads/homepage/gallery/ as gallery_1, gallery_2, gallery_3...
              </p>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => uploadGalleryImages(event.target.files)}
              />

              <button
                type="button"
                className="secondary-btn"
                onClick={loadEditorData}
              >
                Refresh Gallery Files
              </button>

              <div className="selected-count">
                Selected for homepage: <strong>{selectedCount}</strong>
              </div>

              <button
                type="button"
                className="primary-btn full-btn"
                disabled={saving}
                onClick={saveGallerySelection}
              >
                Save Selected Gallery Images
              </button>
            </div>

            <div className="admin-card full">
              <h3>All Images From Hosting Folder</h3>

              <div className="gallery-admin-grid">
                {galleryFiles.map((file) => (
                  <div
                    className={`gallery-admin-item ${
                      selectedGalleryUrls.includes(file.url) ? "selected" : ""
                    }`}
                    key={file.url}
                  >
                    <img src={file.url} alt={file.name} />

                    <label>
                      <input
                        type="checkbox"
                        checked={selectedGalleryUrls.includes(file.url)}
                        onChange={() => toggleGallerySelection(file.url)}
                      />
                      Show on homepage
                    </label>

                    <p>{file.name}</p>

                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => deleteGalleryFile(file)}
                    >
                      Delete from Hosting
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="admin-card full">
              <h3>Selected Homepage Gallery Preview</h3>

              <div className="gallery-preview-grid">
                {galleryPreviewImages.map((file) => (
                  <img src={file.url} alt={file.name} key={file.url} />
                ))}
              </div>
            </div>
          </section>
        )}

        {activeTab === "nav" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>Navigation Settings</h3>

              <AdminInput
                label="Logo Path"
                value={content.nav.logo}
                onChange={(value) => updateField("nav.logo", value)}
              />

              <input
                type="file"
                accept="image/*"
                onChange={(event) => uploadSectionImage("nav_logo", event.target.files?.[0])}
              />

              <AdminInput
                label="Logo Alt Text"
                value={content.nav.logo_alt}
                onChange={(value) => updateField("nav.logo_alt", value)}
              />

              <AdminInput
                label="Booking Button Text"
                value={content.nav.booking_button_text}
                onChange={(value) => updateField("nav.booking_button_text", value)}
              />

              <AdminInput
                label="Booking Button Link"
                value={content.nav.booking_button_link}
                onChange={(value) => updateField("nav.booking_button_link", value)}
              />

              <div className="two-col">
                <AdminInput
                  label="Login Text"
                  value={content.nav.login_text}
                  onChange={(value) => updateField("nav.login_text", value)}
                />
                <AdminInput
                  label="Admin Login Text"
                  value={content.nav.admin_login_text}
                  onChange={(value) => updateField("nav.admin_login_text", value)}
                />
              </div>
            </div>

            <div className="admin-card">
              <div className="card-title-row">
                <h3>Navbar Links</h3>
                <button
                  type="button"
                  className="small-btn"
                  onClick={() => addArrayItem("nav.links", { label: "New Link", href: "#" })}
                >
                  + Add Link
                </button>
              </div>

              {normalizeArray(content.nav.links).map((link, index) => (
                <div className="list-row two" key={`${link.label}-${index}`}>
                  <input
                    value={link.label || ""}
                    onChange={(event) =>
                      updateArrayItem("nav.links", index, "label", event.target.value)
                    }
                  />
                  <input
                    value={link.href || ""}
                    onChange={(event) =>
                      updateArrayItem("nav.links", index, "href", event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeArrayItem("nav.links", index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "stats" && (
          <section className="admin-card full">
            <div className="card-title-row">
              <h3>Stats Section</h3>
              <button
                type="button"
                className="small-btn"
                onClick={() =>
                  addArrayItem("stats", {
                    id: `stat_${Date.now()}`,
                    count: 0,
                    suffix: "+",
                    label: "New Stat",
                    delay: "",
                  })
                }
              >
                + Add Stat
              </button>
            </div>

            {normalizeArray(content.stats).map((stat, index) => (
              <div className="list-row stats-row" key={stat.id || index}>
                <input
                  value={stat.id || ""}
                  onChange={(event) =>
                    updateArrayItem("stats", index, "id", event.target.value)
                  }
                  placeholder="ID"
                />
                <input
                  type="number"
                  value={stat.count || 0}
                  onChange={(event) =>
                    updateArrayItem("stats", index, "count", Number(event.target.value))
                  }
                  placeholder="Count"
                />
                <input
                  value={stat.suffix || ""}
                  onChange={(event) =>
                    updateArrayItem("stats", index, "suffix", event.target.value)
                  }
                  placeholder="Suffix"
                />
                <input
                  value={stat.label || ""}
                  onChange={(event) =>
                    updateArrayItem("stats", index, "label", event.target.value)
                  }
                  placeholder="Label"
                />
                <button
                  type="button"
                  className="danger-btn"
                  onClick={() => removeArrayItem("stats", index)}
                >
                  Remove
                </button>
              </div>
            ))}
          </section>
        )}

        {activeTab === "calendar" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>Calendar Section Text</h3>

              <AdminInput
                label="Eyebrow"
                value={content.calendar_section.eyebrow}
                onChange={(value) => updateField("calendar_section.eyebrow", value)}
              />

              <AdminInput
                label="Title"
                value={content.calendar_section.title}
                onChange={(value) => updateField("calendar_section.title", value)}
              />

              <AdminTextarea
                label="Description"
                value={content.calendar_section.description}
                onChange={(value) => updateField("calendar_section.description", value)}
              />

              <AdminInput
                label="Loading Text"
                value={content.calendar_section.loading_text}
                onChange={(value) => updateField("calendar_section.loading_text", value)}
              />
            </div>

            <div className="admin-card">
              <h3>Calendar Buttons</h3>

              <AdminInput
                label="Today Button"
                value={content.calendar_section.button_today}
                onChange={(value) => updateField("calendar_section.button_today", value)}
              />

              <AdminInput
                label="Month Button"
                value={content.calendar_section.button_month}
                onChange={(value) => updateField("calendar_section.button_month", value)}
              />

              <AdminInput
                label="Year View Button"
                value={content.calendar_section.button_year_view}
                onChange={(value) => updateField("calendar_section.button_year_view", value)}
              />
            </div>
          </section>
        )}

        {activeTab === "features" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>Features Section Text</h3>

              <AdminInput
                label="Eyebrow"
                value={content.features_section.eyebrow}
                onChange={(value) => updateField("features_section.eyebrow", value)}
              />

              <AdminInput
                label="Title"
                value={content.features_section.title}
                onChange={(value) => updateField("features_section.title", value)}
              />

              <AdminTextarea
                label="Description"
                value={content.features_section.description}
                onChange={(value) => updateField("features_section.description", value)}
              />
            </div>

            <div className="admin-card full">
              <div className="card-title-row">
                <h3>Feature Cards</h3>
                <button
                  type="button"
                  className="small-btn"
                  onClick={() =>
                    addArrayItem("features_section.cards", {
                      id: `feature_${Date.now()}`,
                      icon: "⭐",
                      title: "New Feature",
                      text: "Feature description",
                      delay: "",
                    })
                  }
                >
                  + Add Feature
                </button>
              </div>

              {normalizeArray(content.features_section.cards).map((card, index) => (
                <div className="feature-edit-card" key={card.id || index}>
                  <div className="two-col">
                    <AdminInput
                      label="Icon"
                      value={card.icon}
                      onChange={(value) =>
                        updateArrayItem("features_section.cards", index, "icon", value)
                      }
                    />
                    <AdminInput
                      label="Title"
                      value={card.title}
                      onChange={(value) =>
                        updateArrayItem("features_section.cards", index, "title", value)
                      }
                    />
                  </div>

                  <AdminTextarea
                    label="Text"
                    value={card.text}
                    onChange={(value) =>
                      updateArrayItem("features_section.cards", index, "text", value)
                    }
                  />

                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeArrayItem("features_section.cards", index)}
                  >
                    Remove Feature
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "cta" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>CTA Content</h3>

              <AdminInput
                label="Title"
                value={content.booking_cta.title}
                onChange={(value) => updateField("booking_cta.title", value)}
              />

              <AdminInput
                label="Highlight"
                value={content.booking_cta.highlight}
                onChange={(value) => updateField("booking_cta.highlight", value)}
              />

              <AdminInput
                label="Title Suffix"
                value={content.booking_cta.title_suffix}
                onChange={(value) => updateField("booking_cta.title_suffix", value)}
              />

              <AdminTextarea
                label="Description"
                value={content.booking_cta.description}
                onChange={(value) => updateField("booking_cta.description", value)}
              />

              <div className="two-col">
                <AdminInput
                  label="Primary Button Text"
                  value={content.booking_cta.primary_button_text}
                  onChange={(value) => updateField("booking_cta.primary_button_text", value)}
                />
                <AdminInput
                  label="Primary Button Link"
                  value={content.booking_cta.primary_button_link}
                  onChange={(value) => updateField("booking_cta.primary_button_link", value)}
                />
              </div>

              <div className="two-col">
                <AdminInput
                  label="Secondary Button Text"
                  value={content.booking_cta.secondary_button_text}
                  onChange={(value) => updateField("booking_cta.secondary_button_text", value)}
                />
                <AdminInput
                  label="Secondary Button Link"
                  value={content.booking_cta.secondary_button_link}
                  onChange={(value) => updateField("booking_cta.secondary_button_link", value)}
                />
              </div>
            </div>

            <div className="admin-card">
              <h3>CTA Background Image</h3>

              <div className="image-preview">
                {content.booking_cta.background_image ? (
                  <img src={resolveAssetUrl(content.booking_cta.background_image)} alt="CTA" />
                ) : (
                  <span>No image selected</span>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  uploadSectionImage("booking_cta_background", event.target.files?.[0])
                }
              />
            </div>
          </section>
        )}

        {activeTab === "footer" && (
          <section className="admin-card-grid">
            <div className="admin-card">
              <h3>Footer Brand</h3>

              <AdminInput
                label="Footer Logo"
                value={content.footer.logo}
                onChange={(value) => updateField("footer.logo", value)}
              />

              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  uploadSectionImage("footer_logo", event.target.files?.[0])
                }
              />

              <AdminInput
                label="Logo Alt Text"
                value={content.footer.logo_alt}
                onChange={(value) => updateField("footer.logo_alt", value)}
              />

              <AdminTextarea
                label="Footer Description"
                value={content.footer.description}
                onChange={(value) => updateField("footer.description", value)}
              />
            </div>

            <div className="admin-card">
              <h3>Contact Information</h3>

              <AdminInput
                label="Contact Title"
                value={content.footer.contact_title}
                onChange={(value) => updateField("footer.contact_title", value)}
              />

              <AdminInput
                label="Address"
                value={content.footer.address}
                onChange={(value) => updateField("footer.address", value)}
              />

              <AdminInput
                label="Phone"
                value={content.footer.phone}
                onChange={(value) => updateField("footer.phone", value)}
              />

              <AdminInput
                label="Email"
                value={content.footer.email}
                onChange={(value) => updateField("footer.email", value)}
              />

              <AdminInput
                label="Copyright"
                value={content.footer.copyright}
                onChange={(value) => updateField("footer.copyright", value)}
              />

              <AdminInput
                label="Tagline"
                value={content.footer.tagline}
                onChange={(value) => updateField("footer.tagline", value)}
              />
            </div>

            <div className="admin-card full">
              <div className="card-title-row">
                <h3>Footer Quick Links</h3>
                <button
                  type="button"
                  className="small-btn"
                  onClick={() =>
                    addArrayItem("footer.quick_links", {
                      label: "New Link",
                      href: "#",
                    })
                  }
                >
                  + Add Link
                </button>
              </div>

              {normalizeArray(content.footer.quick_links).map((link, index) => (
                <div className="list-row two" key={`${link.label}-${index}`}>
                  <input
                    value={link.label || ""}
                    onChange={(event) =>
                      updateArrayItem("footer.quick_links", index, "label", event.target.value)
                    }
                  />
                  <input
                    value={link.href || ""}
                    onChange={(event) =>
                      updateArrayItem("footer.quick_links", index, "href", event.target.value)
                    }
                  />
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={() => removeArrayItem("footer.quick_links", index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === "advanced" && (
          <section className="admin-card full">
            <div className="card-title-row">
              <h3>Advanced JSON Editor</h3>
              <div className="button-row">
                <button type="button" className="secondary-btn" onClick={applyAdvancedJson}>
                  Apply JSON Locally
                </button>
                <button
                  type="button"
                  className="primary-btn"
                  disabled={saving}
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(advancedJson);
                      saveContent(deepMergeContent(parsed));
                    } catch {
                      alert("Invalid JSON format.");
                    }
                  }}
                >
                  Save JSON to Hosting
                </button>
              </div>
            </div>

            <textarea
              className="json-editor"
              value={advancedJson}
              onChange={(event) => setAdvancedJson(event.target.value)}
            />
          </section>
        )}
      </main>
    </div>
  );
}

const adminPageStyles = `
  * {
    box-sizing: border-box;
  }

  .admin-homepage-page {
    min-height: 100vh;
    background: #f5f2eb;
    font-family: 'Poppins', Arial, sans-serif;
    color: #111827;
    display: flex;
  }

  .admin-loading-card {
    margin: 100px auto;
    background: white;
    padding: 30px 40px;
    border-radius: 18px;
    box-shadow: 0 18px 45px rgba(0,0,0,0.08);
    font-weight: 700;
    color: #8f6908;
  }

  .admin-sidebar {
    width: 280px;
    background: #111827;
    color: white;
    padding: 26px 20px;
    position: fixed;
    inset: 0 auto 0 0;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .admin-brand {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }

  .admin-brand-mark {
    width: 50px;
    height: 50px;
    border-radius: 15px;
    background: linear-gradient(135deg, #b8860b, #d4a017);
    display: grid;
    place-items: center;
    font-weight: 900;
    color: white;
  }

  .admin-brand h2 {
    font-size: 16px;
    margin: 0;
  }

  .admin-brand p {
    margin: 4px 0 0;
    color: #9ca3af;
    font-size: 12px;
  }

  .admin-menu {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .admin-menu a {
    color: #d1d5db;
    text-decoration: none;
    padding: 13px 14px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    transition: 0.25s ease;
  }

  .admin-menu a:hover,
  .admin-menu a.active {
    background: rgba(184,134,11,0.18);
    color: #f8d56b;
  }

  .admin-logout {
    margin-top: auto;
    border: none;
    background: #b8860b;
    color: white;
    padding: 13px 16px;
    border-radius: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .admin-main {
    margin-left: 280px;
    width: calc(100% - 280px);
    padding: 28px;
  }

  .admin-topbar {
    background: white;
    border-radius: 24px;
    padding: 26px 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 24px;
    box-shadow: 0 16px 45px rgba(0,0,0,0.06);
    margin-bottom: 22px;
  }

  .admin-eyebrow {
    color: #b8860b;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0 0 8px;
  }

  .admin-topbar h1 {
    margin: 0;
    font-size: 30px;
    color: #111827;
  }

  .admin-topbar span {
    color: #6b7280;
    font-size: 14px;
  }

  .admin-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 22px;
  }

  .admin-tabs button {
    border: 1px solid #ead7a6;
    background: white;
    color: #374151;
    padding: 11px 16px;
    border-radius: 999px;
    font-weight: 700;
    cursor: pointer;
  }

  .admin-tabs button.active {
    background: #b8860b;
    color: white;
    border-color: #b8860b;
  }

  .admin-card-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 22px;
  }

  .admin-card {
    background: white;
    border-radius: 22px;
    padding: 24px;
    box-shadow: 0 16px 45px rgba(0,0,0,0.06);
    border: 1px solid rgba(184,134,11,0.12);
  }

  .admin-card.full {
    grid-column: 1 / -1;
  }

  .admin-card h3 {
    margin: 0 0 18px;
    font-size: 20px;
    color: #111827;
  }

  .admin-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
  }

  .admin-field span {
    font-size: 13px;
    font-weight: 800;
    color: #374151;
  }

  .admin-field input,
  .admin-field textarea,
  .admin-card input,
  .admin-card textarea {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    padding: 12px 14px;
    font-family: inherit;
    font-size: 14px;
    outline: none;
  }

  .admin-field input:focus,
  .admin-field textarea:focus,
  .admin-card input:focus,
  .admin-card textarea:focus {
    border-color: #b8860b;
    box-shadow: 0 0 0 4px rgba(184,134,11,0.12);
  }

  .two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .card-title-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 16px;
  }

  .card-title-row h3 {
    margin: 0;
  }

  .button-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .primary-btn,
  .secondary-btn,
  .small-btn,
  .danger-btn {
    border: none;
    border-radius: 14px;
    padding: 12px 16px;
    font-weight: 800;
    cursor: pointer;
    font-family: inherit;
  }

  .primary-btn {
    background: #b8860b;
    color: white;
  }

  .primary-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .secondary-btn {
    background: #f3f4f6;
    color: #374151;
    margin-top: 14px;
  }

  .small-btn {
    background: #111827;
    color: white;
    padding: 10px 14px;
  }

  .danger-btn {
    background: #fee2e2;
    color: #991b1b;
    padding: 10px 12px;
  }

  .full-btn {
    width: 100%;
    margin-top: 16px;
  }

  .hint {
    color: #6b7280;
    font-size: 13px;
    line-height: 1.6;
    margin: 8px 0 14px;
  }

  .selected-count {
    margin-top: 16px;
    background: #fdf6e3;
    color: #8f6908;
    border: 1px solid #ead7a6;
    padding: 12px;
    border-radius: 14px;
  }

  .image-preview {
    width: 100%;
    min-height: 220px;
    border-radius: 18px;
    border: 1px dashed #d1d5db;
    background: #f9fafb;
    display: grid;
    place-items: center;
    overflow: hidden;
    margin-bottom: 14px;
  }

  .image-preview.hero-preview {
    min-height: 300px;
  }

  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .list-row {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 10px;
    margin-bottom: 10px;
    align-items: center;
  }

  .list-row.two {
    grid-template-columns: 1fr 1fr auto;
  }

  .list-row.stats-row {
    grid-template-columns: 1fr 120px 100px 1.5fr auto;
  }

  .feature-edit-card {
    border: 1px solid #e5e7eb;
    border-radius: 18px;
    padding: 18px;
    margin-bottom: 14px;
    background: #fafafa;
  }

  .gallery-admin-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 18px;
  }

  .gallery-admin-item {
    border: 2px solid #e5e7eb;
    border-radius: 18px;
    padding: 12px;
    background: #fafafa;
    transition: 0.25s ease;
  }

  .gallery-admin-item.selected {
    border-color: #b8860b;
    background: #fdf6e3;
  }

  .gallery-admin-item img {
    width: 100%;
    height: 140px;
    object-fit: cover;
    border-radius: 14px;
    display: block;
    margin-bottom: 10px;
  }

  .gallery-admin-item label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #111827;
    font-size: 13px;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .gallery-admin-item p {
    color: #6b7280;
    font-size: 12px;
    word-break: break-all;
  }

  .gallery-preview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 12px;
  }

  .gallery-preview-grid img {
    width: 100%;
    height: 130px;
    border-radius: 14px;
    object-fit: cover;
  }

  .json-editor {
    width: 100%;
    min-height: 680px;
    font-family: Consolas, Monaco, monospace !important;
    font-size: 13px !important;
    line-height: 1.6;
    background: #0f172a;
    color: #e5e7eb;
    border: none !important;
    border-radius: 18px;
    padding: 18px;
  }

  @media (max-width: 1100px) {
    .admin-sidebar {
      position: static;
      width: 100%;
      min-height: auto;
    }

    .admin-homepage-page {
      display: block;
    }

    .admin-main {
      margin-left: 0;
      width: 100%;
    }

    .admin-card-grid,
    .two-col {
      grid-template-columns: 1fr;
    }

    .list-row,
    .list-row.two,
    .list-row.stats-row {
      grid-template-columns: 1fr;
    }

    .admin-topbar {
      flex-direction: column;
      align-items: flex-start;
    }
  }
`;