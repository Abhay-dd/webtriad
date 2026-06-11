import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import apiClient from "../../services/api/client";
import {
  LogOut, User, Phone, Mail, X, CheckCircle, AlertCircle,
  Menu, PhoneCall, Target
} from "lucide-react";

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
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${map[status] || "bg-gray-100 text-gray-600"}`}>
      {status || "new"}
    </span>
  );
}

const formatDate = (value) => {
  if (!value) return "No date";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "No date";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function StaffAdmin() {
  const { logout, user } = useAuth();
  const [assignedLeads, setAssignedLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadUpdating, setLeadUpdating] = useState("");
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const leadsRes = await apiClient.get("/admin/leads");
      // Filter leads to only show the ones assigned to the currently logged in staff member
      const allLeads = leadsRes.data.results || [];
      const myLeads = allLeads.filter(
        (lead) => lead.assigned_to === user?.id
      );
      setAssignedLeads(myLeads);
    } catch {
      showToast("error", "Could not load assigned leads.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line

  const updateLeadStatus = async (leadId, status) => {
    setLeadUpdating(leadId);
    try {
      await apiClient.patch(`/admin/leads/${leadId}`, { status });
      setAssignedLeads((items) =>
        items.map((lead) => (lead.id === leadId ? { ...lead, status } : lead))
      );
      showToast("success", "Lead status updated.");
    } catch (err) {
      showToast("error", err.response?.data?.detail || "Could not update lead.");
    }
    setLeadUpdating("");
  };

  return (
    <div className="min-h-screen bg-[#f4f2ee] flex">

      {/* ─── Mobile Overlay ─── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`admin-sidebar-fixed fixed top-0 left-0 h-screen min-h-screen w-64 bg-[var(--ink)] flex flex-col z-50 transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:flex-shrink-0`}
      >
        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/triad_logo.jpeg"
              alt="Triad Realty"
              className="h-9 w-auto object-contain flex-shrink-0"
            />
            <div className="min-w-0">
              <p className="font-display text-white text-sm leading-tight truncate">Triad Realty</p>
              <p className="text-white/40 text-[9px] uppercase tracking-widest mt-0.5">Staff Portal</p>
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

        {/* User Info */}
        <div className="px-6 py-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[var(--gold)] flex items-center justify-center flex-shrink-0 border-2 border-[var(--gold)]/50">
              <User size={18} className="text-[var(--ink)]" />
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.name || "Staff Member"}</p>
              <p className="text-white/40 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors text-left bg-[var(--gold)] text-[var(--ink)] font-medium"
          >
            <PhoneCall size={16} />
            My Leads
            {assignedLeads.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-tight">
                {assignedLeads.length}
              </span>
            )}
          </button>
        </nav>

        {/* Logout */}
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

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile Top Bar */}
        <div className="lg:hidden bg-[var(--ink)] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-lg">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 -ml-1 text-white/70 hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2.5">
            <img src="/triad_logo.jpeg" alt="Triad Realty" className="h-8 w-auto object-contain" />
            <span className="font-display text-sm">Staff Portal</span>
          </div>
          <button
            type="button"
            onClick={logout}
            className="p-1.5 text-white/50 hover:text-white transition-colors"
          >
            <LogOut size={18} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-4 right-4 left-4 sm:left-auto sm:right-6 sm:top-6 z-[60] flex items-center gap-3 px-5 py-3.5 shadow-xl text-sm font-medium rounded transition-all max-w-sm
            ${toast.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
            {toast.type === "success" ? <CheckCircle size={16} className="flex-shrink-0" /> : <AlertCircle size={16} className="flex-shrink-0" />}
            <span>{toast.msg}</span>
          </div>
        )}

        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

            {/* Header */}
            <div className="mb-6 sm:mb-8">
              <h1 className="font-display text-2xl sm:text-3xl text-[var(--ink)]">
                My Leads
              </h1>
              <p className="text-[var(--muted)] text-sm mt-1">
                Follow up with leads assigned to you by the owner.
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48">
                <div className="w-8 h-8 border-2 border-[var(--gold)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-[var(--line)] rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Assigned</p>
                    <p className="font-display text-3xl mt-1">{assignedLeads.length}</p>
                  </div>
                  <div className="bg-white border border-[var(--line)] rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">In Progress</p>
                    <p className="font-display text-3xl mt-1">
                      {assignedLeads.filter((lead) => ["assigned", "contacted", "qualified"].includes(lead.status)).length}
                    </p>
                  </div>
                  <div className="bg-white border border-[var(--line)] rounded-lg p-4">
                    <p className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Closed</p>
                    <p className="font-display text-3xl mt-1">
                      {assignedLeads.filter((lead) => lead.status === "closed").length}
                    </p>
                  </div>
                </div>

                {assignedLeads.length === 0 ? (
                  <div className="bg-white border border-[var(--line)] rounded-lg p-8 text-center">
                    <Target className="mx-auto text-[var(--gold)]" size={28} />
                    <h2 className="font-display text-xl mt-4">No leads assigned yet</h2>
                    <p className="text-sm text-[var(--muted)] mt-2">
                      New assignments from the owner will appear here automatically.
                    </p>
                  </div>
                ) : (
                  <div className="bg-white border border-[var(--line)] rounded-lg overflow-hidden">
                    <div className="divide-y divide-[var(--line)]">
                      {assignedLeads.map((lead) => (
                        <div key={lead.id} className="p-5 sm:p-6">
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h2 className="font-display text-xl text-[var(--ink)]">{lead.name}</h2>
                                <StatusBadge status={lead.status} />
                              </div>
                              <p className="text-xs text-[var(--muted)] mt-1">
                                Assigned {formatDate(lead.updated_at || lead.created_at)}
                              </p>
                              {lead.source_page && (
                                <p className="text-xs text-[var(--muted)] mt-1">{lead.source_page}</p>
                              )}
                            </div>
                            <select
                              className="bg-white border border-[var(--line)] text-xs px-3 py-2 rounded focus:outline-none focus:border-[var(--gold)] transition-colors disabled:opacity-50"
                              value={lead.status || "assigned"}
                              disabled={leadUpdating === lead.id}
                              onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                            >
                              <option value="assigned">Assigned</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="closed">Closed</option>
                              <option value="lost">Lost</option>
                            </select>
                          </div>

                          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                              <Phone size={14} /> {lead.phone}
                            </a>
                            <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--gold)] transition-colors">
                              <Mail size={14} /> {lead.email}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
