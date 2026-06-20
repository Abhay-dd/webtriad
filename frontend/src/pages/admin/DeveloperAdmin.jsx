import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import { Plus, Trash, LogOut, Edit, X, RefreshCw, Activity, CheckCircle, XCircle, Database, Clock, Users } from "lucide-react";
import { resolveMediaUrl } from "../../config";

const TIER_LABELS = {
  "co-founder": "Founders",
  "senior-portfolio-manager": "Senior Portfolio Managers",
  "portfolio-manager": "Portfolio Managers",
  "property-investment-consultant": "Property Investment Consultants",
  "none": "None / Unassigned",
};
const TIER_KEYS = Object.keys(TIER_LABELS);
const DEFAULT_TIER_ORDER = ["co-founder", "senior-portfolio-manager", "portfolio-manager", "property-investment-consultant"];

function FileUploadButton({ onUploadSuccess, label = "Upload File" }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.data && res.data.url) {
        onUploadSuccess(res.data.url);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1 mt-1">
      <label className="inline-flex items-center justify-center btn-gold !px-3 !py-1 text-xs cursor-pointer w-max select-none border-none">
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,application/pdf"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
        {uploading ? "Uploading..." : label}
      </label>
      {error && <span className="text-red-500 text-xs">{error}</span>}
    </div>
  );
}

const TABS = ["team", "owners", "projects", "blogs", "home", "popup", "reviews", "status"];

const TAB_LABELS = {
  team: "Team",
  owners: "Owners",
  projects: "Projects",
  blogs: "Blogs",
  home: "Home",
  popup: "Popup",
  reviews: "Reviews",
  status: "⚡ Status",
};

const EMPTY_PROJECT_FORM = {
  id: "",
  name: "",
  developer: "",
  location: "",
  emirate: "",
  type: "",
  configuration: "",
  price_from: "",
  price_currency: "AED",
  sqft_from: "",
  handover: "",
  status: "",
  hot: false,
  tagline: "",
  hero: "",
  description: "",
  amenities: "",
  gallery: "",
};

const EMPTY_BLOG_FORM = {
  id: "",
  title: "",
  category: "",
  author: "",
  date: "",
  read_minutes: "",
  cover: "",
  excerpt: "",
  content: "",
};

const DEFAULT_HOMEPAGE_FORM = {
  launch_title: "",
  launch_description: "",
  launch_video_url: "",
  stat1_value: "",
  stat1_label: "",
  stat2_value: "",
  stat2_label: "",
  stat3_value: "",
  stat3_label: "",
  stat4_value: "",
  stat4_label: "",
  founders_image_url: "",
  company_address: "",
  company_phone: "",
  company_email: "",
  company_whatsapp: "",
  company_instagram: "",
  company_linkedin: "",
};

const splitCsv = (s) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

const joinCsv = (arr) => (Array.isArray(arr) ? arr.join(", ") : "");

