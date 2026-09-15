import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Eye,
  FileText,
  Filter,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  MailOpen,
  MapPin,
  MessageSquare,
  Pencil,
  Plus,
  Phone,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/react";

type AdminView = "dashboard" | "appointments" | "inquiries" | "treatments" | "branches" | "media" | "settings";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";
type AppointmentFilter = "all" | AppointmentStatus;
type InquiryFilter = "all" | "unread" | "read";

type Appointment = {
  id: number;
  patientName: string;
  phone: string;
  email: string;
  age: number;
  treatment: string;
  branchId: number | null;
  appointmentDate: string;
  appointmentTime: string;
  notes: string;
  status: AppointmentStatus;
  submittedAt: string;
  updatedAt: string;
};

type Inquiry = {
  id: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  isRead: boolean;
  submittedAt: string;
  updatedAt: string;
};

type Dashboard = {
  counts: {
    totalAppointments: number;
    pendingAppointments: number;
    confirmedAppointments: number;
    completedAppointments: number;
    cancelledAppointments: number;
    totalInquiries: number;
    unreadInquiries: number;
    activeTreatments: number;
  };
  recentActivity: Array<{
    type: "appointment" | "inquiry";
    id: number;
    title: string;
    detail: string;
    status: string;
    createdAt: string;
  }>;
};

type Treatment = {
  id: number;
  title: string;
  price: string;
  description: string;
  icon: string;
  imagePath: string | null;
  isActive: boolean;
  displayOrder: number;
};

type MediaItem = {
  id: number;
  objectPath: string;
  originalName: string;
  contentType: string;
  size: number;
  createdAt: string;
};

type Branch = {
  id: number;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  sundayHours: string;
  mapUrl: string;
  imagePath: string | null;
  isActive: boolean;
};

type ClinicSettings = {
  id: number;
  clinicName: string;
  phone: string;
  alternatePhone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  sundayHours: string;
  socialInstagram: string;
  socialFacebook: string;
  mapUrl: string;
};

