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
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Phone,
  Search,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useClerk, useUser } from "@clerk/react";

type AdminView = "dashboard" | "appointments" | "inquiries" | "treatments";
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

type Appointment = {
  id: number;
  patientName: string;
  phone: string;
  email: string;
  age: number;
  treatment: string;
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
  contact: string;
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

type Treatment = { title: string; price: string; copy: string };

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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [dashboardResult, appointmentResult, inquiryResult, treatmentResult] = await Promise.all([
        apiRequest<Dashboard>("/admin/dashboard"),
        apiRequest<{ appointments: Appointment[] }>("/admin/appointments"),
        apiRequest<{ inquiries: Inquiry[] }>("/admin/inquiries"),
        apiRequest<{ treatments: Treatment[] }>("/admin/treatments"),
      ]);
      setDashboard(dashboardResult);
      setAppointments(appointmentResult.appointments);
      setInquiries(inquiryResult.inquiries);
      setTreatments(treatmentResult.treatments);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the admin panel.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredAppointments = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return appointments;
    return appointments.filter((appointment) =>
      [appointment.patientName, appointment.phone, appointment.email, appointment.treatment, appointment.status]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [appointments, searchTerm]);

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
    if (inquiry.isRead) return;
    setBusyId(`inquiry-${inquiry.id}`);
    try {
      await apiRequest(`/admin/inquiries/${inquiry.id}/read`, { method: "PATCH" });
      await loadData();
    } catch (readError) {
      setError(readError instanceof Error ? readError.message : "Unable to update inquiry.");
    } finally {
      setBusyId(null);
    }
  };

  const navItems: Array<{ id: AdminView; label: string; icon: typeof LayoutDashboard }> = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "appointments", label: "Appointments", icon: CalendarDays },
    { id: "inquiries", label: "Inquiries", icon: MessageSquare },
    { id: "treatments", label: "Treatments", icon: ClipboardList },
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
        <a href="/" className="admin-brand">
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
            onSelect={setSelectedAppointment}
            onStatus={updateAppointmentStatus}
            onDelete={deleteAppointment}
            busyId={busyId}
          />
        ) : null}

        {view === "inquiries" ? (
          <InquiriesView inquiries={inquiries} onRead={markInquiryRead} busyId={busyId} />
        ) : null}

        {view === "treatments" ? <TreatmentsView treatments={treatments} /> : null}
      </section>

      {selectedAppointment ? (
        <div className="admin-modal-backdrop" role="presentation" onClick={() => setSelectedAppointment(null)}>
          <section className="admin-detail-modal" role="dialog" aria-modal="true" aria-labelledby="appointment-detail-title" onClick={(event) => event.stopPropagation()}>
            <div className="admin-detail-head">
              <div><div className="eyebrow">Appointment request</div><h2 id="appointment-detail-title">{selectedAppointment.patientName}</h2></div>
              <button className="admin-close-button" onClick={() => setSelectedAppointment(null)} aria-label="Close details"><X size={18} /></button>
            </div>
            <span className={`status-badge status-${selectedAppointment.status}`}>{statusLabel(selectedAppointment.status)}</span>
            <div className="admin-detail-grid">
              <div><span>Patient</span><strong>{selectedAppointment.patientName}, {selectedAppointment.age}</strong></div>
              <div><span>Treatment</span><strong>{selectedAppointment.treatment}</strong></div>
              <div><span>Preferred visit</span><strong>{formatDate(selectedAppointment.appointmentDate)} · {selectedAppointment.appointmentTime}</strong></div>
              <div><span>Submitted</span><strong>{formatDateTime(selectedAppointment.submittedAt)}</strong></div>
              <div><span>Phone</span><a href={`tel:${selectedAppointment.phone}`}><Phone size={13} /> {selectedAppointment.phone}</a></div>
              <div><span>Email</span><a href={`mailto:${selectedAppointment.email}`}><Mail size={13} /> {selectedAppointment.email}</a></div>
            </div>
            <div className="admin-detail-notes"><span>Message / notes</span><p>{selectedAppointment.notes || "No additional notes were provided."}</p></div>
            <div className="admin-detail-actions">
              {selectedAppointment.status !== "confirmed" ? <button className="admin-primary-button" onClick={() => void updateAppointmentStatus(selectedAppointment, "confirmed")} disabled={busyId === `appointment-${selectedAppointment.id}`}><Check size={15} /> Confirm</button> : null}
              {selectedAppointment.status !== "completed" ? <button className="admin-secondary-button" onClick={() => void updateAppointmentStatus(selectedAppointment, "completed")} disabled={busyId === `appointment-${selectedAppointment.id}`}><CheckCircle2 size={15} /> Complete</button> : null}
              {selectedAppointment.status !== "cancelled" ? <button className="admin-danger-button" onClick={() => void updateAppointmentStatus(selectedAppointment, "cancelled")} disabled={busyId === `appointment-${selectedAppointment.id}`}><X size={15} /> Cancel</button> : null}
              <button className="admin-quiet-button" onClick={() => void deleteAppointment(selectedAppointment)} disabled={busyId === `delete-${selectedAppointment.id}`}><Trash2 size={15} /> Delete</button>
            </div>
          </section>
        </div>
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

function AppointmentsView({ appointments, searchTerm, onSearch, onSelect, onStatus, onDelete, busyId }: {
  appointments: Appointment[];
  searchTerm: string;
  onSearch: (value: string) => void;
  onSelect: (appointment: Appointment) => void;
  onStatus: (appointment: Appointment, status: AppointmentStatus) => void;
  onDelete: (appointment: Appointment) => void;
  busyId: string | null;
}) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro"><div><h2>Appointments & bookings</h2><p>Review every request submitted through the clinic website.</p></div><span className="admin-count-label">{appointments.length} {appointments.length === 1 ? "request" : "requests"}</span></div>
      <div className="admin-toolbar"><label className="admin-search"><Search size={16} /><input value={searchTerm} onChange={(event) => onSearch(event.target.value)} placeholder="Search patients, treatments, or status" /></label><span className="admin-data-note"><ShieldCheck size={14} /> Live database records</span></div>
      <div className="admin-table-card">
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Patient</th><th>Treatment</th><th>Preferred visit</th><th>Submitted</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{appointments.map((appointment) => <tr key={appointment.id}><td><button className="patient-cell" onClick={() => onSelect(appointment)}><span className="patient-initial">{appointment.patientName[0]}</span><span><strong>{appointment.patientName}</strong><small>{appointment.phone}</small></span></button></td><td><span className="table-primary">{appointment.treatment}</span><small className="table-secondary">{appointment.email}</small></td><td><span className="table-primary">{formatDate(appointment.appointmentDate)}</span><small className="table-secondary">{appointment.appointmentTime}</small></td><td><span className="table-secondary">{formatDateTime(appointment.submittedAt)}</span></td><td><select className={`status-select status-${appointment.status}`} value={appointment.status} onChange={(event) => void onStatus(appointment, event.target.value as AppointmentStatus)} disabled={busyId === `appointment-${appointment.id}`} aria-label={`Status for ${appointment.patientName}`}>{(["pending", "confirmed", "completed", "cancelled"] as AppointmentStatus[]).map((status) => <option value={status} key={status}>{statusLabel(status)}</option>)}</select></td><td><div className="table-actions"><button onClick={() => onSelect(appointment)} aria-label={`View ${appointment.patientName}'s booking`}><Eye size={15} /></button><button onClick={() => void onDelete(appointment)} disabled={busyId === `delete-${appointment.id}`} aria-label={`Delete ${appointment.patientName}'s booking`}><Trash2 size={15} /></button></div></td></tr>)}</tbody></table>{appointments.length === 0 ? <EmptyState icon={CalendarDays} title="No appointments found" copy={searchTerm ? "Try a different search term." : "New booking requests will appear here automatically."} /> : null}</div>
      </div>
    </div>
  );
}