export default function DeveloperAdmin() {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState("team");
  const [team, setTeam] = useState([]);
  const [owners, setOwners] = useState([]);
  const [projects, setProjects] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ownerForm, setOwnerForm] = useState({
    email: "",
    password: "",
    name: "",
    organization_name: "",
  });
  const [editingOwnerId, setEditingOwnerId] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    youtubeCode: "",
    description: "",
    name: "",
    role: "",
    country: "",
    rating: 5,
    avatar: "",
  });
  const [teamModal, setTeamModal] = useState(false);
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [teamForm, setTeamForm] = useState({
    name: "",
    role: "",
    tier: "senior-portfolio-manager",
    experience: "",
    speaks: "",
    photo: "",
    phone: "",
    email: "",
    instagram: "",
    linkedin: "",
    facebook: "",
    bio: "",
    videoUrl: "",
    videoUrl2: "",
    isFounder: false,
    showOnHome: true,
    showOnAbout: true,
    sortOrder: 0,
  });
  const [projectModal, setProjectModal] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [projectForm, setProjectForm] = useState(EMPTY_PROJECT_FORM);
  const [duplicateNameError, setDuplicateNameError] = useState("");
  const [blogModal, setBlogModal] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState(null);
  const [blogForm, setBlogForm] = useState(EMPTY_BLOG_FORM);
  const [popupForm, setPopupForm] = useState({
    tag: "",
    title: "",
    description: "",
    btn1_label: "",
    btn1_link: "",
    btn2_label: "",
    btn2_link: "",
    active: true,
    poster_image_url: "",
    project_link: "",
    popup_type: "text",
  });
  const [popupSaved, setPopupSaved] = useState(false);
  const [homepageForm, setHomepageForm] = useState(DEFAULT_HOMEPAGE_FORM);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  const [healthRefreshing, setHealthRefreshing] = useState(false);

  const refreshHealth = useCallback(async () => {
    setHealthRefreshing(true);
    try {
      const h = await apiClient.get("/admin/system/health");
      setHealth(h.data);
    } catch { /* silent */ }
    setHealthRefreshing(false);
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [t, o, p, b, h, pop, home, r, cons] = await Promise.all([
        apiClient.get("/team"),
        apiClient.get("/admin/owners"),
        apiClient.get("/admin/projects"),
        apiClient.get("/admin/blogs"),
        apiClient.get("/admin/system/health"),
        apiClient.get("/settings/popup"),
        apiClient.get("/settings/homepage"),
        apiClient.get("/reviews"),
        apiClient.get("/admin/consultations").catch(() => ({ data: { results: [] } })),
      ]);
      setTeam(t.data.results || []);
      setOwners(o.data.results || []);
      setProjects(p.data.results || []);
      setBlogs(b.data.results || []);
      setReviews(r.data.results || []);
      setConsultations(cons.data.results || []);
      setHealth(h.data);
      if (pop.data) {
        setPopupForm({
          tag: pop.data.tag || "",
          title: pop.data.title || "",
          description: pop.data.description || "",
          btn1_label: pop.data.btn1_label || "",
          btn1_link: pop.data.btn1_link || "",
          btn2_label: pop.data.btn2_label || "",
          btn2_link: pop.data.btn2_link || "",
          active: pop.data.active ?? true,
          poster_image_url: pop.data.poster_image_url || "",
          project_link: pop.data.project_link || "",
          popup_type: pop.data.popup_type || (pop.data.poster_image_url ? "image" : "text"),
        });
      }
      if (home.data) {
        setHomepageForm({
          ...DEFAULT_HOMEPAGE_FORM,
          launch_title: home.data.launch_title || "",
          launch_description: home.data.launch_description || "",
          launch_video_url: home.data.launch_video_url || "",
          stat1_value: home.data.stat1_value || "",
          stat1_label: home.data.stat1_label || "",
          stat2_value: home.data.stat2_value || "",
          stat2_label: home.data.stat2_label || "",
          stat3_value: home.data.stat3_value || "",
          stat3_label: home.data.stat3_label || "",
          stat4_value: home.data.stat4_value || "",
          stat4_label: home.data.stat4_label || "",
          founders_image_url: home.data.founders_image_url || "",
          company_address: home.data.company_address || "",
          company_phone: home.data.company_phone || "",
          company_email: home.data.company_email || "",
          company_whatsapp: home.data.company_whatsapp || "",
          company_instagram: home.data.company_instagram || "",
          company_linkedin: home.data.company_linkedin || "",
        });
      }
    } catch {
      /* per-action errors */
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Auto-refresh health every 30 seconds when on the status tab
  useEffect(() => {
    if (tab !== "status") return;
    const id = setInterval(refreshHealth, 30_000);
    return () => clearInterval(id);
  }, [tab, refreshHealth]);

  const saveOwner = async (e) => {
    e.preventDefault();
    setActionError("");
    setSaving(true);
    try {
      if (editingOwnerId) {
        const payload = { ...ownerForm };
        if (!payload.password) delete payload.password;
        await apiClient.patch(`/admin/owners/${editingOwnerId}`, payload);
      } else {
        await apiClient.post("/admin/owners", ownerForm);
      }
      setOwnerForm({ email: "", password: "", name: "", organization_name: "" });
      setEditingOwnerId(null);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to save owner");
    }
    setSaving(false);
  };

  const deleteOwner = async (id) => {
    if (!window.confirm("Are you sure you want to delete this owner and their organization? This cannot be undone.")) return;
    try {
      await apiClient.delete(`/admin/owners/${id}`);
      if (editingOwnerId === id) {
        setEditingOwnerId(null);
        setOwnerForm({ email: "", password: "", name: "", organization_name: "" });
      }
      load();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to delete owner");
    }
  };

  const createReview = async (e) => {
    e.preventDefault();
    setActionError("");
    setSaving(true);
    try {
      await apiClient.post("/admin/reviews", reviewForm);
      setReviewForm({
        youtubeCode: "",
        description: "",
        name: "",
        role: "",
        country: "",
        rating: 5,
        avatar: "",
      });
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to create review");
    }
    setSaving(false);
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Delete this video review?")) return;
    setActionError("");
    try {
      await apiClient.delete(`/admin/reviews/${id}`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to delete review");
    }
  };

  const deleteTeam = async (id) => {
    if (!window.confirm("Delete team member?")) return;
    await apiClient.delete(`/team/${id}`);
    load();
  };

  const openTeamModal = (member = null) => {
    if (member) {
      setEditingTeamId(member.id);
      setTeamForm({
        name: member.name || "",
        role: member.role || "",
        tier: member.tier || "senior-portfolio-manager",
        experience: member.experience || "",
        speaks: member.speaks || "",
        photo: member.photo || "",
        phone: member.phone || "",
        email: member.email || "",
        instagram: member.instagram || "",
        linkedin: member.linkedin || "",
        facebook: member.facebook || "",
        bio: member.bio || "",
        videoUrl: member.videoUrl || "",
        videoUrl2: member.videoUrl2 || "",
        isFounder: member.isFounder !== false && member.isFounder !== undefined,
        showOnHome: member.showOnHome !== false,
        showOnAbout: member.showOnAbout !== false,
        sortOrder: member.sortOrder || 0,
      });
    } else {
      setEditingTeamId(null);
      setTeamForm({
        name: "",
        role: "",
        tier: "senior-portfolio-manager",
        experience: "",
        speaks: "",
        photo: "",
        phone: "",
        email: "",
        instagram: "",
        linkedin: "",
        facebook: "",
        bio: "",
        videoUrl: "",
        videoUrl2: "",
        isFounder: false,
        showOnHome: true,
        showOnAbout: true,
        sortOrder: 0,
      });
    }
    setTeamModal(true);
  };

  const saveTeam = async (e) => {
    e.preventDefault();
    setActionError("");
    setSaving(true);
    try {
      if (editingTeamId) {
        await apiClient.put(`/team/${editingTeamId}`, teamForm);
      } else {
        await apiClient.post("/team", teamForm);
      }
      setTeamModal(false);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to save team member");
    }
    setSaving(false);
  };

  const openProjectModal = (project = null) => {
    setActionError("");
    setDuplicateNameError("");
    if (project) {
      setEditingProjectId(project.id);
      setProjectForm({
        id: project.id || "",
        name: project.name || "",
        developer: project.developer || "",
        location: project.location || "",
        emirate: project.emirate || "",
        type: project.type || "",
        configuration: joinCsv(project.configuration),
        price_from: project.price_from != null ? String(project.price_from) : "",
        price_currency: project.price_currency || "AED",
        sqft_from: project.sqft_from != null ? String(project.sqft_from) : "",
        handover: project.handover || "",
        status: project.status || "",
        hot: Boolean(project.hot),
        tagline: project.tagline || "",
        hero: project.hero || "",
        description: project.description || "",
        amenities: joinCsv(project.amenities),
        gallery: joinCsv(project.gallery),
      });
    } else {
      setEditingProjectId(null);
      setProjectForm(EMPTY_PROJECT_FORM);
    }
    setProjectModal(true);
  };

  /** Check if the typed project name duplicates an existing project (case-insensitive). */
  const checkDuplicateName = (name) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) { setDuplicateNameError(""); return; }
    const duplicate = projects.find(
      (p) => p.name.trim().toLowerCase() === trimmed && p.id !== editingProjectId
    );
    setDuplicateNameError(
      duplicate ? `A project named "${duplicate.name}" already exists.` : ""
    );
  };

  const buildProjectPayload = () => {
    const payload = {
      name: projectForm.name,
      developer: projectForm.developer,
      location: projectForm.location,
      emirate: projectForm.emirate,
      type: projectForm.type,
      configuration: splitCsv(projectForm.configuration),
      price_currency: projectForm.price_currency || "AED",
      handover: projectForm.handover,
      status: projectForm.status,
      hot: projectForm.hot,
      tagline: projectForm.tagline,
      hero: projectForm.hero,
      description: projectForm.description,
      amenities: splitCsv(projectForm.amenities),
    };
    if (projectForm.id) payload.id = projectForm.id;
    if (projectForm.price_from !== "") payload.price_from = Number(projectForm.price_from);
    if (projectForm.sqft_from !== "") payload.sqft_from = Number(projectForm.sqft_from);
    const gallery = splitCsv(projectForm.gallery);
    if (gallery.length) payload.gallery = gallery;
    return payload;
  };

  const saveProject = async (e) => {
    e.preventDefault();
    if (duplicateNameError) return; // block if duplicate name
    setActionError("");
    setSaving(true);
    try {
      const payload = buildProjectPayload();
      if (editingProjectId) {
        await apiClient.patch(`/admin/projects/${editingProjectId}`, payload);
      } else {
        if (!payload.id) {
          setActionError("Project ID is required for new projects");
          setSaving(false);
          return;
        }
        await apiClient.post("/admin/projects", payload);
      }
      setProjectModal(false);
      setDuplicateNameError("");
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to save project");
    }
    setSaving(false);
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    setActionError("");
    try {
      await apiClient.delete(`/admin/projects/${id}`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to delete project");
    }
  };

  const openBlogModal = (blog = null) => {
    setActionError("");
    if (blog) {
      setEditingBlogId(blog.id);
      setBlogForm({
        id: blog.id || "",
        title: blog.title || "",
        category: blog.category || "",
        author: blog.author || "",
        date: blog.date || "",
        read_minutes: blog.read_minutes != null ? String(blog.read_minutes) : "",
        cover: blog.cover || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
      });
    } else {
      setEditingBlogId(null);
      setBlogForm(EMPTY_BLOG_FORM);
    }
    setBlogModal(true);
  };

  const buildBlogPayload = () => {
    const payload = {
      title: blogForm.title,
      category: blogForm.category,
      author: blogForm.author,
      date: blogForm.date,
      cover: blogForm.cover,
      excerpt: blogForm.excerpt,
      content: blogForm.content,
    };
    if (blogForm.id) payload.id = blogForm.id;
    if (blogForm.read_minutes !== "") payload.read_minutes = Number(blogForm.read_minutes);
    return payload;
  };

  const saveBlog = async (e) => {
    e.preventDefault();
    setActionError("");
    setSaving(true);
    try {
      const payload = buildBlogPayload();
      if (editingBlogId) {
        await apiClient.patch(`/admin/blogs/${editingBlogId}`, payload);
      } else {
        if (!payload.id) {
          setActionError("Blog ID is required for new posts");
          setSaving(false);
          return;
        }
        await apiClient.post("/admin/blogs", payload);
      }
      setBlogModal(false);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to save blog");
    }
    setSaving(false);
  };

  const deleteBlog = async (id) => {
    if (!window.confirm("Delete this blog post?")) return;
    setActionError("");
    try {
      await apiClient.delete(`/admin/blogs/${id}`);
      load();
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to delete blog");
    }
  };

  const savePopupSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError("");
    setPopupSaved(false);
    try {
      const res = await apiClient.put("/admin/settings/popup", popupForm);
      if (res.data) {
        setPopupForm({
          tag: res.data.tag || "",
          title: res.data.title || "",
          description: res.data.description || "",
          btn1_label: res.data.btn1_label || "",
          btn1_link: res.data.btn1_link || "",
          btn2_label: res.data.btn2_label || "",
          btn2_link: res.data.btn2_link || "",
          active: res.data.active ?? true,
          poster_image_url: res.data.poster_image_url || "",
          project_link: res.data.project_link || "",
          popup_type: res.data.popup_type || (res.data.poster_image_url ? "image" : "text"),
        });
        setPopupSaved(true);
        setTimeout(() => setPopupSaved(false), 3000);
      }
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to update popup settings");
    }
    setSaving(false);
  };

  const updateConsultationStatus = async (id, newStatus) => {
    setActionError("");
    try {
      await apiClient.patch(`/admin/consultations/${id}`, { status: newStatus });
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to update booking status");
    }
  };

  const deleteConsultation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    setActionError("");
    try {
      await apiClient.delete(`/admin/consultations/${id}`);
      setConsultations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to delete booking");
    }
  };

  const saveHomepageSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    setActionError("");
    try {
      const res = await apiClient.put("/admin/settings/homepage", homepageForm);
      if (res.data) {
        setHomepageForm({
          ...DEFAULT_HOMEPAGE_FORM,
          launch_title: res.data.launch_title || "",
          launch_description: res.data.launch_description || "",
          launch_video_url: res.data.launch_video_url || "",
          stat1_value: res.data.stat1_value || "",
          stat1_label: res.data.stat1_label || "",
          stat2_value: res.data.stat2_value || "",
          stat2_label: res.data.stat2_label || "",
          stat3_value: res.data.stat3_value || "",
          stat3_label: res.data.stat3_label || "",
          stat4_value: res.data.stat4_value || "",
          stat4_label: res.data.stat4_label || "",
          founders_image_url: res.data.founders_image_url || "",
          company_address: res.data.company_address || "",
          company_phone: res.data.company_phone || "",
          company_email: res.data.company_email || "",
          company_whatsapp: res.data.company_whatsapp || "",
          company_instagram: res.data.company_instagram || "",
          company_linkedin: res.data.company_linkedin || "",
        });
        alert("Homepage settings updated successfully!");
      }
    } catch (err) {
      setActionError(err.response?.data?.detail || "Failed to update homepage settings");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex">
      <aside className="admin-sidebar-fixed hidden lg:flex fixed top-0 left-0 h-screen min-h-screen w-64 bg-[var(--ink)] flex-col z-50 lg:static lg:flex-shrink-0">
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/triad_logo.jpeg"
              alt="Triad Realty"
              className="h-9 w-auto object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display text-white text-sm leading-tight truncate">Triad Realty</p>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Developer Portal</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-white text-sm font-medium truncate">Platform Developer</p>
          <p className="text-white/40 text-xs truncate">{user?.email}</p>
          {health && (
            <p className="text-white/35 text-[10px] mt-2 leading-relaxed">
              DB: {health.database} · {health.projects} projects · {health.users} users
            </p>
          )}
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left ${
                tab === t
                  ? "bg-[var(--gold)] text-[var(--ink)] font-medium"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              {TAB_LABELS[t]}
            </button>
          ))}
        </nav>

        <div className="px-4 pb-6">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors rounded-lg hover:bg-white/10"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-wrap justify-between items-start gap-4 mb-8 sm:mb-10">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl">Developer Console</h1>
            <p className="text-[var(--muted)] text-sm mt-1.5">Manage site content, team profiles, owners, and launch settings.</p>
          </div>
        </div>

        {actionError && !teamModal && !projectModal && !blogModal && (
          <p className="text-red-600 text-sm mb-4">{actionError}</p>
        )}

        {loading ? (
          <p className="text-[var(--muted)]">Loading…</p>
        ) : (
          <>
            {tab === "team" && (
              <div className="bg-white p-8 border border-[var(--line)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl">Team ({team.length})</h2>
                  <button type="button" onClick={() => openTeamModal()} className="btn-gold !px-4 !py-2 flex gap-2 items-center text-sm">
                    <Plus size={14} /> Add Member
                  </button>
                </div>
                {/* Group members by tier */}
                {TIER_KEYS.map((tierKey) => {
                  const members = team.filter((m) => (m.tier || "senior-portfolio-manager") === tierKey);
                  return (
                    <div key={tierKey} className="mb-8">
                      <p className="overline text-[var(--muted)] mb-2">{TIER_LABELS[tierKey]}</p>
                      {members.length === 0 ? (
                        <p className="text-sm text-[var(--muted)] pl-2 italic">No members in this section</p>
                      ) : (
                        <ul className="space-y-1">
                          {members.map((m) => (
                            <li key={m.id} className="flex justify-between items-center border-b border-[var(--line)] py-2">
                              <span className="text-sm">{m.name} — <span className="text-[var(--muted)]">{m.role}</span></span>
                              <div className="flex gap-2">
                                <button type="button" onClick={() => openTeamModal(m)} className="p-1 hover:bg-[var(--bg-alt)] rounded">
                                  <Edit size={14} />
                                </button>
                                <button type="button" onClick={() => deleteTeam(m.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                  <Trash size={14} />
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            )}



            {tab === "owners" && (
              <div className="grid lg:grid-cols-2 gap-8">
                <form onSubmit={saveOwner} className="bg-white p-8 border border-[var(--line)] space-y-4">
                  <h2 className="font-display text-2xl font-semibold">{editingOwnerId ? "Edit Owner" : "Create Owner"}</h2>
                  <input
                    placeholder="Name"
                    required
                    className="input-line w-full"
                    value={ownerForm.name}
                    onChange={(e) => setOwnerForm({ ...ownerForm, name: e.target.value })}
                  />
                  <input
                    placeholder="Email"
                    type="email"
                    required
                    className="input-line w-full"
                    value={ownerForm.email}
                    onChange={(e) => setOwnerForm({ ...ownerForm, email: e.target.value })}
                  />
                  <input
                    placeholder={editingOwnerId ? "Password (leave blank to keep current)" : "Password"}
                    type="password"
                    required={!editingOwnerId}
                    className="input-line w-full"
                    value={ownerForm.password}
                    onChange={(e) => setOwnerForm({ ...ownerForm, password: e.target.value })}
                  />
                  <input
                    placeholder="Organization name"
                    required
                    className="input-line w-full"
                    value={ownerForm.organization_name}
                    onChange={(e) => setOwnerForm({ ...ownerForm, organization_name: e.target.value })}
                  />
                  <div className="flex gap-3">
                    <button type="submit" className="btn-gold">
                      {editingOwnerId ? "Save Changes" : "Create"}
                    </button>
                    {editingOwnerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOwnerId(null);
                          setOwnerForm({ email: "", password: "", name: "", organization_name: "" });
                        }}
                        className="px-5 py-2 border border-[var(--line)] text-sm rounded hover:border-[var(--ink)] transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                <div className="bg-white p-8 border border-[var(--line)]">
                  <h2 className="font-display text-2xl mb-4 font-semibold">Owners ({owners.length})</h2>
                  <ul className="space-y-3">
                    {owners.map((o) => (
                      <li key={o.id} className="flex justify-between items-center border-b border-[var(--line)] pb-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-[var(--ink)]">{o.name}</p>
                          <p className="text-xs text-[var(--muted)]">{o.email} · {o.organization_name}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingOwnerId(o.id);
                              setOwnerForm({
                                name: o.name,
                                email: o.email,
                                password: "",
                                organization_name: o.organization_name || "",
                              });
                            }}
                            className="p-1.5 hover:bg-[var(--bg-alt)] rounded text-[var(--ink)] transition-colors"
                            title="Edit Owner"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteOwner(o.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Delete Owner"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {tab === "projects" && (
              <div className="bg-white p-8 border border-[var(--line)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl">Projects ({projects.length})</h2>
                  <button type="button" onClick={() => openProjectModal()} className="btn-gold !px-4 !py-2 flex gap-2 items-center text-sm">
                    <Plus size={14} /> Add Project
                  </button>
                </div>
                <ul className="space-y-2">
                  {projects.map((p) => (
                    <li key={p.id} className="flex justify-between items-center border-b border-[var(--line)] py-2">
                      <span className="text-sm">
                        {p.name} <span className="text-[var(--muted)]">— {p.emirate}</span>
                      </span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openProjectModal(p)} className="p-1 hover:bg-[var(--bg-alt)] rounded">
                          <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => deleteProject(p.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "blogs" && (
              <div className="bg-white p-8 border border-[var(--line)]">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="font-display text-2xl">Blogs ({blogs.length})</h2>
                  <button type="button" onClick={() => openBlogModal()} className="btn-gold !px-4 !py-2 flex gap-2 items-center text-sm">
                    <Plus size={14} /> Add Blog
                  </button>
                </div>
                <ul className="space-y-2">
                  {blogs.map((b) => (
                    <li key={b.id} className="flex justify-between items-center border-b border-[var(--line)] py-2">
                      <span className="text-sm">{b.title}</span>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => openBlogModal(b)} className="p-1 hover:bg-[var(--bg-alt)] rounded">
                          <Edit size={14} />
                        </button>
                        <button type="button" onClick={() => deleteBlog(b.id)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                          <Trash size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {tab === "home" && (
              <form onSubmit={saveHomepageSettings} className="bg-white p-8 border border-[var(--line)] space-y-6 max-w-4xl">
                <h2 className="font-display text-2xl mb-4">Homepage &amp; Contact Settings</h2>
                <div className="border border-[var(--line)] p-5 space-y-4 bg-[var(--bg-alt)] rounded">
                  <p className="overline text-[var(--muted)]">Contact Information</p>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Office Address / Location</label>
                    <input
                      placeholder="e.g. Office 1204, Marina Plaza, Dubai Marina, Dubai, UAE"
                      required
                      className="input-line w-full"
                      value={homepageForm.company_address}
                      onChange={(e) => setHomepageForm({ ...homepageForm, company_address: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Phone Number</label>
                      <input placeholder="+971 54 519 3393" className="input-line w-full" value={homepageForm.company_phone} onChange={(e) => setHomepageForm({ ...homepageForm, company_phone: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Email Address</label>
                      <input type="email" placeholder="info@triadrealityuae.com" className="input-line w-full" value={homepageForm.company_email} onChange={(e) => setHomepageForm({ ...homepageForm, company_email: e.target.value })} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">WhatsApp Link (with pre-filled message)</label>
                    <input placeholder="https://wa.me/971545193393?text=Hello..." className="input-line w-full" value={homepageForm.company_whatsapp} onChange={(e) => setHomepageForm({ ...homepageForm, company_whatsapp: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Instagram URL</label>
                      <input placeholder="https://www.instagram.com/triadrealty.ae" className="input-line w-full" value={homepageForm.company_instagram} onChange={(e) => setHomepageForm({ ...homepageForm, company_instagram: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">LinkedIn URL</label>
                      <input placeholder="https://www.linkedin.com/company/triadrealty-ae/" className="input-line w-full" value={homepageForm.company_linkedin} onChange={(e) => setHomepageForm({ ...homepageForm, company_linkedin: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Section Title</label>
                  <input
                    placeholder="e.g. Why Triad Realty?"
                    required
                    className="input-line w-full"
                    value={homepageForm.launch_title}
                    onChange={(e) => setHomepageForm({ ...homepageForm, launch_title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Description</label>
                  <textarea
                    placeholder="Short launch update introduction"
                    required
                    rows={4}
                    className="w-full border border-[var(--line)] p-3 text-sm"
                    value={homepageForm.launch_description}
                    onChange={(e) => setHomepageForm({ ...homepageForm, launch_description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">YouTube Video URL</label>
                    <input
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="input-line w-full"
                      value={homepageForm.launch_video_url}
                      onChange={(e) => setHomepageForm({ ...homepageForm, launch_video_url: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Founders Image URL</label>
                    <input
                      placeholder="https://..."
                      className="input-line w-full"
                      value={homepageForm.founders_image_url}
                      onChange={(e) => setHomepageForm({ ...homepageForm, founders_image_url: e.target.value })}
                    />
                    <FileUploadButton onUploadSuccess={(url) => setHomepageForm({ ...homepageForm, founders_image_url: url })} label="Upload Founders Image" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="border border-[var(--line)] p-5">
                      <p className="overline text-[var(--muted)] mb-3">Detail {n}</p>
                      <input
                        placeholder="Value"
                        required
                        className="input-line w-full"
                        value={homepageForm[`stat${n}_value`]}
                        onChange={(e) => setHomepageForm({ ...homepageForm, [`stat${n}_value`]: e.target.value })}
                      />
                      <input
                        placeholder="Label"
                        required
                        className="input-line w-full mt-3"
                        value={homepageForm[`stat${n}_label`]}
                        onChange={(e) => setHomepageForm({ ...homepageForm, [`stat${n}_label`]: e.target.value })}
                      />
                    </div>
                  ))}
                </div>
                <button type="submit" disabled={saving} className="btn-gold w-full !py-3">
                  {saving ? "Saving..." : "Save Homepage Settings"}
                </button>
              </form>
            )}

            {tab === "popup" && (
              <form onSubmit={savePopupSettings} className="bg-white p-8 border border-[var(--line)] space-y-6 max-w-2xl">
                <h2 className="font-display text-2xl mb-4">Launch Popup / Notification Settings</h2>
                
                <div className="flex items-center gap-2 pb-2">
                  <input
                    type="checkbox"
                    id="popup-active"
                    checked={popupForm.active}
                    onChange={(e) => setPopupForm({ ...popupForm, active: e.target.checked })}
                    className="w-4 h-4 text-[var(--gold)] border-[var(--line)] rounded focus:ring-[var(--gold)]"
                  />
                  <label htmlFor="popup-active" className="text-sm font-medium cursor-pointer">
                    Enable Popup / Notification on site
                  </label>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Notification Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPopupForm({ ...popupForm, popup_type: "text" })}
                      className={`py-3 text-center text-sm border font-medium transition-colors ${
                        popupForm.popup_type === "text"
                          ? "border-[var(--gold)] bg-[var(--bg-alt)] text-[var(--ink)]"
                          : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Text-based Hot Launch Card
                    </button>
                    <button
                      type="button"
                      onClick={() => setPopupForm({ ...popupForm, popup_type: "image" })}
                      className={`py-3 text-center text-sm border font-medium transition-colors ${
                        popupForm.popup_type === "image"
                          ? "border-[var(--gold)] bg-[var(--bg-alt)] text-[var(--ink)]"
                          : "border-[var(--line)] text-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      Poster Image Popup
                    </button>
                  </div>
                </div>

                {popupForm.popup_type === "image" ? (
                  <>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Poster Image URL</label>
                      <input
                        placeholder="https://images.unsplash.com/... or base64 image data"
                        required={popupForm.active && popupForm.popup_type === "image"}
                        className="input-line w-full"
                        value={popupForm.poster_image_url}
                        onChange={(e) => setPopupForm({ ...popupForm, poster_image_url: e.target.value })}
                      />
                      <FileUploadButton onUploadSuccess={(url) => setPopupForm({ ...popupForm, poster_image_url: url })} label="Upload Poster Image" />
                      {popupForm.poster_image_url && (
                        <div className="mt-4 max-w-sm border border-[var(--line)] bg-[var(--bg-alt)] overflow-hidden">
                          <img
                            src={resolveMediaUrl(popupForm.poster_image_url)}
                            alt="Poster Preview"
                            className="w-full h-auto block"
                            style={{ display: "block" }}
                          />
                          <p className="text-[10px] text-[var(--muted)] px-3 py-2">Preview — shown at actual proportions, no cropping.</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Link to Project</label>
                      <select
                        className="input-line w-full mt-2 cursor-pointer"
                        value={popupForm.project_link}
                        onChange={(e) => setPopupForm({ ...popupForm, project_link: e.target.value })}
                      >
                        <option value="">No link (Not clickable)</option>
                        {projects.map((p) => (
                          <option key={p.id} value={`/projects/${p.id}`}>
                            {p.name} ({p.location})
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Tag / Ribbon</label>
                        <input
                          placeholder="e.g. New Launch, Hot Launch"
                          className="input-line w-full"
                          value={popupForm.tag}
                          onChange={(e) => setPopupForm({ ...popupForm, tag: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Title</label>
                        <input
                          placeholder="e.g. Marina Aurora — Pre-Launch"
                          required={popupForm.active && popupForm.popup_type === "text"}
                          className="input-line w-full"
                          value={popupForm.title}
                          onChange={(e) => setPopupForm({ ...popupForm, title: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Description</label>
                      <textarea
                        placeholder="Exclusive access to Emaar's newest waterfront tower before the public release..."
                        rows={3}
                        required={popupForm.active && popupForm.popup_type === "text"}
                        className="w-full border border-[var(--line)] p-3 text-sm"
                        value={popupForm.description}
                        onChange={(e) => setPopupForm({ ...popupForm, description: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Primary Button Label</label>
                        <input
                          placeholder="e.g. View Details"
                          className="input-line w-full"
                          value={popupForm.btn1_label}
                          onChange={(e) => setPopupForm({ ...popupForm, btn1_label: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Primary Button Link</label>
                        <input
                          placeholder="e.g. /projects/marina-aurora"
                          className="input-line w-full"
                          value={popupForm.btn1_link}
                          onChange={(e) => setPopupForm({ ...popupForm, btn1_link: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Secondary Button Label</label>
                        <input
                          placeholder="e.g. Compare"
                          className="input-line w-full"
                          value={popupForm.btn2_label}
                          onChange={(e) => setPopupForm({ ...popupForm, btn2_label: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Secondary Button Link</label>
                        <input
                          placeholder="e.g. /analysis"
                          className="input-line w-full"
                          value={popupForm.btn2_link}
                          onChange={(e) => setPopupForm({ ...popupForm, btn2_link: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 pt-4 border-t border-[var(--line)]">
                  <button type="submit" disabled={saving} className="btn-gold flex-1 !py-3">
                    {saving ? "Saving..." : "Save Settings"}
                  </button>
                  {popupSaved && (
                    <span className="text-green-600 text-sm font-medium animate-fade-in">
                      ✓ Settings saved
                    </span>
                  )}
                </div>
              </form>
            )}



            {tab === "reviews" && (
              <div className="grid lg:grid-cols-2 gap-8">
                <form onSubmit={createReview} className="bg-white p-8 border border-[var(--line)] space-y-4">
                  <h2 className="font-display text-2xl font-semibold">Post Video Review</h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Client Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        className="w-full border border-[var(--line)] p-2.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                        value={reviewForm.name}
                        onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Role/Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Off-Plan Buyer"
                        className="w-full border border-[var(--line)] p-2.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                        value={reviewForm.role}
                        onChange={(e) => setReviewForm({ ...reviewForm, role: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Country</label>
                      <input
                        type="text"
                        placeholder="e.g. United Kingdom"
                        className="w-full border border-[var(--line)] p-2.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                        value={reviewForm.country}
                        onChange={(e) => setReviewForm({ ...reviewForm, country: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Rating</label>
                      <select
                        className="w-full border border-[var(--line)] p-2.5 text-sm focus:outline-none focus:border-[var(--gold)] bg-white"
                        value={reviewForm.rating}
                        onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                      >
                        <option value={5}>5 Stars</option>
                        <option value={4}>4 Stars</option>
                        <option value={3}>3 Stars</option>
                        <option value={2}>2 Stars</option>
                        <option value={1}>1 Star</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Client Profile Picture (Avatar)</label>
                    <input
                      type="text"
                      placeholder="Paste image URL or upload file"
                      className="w-full border border-[var(--line)] p-2.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                      value={reviewForm.avatar}
                      onChange={(e) => setReviewForm({ ...reviewForm, avatar: e.target.value })}
                    />
                    <FileUploadButton
                      onUploadSuccess={(url) => setReviewForm({ ...reviewForm, avatar: url })}
                      label="Upload Profile Photo"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">YouTube Embed, Video Link, or Uploaded Video</label>
                    <textarea
                      placeholder="Paste <iframe> embed code, YouTube watch link, or upload video below"
                      required
                      rows={2}
                      className="w-full border border-[var(--line)] p-2.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                      value={reviewForm.youtubeCode}
                      onChange={(e) => setReviewForm({ ...reviewForm, youtubeCode: e.target.value })}
                    />
                    <FileUploadButton
                      onUploadSuccess={(url) => setReviewForm({ ...reviewForm, youtubeCode: url })}
                      label="Upload Review Video"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Written Review/Description</label>
                    <textarea
                      placeholder="Enter client's review text here..."
                      required
                      rows={3}
                      className="w-full border border-[var(--line)] p-2.5 text-sm focus:outline-none focus:border-[var(--gold)]"
                      value={reviewForm.description}
                      onChange={(e) => setReviewForm({ ...reviewForm, description: e.target.value })}
                    />
                  </div>

                  <button type="submit" disabled={saving} className="btn-gold w-full mt-2">
                    {saving ? "Posting..." : "Post Review"}
                  </button>
                </form>

                <div className="bg-white p-8 border border-[var(--line)]">
                  <h2 className="font-display text-2xl mb-4 font-semibold">Video Reviews ({reviews.length})</h2>
                  <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                    {reviews.length === 0 && (
                      <p className="text-[var(--muted)] text-sm">No video reviews posted yet.</p>
                    )}
                    {reviews.map((rev) => (
                      <div key={rev.id} className="border-b border-[var(--line)] pb-4 flex justify-between gap-4 items-start">
                        <div className="flex gap-3 min-w-0 flex-1">
                          {rev.avatar && (
                            <img
                              src={resolveMediaUrl(rev.avatar)}
                              alt=""
                              className="w-10 h-10 rounded-full object-cover border border-[var(--line)] flex-shrink-0"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--ink)]">{rev.name || "Anonymous"}</span>
                              {rev.rating && (
                                <span className="text-xs text-[var(--gold-deep)] flex items-center gap-0.5 font-bold">
                                  ★ {rev.rating}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--muted)] mt-0.5">
                              {rev.role} {rev.country ? `· ${rev.country}` : ""}
                            </p>
                            <p className="text-sm italic font-medium text-[var(--ink-2)] mt-1.5 line-clamp-2">
                              "{rev.description}"
                            </p>
                            <p className="text-[10px] text-[var(--muted)] truncate mt-1">Video: {rev.youtubeCode.slice(0, 40)}...</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteReview(rev.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded flex-shrink-0 transition-colors"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {tab === "status" && (
              <div className="space-y-8">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl font-semibold flex items-center gap-2">
                      <Activity size={20} className="text-[var(--gold-deep)]" />
                      System Status
                    </h2>
                    <p className="text-xs text-[var(--muted)] mt-1">
                      Live diagnostic view · auto-refreshes every 30s on this tab
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={refreshHealth}
                    disabled={healthRefreshing}
                    className="btn-ghost !px-4 !py-2 flex items-center gap-2 text-sm"
                  >
                    <RefreshCw size={14} className={healthRefreshing ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                {!health ? (
                  <div className="bg-white border border-[var(--line)] p-8 text-center text-[var(--muted)]">
                    No health data available.
                  </div>
                ) : (
                  <>
                    {/* Overall Status Banner */}
                    <div className={`flex items-center gap-4 p-5 border-l-4 ${health.status === "ok" ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
                      {health.status === "ok"
                        ? <CheckCircle size={28} className="text-green-600 flex-shrink-0" />
                        : <XCircle size={28} className="text-red-600 flex-shrink-0" />}
                      <div>
                        <p className={`font-semibold text-lg ${health.status === "ok" ? "text-green-800" : "text-red-800"}`}>
                          {health.status === "ok" ? "All systems operational" : "System issues detected"}
                        </p>
                        <p className="text-xs text-[var(--muted)] mt-0.5">
                          Last checked: {health.timestamp ? new Date(health.timestamp).toLocaleString() : "—"}
                        </p>
                      </div>
                    </div>

                    {/* Server Info Row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: <Clock size={18} className="text-[var(--gold-deep)]" />, label: "Uptime", value: health.uptime || "—" },
                        { icon: <Database size={18} className="text-[var(--gold-deep)]" />, label: "Database", value: health.database || "—" },
                        { icon: <Users size={18} className="text-[var(--gold-deep)]" />, label: "Users", value: health.counts?.users ?? health.users ?? "—" },
                        { icon: <Activity size={18} className="text-[var(--gold-deep)]" />, label: "Leads", value: health.counts?.leads ?? health.leads ?? "—" },
                      ].map((s) => (
                        <div key={s.label} className="bg-white border border-[var(--line)] p-5">
                          <div className="flex items-center gap-2 mb-2">{s.icon}<span className="text-xs uppercase tracking-widest text-[var(--muted)]">{s.label}</span></div>
                          <div className="font-display text-3xl font-semibold text-[var(--ink)]">{s.value}</div>
                        </div>
                      ))}
                    </div>

                    {/* Collection Counts */}
                    {health.counts && (
                      <div className="bg-white border border-[var(--line)] p-6">
                        <h3 className="font-display text-lg font-semibold mb-4">Database Collections</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                          {Object.entries(health.counts).map(([col, count]) => (
                            <div key={col} className="text-center border border-[var(--line)] p-4">
                              <div className="font-display text-2xl font-bold text-[var(--gold-deep)]">{count}</div>
                              <div className="text-[10px] uppercase tracking-widest text-[var(--muted)] mt-1 capitalize">{col}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Environment / Config Checks */}
                    {health.checks && (
                      <div className="bg-white border border-[var(--line)] p-6">
                        <h3 className="font-display text-lg font-semibold mb-4">Configuration Checks</h3>
                        <div className="divide-y divide-[var(--line)]">
                          {[
                            { key: "jwt_secret_strong",  label: "JWT Secret — Strong key set", warn: "Weak or default JWT secret detected!" },
                            { key: "database",           label: `Database — ${health.checks.database}`, isText: true },
                            { key: "mongo_uri_set",      label: "MongoDB URI — configured", warn: "MONGODB_URI not set (using in-memory store)" },
                            { key: "reelly_api_key_set", label: "Reelly API Key — configured", warn: "REELLY_API_KEY not set (property sync unavailable)" },
                            { key: "sendgrid_key_set",   label: "SendGrid API Key — configured", warn: "SENDGRID_API_KEY not set (email notifications disabled)" },
                          ].map(({ key, label, warn, isText }) => {
                            const val = health.checks[key];
                            const ok  = isText ? true : Boolean(val);
                            return (
                              <div key={key} className="flex items-center justify-between py-3 gap-4">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-[var(--ink)]">{label}</p>
                                  {!ok && warn && <p className="text-xs text-red-500 mt-0.5">{warn}</p>}
                                </div>
                                {isText
                                  ? <span className="text-xs font-mono bg-[var(--bg-alt)] px-2 py-1 rounded flex-shrink-0">{String(val)}</span>
                                  : ok
                                    ? <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                                    : <XCircle    size={18} className="text-red-500 flex-shrink-0" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Recent Leads */}
                    {health.recent_leads && (
                      <div className="bg-white border border-[var(--line)] p-6">
                        <h3 className="font-display text-lg font-semibold mb-4">
                          Recent Lead Submissions
                          <span className="ml-2 text-sm font-normal text-[var(--muted)]">(last 10)</span>
                        </h3>
                        {health.recent_leads.length === 0 ? (
                          <p className="text-sm text-[var(--muted)]">No leads submitted yet.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-[var(--line)] text-left">
                                  <th className="pb-2 pr-4 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Name</th>
                                  <th className="pb-2 pr-4 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Email</th>
                                  <th className="pb-2 pr-4 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Phone</th>
                                  <th className="pb-2 pr-4 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Asset / Source</th>
                                  <th className="pb-2 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Submitted</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--line)]">
                                {health.recent_leads.map((lead, i) => (
                                  <tr key={i} className="hover:bg-[var(--bg-alt)] transition-colors">
                                    <td className="py-2.5 pr-4 font-medium text-[var(--ink)]">{lead.name || "—"}</td>
                                    <td className="py-2.5 pr-4 text-[var(--muted)]">{lead.email || "—"}</td>
                                    <td className="py-2.5 pr-4 text-[var(--muted)]">{lead.phone || "—"}</td>
                                    <td className="py-2.5 pr-4">
                                      <span className="bg-[var(--ink)] text-[var(--gold)] text-[10px] uppercase tracking-widest px-2 py-0.5 font-semibold">
                                        {lead.asset || "—"}
                                      </span>
                                      {lead.source && <span className="ml-2 text-[var(--muted)] text-xs">{lead.source}</span>}
                                    </td>
                                    <td className="py-2.5 text-xs text-[var(--muted)] whitespace-nowrap">
                                      {lead.created_at ? new Date(lead.created_at).toLocaleString() : "—"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
        </div>
      </main>

      {teamModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex justify-end">
          <div className="w-full max-w-xl sm:max-w-lg bg-white h-full overflow-y-auto border-l border-[var(--gold)]/30 shadow-2xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl">{editingTeamId ? "Edit Member" : "Add Member"}</h2>
              <button type="button" onClick={() => setTeamModal(false)}>
                <X size={20} />
              </button>
            </div>
            {actionError && <p className="text-red-600 text-sm">{actionError}</p>}
            <form onSubmit={saveTeam} className="space-y-4">
              <input required placeholder="Name *" className="input-line w-full" value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} />
              <input required placeholder="Role *" className="input-line w-full" value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} />
              {/* Section Tier */}
              <div>
                <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Section / Tier</label>
                <select
                  className="w-full border border-[var(--line)] p-3 text-sm bg-white"
                  value={teamForm.tier}
                  onChange={(e) => setTeamForm({ ...teamForm, tier: e.target.value })}
                >
                  {TIER_KEYS.map((k) => (
                    <option key={k} value={k}>{TIER_LABELS[k]}</option>
                  ))}
                </select>
              </div>
              <div>
                <input placeholder="Photo URL" className="input-line w-full" value={teamForm.photo} onChange={(e) => setTeamForm({ ...teamForm, photo: e.target.value })} />
                <FileUploadButton onUploadSuccess={(url) => setTeamForm({ ...teamForm, photo: url })} label="Upload Photo" />
              </div>
              <input placeholder="Phone" className="input-line w-full" value={teamForm.phone} onChange={(e) => setTeamForm({ ...teamForm, phone: e.target.value })} />
              <input type="email" placeholder="Email" className="input-line w-full" value={teamForm.email} onChange={(e) => setTeamForm({ ...teamForm, email: e.target.value })} />
              <input placeholder="Instagram URL" className="input-line w-full" value={teamForm.instagram} onChange={(e) => setTeamForm({ ...teamForm, instagram: e.target.value })} />
              <input placeholder="LinkedIn URL" className="input-line w-full" value={teamForm.linkedin} onChange={(e) => setTeamForm({ ...teamForm, linkedin: e.target.value })} />
              <input placeholder="Facebook URL" className="input-line w-full" value={teamForm.facebook} onChange={(e) => setTeamForm({ ...teamForm, facebook: e.target.value })} />
              <input placeholder="Experience" className="input-line w-full" value={teamForm.experience} onChange={(e) => setTeamForm({ ...teamForm, experience: e.target.value })} />
              <input placeholder="Speaks" className="input-line w-full" value={teamForm.speaks} onChange={(e) => setTeamForm({ ...teamForm, speaks: e.target.value })} />

              <textarea placeholder="Bio" rows={4} className="w-full border border-[var(--line)] p-3 text-sm" value={teamForm.bio} onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })} />
              <div className="pt-2 border-t border-[var(--line)] space-y-4">
                <p className="overline text-[var(--muted)]">Featured Videos</p>
                <div>
                  <input placeholder="Video URL 1 (YouTube link or direct file)" className="input-line w-full" value={teamForm.videoUrl} onChange={(e) => setTeamForm({ ...teamForm, videoUrl: e.target.value })} />
                  <FileUploadButton onUploadSuccess={(url) => setTeamForm({ ...teamForm, videoUrl: url })} label="Upload Video 1" />
                </div>
                <div>
                  <input placeholder="Video URL 2 (YouTube link or direct file)" className="input-line w-full" value={teamForm.videoUrl2} onChange={(e) => setTeamForm({ ...teamForm, videoUrl2: e.target.value })} />
                  <FileUploadButton onUploadSuccess={(url) => setTeamForm({ ...teamForm, videoUrl2: url })} label="Upload Video 2" />
                </div>
              </div>
              <div className="pt-2 border-t border-[var(--line)] space-y-3">
                <p className="overline text-[var(--muted)] mb-1">Display & Ordering Settings</p>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm text-[var(--ink)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teamForm.isFounder}
                      onChange={(e) => setTeamForm({ ...teamForm, isFounder: e.target.checked })}
                      className="rounded border-[var(--line)] text-[var(--gold)] focus:ring-[var(--gold)]"
                    />
                    <span>Is Founder</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--ink)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teamForm.showOnHome}
                      onChange={(e) => setTeamForm({ ...teamForm, showOnHome: e.target.checked })}
                      className="rounded border-[var(--line)] text-[var(--gold)] focus:ring-[var(--gold)]"
                    />
                    <span>Show on Homepage</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[var(--ink)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={teamForm.showOnAbout}
                      onChange={(e) => setTeamForm({ ...teamForm, showOnAbout: e.target.checked })}
                      className="rounded border-[var(--line)] text-[var(--gold)] focus:ring-[var(--gold)]"
                    />
                    <span>Show on About Us page</span>
                  </label>
                </div>
                <div className="mt-3">
                  <label className="text-xs text-[var(--muted)] uppercase tracking-wider block mb-1">Sort Order (Lower numbers show first)</label>
                  <input
                    type="number"
                    placeholder="Sort Order"
                    className="input-line w-full"
                    value={teamForm.sortOrder}
                    onChange={(e) => setTeamForm({ ...teamForm, sortOrder: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <button type="submit" disabled={saving} className="btn-gold w-full">{saving ? "Saving…" : "Save"}</button>
            </form>
          </div>
        </div>
      )}

      {projectModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto border-l border-[var(--gold)]/30 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl">{editingProjectId ? "Edit Project" : "Add Project"}</h2>
              <button type="button" onClick={() => setProjectModal(false)}>
                <X size={20} />
              </button>
            </div>
            {actionError && <p className="text-red-600 text-sm mb-4">{actionError}</p>}
            <form onSubmit={saveProject} className="space-y-4">
              <input
                required
                disabled={Boolean(editingProjectId)}
                placeholder="ID (slug) *"
                className="input-line w-full disabled:opacity-50"
                value={projectForm.id}
                onChange={(e) => setProjectForm({ ...projectForm, id: e.target.value })}
              />
              {/* Project Name with real-time duplicate detection */}
              <div>
                <input
                  required
                  placeholder="Name *"
                  className={`input-line w-full ${duplicateNameError ? "border-red-400" : ""}`}
                  value={projectForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setProjectForm({ ...projectForm, name });
                    checkDuplicateName(name);
                  }}
                />
                {duplicateNameError && (
                  <p className="text-red-500 text-[11px] mt-1 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/><path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/></svg>
                    {duplicateNameError}
                  </p>
                )}
              </div>
              <input placeholder="Developer" className="input-line w-full" value={projectForm.developer} onChange={(e) => setProjectForm({ ...projectForm, developer: e.target.value })} />
              <input required placeholder="Location *" className="input-line w-full" value={projectForm.location} onChange={(e) => setProjectForm({ ...projectForm, location: e.target.value })} />
              <input required placeholder="Emirate *" className="input-line w-full" value={projectForm.emirate} onChange={(e) => setProjectForm({ ...projectForm, emirate: e.target.value })} />
              <input placeholder="Type (Apartment, Villa…)" className="input-line w-full" value={projectForm.type} onChange={(e) => setProjectForm({ ...projectForm, type: e.target.value })} />
              <input placeholder="Configuration (comma-separated)" className="input-line w-full" value={projectForm.configuration} onChange={(e) => setProjectForm({ ...projectForm, configuration: e.target.value })} />
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="Price from" className="input-line w-full" value={projectForm.price_from} onChange={(e) => setProjectForm({ ...projectForm, price_from: e.target.value })} />
                <input placeholder="Currency" className="input-line w-full" value={projectForm.price_currency} onChange={(e) => setProjectForm({ ...projectForm, price_currency: e.target.value })} />
              </div>
              <input type="number" placeholder="Sqft from" className="input-line w-full" value={projectForm.sqft_from} onChange={(e) => setProjectForm({ ...projectForm, sqft_from: e.target.value })} />
              <input placeholder="Handover" className="input-line w-full" value={projectForm.handover} onChange={(e) => setProjectForm({ ...projectForm, handover: e.target.value })} />
              <input placeholder="Status" className="input-line w-full" value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} />
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={projectForm.hot} onChange={(e) => setProjectForm({ ...projectForm, hot: e.target.checked })} />
                Hot listing
              </label>
              <input placeholder="Tagline" className="input-line w-full" value={projectForm.tagline} onChange={(e) => setProjectForm({ ...projectForm, tagline: e.target.value })} />
              <div>
                <input placeholder="Hero image URL" className="input-line w-full" value={projectForm.hero} onChange={(e) => setProjectForm({ ...projectForm, hero: e.target.value })} />
                <FileUploadButton onUploadSuccess={(url) => setProjectForm({ ...projectForm, hero: url })} label="Upload Hero Image" />
              </div>
              <div>
                <input placeholder="Gallery URLs (comma-separated)" className="input-line w-full" value={projectForm.gallery} onChange={(e) => setProjectForm({ ...projectForm, gallery: e.target.value })} />
                <FileUploadButton
                  onUploadSuccess={(url) => {
                    const current = projectForm.gallery ? projectForm.gallery.trim() : "";
                    const updated = current ? `${current}, ${url}` : url;
                    setProjectForm({ ...projectForm, gallery: updated });
                  }}
                  label="Upload & Append to Gallery"
                />
              </div>
              <input placeholder="Amenities (comma-separated)" className="input-line w-full" value={projectForm.amenities} onChange={(e) => setProjectForm({ ...projectForm, amenities: e.target.value })} />
              <textarea placeholder="Description" rows={4} className="w-full border border-[var(--line)] p-3 text-sm" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              <button
                type="submit"
                disabled={saving || !!duplicateNameError}
                className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </form>
          </div>
        </div>
      )}

      {blogModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full overflow-y-auto border-l border-[var(--gold)]/30 shadow-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-2xl">{editingBlogId ? "Edit Blog" : "Add Blog"}</h2>
              <button type="button" onClick={() => setBlogModal(false)}>
                <X size={20} />
              </button>
            </div>
            {actionError && <p className="text-red-600 text-sm mb-4">{actionError}</p>}
            <form onSubmit={saveBlog} className="space-y-4">
              <input
                required
                disabled={Boolean(editingBlogId)}
                placeholder="ID (slug) *"
                className="input-line w-full disabled:opacity-50"
                value={blogForm.id}
                onChange={(e) => setBlogForm({ ...blogForm, id: e.target.value })}
              />
              <input required placeholder="Title *" className="input-line w-full" value={blogForm.title} onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })} />
              <input placeholder="Category" className="input-line w-full" value={blogForm.category} onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })} />
              <input placeholder="Author" className="input-line w-full" value={blogForm.author} onChange={(e) => setBlogForm({ ...blogForm, author: e.target.value })} />
              <input type="date" placeholder="Date" className="input-line w-full" value={blogForm.date} onChange={(e) => setBlogForm({ ...blogForm, date: e.target.value })} />
              <input type="number" placeholder="Read minutes" className="input-line w-full" value={blogForm.read_minutes} onChange={(e) => setBlogForm({ ...blogForm, read_minutes: e.target.value })} />
              <div>
                <input placeholder="Cover image URL" className="input-line w-full" value={blogForm.cover} onChange={(e) => setBlogForm({ ...blogForm, cover: e.target.value })} />
                <FileUploadButton onUploadSuccess={(url) => setBlogForm({ ...blogForm, cover: url })} label="Upload Cover Image" />
              </div>
              <textarea placeholder="Excerpt" rows={2} className="w-full border border-[var(--line)] p-3 text-sm" value={blogForm.excerpt} onChange={(e) => setBlogForm({ ...blogForm, excerpt: e.target.value })} />
              <textarea placeholder="Content" rows={8} className="w-full border border-[var(--line)] p-3 text-sm" value={blogForm.content} onChange={(e) => setBlogForm({ ...blogForm, content: e.target.value })} />
              <button type="submit" disabled={saving} className="btn-gold w-full">{saving ? "Saving…" : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