const baseApiPath = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/api`;

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${baseApiPath}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Something went wrong. Please try again.");
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));

const statusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

export default function AdminPage() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [view, setView] = useState<AdminView>("dashboard");
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [settings, setSettings] = useState<ClinicSettings | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appointmentFilter, setAppointmentFilter] = useState<AppointmentFilter>("all");
  const [inquirySearch, setInquirySearch] = useState("");
  const [inquiryFilter, setInquiryFilter] = useState<InquiryFilter>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    const results = await Promise.allSettled([
        apiRequest<Dashboard>("/admin/dashboard"),
        apiRequest<{ appointments: Appointment[] }>("/admin/appointments"),
        apiRequest<{ inquiries: Inquiry[] }>("/admin/inquiries"),
        apiRequest<{ treatments: Treatment[] }>("/admin/treatments"),
        apiRequest<{ branches: Branch[] }>("/admin/branches"),
        apiRequest<{ media: MediaItem[] }>("/admin/media"),
        apiRequest<{ settings: ClinicSettings }>("/admin/settings"),
      ]);
    const [dashboardResult, appointmentResult, inquiryResult, treatmentResult, branchResult, mediaResult, settingsResult] = results;
    if (dashboardResult.status === "fulfilled") setDashboard(dashboardResult.value);
    if (appointmentResult.status === "fulfilled") setAppointments(appointmentResult.value.appointments);
    if (inquiryResult.status === "fulfilled") setInquiries(inquiryResult.value.inquiries);
    if (treatmentResult.status === "fulfilled") setTreatments(treatmentResult.value.treatments);
    if (branchResult.status === "fulfilled") setBranches(branchResult.value.branches);
    if (mediaResult.status === "fulfilled") setMedia(mediaResult.value.media);
    if (settingsResult.status === "fulfilled") setSettings(settingsResult.value.settings);
    const failedResult = results.find((result) => result.status === "rejected");
    if (failedResult?.status === "rejected") {
      setError(failedResult.reason instanceof Error ? failedResult.reason.message : "Some admin data could not be loaded.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return appointments.filter((appointment) =>
      (appointmentFilter === "all" || appointment.status === appointmentFilter) &&
      (!query || [appointment.id, appointment.patientName, appointment.phone, appointment.email, appointment.treatment, appointment.status]
        .join(" ")
        .toLowerCase()
        .includes(query)),
    );
  }, [appointments, appointmentFilter, searchTerm]);

  const filteredInquiries = useMemo(() => {
    const query = inquirySearch.trim().toLowerCase();
    return inquiries.filter((inquiry) =>
      (inquiryFilter === "all" ||
        (inquiryFilter === "unread" && !inquiry.isRead) ||
        (inquiryFilter === "read" && inquiry.isRead)) &&
      (!query || [inquiry.id, inquiry.name, inquiry.email, inquiry.phone, inquiry.message]
        .join(" ")
        .toLowerCase()
        .includes(query)),
    );
  }, [inquiries, inquiryFilter, inquirySearch]);

  const updateAppointmentStatus = async (appointment: Appointment, status: AppointmentStatus) => {
    setBusyId(`appointment-${appointment.id}`);
    try {
      await apiRequest(`/admin/appointments/${appointment.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadData();
      if (selectedAppointment?.id === appointment.id) {
        setSelectedAppointment({ ...appointment, status });
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update appointment.");
    } finally {
      setBusyId(null);
    }
  };

  const rescheduleAppointment = async (appointment: Appointment, appointmentDate: string, appointmentTime: string) => {
    setBusyId(`schedule-${appointment.id}`);
    try {
      const result = await apiRequest<{ appointment: Appointment }>(`/admin/appointments/${appointment.id}/schedule`, {
        method: "PATCH",
        body: JSON.stringify({ appointmentDate, appointmentTime }),
      });
      await loadData();
      setSelectedAppointment(result.appointment);
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : "Unable to reschedule appointment.");
      throw scheduleError;
    } finally {
      setBusyId(null);
    }
  };

  const deleteAppointment = async (appointment: Appointment) => {
    if (!window.confirm(`Delete the appointment request from ${appointment.patientName}?`)) return;
    setBusyId(`delete-${appointment.id}`);
    try {
      await apiRequest(`/admin/appointments/${appointment.id}`, { method: "DELETE" });
      setSelectedAppointment(null);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete appointment.");
    } finally {
      setBusyId(null);
    }
  };

  const markInquiryRead = async (inquiry: Inquiry) => {
    setBusyId(`inquiry-${inquiry.id}`);
    try {
      await apiRequest(`/admin/inquiries/${inquiry.id}/${inquiry.isRead ? "unread" : "read"}`, { method: "PATCH" });
      await loadData();
      setSelectedInquiry((current) => current?.id === inquiry.id ? { ...current, isRead: !inquiry.isRead } : current);
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to update inquiry.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteInquiry = async (inquiry: Inquiry) => {
    if (!window.confirm(`Delete the inquiry from ${inquiry.name}?`)) return;
    setBusyId(`delete-inquiry-${inquiry.id}`);
    try {
      await apiRequest(`/admin/inquiries/${inquiry.id}`, { method: "DELETE" });
      setSelectedInquiry(null);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete inquiry.");
    } finally {
      setBusyId(null);
    }
  };

  const uploadImage = async (file: File) => {
    const uploadResponse = await apiRequest<{ uploadURL: string; objectPath: string }>("/storage/uploads/request-url", {
      method: "POST",
      body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
    });
    const response = await fetch(uploadResponse.uploadURL, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    if (!response.ok) throw new Error("Unable to upload image.");
    await apiRequest("/admin/media", {
      method: "POST",
      body: JSON.stringify({ objectPath: uploadResponse.objectPath, originalName: file.name, contentType: file.type, size: file.size }),
    });
    return uploadResponse.objectPath;
  };

  const saveTreatment = async (
    values: Omit<Treatment, "id" | "imagePath"> & { imagePath?: string | null },
    id?: number,
    file?: File | null,
  ) => {
    setBusyId(id ? `treatment-${id}` : "new-treatment");
    try {
      const imagePath = file ? await uploadImage(file) : values.imagePath ?? null;
      await apiRequest(id ? `/admin/treatments/${id}` : "/admin/treatments", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify({ ...values, imagePath }),
      });
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save treatment.");
      throw saveError;
    } finally {
      setBusyId(null);
    }
  };

  const deleteTreatment = async (treatment: Treatment) => {
    if (!window.confirm(`Delete ${treatment.title} from the public catalog?`)) return;
    setBusyId(`delete-treatment-${treatment.id}`);
    try {
      await apiRequest(`/admin/treatments/${treatment.id}`, { method: "DELETE" });
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete treatment.");
    } finally {
      setBusyId(null);
    }
  };

  const saveBranch = async (
    values: Omit<Branch, "id"> & { imagePath?: string | null },
    id?: number,
    file?: File | null,
  ) => {
    setBusyId(id ? `branch-${id}` : "new-branch");
    try {
      const imagePath = file ? await uploadImage(file) : values.imagePath ?? null;
      await apiRequest(id ? `/admin/branches/${id}` : "/admin/branches", {
        method: id ? "PATCH" : "POST",
        body: JSON.stringify({ ...values, imagePath }),
      });
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save branch.");
      throw saveError;
    } finally {
      setBusyId(null);
    }
  };

  const deleteBranch = async (branch: Branch) => {
    if (!window.confirm(`Delete ${branch.name}? Existing appointments will keep their patient details but lose this branch assignment.`)) return;
    setBusyId(`delete-branch-${branch.id}`);
    try {
      await apiRequest(`/admin/branches/${branch.id}`, { method: "DELETE" });
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete branch.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteMedia = async (item: MediaItem) => {
    if (!window.confirm(`Remove ${item.originalName} from clinic media?`)) return;
    setBusyId(`media-${item.id}`);
    try {
      await apiRequest(`/admin/media/${item.id}`, { method: "DELETE" });
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete media.");
    } finally {
      setBusyId(null);
    }
  };

  const saveSettings = async (nextSettings: Omit<ClinicSettings, "id">) => {
    setBusyId("settings");
    try {
      await apiRequest("/admin/settings", { method: "PATCH", body: JSON.stringify(nextSettings) });
      await loadData();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save clinic settings.");
      throw saveError;
    } finally {
      setBusyId(null);
    }
  };

  const navItems: Array<{ id: AdminView; label: string; icon: typeof LayoutDashboard }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "inquiries", label: "Inquiries", icon: MessageSquare },
    { id: "treatments", label: "Treatments", icon: ClipboardList },
    { id: "branches", label: "Branches", icon: MapPin },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "settings", label: "Settings", icon: Settings2 },
  ];

  if (isLoading && !dashboard) {
    return <div className="admin-loading"><div className="admin-spinner" /><p>Loading your clinic dashboard…</p></div>;
  }

  if (error && !dashboard) {
    return (
      <main className="admin-access-error">
        <div className="admin-access-card">
          <span className="admin-access-icon"><ShieldCheck size={26} /></span>
          <div className="eyebrow">Somil Dental Clinic / Admin</div>
          <h1>Admin access needed.</h1>
          <p>{error}</p>
          <div className="admin-access-actions">
            <button className="admin-primary-button" onClick={() => void loadData()}>Try again <ArrowRight size={15} /></button>
            <button className="admin-quiet-button" onClick={() => void signOut({ redirectUrl: "/" })}>Sign out <LogOut size={14} /></button>
          </div>
        </div>
      </main>
    );
  }

  const counts = dashboard?.counts;

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a href={import.meta.env.BASE_URL} className="admin-brand">
          <span className="admin-brand-mark">SDC</span>
          <span><strong>SOMIL</strong><small>Dental clinic</small></span>
        </a>
        <div className="admin-sidebar-label">Clinic workspace</div>
        <nav className="admin-nav" aria-label="Admin sections">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "is-active" : ""} onClick={() => setView(id)}>
              <Icon size={17} /><span>{label}</span>
              {id === "inquiries" && counts?.unreadInquiries ? <b>{counts.unreadInquiries}</b> : null}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <div className="admin-sidebar-note"><Activity size={15} /><span>Live clinic activity</span></div>
          <button className="admin-signout" onClick={() => void signOut({ redirectUrl: "/" })}><LogOut size={15} /> Sign out</button>
        </div>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <div>
            <div className="eyebrow">Somil Dental Clinic / Secure workspace</div>
            <h1>{navItems.find((item) => item.id === view)?.label}</h1>
          </div>
          <div className="admin-user">
            <span className="admin-avatar">{(user?.firstName?.[0] || user?.emailAddresses[0]?.emailAddress[0] || "A").toUpperCase()}</span>
            <div><strong>{user?.firstName || "Clinic admin"}</strong><small>{user?.emailAddresses[0]?.emailAddress}</small></div>
          </div>
        </header>

        {error ? <div className="admin-inline-error" role="alert"><X size={15} /> {error}<button onClick={() => setError("")}>Dismiss</button></div> : null}

        {view === "dashboard" && counts ? (
          <DashboardView dashboard={dashboard!} onNavigate={setView} />
        ) : null}

        {view === "appointments" ? (
          <AppointmentsView
            appointments={filteredAppointments}
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            filter={appointmentFilter}
            onFilter={setAppointmentFilter}
            onSelect={setSelectedAppointment}
            onStatus={updateAppointmentStatus}
            onDelete={deleteAppointment}
            branches={branches}
            busyId={busyId}
          />
        ) : null}

        {view === "inquiries" ? (
          <InquiriesView
            inquiries={filteredInquiries}
            searchTerm={inquirySearch}
            onSearch={setInquirySearch}
            filter={inquiryFilter}
            onFilter={setInquiryFilter}
            onSelect={setSelectedInquiry}
            onRead={markInquiryRead}
            onDelete={deleteInquiry}
            busyId={busyId}
          />
        ) : null}

        {view === "treatments" ? <TreatmentsView treatments={treatments} onSave={saveTreatment} onDelete={deleteTreatment} busyId={busyId} /> : null}
        {view === "branches" ? <BranchesView branches={branches} onSave={saveBranch} onDelete={deleteBranch} busyId={busyId} /> : null}
        {view === "media" ? <MediaView media={media} onUpload={async (file) => { const path = await uploadImage(file); await loadData(); return path; }} onDelete={deleteMedia} busyId={busyId} /> : null}
        {view === "settings" ? <SettingsView user={user} settings={settings} onSave={saveSettings} busyId={busyId} /> : null}
      </section>

      {selectedAppointment ? <AppointmentDetailModal appointment={selectedAppointment} branches={branches} onClose={() => setSelectedAppointment(null)} onStatus={updateAppointmentStatus} onSchedule={rescheduleAppointment} onDelete={deleteAppointment} busyId={busyId} /> : null}

      {selectedInquiry ? (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onRead={markInquiryRead}
          onDelete={deleteInquiry}
          busyId={busyId}
        />
      ) : null}
    </main>
  );
}