function InquiriesView({ inquiries, onRead, busyId }: { inquiries: Inquiry[]; onRead: (inquiry: Inquiry) => void; busyId: string | null }) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro"><div><h2>Inquiries & messages</h2><p>Keep up with questions sent through the clinic contact form.</p></div><span className="admin-count-label">{inquiries.filter((inquiry) => !inquiry.isRead).length} unread</span></div>
      <div className="admin-inquiry-list">{inquiries.map((inquiry) => <article className={`inquiry-card ${inquiry.isRead ? "is-read" : ""}`} key={inquiry.id}><span className="inquiry-icon"><MessageSquare size={17} /></span><div className="inquiry-main"><div className="inquiry-head"><div><strong>{inquiry.name}</strong><span>{inquiry.contact}</span></div><small>{formatDateTime(inquiry.submittedAt)}</small></div><p>{inquiry.message}</p>{!inquiry.isRead ? <button className="admin-mark-read" onClick={() => void onRead(inquiry)} disabled={busyId === `inquiry-${inquiry.id}`}><Check size={14} /> Mark as read</button> : <span className="inquiry-read-label"><Check size={13} /> Read</span>}</div></article>)}{inquiries.length === 0 ? <EmptyState icon={MessageSquare} title="No inquiries yet" copy="Messages from the public contact form will appear here." /> : null}</div>
    </div>
  );
}

function TreatmentsView({ treatments }: { treatments: Treatment[] }) {
  return (
    <div className="admin-content">
      <div className="admin-section-intro"><div><h2>Treatments & pricing</h2><p>Review the treatments currently shown on the public clinic website.</p></div><span className="admin-data-note"><FileText size={14} /> Read-only public catalog</span></div>
      <div className="admin-treatment-grid">{treatments.map((treatment) => <article className="admin-treatment-card" key={treatment.title}><div className="admin-treatment-icon"><ClipboardList size={17} /></div><div><h3>{treatment.title}</h3><p>{treatment.copy}</p></div><strong>{treatment.price}</strong></article>)}</div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, copy }: { icon: typeof Activity; title: string; copy: string }) {
  return <div className="admin-empty-state"><Icon size={22} /><strong>{title}</strong><span>{copy}</span></div>;
}