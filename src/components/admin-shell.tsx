"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CreditCard,
  LayoutDashboard,
  Loader2,
  LogOut,
  Pencil,
  Plus,
  Settings,
  Sparkles,
  Ticket,
  Trash2,
  UserCog,
  Users,
} from "lucide-react";
import { Badge, Button, Card } from "@/components/ui";
import { AdminCourseEditor } from "@/components/admin-course-editor";
import { AdminSectionsManager } from "@/components/admin-sections-manager";
import { AdminTestimonialsManager } from "@/components/admin-testimonials-manager";
import { AdminCouponsManager } from "@/components/admin-coupons-manager";
import { AdminUsersManager } from "@/components/admin-users-manager";
import { AdminBecasManager } from "@/components/admin-becas-manager";
import { createCourseAction, deleteCourseAction, saveCourseAction } from "@/server/actions/courses";
import { createSectionAction, deleteSectionAction, renameSectionAction } from "@/server/actions/sections";
import { createTestimonialAction, deleteTestimonialAction } from "@/server/actions/testimonials";
import { createCouponAction, deleteCouponAction, toggleCouponAction } from "@/server/actions/coupons";
import { createStaffUserAction, deleteStaffUserAction } from "@/server/actions/users";
import { createBecaAction, deleteBecaAction } from "@/server/actions/becas";
import { authClient } from "@/lib/auth-client";
import type { EnrollmentRow, PaymentRow, ReportStats } from "@/server/admin";
import type { Testimonial } from "@/server/testimonials";
import type { Coupon } from "@/server/coupons";
import type { StaffRole, StaffUser } from "@/server/users";
import type { Beca, BecasStats } from "@/server/becas";
import type { Course, Section } from "@/lib/types";
import { cn, formatCOP } from "@/lib/utils";

type Tab = "cursos" | "matriculas" | "pagos" | "cupones" | "usuarios" | "becas" | "reportes" | "config";

function tabsForRole(role: string): { key: Tab; label: string; icon: React.ReactNode }[] {
  const base: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "cursos", label: "Cursos", icon: <BookOpen size={18} /> },
    { key: "matriculas", label: "Matrículas", icon: <Users size={18} /> },
    { key: "pagos", label: "Pagos", icon: <CreditCard size={18} /> },
    { key: "cupones", label: "Cupones", icon: <Ticket size={18} /> },
    { key: "usuarios", label: "Usuarios", icon: <UserCog size={18} /> },
  ];
  // Becas solo la administra superadmin — ni siquiera aparece el tab para un admin normal.
  if (role === "superadmin") {
    base.push({ key: "becas", label: "Becas GEIFEM", icon: <Sparkles size={18} /> });
  }
  base.push(
    { key: "reportes", label: "Reportes", icon: <LayoutDashboard size={18} /> },
    { key: "config", label: "Configuración", icon: <Settings size={18} /> },
  );
  return base;
}

const ESTADO_TONE: Record<string, "brand" | "accent" | "neutral"> = {
  pagado: "brand",
  pendiente: "accent",
  fallido: "neutral",
};