function DashboardView({ dashboard, onNavigate }: { dashboard: Dashboard; onNavigate: (view: AdminView) => void }) {
  const { counts } = dashboard;
  const metrics = [
    { label: "Total appointments", value: counts.totalAppointments, icon: CalendarDays, tone: "navy" },
    { label: "Pending", value: counts.pendingAppointments, icon: Clock3, tone: "amber" },
    { label: "Confirmed", value: counts.confirmedAppointments, icon: Check, tone: "teal" },
    { label: "Completed", value: counts.completedAppointments, icon: CheckCircle2, tone: "green" },
    { label: "Cancelled", value: counts.cancelledAppointments, icon: X, tone: "rose" },
    { label: "Total inquiries", value: counts.totalInquiries, icon: MessageSquare, tone: "blue" },
    { label: "Active treatments", value: counts.activeTreatments, icon: ClipboardList, tone: "teal" },
  ];

  return (
    <div className="admin-content">
      <div className="admin-welcome"><div><h2>Good to see you.</h2><p>Here’s what’s happening at the clinic today.</p></div><button className="admin-secondary-button" onClick={() => onNavigate("appointments")}>View appointments <ArrowRight size={15} /></button></div>
      <div className="admin-metric-grid">
        {metrics.map(({ label, value, icon: Icon, tone }) => <article className="admin-metric-card" key={label}><span className={`admin-metric-icon ${tone}`}><Icon size={17} /></span><div><strong>{value}</strong><span>{label}</span></div></article>)}
      </div>
      <div className="admin-dashboard-grid">
        <section className="admin-panel-card admin-activity-card">
          <div className="admin-panel-heading"><div><div className="eyebrow">Latest updates</div><h2>Recent activity</h2></div><Activity size={19} /></div>
          {dashboard.recentActivity.length ? <div className="activity-list">{dashboard.recentActivity.map((item) => <div className="activity-row" key={`${item.type}-${item.id}`}><span className={`activity-icon ${item.type}`} aria-hidden="true">{item.type === "appointment" ? <CalendarDays size={15} /> : <MessageSquare size={15} />}</span><div><strong>{item.title}</strong><small>{item.detail} · {formatDateTime(item.createdAt)}</small></div><span className={`status-dot status-${item.status}`} /></div>)}</div> : <EmptyState icon={Activity} title="No activity yet" copy="New appointments and inquiries will appear here." /> }
        </section>
        <section className="admin-panel-card admin-summary-card">
          <div className="admin-panel-heading"><div><div className="eyebrow">Needs attention</div><h2>Today’s queue</h2></div><Settings2 size={19} /></div>
          <div className="queue-list"><button onClick={() => onNavigate("appointments")}><span><Clock3 size={16} /> Pending appointments</span><strong>{counts.pendingAppointments}</strong><ArrowRight size={15} /></button><button onClick={() => onNavigate("inquiries")}><span><Mail size={16} /> Unread inquiries</span><strong>{counts.unreadInquiries}</strong><ArrowRight size={15} /></button></div>
          <div className="admin-summary-footer"><ShieldCheck size={15} /><span>Only authorized clinic staff can access these records.</span></div>
        </section>
      </div>
    </div>
  );
}

