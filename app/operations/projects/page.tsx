/**
 * Define the operations projects page responsibility boundary.
 * Coordinates operations projects page data loading, authorization, and presentation.
 */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, CircleDot, Code2, LockKeyhole, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocalization } from "@/lib/localization-context";
import { createWorkItem, listWorkItems, updateWorkItem, type WorkItem } from "@/lib/operations-api";

type Column = "Backlog" | "Building" | "Review" | "Done";
type Priority = "Low" | "Normal" | "High";
const columns: Column[] = ["Backlog", "Building", "Review", "Done"];
const projectComponents = ["Frontend", "Backend", "Discord Bot", "Wiki", "Localization", "WatchCat", "Operations"] as const;

/**
 * Handles the exported route operation using its declared request and response contract.
 * Returns: `React.JSX.Element`
 */
export default function ProjectsPage() {
  const { user, isLoading } = useAuth();
  const { t } = useLocalization();
  const [items, setItems] = useState<WorkItem[]>([]);
  const [selected, setSelected] = useState<WorkItem | null>(null);
  const isManager = user?.isAdmin === true || user?.isProjectDeveloper === true;
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{if(isManager) void listWorkItems().then(setItems).catch(reason=>setError(reason instanceof Error?reason.message:"Unable to load projects"));},[isManager]);

  if (isLoading) return <div className="pc-card p-8 text-sm text-pc-text-secondary">{t("generated.operations.ticketLoading")}</div>;
  if (!isManager) return <AccessWall />;

  async function addWorkItem() {
    try { const created=await createWorkItem({title:t("generated.operations.projectsUntitled"),component:"Frontend"}); const next=await listWorkItems(); setItems(next); setSelected(next.find(item=>item.id===created.id)??null); } catch(reason) { setError(reason instanceof Error?reason.message:t("generated.operations.statsLoadFailed")); }
  }
  async function save(form: FormData) {
    if (!selected) return;
    const updated: WorkItem = {
      ...selected,
      title: String(form.get("title") ?? "").trim() || selected.title,
      component: (() => { const project = String(form.get("project") ?? ""); const customProject = String(form.get("customProject") ?? "").trim(); return project === "__custom" ? customProject || selected.component : project || selected.component; })(),
      column_name: String(form.get("column") ?? "backlog").toLowerCase() as WorkItem["column_name"],
      priority: String(form.get("priority") ?? "normal").toLowerCase() as WorkItem["priority"],
      assignee: String(form.get("assignee") ?? "").trim() || null,
      details: String(form.get("details") ?? "").trim(),
    };
    try { await updateWorkItem(updated.id,updated); setItems(await listWorkItems()); setSelected(null); } catch(reason) { setError(reason instanceof Error?reason.message:"Unable to save task"); }
  }

  const columnLabel:Record<Column,string>={Backlog:t("generated.operations.projectsBacklog"),Building:t("generated.operations.projectsBuilding"),Review:t("generated.operations.projectsReview"),Done:t("generated.operations.projectsDone")};
  return <div className="space-y-5">
    <header className="flex items-center justify-between border-b border-pc-border pb-5"><h1 className="pc-heading pc-heading-lg">{t("generated.operations.projects")}</h1><button type="button" onClick={addWorkItem} className="pc-btn-primary inline-flex items-center gap-2 text-sm"><Plus className="h-4 w-4" /> {t("generated.operations.projectsAddTask")}</button></header>
    <section className="overflow-x-auto pb-3"><div className="grid min-w-[940px] grid-cols-4 gap-4">{columns.map((column) => {const value=column.toLowerCase() as WorkItem["column_name"];return <div key={column} className="rounded-xl border border-pc-border bg-pc-bg/55 p-3"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold text-pc-text">{columnLabel[column]}</h2><span className="rounded-full bg-pc-bg-elevated px-2 py-0.5 text-xs text-pc-text-muted">{items.filter((item) => item.column_name === value).length}</span></div><div className="space-y-3">{items.filter((item) => item.column_name === value).map((item) => <WorkCard key={item.id} item={item} onClick={() => setSelected(item)} />)}{items.every((item) => item.column_name !== value) && <div className="rounded-lg border border-dashed border-pc-border/70 p-4 text-center text-xs text-pc-text-muted">{t("generated.operations.projectsNoTasks")}</div>}</div></div>})}</div>{error&&<p className="mt-3 text-sm text-rose-200">{error}</p>}</section>
    {selected && <TaskDialog item={selected} onClose={() => setSelected(null)} onSave={save} />}
  </div>;
}

function AccessWall() { const {t}=useLocalization(); return <div className="mx-auto max-w-xl pc-card p-7 text-center"><LockKeyhole className="mx-auto h-8 w-8 text-pc-accent" /><h1 className="mt-3 text-xl font-bold text-pc-text">{t("generated.operations.projects")}</h1><p className="mt-2 text-sm text-pc-text-secondary">{t("generated.operations.projectsRestricted")}</p><Link href="/operations/tickets" className="pc-btn-secondary mt-5 inline-flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" /> {t("generated.operations.tickets")}</Link></div>; }
function WorkCard({ item, onClick }: { item: WorkItem; onClick: () => void }) { const priority = item.priority === "high" ? "text-rose-300" : item.priority === "low" ? "text-pc-text-muted" : "text-amber-200"; return <button type="button" onClick={onClick} className="block w-full rounded-xl border border-pc-border bg-pc-bg-elevated p-3 text-left transition hover:border-pc-accent/50"><div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-semibold text-pc-accent">{item.code}</span><span className={`text-xs ${priority}`}>{item.priority}</span></div><h3 className="mt-2 text-sm font-semibold leading-snug text-pc-text">{item.title}</h3><div className="mt-3 flex items-center justify-between gap-2 text-xs text-pc-text-muted"><span className="truncate">{item.component}</span>{item.assignee ? <span className="inline-flex items-center gap-1"><Code2 className="h-3 w-3" />{item.assignee}</span> : <CircleDot className="h-3.5 w-3.5" />}</div></button>; }
function TaskDialog({ item, onClose, onSave }: { item: WorkItem; onClose: () => void; onSave: (form: FormData) => void }) {
  const {t}=useLocalization(); const knownProject = projectComponents.includes(item.component as typeof projectComponents[number]); const [project, setProject] = useState(knownProject ? item.component : "__custom");
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label={t("generated.operations.projectsEditTask")}><form action={onSave} className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-xl border border-pc-border bg-pc-bg-secondary p-5 shadow-2xl"><div className="flex items-center justify-between gap-3"><span className="font-mono text-xs text-pc-accent">{item.code}</span><button type="button" onClick={onClose} className="rounded p-1 text-pc-text-muted hover:bg-pc-bg-elevated hover:text-pc-text" aria-label={t("generated.operations.projectsClose")}><X className="h-5 w-5"/></button></div><div className="mt-4 space-y-4"><input required name="title" defaultValue={item.title} className="w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-base font-semibold text-pc-text"/><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs text-pc-text-secondary">{t("generated.operations.projectsStatus")}<select name="column" defaultValue={item.column_name} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm text-pc-text"><option value="backlog">{t("generated.operations.projectsBacklog")}</option><option value="building">{t("generated.operations.projectsBuilding")}</option><option value="review">{t("generated.operations.projectsReview")}</option><option value="done">{t("generated.operations.projectsDone")}</option></select></label><label className="text-xs text-pc-text-secondary">{t("generated.operations.projectsPriority")}<select name="priority" defaultValue={item.priority} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm text-pc-text"><option value="low">{t("generated.operations.projectsLow")}</option><option value="normal">{t("generated.operations.projectsNormal")}</option><option value="high">{t("generated.operations.projectsHigh")}</option></select></label></div><label className="block text-xs text-pc-text-secondary">{t("generated.operations.projectsProject")}<select name="project" value={project} onChange={event=>setProject(event.target.value)} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm text-pc-text">{projectComponents.map(component=><option key={component}>{component}</option>)}<option value="__custom">{t("generated.operations.projectsCustom")}</option></select></label>{project==="__custom"&&<label className="block text-xs text-pc-text-secondary">{t("generated.operations.projectsCustomProject")}<input required name="customProject" defaultValue={knownProject?"":item.component} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm text-pc-text"/></label>}<label className="block text-xs text-pc-text-secondary">{t("generated.operations.projectsAssignee")}<input name="assignee" defaultValue={item.assignee??""} className="mt-1 w-full rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm text-pc-text"/></label><label className="block text-xs text-pc-text-secondary">{t("generated.operations.projectsDetails")}<textarea name="details" rows={5} defaultValue={item.details} className="mt-1 w-full resize-y rounded-lg border border-pc-border bg-pc-bg px-3 py-2 text-sm text-pc-text"/></label></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onClose} className="pc-btn-secondary text-sm">{t("generated.operations.projectsCancel")}</button><button className="pc-btn-primary text-sm">{t("generated.operations.projectsSave")}</button></div></form></div>;
}
