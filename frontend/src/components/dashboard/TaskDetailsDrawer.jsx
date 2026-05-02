import { useEffect, useRef, useState } from "react";
import {
  CalendarDays,
  Download,
  ExternalLink,
  Paperclip,
  Trash2,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import useToast from "../../hooks/useToast";
import {
  createTaskFile,
  deleteTaskFile as deleteTaskFileRecord,
  getTaskFiles,
} from "../../services/taskFileService";
import {
  deleteTaskFileFromSupabase,
  hasSupabaseStorageConfig,
  uploadTaskFileToSupabase,
} from "../../services/supabaseStorage";

const statusOptions = [
  { value: "todo", label: "Todo" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

const priorityOptions = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

const defaultValues = {
  title: "",
  description: "",
  status: "todo",
  priority: "medium",
  dueDate: "",
  assignedTo: "",
};

const priorityStyles = {
  low: "priority-pill priority-pill-low",
  medium: "priority-pill priority-pill-medium",
  high: "priority-pill priority-pill-high",
  urgent: "priority-pill priority-pill-urgent",
};

const statusStyles = {
  todo: "status-pill status-pill-todo",
  in_progress: "status-pill status-pill-progress",
  done: "status-pill status-pill-done",
};

const formatFileSize = (value) => {
  if (!value) {
    return null;
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

export default function TaskDetailsDrawer({
  open,
  task,
  members = [],
  onClose,
  onSave,
  onDelete,
  saving,
  deleting,
}) {
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [values, setValues] = useState(defaultValues);
  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!open || !task) {
      setIsEditing(false);
      setValues(defaultValues);
      setFiles([]);
      setFilesLoading(false);
      setUploadingFiles(false);
      setDeletingFileId("");
      return;
    }

    setValues({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "todo",
      priority: task.priority || "medium",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "",
      assignedTo: task.assignedTo?._id || task.assignedTo || "",
    });
    setIsEditing(false);
  }, [open, task]);

  useEffect(() => {
    const loadTaskFiles = async () => {
      if (!open || !task?._id) {
        return;
      }

      setFilesLoading(true);

      try {
        const data = await getTaskFiles(task._id);
        setFiles(data);
      } catch {
        setFiles([]);
      } finally {
        setFilesLoading(false);
      }
    };

    loadTaskFiles();
  }, [open, task?._id]);

  if (!open || !task) {
    return null;
  }

  const handleChange = (event) => {
    setValues((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      ...values,
      assignedTo: values.assignedTo || null,
      dueDate: values.dueDate || null,
    });
  };

  const handleUploadFiles = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    if (!selectedFiles.length) {
      return;
    }

    if (!hasSupabaseStorageConfig()) {
      showToast({
        title: "Supabase not configured",
        description: "Add your Supabase URL and anon key to the frontend env file first.",
        type: "error",
      });
      event.target.value = "";
      return;
    }

    setUploadingFiles(true);

    try {
      const uploadedFiles = [];

      for (const file of selectedFiles) {
        const uploadResult = await uploadTaskFileToSupabase({
          file,
          taskId: task._id,
        });

        const savedFile = await createTaskFile(task._id, uploadResult);
        uploadedFiles.push(savedFile);
      }

      setFiles((current) => [...uploadedFiles.reverse(), ...current]);
      showToast({
        title: uploadedFiles.length > 1 ? "Files attached" : "File attached",
        description: `${uploadedFiles.length} file${uploadedFiles.length > 1 ? "s were" : " was"} added to ${task.title}.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Upload failed",
        description: error.message || "Unable to upload file. Please try again.",
        type: "error",
      });
    } finally {
      setUploadingFiles(false);
      event.target.value = "";
    }
  };

  const handleDeleteTaskFile = async (file) => {
    setDeletingFileId(file._id);

    try {
      if (hasSupabaseStorageConfig()) {
        await deleteTaskFileFromSupabase(file);
      }

      await deleteTaskFileRecord(task._id, file._id);
      setFiles((current) => current.filter((entry) => entry._id !== file._id));
      showToast({
        title: "File deleted",
        description: `${file.fileName} was removed from ${task.title}.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        title: "Delete failed",
        description: error.message || "Unable to delete file. Please try again.",
        type: "error",
      });
    } finally {
      setDeletingFileId("");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/55 backdrop-blur-sm">
      <button
        aria-label="Close task details"
        className="flex-1 cursor-default"
        onClick={onClose}
        type="button"
      />

      <aside className="h-full w-full max-w-xl border-l border-white/10 bg-slate-950/96 p-6 shadow-[-24px_0_80px_rgba(2,6,23,0.45)]">
        <div className="flex h-full flex-col">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-text-subtle">
                Task details
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-text-primary">{task.title}</h2>
            </div>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-xl text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
              onClick={onClose}
              type="button"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          <div className="mb-6 flex flex-wrap items-center gap-2.5">
            <span className={statusStyles[task.status] || statusStyles.todo}>
              {statusOptions.find((option) => option.value === task.status)?.label || "Todo"}
            </span>
            <span className={priorityStyles[task.priority] || priorityStyles.medium}>
              {task.priority || "medium"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-text-subtle">
              <UserRound className="h-3.5 w-3.5" />
              {task.assignedTo?.name || "Unassigned"}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-text-subtle">
              <CalendarDays className="h-3.5 w-3.5" />
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs font-medium text-text-primary transition hover:bg-white/[0.08]"
              disabled={uploadingFiles}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <Paperclip className="h-3.5 w-3.5" />
              {uploadingFiles ? "Uploading..." : "Attach file"}
            </button>
          </div>

          <input
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
            className="hidden"
            multiple
            onChange={handleUploadFiles}
            ref={fileInputRef}
            type="file"
          />

          <div className="flex-1 overflow-y-auto pr-1">
            {isEditing ? (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm text-text-muted">Task title</span>
                  <input
                    className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                    name="title"
                    onChange={handleChange}
                    required
                    value={values.title}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm text-text-muted">Description</span>
                  <textarea
                    className="min-h-28 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 py-3 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                    name="description"
                    onChange={handleChange}
                    value={values.description}
                  />
                </label>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-text-muted">Status</span>
                    <select
                      className="h-11 w-full rounded-xl border border-white/8 bg-slate-950 px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                      name="status"
                      onChange={handleChange}
                      value={values.status}
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-text-muted">Priority</span>
                    <select
                      className="h-11 w-full rounded-xl border border-white/8 bg-slate-950 px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                      name="priority"
                      onChange={handleChange}
                      value={values.priority}
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm text-text-muted">Due date</span>
                    <input
                      className="h-11 w-full rounded-xl border border-white/8 bg-white/[0.04] px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                      name="dueDate"
                      onChange={handleChange}
                      type="date"
                      value={values.dueDate}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm text-text-muted">Assign to</span>
                    <select
                      className="h-11 w-full rounded-xl border border-white/8 bg-slate-950 px-3.5 text-sm text-text-primary outline-none transition focus:border-brand-500/40"
                      name="assignedTo"
                      onChange={handleChange}
                      value={values.assignedTo}
                    >
                      <option value="">Unassigned</option>
                      {members.map((member) => (
                        <option key={member._id} value={member._id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap justify-between gap-3 pt-2">
                  <button
                    className="flex h-11 items-center gap-2 rounded-xl border border-red-400/20 px-4 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
                    disabled={deleting || saving}
                    onClick={() => onDelete(task)}
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                    {deleting ? "Deleting..." : "Delete task"}
                  </button>

                  <div className="flex gap-3">
                    <button
                      className="h-11 rounded-xl border border-white/8 px-4 text-sm text-text-muted transition hover:bg-white/[0.05] hover:text-text-primary"
                      disabled={saving}
                      onClick={() => setIsEditing(false)}
                      type="button"
                    >
                      Cancel
                    </button>
                    <button
                      className="app-primary-button h-11 rounded-xl px-4 text-sm font-medium text-white"
                      disabled={saving}
                      type="submit"
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="space-y-5">
                <section className="app-panel-secondary p-4">
                  <p className="app-kicker">Description</p>
                  <p className="mt-3 text-sm leading-7 text-text-muted">
                    {task.description || "No description has been written for this task yet."}
                  </p>
                </section>

                <section className="app-panel-secondary p-4">
                  <p className="app-kicker">Assignment</p>
                  <div className="mt-3 space-y-3 text-sm text-text-muted">
                    <p>
                      Owner:{" "}
                      <span className="font-medium text-text-primary">
                        {task.assignedTo?.name || "Unassigned"}
                      </span>
                    </p>
                    <p>
                      Created by:{" "}
                      <span className="font-medium text-text-primary">
                        {task.createdBy?.name || "Unknown"}
                      </span>
                    </p>
                    <p>
                      Due:{" "}
                      <span className="font-medium text-text-primary">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                      </span>
                    </p>
                  </div>
                </section>

                <section className="app-panel-secondary p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="app-kicker">Attachments</p>
                      <h3 className="mt-1 text-base font-semibold text-text-primary">Task files</h3>
                    </div>
                    <button
                      className="app-action-button h-10 rounded-xl px-4 text-sm"
                      disabled={uploadingFiles}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <Upload className="h-4 w-4" />
                      {uploadingFiles ? "Uploading..." : "Attach file"}
                    </button>
                  </div>

                  {filesLoading ? (
                    <div className="mt-4 rounded-xl border border-white/8 bg-slate-950/35 px-4 py-6 text-sm text-text-muted">
                      Loading files...
                    </div>
                  ) : files.length ? (
                    <div className="mt-4 space-y-3">
                      {files.map((file) => {
                        const isDeleting = deletingFileId === file._id;

                        return (
                          <div
                            className="app-row-hover flex items-center justify-between gap-3 px-4 py-3"
                            key={file._id}
                          >
                            <a
                              className="min-w-0 flex-1"
                              href={file.fileUrl}
                              rel="noreferrer"
                              target="_blank"
                            >
                              <p className="truncate text-sm font-medium text-text-primary">
                                {file.fileName}
                              </p>
                              <p className="mt-1 text-xs text-text-subtle">
                                Uploaded by {file.uploadedBy?.name || "Workspace member"} on{" "}
                                {new Date(file.createdAt).toLocaleDateString()}
                                {file.fileSize ? ` • ${formatFileSize(file.fileSize)}` : ""}
                              </p>
                            </a>

                            <div className="flex items-center gap-2">
                              <a
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-text-muted transition hover:bg-white/[0.08] hover:text-text-primary"
                                href={file.fileUrl}
                                rel="noreferrer"
                                target="_blank"
                                title="Open file"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </a>
                              <a
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-text-muted transition hover:bg-white/[0.08] hover:text-text-primary"
                                download={file.fileName}
                                href={file.fileUrl}
                                rel="noreferrer"
                                target="_blank"
                                title="Download file"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <button
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/5 text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                                disabled={isDeleting}
                                onClick={() => handleDeleteTaskFile(file)}
                                title="Delete file"
                                type="button"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl border border-dashed border-white/10 bg-slate-950/35 px-4 py-8 text-center">
                      <p className="text-sm font-medium text-text-primary">No files yet</p>
                      <p className="mt-2 text-sm leading-6 text-text-muted">
                        Upload specs, screenshots, or documents so everyone working on this task has the same context.
                      </p>
                      <p className="mt-2 text-xs text-text-subtle">
                        Accepted: PDF, DOCX, TXT, PNG, JPG, WEBP up to 5MB.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>

          {!isEditing ? (
            <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-white/8 pt-5">
              <button
                className="flex h-11 items-center gap-2 rounded-xl border border-red-400/20 px-4 text-sm font-medium text-red-200 transition hover:bg-red-500/10"
                disabled={deleting}
                onClick={() => onDelete(task)}
                type="button"
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting..." : "Delete task"}
              </button>

              <button
                className="app-primary-button h-11 rounded-xl px-4 text-sm font-medium text-white"
                onClick={() => setIsEditing(true)}
                type="button"
              >
                Edit task
              </button>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