function AppointmentsView({ appointments, branches, searchTerm, onSearch, filter, onFilter, onSelect, onStatus, onDelete, busyId }: {
  appointments: Appointment[];
  branches: Branch[];
  searchTerm: string;
  onSearch: (value: string) => void;
  filter: AppointmentFilter;
  onFilter: (value: AppointmentFilter) => void;
  onSelect: (appointment: Appointment) => void;
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onDelete: (appointment: Appointment) => void;
  busyId: string | null;
}) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro"><div><h2>Appointments & bookings</h2><p>Review every request submitted through the clinic website.</p></div><span className="admin-count-label">{appointments.length} {appointments.length === 1 ? "request" : "requests"}</span></div>
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={16} /><input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Search name, phone, email, or booking ID" /></label>
        <label className="admin-filter"><Filter size={15} /><span className="sr-only">Filter appointments by status</span><select value={filter} onChange={(event) => onFilter(event.target.value as AppointmentFilter)}>{(["all", "pending", "confirmed", "completed", "cancelled"] as AppointmentFilter[]).map((status) => <option value={status} key={status}>{status === "all" ? "All statuses" : statusLabel(status)}</option>)}</select></label>
        <span className="admin-data-note"><ShieldCheck size={14} /> Live database records</span>
      </div>
      <div className="admin-table-card">
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Patient</th><th>Treatment</th><th>Branch</th><th>Preferred visit</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{appointments.map((appointment) => <tr key={appointment.id}><td><button className="patient-cell" onClick={() => onSelect(appointment)}><span className="patient-initial">{appointment.patientName[0]}</span><span><strong>{appointment.patientName}</strong><small>{appointment.phone}</small></span></button></td><td><span className="table-primary">{appointment.treatment}</span><small className="table-secondary">{appointment.email}</small></td><td><span className="table-primary">{branches.find((branch) => branch.id === appointment.branchId)?.name || "Unassigned"}</span></td><td><span className="table-primary">{formatDate(appointment.appointmentDate)}</span><small className="table-secondary">{appointment.appointmentTime}</small></td><td><span className="table-secondary">{formatDateTime(appointment.submittedAt)}</span></td><td><select className={`status-select status-${appointment.status}`} value={appointment.status} onChange={(event) => void onStatus(appointment, event.target.value as AppointmentStatus)} disabled={busyId === `appointment-${appointment.id}`} aria-label={`Status for ${appointment.patientName}`}>{(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></td><td><div className="table-actions"><button onClick={() => onSelect(appointment)} aria-label={`View ${appointment.patientName}'s booking`}><Eye size={15} /></button><button onClick={() => void onDelete(appointment)} disabled={busyId === `delete-${appointment.id}`} aria-label={`Delete ${appointment.patientName}'s booking`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{appointments.length === 0 ? <EmptyState icon={CalendarDays} title="No appointments found" copy={searchTerm ? "Try a different search term." : "New booking requests will appear here automatically."} /> : null}</div>
      </div>
    </div>
  );
}

function AppointmentDetailModal({ appointment, branches, onClose, onStatus, onSchedule, onDelete, busyId }: {
  appointment: Appointment;
  branches: Branch[];
  onClose: () => void;
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onSchedule: (appointment: Appointment, date: string, time: string) => Promise<void>;
  onDelete: (appointment: Appointment) => void;
  busyId: string | null;
}) {
  const [appointmentDate, setAppointmentDate] = useState(appointment.appointmentDate);
  const [appointmentTime, setAppointmentTime] = useState(appointment.appointmentTime);
  const appointmentTimes = ["6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM"];
  const today = new Date();
  const minimumDate = new Date(today.getTime() - today.getTimezoneOffset() * 60 * 1000).toISOString().split("T")[0];
  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title" onClick={(event) => event.stopPropagation()}>
        <div className="admin-detail-head">
          <div><div className="eyebrow">Appointment request</div><h2 id="appointment-detail-title">{appointment.patientName}</h2></div>
          <button className="admin-close-button" onClick={onClose} aria-label="Close details"><X size={18} /></button>
        </div>
        <span className={`status-badge status-${appointment.status}`}>{statusLabel(appointment.status)}</span>
        <div className="admin-detail-grid">
          <div><span>Patient</span><strong>{appointment.patientName}, {appointment.age}</strong></div>
          <div><span>Treatment</span><strong>{appointment.treatment}</strong></div>
          <div><span>Branch</span><strong>{branches.find((branch) => branch.id === appointment.branchId)?.name || "Unassigned"}</strong></div>
          <div><span>Preferred visit</span><strong>{formatDate(appointment.appointmentDate)} · {appointment.appointmentTime}</strong></div>
          <div><span>Submitted</span><strong>{formatDateTime(appointment.submittedAt)}</strong></div>
          <div><span>Phone</span><a href={`tel:${appointment.phone}`}><Phone size={13} /> {appointment.phone}</a></div>
          <div><span>Email</span><a href={`mailto:${appointment.email}`}><Mail size={13} /> {appointment.email}</a></div>
        </div>
        <form className="admin-schedule-form" onSubmit={(event) => { event.preventDefault(); void onSchedule(appointment, appointmentDate, appointmentTime); }}>
          <div className="eyebrow">Reschedule visit</div>
          <div className="admin-form-grid">
            <label>Date<input required type="date" min={minimumDate} value={appointmentDate} onChange={(event) => setAppointmentDate(event.target.value)} /></label>
            <label>Time<select value={appointmentTime} onChange={(event) => setAppointmentTime(event.target.value)}>{appointmentTimes.map((time) => <option value={time} key={time}>{time}</option>)}</select></label>
          </div>
          <button className="admin-secondary-button" type="submit" disabled={busyId === `schedule-${appointment.id}`}>{busyId === `schedule-${appointment.id}` ? "Saving…" : "Save new visit time"}</button>
        </form>
        <div className="admin-detail-notes"><span>Message / notes</span><p>{appointment.notes || "No additional notes were provided."}</p></div>
        <div className="admin-detail-actions">
          {appointment.status !== "confirmed" ? <button className="admin-primary-button" onClick={() => void onStatus(appointment, "confirmed")} disabled={busyId === `appointment-${appointment.id}`}><Check size={15} /> Confirm</button> : null}
          {appointment.status !== "completed" ? <button className="admin-secondary-button" onClick={() => void onStatus(appointment, "completed")} disabled={busyId === `appointment-${appointment.id}`}><CheckCircle2 size={15} /> Complete</button> : null}
          {appointment.status !== "cancelled" ? <button className="admin-danger-button" onClick={() => void onStatus(appointment, "cancelled")} disabled={busyId === `appointment-${appointment.id}`}><X size={15} /> Cancel</button> : null}
          <button className="admin-quiet-button" onClick={() => void onDelete(appointment)} disabled={busyId === `delete-${appointment.id}`}><Trash2 size={15} /> Delete</button>
        </div>
      </section>
    </div>
  );
}

function InquiriesView({ inquiries, searchTerm, onSearch, filter, onFilter, onSelect, onRead, onDelete, busyId }: {
  inquiries: Inquiry[];
  searchTerm: string;
  onSearch: (value: string) => void;
  filter: InquiryFilter;
  onFilter: (value: InquiryFilter) => void;
  onSelect: (inquiry: Inquiry) => void;
  onRead: (inquiry: Inquiry) => void;
  onDelete: (inquiry: Inquiry) => void;
  busyId: string | null;
}) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro"><div><h2>Inquiries & messages</h2><p>Keep up with questions sent through the clinic contact form.</p></div><span className="admin-count-label">{inquiries.filter((inquiry) => !inquiry.isRead).length} unread</span></div>
      <div className="admin-toolbar">
        <label className="admin-search"><Search size={16} /><input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Search name, email, phone, or message" /></label>
        <label className="admin-filter"><Filter size={15} /><span className="sr-only">Filter inquiries by read status</span><select value={filter} onChange={(event) => onFilter(event.target.value as InquiryFilter)}><option value="all">All messages</option><option value="unread">Unread</option><option value="read">Read</option></select></label>
      </div>
      <div className="admin-inquiry-list">{inquiries.map((inquiry) => <article className={`inquiry-card ${inquiry.isRead ? "is-read" : ""}`} key={inquiry.id}>
        <button className="inquiry-icon" onClick={() => onSelect(inquiry)} aria-label={`Open inquiry from ${inquiry.name}`}><MessageSquare size={17} /></button>
        <div className="inquiry-main">
          <div className="inquiry-head"><div><button className="inquiry-title-button" onClick={() => onSelect(inquiry)}><strong>{inquiry.name}</strong></button><span><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a> · <a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a></span></div><small>{formatDateTime(inquiry.submittedAt)}</small></div>
          <p>{inquiry.message}</p>
          <div className="inquiry-actions">
            <button className="admin-mark-read" onClick={() => void onRead(inquiry)} disabled={busyId === `inquiry-${inquiry.id}`}><Check size={14} /> {inquiry.isRead ? "Mark as unread" : "Mark as read"}</button>
            <button className="admin-quiet-button" onClick={() => void onDelete(inquiry)} disabled={busyId === `delete-inquiry-${inquiry.id}`}><Trash2 size={14} /> Delete</button>
          </div>
        </div>
      </article>)}{inquiries.length === 0 ? <EmptyState icon={MessageSquare} title="No inquiries found" copy={searchTerm ? "Try a different search or filter." : "Messages from the public contact form will appear here."} /> : null}</div>
    </div>
  );
}

