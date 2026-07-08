import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import { getAnalyticsSummary } from "../../hooks/useAnalytics";
import {
  LogOut, Users, TrendingUp, Target, XCircle, PhoneCall,
  Plus, Trash, Eye, BarChart2, UserCheck, Home,
  Building, Star, Award, Activity, ChevronRight, Search, Menu, X, Edit, Calendar
} from "lucide-react";
import { resolveMediaUrl } from "../../config";

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

const TABS = ["overview", "leads", "consultations", "staff", "experience", "analytics"];

const TAB_LABELS = {
  overview: "Overview",
  leads: "Leads",
  consultations: "📅 Bookings",
  staff: "Staff",
  experience: "Experience",
  analytics: "Analytics",
};

const TAB_ICONS = {
  overview: Home,
  leads: PhoneCall,
  consultations: Calendar,
  staff: Users,
  experience: Eye,
  analytics: BarChart2,
};

function KpiCard({ icon: Icon, label, value, sub, color = "gold" }) {
  const colorMap = {
    gold: "bg-[var(--gold)]/10 text-[var(--gold-deep)]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
    purple: "bg-purple-50 text-purple-700",
    muted: "bg-[var(--bg-alt)] text-[var(--muted)]",
  };
  return (
    <div className="bg-white border border-[var(--line)] rounded-lg p-4 sm:p-6 flex items-start gap-3 sm:gap-4 hover:shadow-md transition-shadow">
      <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-[var(--muted)] text-[10px] uppercase tracking-widest mb-1 truncate">{label}</p>
        <p className="font-display text-2xl sm:text-3xl text-[var(--ink)]">{value}</p>
        {sub && <p className="text-xs text-[var(--muted)] mt-0.5 leading-tight">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    new: "bg-blue-50 text-blue-700",
    assigned: "bg-amber-50 text-amber-700",
    contacted: "bg-purple-50 text-purple-700",
    qualified: "bg-indigo-50 text-indigo-700",
    closed: "bg-emerald-50 text-emerald-700",
    lost: "bg-red-50 text-red-700",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "new"}
    </span>
  );
}