export function AdminShell({
  initialCourses,
  allCategories,
  initialSections,
  userId,
  userName,
  userRole,
  enrollments,
  payments,
  reportStats,
  initialTestimonials,
  initialCoupons,
  initialStaff,
  initialBecas,
  becasStats,
}: {
  initialCourses: Course[];
  allCategories: string[];
  initialSections: Section[];
  userId: string;
  userName: string;
  userRole: string;
  enrollments: EnrollmentRow[];
  payments: PaymentRow[];
  reportStats: ReportStats;
  initialTestimonials: Testimonial[];
  initialCoupons: Coupon[];
  initialStaff: StaffUser[];
  initialBecas: Beca[];
  becasStats: BecasStats | null;
}) {
  const tabs = tabsForRole(userRole);
  const [tab, setTab] = useState<Tab>("cursos");
  const [courses, setCourses] = useState(initialCourses);
  const [sections, setSections] = useState(initialSections);
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [coupons, setCoupons] = useState(initialCoupons);
  const [staff, setStaff] = useState(initialStaff);
  const [becas, setBecas] = useState(initialBecas);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function createBeca(input: { beneficiarioNombre: string; criterio: string }) {
    startTransition(async () => {
      const created = await createBecaAction(input);
      setBecas((prev) => [created, ...prev]);
      router.refresh();
    });
  }

  function removeBeca(id: string) {
    startTransition(async () => {
      await deleteBecaAction(id);
      setBecas((prev) => prev.filter((b) => b.id !== id));
      router.refresh();
    });
  }

  function createStaff(input: { name: string; email: string; password: string; role: StaffRole }) {
    startTransition(async () => {
      const created = await createStaffUserAction(input);
      setStaff((prev) => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
    });
  }

  function removeStaff(id: string) {
    startTransition(async () => {
      await deleteStaffUserAction(id);
      setStaff((prev) => prev.filter((s) => s.id !== id));
    });
  }

  function createCoupon(input: {
    codigo: string;
    tipo: "porcentaje" | "fijo";
    valor: number;
    usosMaximos: number | null;
    fechaExpiracion: string | null;
  }) {
    startTransition(async () => {
      const coupon = await createCouponAction(input);
      setCoupons((prev) => [coupon, ...prev]);
    });
  }

  function toggleCoupon(id: string, activo: boolean) {
    startTransition(async () => {
      await toggleCouponAction(id, activo);
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, activo } : c)));
    });
  }

  function removeCoupon(id: string) {
    startTransition(async () => {
      await deleteCouponAction(id);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    });
  }

  function createTestimonial(input: { nombre: string; rol: string; texto: string }) {
    startTransition(async () => {
      const testimonial = await createTestimonialAction(input);
      setTestimonials((prev) => [testimonial, ...prev]);
    });
  }

  function removeTestimonial(id: string) {
    startTransition(async () => {
      await deleteTestimonialAction(id);
      setTestimonials((prev) => prev.filter((t) => t.id !== id));
    });
  }

  function createSection(nombre: string) {
    startTransition(async () => {
      const section = await createSectionAction(nombre);
      setSections((prev) => [...prev, section]);
    });
  }

  function renameSection(id: string, nombre: string) {
    startTransition(async () => {
      await renameSectionAction(id, nombre);
      setSections((prev) => prev.map((s) => (s.id === id ? { ...s, nombre } : s)));
    });
  }

  function removeSection(id: string) {
    startTransition(async () => {
      await deleteSectionAction(id);
      setSections((prev) => prev.filter((s) => s.id !== id));
      setCourses((prev) => prev.map((c) => (c.seccionId === id ? { ...c, seccionId: null, seccionNombre: "Sin sección" } : c)));
    });
  }

  async function logout() {
    await authClient.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  function createCourse() {
    startTransition(async () => {
      const course = await createCourseAction();
      setCourses((prev) => [...prev, course]);
      setEditingSlug(course.slug);
    });
  }

  function saveCourse(updated: Course) {
    startTransition(async () => {
      await saveCourseAction(updated);
      setCourses((prev) => prev.map((c) => (c.slug === editingSlug ? updated : c)));
      setEditingSlug(null);
    });
  }

  function removeCourse(slug: string) {
    startTransition(async () => {
      await deleteCourseAction(slug);
      setCourses((prev) => prev.filter((c) => c.slug !== slug));
    });
  }

  const editingCourse = courses.find((c) => c.slug === editingSlug) ?? null;

  return (
    <div className="flex min-h-screen bg-surface-muted">
      <aside className="w-64 shrink-0 border-r border-border bg-surface p-4">
        <div className="mb-6 flex items-center gap-2 px-2 font-bold text-ink">
          <Image src="/brand/logo.png" alt="GEIFEM Academy" width={36} height={36} className="rounded-xl" />
          GEIFEM Academy admin
        </div>
        <nav className="space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium",
                tab === t.key ? "bg-brand-50 text-brand-700" : "text-ink-soft hover:bg-surface-muted",
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6 border-t border-border pt-4">
          <p className="truncate px-3 text-xs text-ink-soft">{userName}</p>
          {userRole === "superadmin" && (
            <div className="px-3 pt-1">
              <Badge tone="accent">Superadmin</Badge>
            </div>
          )}
          <button
            onClick={logout}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-soft hover:bg-surface-muted"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8">
        {tab === "cursos" && (
          <div>
            {editingCourse ? (
              <AdminCourseEditor
                course={editingCourse}
                onSave={saveCourse}
                onCancel={() => setEditingSlug(null)}
                saving={pending}
                allCategories={allCategories}
                sections={sections}
              />
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-ink">Cursos</h1>
                  <Button onClick={createCourse} disabled={pending}>
                    {pending ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Nuevo curso
                  </Button>
                </div>

                <AdminSectionsManager
                  sections={sections}
                  onCreate={createSection}
                  onRename={renameSection}
                  onDelete={removeSection}
                  pending={pending}
                />

                {courses.length === 0 ? (
                  <Card className="text-center text-ink-soft">
                    Todavía no hay cursos. Crea el primero con "Nuevo curso" — en cuanto lo
                    guardes, aparece en el catálogo público.
                  </Card>
                ) : (
                  <Card className="overflow-x-auto p-0">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b border-border bg-surface-muted text-xs uppercase text-ink-soft">
                        <tr>
                          <th className="px-4 py-3">Curso</th>
                          <th className="px-4 py-3">Sección</th>
                          <th className="px-4 py-3">Categorías</th>
                          <th className="px-4 py-3">Precio</th>
                          <th className="px-4 py-3">Unidades</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {courses.map((c) => (
                          <tr key={c.slug} className="border-b border-border last:border-0">
                            <td className="px-4 py-3 font-medium text-ink">{c.titulo}</td>
                            <td className="px-4 py-3">
                              <Badge tone={c.seccionId ? "brand" : "neutral"}>{c.seccionNombre}</Badge>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-wrap gap-1">
                                {c.categorias.map((cat) => (
                                  <Badge key={cat} tone="neutral">
                                    {cat}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3">{formatCOP(c.precio)}</td>
                            <td className="px-4 py-3">{c.unidades.length}</td>
                            <td className="px-4 py-3">
                              <div className="flex justify-end gap-2">
                                <button
                                  className="rounded-lg p-1.5 text-ink-soft hover:bg-surface-muted"
                                  onClick={() => setEditingSlug(c.slug)}
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                                  onClick={() => removeCourse(c.slug)}
                                  disabled={pending}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                )}
              </>
            )}
          </div>
        )}

        {tab === "matriculas" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-ink">Matrículas</h1>
            {enrollments.length === 0 ? (
              <Card className="text-center text-ink-soft">Todavía no hay matrículas.</Card>
            ) : (
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-muted text-xs uppercase text-ink-soft">
                    <tr>
                      <th className="px-4 py-3">Estudiante</th>
                      <th className="px-4 py-3">Curso</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Progreso</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((e) => (
                      <tr key={e.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink">{e.estudianteNombre}</p>
                          <p className="text-xs text-ink-soft">{e.estudianteEmail}</p>
                        </td>
                        <td className="px-4 py-3">{e.cursoTitulo}</td>
                        <td className="px-4 py-3">
                          <Badge tone={ESTADO_TONE[e.estadoPago] ?? "neutral"}>{e.estadoPago}</Badge>
                        </td>
                        <td className="px-4 py-3">{e.porcentajeCompletado}%</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {new Date(e.fecha).toLocaleDateString("es-CO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {tab === "pagos" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-ink">Pagos</h1>
            {payments.length === 0 ? (
              <Card className="text-center text-ink-soft">Todavía no hay pagos.</Card>
            ) : (
              <Card className="overflow-x-auto p-0">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-surface-muted text-xs uppercase text-ink-soft">
                    <tr>
                      <th className="px-4 py-3">Estudiante</th>
                      <th className="px-4 py-3">Curso</th>
                      <th className="px-4 py-3">Monto</th>
                      <th className="px-4 py-3">Cupón</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3">Factura Alegra</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.id} className="border-b border-border last:border-0">
                        <td className="px-4 py-3 font-medium text-ink">{p.estudianteNombre}</td>
                        <td className="px-4 py-3">{p.cursoTitulo}</td>
                        <td className="px-4 py-3">{formatCOP(Math.round(p.montoCents / 100))}</td>
                        <td className="px-4 py-3 text-ink-soft">
                          {p.cuponCodigo ? (
                            <span className="font-mono text-xs">
                              {p.cuponCodigo} (-{formatCOP(Math.round(p.descuentoCents / 100))})
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Badge tone={ESTADO_TONE[p.estado] ?? "neutral"}>{p.estado}</Badge>
                        </td>
                        <td className="px-4 py-3 text-ink-soft">
                          {p.facturaAlegraId ? `#${p.facturaAlegraId}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-ink-soft">
                          {new Date(p.fecha).toLocaleDateString("es-CO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {tab === "cupones" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-ink">Cupones de descuento</h1>
            <AdminCouponsManager
              coupons={coupons}
              onCreate={createCoupon}
              onToggle={toggleCoupon}
              onDelete={removeCoupon}
              pending={pending}
            />
          </div>
        )}

        {tab === "usuarios" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-ink">Usuarios</h1>
            <AdminUsersManager
              staff={staff}
              currentUserId={userId}
              onCreate={createStaff}
              onDelete={removeStaff}
              pending={pending}
            />
          </div>
        )}

        {tab === "reportes" && (
          <div>
            <h1 className="mb-6 text-2xl font-bold text-ink">Reportes</h1>
            <div className="grid grid-cols-2 gap-4">
              <Stat label="Matrículas pagadas" value={reportStats.matriculasPagadas} />
              <Stat
                label="Ingresos totales"
                value={formatCOP(Math.round(reportStats.ingresosTotalesCents / 100))}
              />
            </div>
            <Card className="mt-6">
              <p className="mb-3 font-semibold text-ink">Cursos más vendidos</p>
              {reportStats.topCursos.length === 0 ? (
                <p className="text-sm text-ink-soft">Todavía no hay ventas.</p>
              ) : (
                <div className="space-y-2">
                  {reportStats.topCursos.map((c) => (
                    <div key={c.titulo} className="flex items-center justify-between text-sm">
                      <span className="text-ink">{c.titulo}</span>
                      <span className="font-semibold text-brand-700">{c.ventas} ventas</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "becas" && becasStats && (
          <AdminBecasManager stats={becasStats} becas={becas} onCreate={createBeca} onDelete={removeBeca} pending={pending} />
        )}

        {tab === "config" && (
          <div>
            <h1 className="mb-2 text-2xl font-bold text-ink">Configuración</h1>
            <p className="mb-6 text-ink-soft">
              El nombre del sitio, textos legales y demás copy siguen escritos directo en el
              código — eso se completa cuando haya algo real que editar. Lo que sí es real y se
              gestiona aquí son los testimonios de la landing.
            </p>
            <AdminTestimonialsManager
              testimonials={testimonials}
              onCreate={createTestimonial}
              onDelete={removeTestimonial}
              pending={pending}
            />
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value, tone = "brand" }: { label: string; value: number | string; tone?: "brand" | "accent" }) {
  return (
    <Card>
      <p className="text-xs font-semibold uppercase text-ink-soft">{label}</p>
      <p className={cn("mt-2 text-3xl font-extrabold", tone === "brand" ? "text-brand-700" : "text-accent-600")}>
        {value}
      </p>
    </Card>
  );
}