function InquiryDetailModal({ inquiry, onClose, onRead, onDelete, busyId }: {
  inquiry: Inquiry;
  onClose: () => void;
  onRead: (inquiry: Inquiry) => void;
  onDelete: (inquiry: Inquiry) => void;
  busyId: string | null;
}) {
  return (
    <div className="admin-modal-backdrop" role="presentation" onClick={onClose}>
      <section className="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="inquiry-detail-title" onClick={(event) => event.stopPropagation()}>
        <div className="admin-detail-head">
          <div><div className="eyebrow">Contact inquiry</div><h2 id="inquiry-detail-title">{inquiry.name}</h2></div>
          <button className="admin-close-button" onClick={onClose} aria-label="Close inquiry details"><X size={18} /></button>
        </div>
        <span className={`status-badge status-${inquiry.isRead ? "read" : "unread"}`}>{inquiry.isRead ? "Read" : "Unread"}</span>
        <div className="admin-detail-grid">
          <div><span>Email</span><a href={`mailto:${inquiry.email}`}><Mail size={13} /> {inquiry.email}</a></div>
          <div><span>Phone</span><a href={`tel:${inquiry.phone}`}><Phone size={13} /> {inquiry.phone}</a></div>
          <div><span>Submitted</span><strong>{formatDateTime(inquiry.submittedAt)}</strong></div>
          <div><span>Inquiry ID</span><strong>#{inquiry.id}</strong></div>
        </div>
        <div className="admin-detail-notes"><span>Message</span><p>{inquiry.message}</p></div>
        <div className="admin-detail-actions">
          <button className="admin-primary-button" onClick={() => void onRead(inquiry)} disabled={busyId === `inquiry-${inquiry.id}`}><MailOpen size={15} /> Mark as {inquiry.isRead ? "unread" : "read"}</button>
          <button className="admin-danger-button" onClick={() => void onDelete(inquiry)} disabled={busyId === `delete-inquiry-${inquiry.id}`}><Trash2 size={15} /> Delete</button>
        </div>
      </section>
    </div>
  );
}