export default function OwnerAdmin() {
  const { logout, user } = useAuth();
  const [tab, setTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [staff, setStaff] = useState([]);
  const [leads, setLeads] = useState([]);
  const [projects, setProjects] = useState([]);
  const [team, setTeam] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [experience, setExperience] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [experienceForm, setExperienceForm] = useState({ type: "photo", url: "" });
  const [addingExperience, setAddingExperience] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [staffForm, setStaffForm] = useState({ name: "", email: "", password: "" });
  const [addingStaff, setAddingStaff] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    
    const fetchSafe = async (url, fallback = []) => {
      try {
        const r = await apiClient.get(url);
        return r.data?.results || r.data || fallback;
      } catch (err) {
        console.error(`Error loading ${url}:`, err);
        return fallback;
      }
    };

    try {
      const [s, l, a, p, t, exp, cons] = await Promise.all([
        fetchSafe("/admin/staff"),
        fetchSafe("/admin/leads"),
        fetchSafe("/admin/attendance"),
        fetchSafe("/projects"),
        fetchSafe("/team"),
        fetchSafe("/experience"),
        fetchSafe("/admin/consultations"),
      ]);
      setStaff(Array.isArray(s) ? s : []);
      setLeads(Array.isArray(l) ? l : []);
      setAttendance(Array.isArray(a) ? a : []);
      setProjects(Array.isArray(p) ? p : []);
      setTeam(Array.isArray(t) ? t : []);
      setExperience(Array.isArray(exp) ? exp : []);
      setConsultations(Array.isArray(cons) ? cons : []);
    } catch (err) {
      console.error("Owner Dashboard load failed:", err);
    }
    
    setAnalytics(getAnalyticsSummary());
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const createStaff = async (e) => {
    e.preventDefault();
    try {
      if (editingStaffId) {
        const payload = { ...staffForm };
        if (!payload.password) delete payload.password;
        await apiClient.patch(`/admin/staff/${editingStaffId}`, payload);
      } else {
        await apiClient.post("/admin/staff", staffForm);
      }
      setStaffForm({ name: "", email: "", password: "" });
      setAddingStaff(false);
      setEditingStaffId(null);
      load();
    } catch { /* ignore */ }
  };

  const deleteStaff = async (id) => {
    if (!window.confirm("Remove this staff member?")) return;
    await apiClient.delete(`/admin/staff/${id}`);
    load();
  };

  const assignLead = async (leadId, staffId) => {
    await apiClient.patch(`/admin/leads/${leadId}`, {
      assigned_to: staffId || null,
      status: staffId ? "assigned" : "new",
    });
    load();
  };

  const updateLeadStatus = async (leadId, status) => {
    await apiClient.patch(`/admin/leads/${leadId}`, { status });
    load();
  };

  const clearAllLeads = async () => {
    if (!window.confirm("Are you sure you want to clear all leads? This cannot be undone.")) return;
    try {
      await apiClient.delete("/admin/leads");
      load();
    } catch {
      alert("Failed to clear leads.");
    }
  };

  const createExperience = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/admin/experience", experienceForm);
      setExperienceForm({ type: "photo", url: "" });
      setAddingExperience(false);
      load();
    } catch { /* ignore */ }
  };

  const deleteExperience = async (id) => {
    if (!window.confirm("Remove this experience item?")) return;
    await apiClient.delete(`/admin/experience/${id}`);
    load();
  };

  const updateConsultationStatus = async (id, newStatus) => {
    try {
      await apiClient.patch(`/admin/consultations/${id}`, { status: newStatus });
      setConsultations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c))
      );
    } catch (err) {
      console.error("Failed to update booking status:", err);
    }
  };

  const deleteConsultation = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await apiClient.delete(`/admin/consultations/${id}`);
      setConsultations((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error("Failed to delete booking:", err);
    }
  };

  // ─── Derived stats ───
  const closed = leads.filter((l) => l.status === "closed").length;
  const lost = leads.filter((l) => l.status === "lost").length;
  const inProgress = leads.filter((l) =>
    ["contacted", "qualified", "assigned"].includes(l.status)
  ).length;
  const unassigned = leads.filter((l) => !l.assigned_to).length;

  const staffPerf = staff.map((s) => {
    const assigned = leads.filter((l) => l.assigned_to === s.id);
    const closedCount = assigned.filter((l) => l.status === "closed").length;
    const lastActive = attendance
      .filter((a) => a.user_id === s.id)
      .sort((a, b) => new Date(b.login_at) - new Date(a.login_at))[0];
    return { ...s, assigned: assigned.length, closed: closedCount, lastActive };
  });

  const filteredLeads = leads.filter((l) => {
    if (leadFilter !== "all" && l.status !== leadFilter) return false;
    if (leadSearch) {
      const q = leadSearch.toLowerCase();
      return l.name?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.phone?.includes(q);
    }
    return true;
  });

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const teamMap = Object.fromEntries(team.map((m) => [m.id, m.name]));

  const handleTabChange = (t) => {
    setTab(t);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex">

      {/* ─── Mobile Sidebar Overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`admin-sidebar-fixed fixed top-0 left-0 h-screen min-h-screen w-60 bg-[var(--ink)] flex-shrink-0 flex flex-col z-50 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}
      >
        {/* Logo */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="https://res.cloudinary.com/dhxttgpfj/image/upload/v1783444277/logo_ciuljv.png"
              alt="Triad Realty"
              className="h-9 sm:h-10 w-auto object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display text-white text-sm leading-tight truncate">Triad Realty</p>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Owner Portal</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white/50 hover:text-white p-1 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* User */}
        <div className="px-5 py-4 sm:px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--gold)] flex items-center justify-center flex-shrink-0">
              <UserCheck size={15} className="text-[var(--ink)]" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || "Owner"}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-5 sm:py-6 space-y-1">
          {TABS.map((t) => {
            const Icon = TAB_ICONS[t];
            return (
              <button
                key={t}
                type="button"
                onClick={() => handleTabChange(t)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left
                  ${tab === t
                    ? "bg-[var(--gold)] text-[var(--ink)] font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
              >
                <Icon size={16} />
                {TAB_LABELS[t]}
                {t === "leads" && unassigned > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight">
                    {unassigned}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 pb-5 sm:pb-6">
          <button
            type="button"
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-white/50 hover:text-white text-xs uppercase tracking-widest transition-colors rounded-lg hover:bg-white/10"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>

      {/* ─── Main content ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile top bar */}
        <div className="lg:hidden bg-[var(--ink)] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 text-white/70 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="https://res.cloudinary.com/dhxttgpfj/image/upload/v1783444277/logo_ciuljv.png" alt="" className="h-8 w-auto object-contain" />
            <span className="font-display text-sm">
              {TAB_LABELS[tab]}
            </span>
          </div>
          {unassigned > 0 && (
            <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
              {unassigned}
            </span>
          )}
          {unassigned === 0 && <div className="w-8" />}
        </div>

        <main className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[60vh]">
              <div className="w-10 h-10 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="p-4 sm:p-6 lg:p-8">

              {/* ══════════ OVERVIEW ══════════ */}
              {tab === "overview" && (
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">Dashboard Overview</h1>
                    <p className="text-[var(--muted)] text-sm mt-1">Real-time snapshot of your operations.</p>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                    <KpiCard icon={Building} label="Total Projects" value={projects.length} sub="In database" color="gold" />
                    <KpiCard icon={Target} label="Total Leads" value={leads.length} sub="All time" color="blue" />
                    <KpiCard icon={Award} label="Leads Closed" value={closed} sub={`${leads.length ? Math.round((closed / leads.length) * 100) : 0}% close rate`} color="green" />
                    <KpiCard icon={XCircle} label="Leads Lost" value={lost} sub="Marked as lost" color="red" />
                    <KpiCard icon={Activity} label="In Progress" value={inProgress} sub="Active follow-ups" color="purple" />
                    <KpiCard icon={Users} label="Active Staff" value={staff.length} sub="Team members" color="muted" />
                  </div>

                  {/* Staff Performance */}
                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-[var(--line)] flex items-center gap-2">
                      <TrendingUp size={16} className="text-[var(--gold)]" />
                      <h2 className="font-display text-base sm:text-lg">Staff Performance</h2>
                    </div>
                    <div className="divide-y divide-[var(--line)]">
                      {staffPerf.length === 0 && (
                        <p className="px-4 sm:px-6 py-6 text-[var(--muted)] text-sm">No staff members yet.</p>
                      )}
                      {staffPerf.map((s) => (
                        <div key={s.id} className="px-4 sm:px-6 py-4 flex items-center justify-between gap-3 sm:gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[var(--bg-alt)] flex items-center justify-center flex-shrink-0">
                              <Users size={13} className="text-[var(--muted)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-[var(--ink)] truncate">{s.name}</p>
                              <p className="text-xs text-[var(--muted)] truncate hidden sm:block">{s.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 sm:gap-6 text-center flex-shrink-0">
                            <div>
                              <p className="text-base sm:text-lg font-display text-[var(--ink)]">{s.assigned}</p>
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest">Asgn</p>
                            </div>
                            <div>
                              <p className="text-base sm:text-lg font-display text-emerald-600">{s.closed}</p>
                              <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest">Clsd</p>
                            </div>
                            <div className="w-12 sm:w-16 hidden sm:block">
                              <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[var(--gold)] rounded-full"
                                  style={{ width: s.assigned ? `${(s.closed / s.assigned) * 100}%` : "0%" }}
                                />
                              </div>
                              <p className="text-xs text-[var(--muted)] mt-1">
                                {s.assigned ? Math.round((s.closed / s.assigned) * 100) : 0}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Leads */}
                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                    <div className="px-4 sm:px-6 py-4 border-b border-[var(--line)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <PhoneCall size={16} className="text-[var(--gold)]" />
                        <h2 className="font-display text-base sm:text-lg">Recent Leads</h2>
                      </div>
                      <button type="button" onClick={() => handleTabChange("leads")} className="text-xs text-[var(--muted)] hover:text-[var(--gold)] flex items-center gap-1 transition-colors">
                        View all <ChevronRight size={13} />
                      </button>
                    </div>
                    <div className="divide-y divide-[var(--line)]">
                      {leads.slice(0, 6).map((l) => (
                        <div key={l.id} className="px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--ink)] truncate">{l.name}</p>
                            <p className="text-xs text-[var(--muted)] truncate">{l.email} · {l.phone}</p>
                          </div>
                          <StatusBadge status={l.status} />
                        </div>
                      ))}
                      {leads.length === 0 && (
                        <p className="px-4 sm:px-6 py-6 text-sm text-[var(--muted)]">No leads yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════ LEADS ══════════ */}
              {tab === "leads" && (
                <div className="space-y-5 sm:space-y-6">
                  <div className="flex flex-wrap justify-between items-start gap-3">
                    <div>
                      <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">Lead Management</h1>
                      <p className="text-[var(--muted)] text-sm mt-1">All incoming leads — assign and track progress.</p>
                    </div>
                    {leads.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllLeads}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors font-medium shadow-sm"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Filters */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
                      <input
                        type="text"
                        placeholder="Search leads..."
                        value={leadSearch}
                        onChange={(e) => setLeadSearch(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-[var(--line)] rounded text-sm focus:outline-none focus:border-[var(--gold)] transition-colors w-44 sm:w-56"
                      />
                    </div>
                    <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                      {["all", "new", "assigned", "contacted", "qualified", "closed", "lost"].map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setLeadFilter(f)}
                          className={`px-2.5 sm:px-3 py-1.5 text-[10px] sm:text-xs uppercase tracking-widest rounded transition-colors
                            ${leadFilter === f ? "bg-[var(--ink)] text-white" : "bg-white border border-[var(--line)] hover:border-[var(--ink)]"}`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[600px]">
                        <thead>
                          <tr className="border-b border-[var(--line)] bg-[var(--bg-alt)]">
                            <th className="text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Name</th>
                            <th className="text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Contact</th>
                            <th className="text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Status</th>
                            <th className="text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Assign To</th>
                            <th className="text-left px-4 sm:px-5 py-3 sm:py-3.5 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Update</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                          {filteredLeads.map((lead) => (
                            <tr key={lead.id} className="hover:bg-[var(--bg-alt)] transition-colors">
                              <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                                <p className="font-medium text-[var(--ink)] whitespace-nowrap">{lead.name}</p>
                                {lead.source_page && <p className="text-xs text-[var(--muted)]">{lead.source_page}</p>}
                              </td>
                              <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                                <p className="text-[var(--muted)] text-xs">{lead.email}</p>
                                <p className="text-xs text-[var(--muted)]">{lead.phone}</p>
                              </td>
                              <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                                <StatusBadge status={lead.status} />
                              </td>
                              <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                                <select
                                  className="bg-white border border-[var(--line)] text-xs px-2 py-1.5 rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                                  value={lead.assigned_to || ""}
                                  onChange={(e) => assignLead(lead.id, e.target.value)}
                                >
                                  <option value="">Unassigned</option>
                                  {staff.map((s) => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 sm:px-5 py-3 sm:py-3.5">
                                <select
                                  className="bg-white border border-[var(--line)] text-xs px-2 py-1.5 rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                                  value={lead.status || "new"}
                                  onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                                >
                                  <option value="new">New</option>
                                  <option value="assigned">Assigned</option>
                                  <option value="contacted">Contacted</option>
                                  <option value="qualified">Qualified</option>
                                  <option value="closed">Closed</option>
                                  <option value="lost">Lost</option>
                                </select>
                              </td>
                            </tr>
                          ))}
                          {filteredLeads.length === 0 && (
                            <tr>
                              <td colSpan={5} className="px-5 py-10 text-center text-[var(--muted)] text-sm">
                                No leads match your filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════ STAFF ══════════ */}
              {tab === "staff" && (
                <div className="space-y-5 sm:space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">Staff Management</h1>
                      <p className="text-[var(--muted)] text-sm mt-1">{staff.length} team member{staff.length !== 1 ? "s" : ""}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddingStaff(!addingStaff)}
                      className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--ink)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors rounded"
                    >
                      <Plus size={14} /> Add Staff
                    </button>
                  </div>

                  {/* Add / Edit staff form */}
                  {addingStaff && (
                    <form onSubmit={createStaff} className="bg-white border border-[var(--line)] rounded-lg p-5 sm:p-6">
                      <h3 className="font-display text-lg mb-4 sm:mb-5">
                        {editingStaffId ? "Edit Staff Member" : "New Staff Member"}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                        <input
                          required
                          placeholder="Full Name"
                          className="bg-[#f8f6f2] border border-[var(--line)] px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                          value={staffForm.name}
                          onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                        />
                        <input
                          required
                          type="email"
                          placeholder="Email Address"
                          className="bg-[#f8f6f2] border border-[var(--line)] px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                          value={staffForm.email}
                          onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                        />
                        <input
                          required={!editingStaffId}
                          type="password"
                          placeholder={editingStaffId ? "New Password (leave blank to keep current)" : "Password"}
                          className="bg-[#f8f6f2] border border-[var(--line)] px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)] transition-colors"
                          value={staffForm.password}
                          onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button type="submit" className="px-5 py-2 bg-[var(--ink)] text-white text-sm rounded hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors">
                          {editingStaffId ? "Save Changes" : "Create"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAddingStaff(false);
                            setEditingStaffId(null);
                            setStaffForm({ name: "", email: "", password: "" });
                          }}
                          className="px-5 py-2 border border-[var(--line)] text-sm rounded hover:border-[var(--ink)] transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Staff cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {staff.length === 0 && (
                      <p className="text-[var(--muted)] text-sm col-span-2 py-10 text-center">No staff members yet. Click Add Staff to create one.</p>
                    )}
                    {staffPerf.map((s) => (
                      <div key={s.id} className="bg-white border border-[var(--line)] rounded-lg p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                              <Users size={16} className="text-[var(--gold-deep)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-[var(--ink)] truncate">{s.name}</p>
                              <p className="text-xs text-[var(--muted)] truncate">{s.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingStaffId(s.id);
                                setStaffForm({ name: s.name, email: s.email, password: "" });
                                setAddingStaff(true);
                              }}
                              className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              title="Edit Staff"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteStaff(s.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Staff"
                            >
                              <Trash size={14} />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
                          <div className="bg-[var(--bg-alt)] rounded p-2.5 sm:p-3 text-center">
                            <p className="font-display text-lg sm:text-xl text-[var(--ink)]">{s.assigned}</p>
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mt-0.5">Assigned</p>
                          </div>
                          <div className="bg-emerald-50 rounded p-2.5 sm:p-3 text-center">
                            <p className="font-display text-lg sm:text-xl text-emerald-700">{s.closed}</p>
                            <p className="text-[10px] text-emerald-600 uppercase tracking-widest mt-0.5">Closed</p>
                          </div>
                          <div className="bg-[var(--bg-alt)] rounded p-2.5 sm:p-3 text-center">
                            <p className="font-display text-lg sm:text-xl text-[var(--ink)]">
                              {s.assigned ? Math.round((s.closed / s.assigned) * 100) : 0}%
                            </p>
                            <p className="text-[10px] text-[var(--muted)] uppercase tracking-widest mt-0.5">Rate</p>
                          </div>
                        </div>

                        <div className="h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--gold)] rounded-full transition-all"
                            style={{ width: s.assigned ? `${(s.closed / s.assigned) * 100}%` : "0%" }}
                          />
                        </div>

                        {s.lastActive && (
                          <p className="text-xs text-[var(--muted)] mt-3">
                            Last active: {new Date(s.lastActive.login_at).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ══════════ EXPERIENCE ══════════ */}
              {tab === "experience" && (
                <div className="space-y-5 sm:space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">Experience Management</h1>
                      <p className="text-[var(--muted)] text-sm mt-1">{experience.length} media item{experience.length !== 1 ? "s" : ""} on the Experience page</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddingExperience(!addingExperience)}
                      className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-[var(--ink)] text-white text-xs uppercase tracking-widest hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors rounded"
                    >
                      <Plus size={14} /> Add Media
                    </button>
                  </div>

                  {addingExperience && (
                    <form onSubmit={createExperience} className="bg-white border border-[var(--line)] rounded-lg p-5 sm:p-6 space-y-4">
                      <h3 className="font-display text-lg mb-2">New Media Item</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                        <div>
                          <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Type</label>
                          <select
                            required
                            className="bg-[#f8f6f2] border border-[var(--line)] w-full px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)]"
                            value={experienceForm.type}
                            onChange={(e) => setExperienceForm({ ...experienceForm, type: e.target.value })}
                          >
                            <option value="photo">Photo</option>
                            <option value="video">Video</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Media URL or YouTube Video Code</label>
                          <input
                            required
                            placeholder={experienceForm.type === "photo" ? "Enter image URL" : "Enter video URL or Youtube embed code"}
                            className="bg-[#f8f6f2] border border-[var(--line)] w-full px-4 py-2.5 text-sm rounded focus:outline-none focus:border-[var(--gold)]"
                            value={experienceForm.url}
                            onChange={(e) => setExperienceForm({ ...experienceForm, url: e.target.value })}
                          />
                          <FileUploadButton 
                            onUploadSuccess={(url) => setExperienceForm({ ...experienceForm, url })} 
                            label={experienceForm.type === "photo" ? "Upload Photo" : "Upload Video"} 
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <button type="submit" className="px-5 py-2 bg-[var(--ink)] text-white text-sm rounded hover:bg-[var(--gold)] hover:text-[var(--ink)] transition-colors">
                          Add
                        </button>
                        <button type="button" onClick={() => setAddingExperience(false)} className="px-5 py-2 border border-[var(--line)] text-sm rounded hover:border-[var(--ink)] transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="bg-white border border-[var(--line)] rounded-lg p-6">
                    <h2 className="font-display text-xl mb-4">Media Items</h2>
                    {experience.length === 0 && (
                      <p className="text-[var(--muted)] text-sm py-4">No custom media items posted yet. Showing default static gallery.</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {experience.map((item) => (
                        <div key={item.id} className="relative border border-[var(--line)] rounded overflow-hidden group aspect-square bg-black">
                          {item.type === "photo" ? (
                            <img src={resolveMediaUrl(item.url)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full relative flex items-center justify-center bg-black">
                              {!item.url.includes("<iframe") && !item.url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/) ? (
                                <video src={resolveMediaUrl(item.url)} className="w-full h-full object-cover opacity-60" muted playsInline />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/50 text-xs text-center p-2">
                                  Video: {item.url.slice(0, 30)}...
                                </div>
                              )}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => deleteExperience(item.id)}
                              className="p-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                              title="Delete Item"
                            >
                              <Trash size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ══════════ CONSULTATIONS ══════════ */}
              {tab === "consultations" && (
                <div className="bg-white p-6 sm:p-8 border border-[var(--line)]">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="font-display text-xl sm:text-2xl text-[var(--ink)]">Consultation Bookings ({consultations.length})</h2>
                  </div>
                  {consultations.length === 0 ? (
                    <p className="text-[var(--muted)] text-sm">No consultation bookings found.</p>
                  ) : (
                    <div className="overflow-x-auto admin-table-wrap">
                      <table className="w-full text-sm min-w-[700px]">
                        <thead>
                          <tr className="border-b border-[var(--line)] text-left bg-[var(--bg-alt)]">
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Client Info</th>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Requested Slot</th>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Client Notes</th>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Booked On</th>
                            <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Status</th>
                            <th className="px-4 py-3 text-right text-[10px] uppercase tracking-widest text-[var(--muted)] font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--line)]">
                          {consultations.map((c) => (
                            <tr key={c.id} className="hover:bg-[var(--bg-alt)] transition-colors">
                              <td className="px-4 py-3">
                                <p className="font-medium text-[var(--ink)]">{c.name}</p>
                                <p className="text-xs text-[var(--muted)]">{c.email}</p>
                                {c.phone && <p className="text-xs text-[var(--muted)]">{c.phone}</p>}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <p className="font-medium text-[var(--ink)]">{c.date}</p>
                                <p className="text-xs text-[var(--gold-deep)]">{c.time_slot} (GST)</p>
                              </td>
                              <td className="px-4 py-3 max-w-[200px] break-words">
                                <p className="text-xs text-[var(--ink-2)] line-clamp-3" title={c.notes}>
                                  {c.notes || <span className="italic text-[var(--muted)]">No notes</span>}
                                </p>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--muted)]">
                                {c.created_at ? new Date(c.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <select
                                  value={c.status || "pending"}
                                  onChange={(e) => updateConsultationStatus(c.id, e.target.value)}
                                  className={`text-xs px-2.5 py-1.5 border font-semibold focus:outline-none cursor-pointer rounded ${
                                    c.status === "confirmed"
                                      ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                      : c.status === "cancelled"
                                        ? "bg-red-50 border-red-200 text-red-700"
                                        : "bg-amber-50 border-amber-200 text-amber-700"
                                  }`}
                                >
                                  <option value="pending" className="text-amber-700 bg-white">Pending</option>
                                  <option value="confirmed" className="text-emerald-700 bg-white">Confirmed</option>
                                  <option value="cancelled" className="text-red-700 bg-white">Cancelled</option>
                                </select>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => deleteConsultation(c.id)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  title="Delete Booking"
                                >
                                  <Trash size={15} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ══════════ ANALYTICS ══════════ */}
              {tab === "analytics" && (
                <div className="space-y-6 sm:space-y-8">
                  <div>
                    <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">Website Analytics</h1>
                    <p className="text-[var(--muted)] text-sm mt-1">
                      Based on page visits tracked in this browser.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <KpiCard icon={Eye} label="Total Page Views" value={analytics?.totalViews || 0} sub="All time in this browser" color="blue" />
                    <KpiCard icon={TrendingUp} label="Views This Week" value={analytics?.last7Days || 0} sub="Last 7 days" color="green" />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Top Pages */}
                    <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden lg:col-span-1">
                      <div className="px-4 sm:px-5 py-4 border-b border-[var(--line)] flex items-center gap-2">
                        <Star size={15} className="text-[var(--gold)]" />
                        <h3 className="font-display text-base">Top Pages</h3>
                      </div>
                      <div className="divide-y divide-[var(--line)]">
                        {analytics?.topPages?.length === 0 && (
                          <p className="px-4 sm:px-5 py-5 text-sm text-[var(--muted)]">No data yet — visit some pages first.</p>
                        )}
                        {analytics?.topPages?.map(({ path, count }, i) => (
                          <div key={path} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs text-[var(--muted)] w-5 flex-shrink-0">#{i + 1}</span>
                              <span className="text-sm text-[var(--ink)] truncate">{path}</span>
                            </div>
                            <span className="text-xs font-medium text-[var(--gold-deep)] flex-shrink-0">{count} views</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Team Members */}
                    <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                      <div className="px-4 sm:px-5 py-4 border-b border-[var(--line)] flex items-center gap-2">
                        <Users size={15} className="text-[var(--gold)]" />
                        <h3 className="font-display text-base">Most Viewed Team</h3>
                      </div>
                      <div className="divide-y divide-[var(--line)]">
                        {analytics?.topTeam?.length === 0 && (
                          <p className="px-4 sm:px-5 py-5 text-sm text-[var(--muted)]">No team profile visits yet.</p>
                        )}
                        {analytics?.topTeam?.map(({ id, count }, i) => (
                          <div key={id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-[var(--bg-alt)] flex items-center justify-center flex-shrink-0">
                                <Users size={12} className="text-[var(--muted)]" />
                              </div>
                              <span className="text-sm text-[var(--ink)] truncate">{teamMap[id] || id}</span>
                            </div>
                            <span className="text-xs font-medium text-[var(--gold-deep)] flex-shrink-0">{count} views</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Top Properties */}
                    <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                      <div className="px-4 sm:px-5 py-4 border-b border-[var(--line)] flex items-center gap-2">
                        <Building size={15} className="text-[var(--gold)]" />
                        <h3 className="font-display text-base">Most Viewed Properties</h3>
                      </div>
                      <div className="divide-y divide-[var(--line)]">
                        {analytics?.topProperties?.length === 0 && (
                          <p className="px-4 sm:px-5 py-5 text-sm text-[var(--muted)]">No property visits tracked yet.</p>
                        )}
                        {analytics?.topProperties?.map(({ id, count }, i) => (
                          <div key={id} className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-7 h-7 rounded-full bg-[var(--bg-alt)] flex items-center justify-center flex-shrink-0">
                                <Building size={12} className="text-[var(--muted)]" />
                              </div>
                              <span className="text-sm text-[var(--ink)] truncate">{projectMap[id] || id}</span>
                            </div>
                            <span className="text-xs font-medium text-[var(--gold-deep)] flex-shrink-0">{count} views</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-5 text-sm text-amber-800">
                    <strong>ℹ️ About Analytics:</strong> Data is tracked locally in this browser using localStorage.
                    As visitors browse the website on the same device, their page views are recorded here.
                    For multi-user tracking, a server-side analytics endpoint would be needed.
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