type TreatmentDraft = Omit<Treatment, "id" | "imagePath"> & { imagePath: string | null };
type SaveTreatment = (draft: TreatmentDraft, id?: number, file?: File | null) => Promise<void>;

function TreatmentsView({ treatments, onSave, onDelete, busyId }: {
  treatments: Treatment[];
  onSave: SaveTreatment;
  onDelete: (treatment: Treatment) => void;
  busyId: string | null;
}) {
  const [editing, setEditing] = useState<Treatment | null | undefined>(undefined);
  return (
    <div className="admin-content">
      <div className="admin-section-intro">
        <div><h2>Treatments & pricing</h2><p>Changes are saved to the database and appear on the public website.</p></div>
        <button className="admin-primary-button" onClick={() => setEditing(null)}><Plus size={15} /> Add treatment</button>
      </div>
      {editing !== undefined ? <TreatmentForm treatment={editing} onSave={onSave} onClose={() => setEditing(undefined)} busy={busyId === (editing ? `treatment-${editing.id}` : "new-treatment")} /> : null}
      <div className="admin-treatment-grid">
        {treatments.map((treatment) => (
          <article className={`admin-treatment-card ${!treatment.isActive ? "is-disabled" : ""}`} key={treatment.id}>
            <div className="admin-treatment-icon">{treatment.imagePath ? <img src={`${baseApiPath}/storage${treatment.imagePath}`} alt="" /> : <ClipboardList size={17} />}</div>
            <div><h3>{treatment.title}</h3><p>{treatment.description}</p><small>Order {treatment.displayOrder} · {treatment.isActive ? "Public" : "Hidden"}</small></div>
            <strong>{treatment.price}</strong>
            <div className="admin-card-actions"><button className="admin-quiet-button" onClick={() => setEditing(treatment)}><Pencil size={14} /> Edit</button><button className="admin-danger-button" onClick={() => void onDelete(treatment)} disabled={busyId === `delete-treatment-${treatment.id}`}><Trash2 size={14} /> Delete</button></div>
          </article>
        ))}
      </div>
    </div>
  );
}

function TreatmentForm({ treatment, onSave, onClose, busy }: { treatment: Treatment | null; onSave: SaveTreatment; onClose: () => void; busy: boolean }) {
  const [draft, setDraft] = useState<TreatmentDraft>(() => treatment ? { title: treatment.title, description: treatment.description, price: treatment.price, icon: treatment.icon, isActive: treatment.isActive, displayOrder: treatment.displayOrder, imagePath: treatment.imagePath } : { title: "", description: "", price: "", icon: "Stethoscope", isActive: true, displayOrder: 0, imagePath: null });
  const [file, setFile] = useState<File | null>(null);
  const update = <K extends keyof TreatmentDraft>(key: K, value: TreatmentDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <form className="admin-editor-card" onSubmit={(event) => { event.preventDefault(); void onSave(draft, treatment?.id, file).then(onClose).catch(() => undefined); }}>
      <div className="admin-panel-heading"><div><div className="eyebrow">{treatment ? "Edit catalog item" : "New catalog item"}</div><h2>{treatment ? "Update treatment" : "Add treatment"}</h2></div><button type="button" className="admin-close-button" onClick={onClose}><X size={16} /></button></div>
      <div className="admin-form-grid">
        <label>Title<input required value={draft.title} onChange={(event) => update("title", event.target.value)} /></label>
        <label>Price<input required value={draft.price} onChange={(event) => update("price", event.target.value)} placeholder="₹500" /></label>
        <label className="admin-form-wide">Short description<textarea required rows={3} value={draft.description} onChange={(event) => update("description", event.target.value)} /></label>
        <label>Display order<input type="number" min="0" value={draft.displayOrder} onChange={(event) => update("displayOrder", Number(event.target.value))} /></label>
        <label>Icon<select value={draft.icon} onChange={(event) => update("icon", event.target.value)}><option>Stethoscope</option><option>Sparkles</option><option>ShieldCheck</option><option>CheckCircle2</option><option>Smile</option><option>CircleDollarSign</option><option>Baby</option></select></label>
        <label className="admin-checkbox"><input type="checkbox" checked={draft.isActive} onChange={(event) => update("isActive", event.target.checked)} /> Show on public website</label>
        <label className="admin-form-wide">Treatment image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><small>{file?.name || (draft.imagePath ? "Current image retained" : "Optional, up to 10 MB")}</small>{draft.imagePath ? <button type="button" className="admin-quiet-button" onClick={() => { update("imagePath", null); setFile(null); }}>Remove current image</button> : null}</label>
      </div>
      <div className="admin-detail-actions"><button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save treatment"}</button><button className="admin-quiet-button" type="button" onClick={onClose}>Cancel</button></div>
    </form>
  );
}

type BranchDraft = Omit<Branch, "id"> & { imagePath: string | null };
type SaveBranch = (draft: BranchDraft, id?: number, file?: File | null) => Promise<void>;

function BranchesView({ branches, onSave, onDelete, busyId }: {
  branches: Branch[];
  onSave: SaveBranch;
  onDelete: (branch: Branch) => void;
  busyId: string | null;
}) {
  const [editing, setEditing] = useState<Branch | null | undefined>(undefined);
  return (
    <div className="admin-content">
      <div className="admin-section-intro">
        <div><h2>Branches</h2><p>Manage the clinic locations available to patients and the public website.</p></div>
        <button className="admin-primary-button" onClick={() => setEditing(null)}><Plus size={15} /> Add branch</button>
      </div>
      {editing !== undefined ? <BranchForm branch={editing} onSave={onSave} onClose={() => setEditing(undefined)} busy={busyId === (editing ? `branch-${editing.id}` : "new-branch")} /> : null}
      <div className="admin-branch-grid">
        {branches.map((branch) => (
          <article className={`admin-branch-card ${!branch.isActive ? "is-disabled" : ""}`} key={branch.id}>
            <div className="admin-branch-image">{branch.imagePath ? <img src={`${baseApiPath}/storage${branch.imagePath}`} alt="" /> : <MapPin size={22} />}</div>
            <div className="admin-branch-content">
              <div className="admin-branch-heading"><div><h3>{branch.name}</h3><small>{branch.isActive ? "Available for booking" : "Hidden from booking"}</small></div><strong>{branch.phone}</strong></div>
              <p>{branch.address}</p>
              <div className="admin-branch-meta"><span>{branch.hours}</span><span>{branch.email}</span></div>
              <div className="admin-card-actions"><button className="admin-quiet-button" onClick={() => setEditing(branch)}><Pencil size={14} /> Edit</button><button className="admin-danger-button" onClick={() => void onDelete(branch)} disabled={busyId === `delete-branch-${branch.id}`}><Trash2 size={14} /> Delete</button></div>
            </div>
          </article>
        ))}
      </div>
      {branches.length === 0 ? <EmptyState icon={MapPin} title="No branches yet" copy="Add a branch so patients can choose where to book." /> : null}
    </div>
  );
}

function BranchForm({ branch, onSave, onClose, busy }: { branch: Branch | null; onSave: SaveBranch; onClose: () => void; busy: boolean }) {
  const [draft, setDraft] = useState<BranchDraft>(() => branch ? {
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    whatsapp: branch.whatsapp,
    email: branch.email,
    hours: branch.hours,
    sundayHours: branch.sundayHours,
    mapUrl: branch.mapUrl,
    imagePath: branch.imagePath,
    isActive: branch.isActive,
  } : {
    name: "",
    address: "",
    phone: "",
    whatsapp: "",
    email: "",
    hours: "",
    sundayHours: "",
    mapUrl: "",
    imagePath: null,
    isActive: true,
  });
  const [file, setFile] = useState<File | null>(null);
  const update = <K extends keyof BranchDraft>(key: K, value: BranchDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));
  return (
    <form className="admin-editor-card" onSubmit={(event) => { event.preventDefault(); void onSave(draft, branch?.id, file).then(onClose).catch(() => undefined); }}>
      <div className="admin-panel-heading"><div><div className="eyebrow">{branch ? "Edit clinic location" : "New clinic location"}</div><h2>{branch ? "Update branch" : "Add branch"}</h2></div><button type="button" className="admin-close-button" onClick={onClose}><X size={16} /></button></div>
      <div className="admin-form-grid">
        <label>Branch name<input required value={draft.name} onChange={(event) => update("name", event.target.value)} placeholder="SDC Kurla" /></label>
        <label>Phone number<input required value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label>
        <label>WhatsApp number<input required value={draft.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} /></label>
        <label>Email<input required type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} /></label>
        <label className="admin-form-wide">Full address<textarea required rows={2} value={draft.address} onChange={(event) => update("address", event.target.value)} /></label>
        <label>Opening / appointment hours<input required value={draft.hours} onChange={(event) => update("hours", event.target.value)} /></label>
        <label>Sunday hours<input required value={draft.sundayHours} onChange={(event) => update("sundayHours", event.target.value)} /></label>
        <label className="admin-form-wide">Google Maps URL<input value={draft.mapUrl} onChange={(event) => update("mapUrl", event.target.value)} /></label>
        <label className="admin-checkbox"><input type="checkbox" checked={draft.isActive} onChange={(event) => update("isActive", event.target.checked)} /> Allow patients to book this branch</label>
        <label className="admin-form-wide">Branch image<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /><small>{file?.name || (draft.imagePath ? "Current image retained" : "Optional, up to 10 MB")}</small>{draft.imagePath ? <button type="button" className="admin-quiet-button" onClick={() => { update("imagePath", null); setFile(null); }}>Remove current image</button> : null}</label>
      </div>
      <div className="admin-detail-actions"><button className="admin-primary-button" type="submit" disabled={busy}>{busy ? "Saving…" : "Save branch"}</button><button className="admin-quiet-button" type="button" onClick={onClose}>Cancel</button></div>
    </form>
  );
}

function MediaView({ media, onUpload, onDelete, busyId }: { media: MediaItem[]; onUpload: (file: File) => Promise<string>; onDelete: (item: MediaItem) => void; busyId: string | null }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="admin-content">
      <div className="admin-section-intro"><div><h2>Clinic media</h2><p>Persistent images used by treatments and the public clinic website.</p></div><label className="admin-primary-button"><Upload size={15} /> {uploading ? "Uploading…" : "Upload image"}<input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={uploading} onChange={async (event) => { const file = event.target.files?.[0]; if (!file) return; setError(""); setUploading(true); try { await onUpload(file); } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Unable to upload image."); } finally { setUploading(false); event.target.value = ""; } }} /></label></div>
      {error ? <div className="admin-inline-error" role="alert">{error}</div> : null}
      <div className="admin-media-grid">{media.map((item) => <article className="admin-media-card" key={item.id}><img src={`${baseApiPath}/storage${item.objectPath}`} alt={item.originalName} /><div><strong>{item.originalName}</strong><small>{Math.ceil(item.size / 1024)} KB</small></div><button className="admin-danger-button" onClick={() => void onDelete(item)} disabled={busyId === `media-${item.id}`}><Trash2 size={14} /> Remove</button></article>)}</div>
      {media.length === 0 ? <EmptyState icon={ImageIcon} title="No clinic media yet" copy="Uploaded treatment and clinic images will appear here." /> : null}
    </div>
  );
}

function SettingsView({ user, settings, onSave, busyId }: { user: ReturnType<typeof useUser>["user"]; settings: ClinicSettings | null; onSave: (settings: Omit<ClinicSettings, "id">) => Promise<void>; busyId: string | null }) {
  const [draft, setDraft] = useState<Omit<ClinicSettings, "id"> | null>(settings ? { ...settings } : null);
  useEffect(() => { if (settings) setDraft({ ...settings }); }, [settings]);
  if (!draft) return <div className="admin-content"><EmptyState icon={Settings2} title="Settings unavailable" copy="Clinic settings could not be loaded." /></div>;
  const update = (key: keyof typeof draft, value: string) => setDraft((current) => current ? { ...current, [key]: value } : current);
  return (
    <div className="admin-content">
      <div className="admin-section-intro"><div><h2>Clinic settings</h2><p>These values are used by the public website and contact flows.</p></div><span className="admin-data-note"><ShieldCheck size={14} /> Protected by Clerk</span></div>
      <form className="admin-editor-card" onSubmit={(event) => { event.preventDefault(); void onSave(draft).catch(() => undefined); }}>
        <div className="admin-form-grid">
          <label>Clinic name<input required value={draft.clinicName} onChange={(event) => update("clinicName", event.target.value)} /></label>
          <label>Phone<input required value={draft.phone} onChange={(event) => update("phone", event.target.value)} /></label>
           <label>Alternate phone<input required value={draft.alternatePhone} onChange={(event) => update("alternatePhone", event.target.value)} /></label>
          <label>WhatsApp number<input required value={draft.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} /></label>
          <label>Email<input required type="email" value={draft.email} onChange={(event) => update("email", event.target.value)} /></label>
          <label className="admin-form-wide">Address<textarea required rows={2} value={draft.address} onChange={(event) => update("address", event.target.value)} /></label>
          <label>Opening hours<input required value={draft.hours} onChange={(event) => update("hours", event.target.value)} /></label>
          <label>Sunday hours<input required value={draft.sundayHours} onChange={(event) => update("sundayHours", event.target.value)} /></label>
          <label>Instagram URL<input value={draft.socialInstagram} onChange={(event) => update("socialInstagram", event.target.value)} /></label>
          <label>Facebook URL<input value={draft.socialFacebook} onChange={(event) => update("socialFacebook", event.target.value)} /></label>
          <label className="admin-form-wide">Map URL<input value={draft.mapUrl} onChange={(event) => update("mapUrl", event.target.value)} /></label>
        </div>
        <div className="admin-detail-actions"><button className="admin-primary-button" type="submit" disabled={busyId === "settings"}>{busyId === "settings" ? "Saving…" : "Save settings"}</button></div>
      </form>
      <div className="admin-settings-grid"><section className="admin-panel-card"><div className="admin-panel-heading"><div><div className="eyebrow">Signed-in account</div><h2>Admin identity</h2></div><ShieldCheck size={19} /></div><div className="admin-settings-row"><span>Name</span><strong>{user?.fullName || user?.firstName || "Clinic admin"}</strong></div><div className="admin-settings-row"><span>Email</span><strong>{user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress}</strong></div></section></div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, copy }: { icon: typeof Activity; title: string; copy: string }) {
  return <div className="admin-empty-state"><Icon size={22} /><strong>{title}</strong><span>{copy}</span></div>;
}