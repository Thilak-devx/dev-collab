import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Download, ExternalLink, FileText, Trash2 } from "lucide-react";
import useToast from "../hooks/useToast";
import useWorkspace from "../hooks/useWorkspace";
import EmptyState from "../components/dashboard/EmptyState";
import { SkeletonList } from "../components/dashboard/LoadingSkeleton";
import SectionHeader from "../components/dashboard/SectionHeader";
import WorkspaceLayout from "../components/dashboard/WorkspaceLayout";
import {
  deleteTaskFile as deleteTaskFileRecord,
  getTaskFiles,
} from "../services/taskFileService";
import {
  deleteTaskFileFromSupabase,
  hasSupabaseStorageConfig,
} from "../services/supabaseStorage";

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

export default function FilesPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { tasks, loading: workspaceLoading, syncing } = useWorkspace();
  const [search, setSearch] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingFileId, setDeletingFileId] = useState("");

  useEffect(() => {
    const loadFiles = async () => {
      if (workspaceLoading || syncing) {
        return;
      }

      if (!tasks.length) {
        setFiles([]);
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        const taskFiles = await Promise.all(
          tasks.map(async (task) => {
            const filesForTask = await getTaskFiles(task._id);
            return filesForTask.map((file) => ({
              ...file,
              taskMeta: task,
            }));
          })
        );

        const flattenedFiles = taskFiles
          .flat()
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

        setFiles(flattenedFiles);
      } catch (error) {
        setFiles([]);
        showToast({
          title: "Unable to load files",
          description: error.response?.data?.message || "Please try again.",
          type: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    loadFiles();
  }, [showToast, syncing, tasks, workspaceLoading]);

  const filteredFiles = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return files;
    }

    return files.filter((file) =>
      [
        file.fileName,
        file.taskMeta?.title,
        file.taskMeta?.projectId?.name,
        file.uploadedBy?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [files, search]);

  const handleDeleteFile = async (file) => {
    setDeletingFileId(file._id);

    try {
      if (hasSupabaseStorageConfig()) {
        await deleteTaskFileFromSupabase(file);
      }

      await deleteTaskFileRecord(file.taskMeta?._id || file.taskId, file._id);
      setFiles((current) => current.filter((entry) => entry._id !== file._id));
      showToast({
        title: "File deleted",
        description: `${file.fileName} was removed from ${file.taskMeta?.title || "the task"}.`,
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
    <WorkspaceLayout
      label="Files"
      onPrimaryAction={() => navigate("/projects")}
      onSearchChange={(event) => setSearch(event.target.value)}
      primaryActionLabel="Go to projects"
      search={search}
      searchPlaceholder="Search files"
      title="Files"
    >
      <section className="app-panel-primary p-5">
        <SectionHeader
          label="Workspace library"
          title="Files attached across your tasks"
        />

        {loading || workspaceLoading || syncing ? (
          <SkeletonList rows={5} />
        ) : filteredFiles.length ? (
          <div className="space-y-3">
            {filteredFiles.map((file) => {
              const isDeleting = deletingFileId === file._id;

              return (
                <article
                  className="app-row-hover flex items-center justify-between gap-4 p-4"
                  key={file._id}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4.5 w-4.5 text-brand-300" />
                      <h2 className="truncate text-sm font-semibold text-text-primary">
                        {file.fileName}
                      </h2>
                    </div>
                    <p className="mt-2 text-sm text-text-muted">
                      {file.taskMeta?.title || "Task"}
                      {file.taskMeta?.projectId?.name ? ` • ${file.taskMeta.projectId.name}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-text-subtle">
                      Uploaded by {file.uploadedBy?.name || "Workspace member"} on{" "}
                      {new Date(file.createdAt).toLocaleDateString()}
                      {file.fileSize ? ` • ${formatFileSize(file.fileSize)}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/8 px-3 text-sm text-text-primary transition hover:bg-white/[0.05]"
                      onClick={() => navigate(`/projects/${file.taskMeta?.projectId?._id || file.taskMeta?.projectId}`)}
                      type="button"
                    >
                      Open project
                    </button>
                    <a
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-text-muted transition hover:bg-white/[0.08] hover:text-text-primary"
                      href={file.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                      title="Open file"
                    >
                      <ExternalLink className="h-4.5 w-4.5" />
                    </a>
                    <a
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-text-muted transition hover:bg-white/[0.08] hover:text-text-primary"
                      download={file.fileName}
                      href={file.fileUrl}
                      rel="noreferrer"
                      target="_blank"
                      title="Download file"
                    >
                      <Download className="h-4.5 w-4.5" />
                    </a>
                    <button
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-400/20 bg-red-500/5 text-red-200 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isDeleting}
                      onClick={() => handleDeleteFile(file)}
                      title="Delete file"
                      type="button"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            action={
              <button
                className="app-primary-button"
                onClick={() => navigate("/projects")}
                type="button"
              >
                Open projects
              </button>
            }
            description="Attach files to tasks and they’ll appear here as a shared workspace library."
            title="No files yet"
          />
        )}
      </section>
    </WorkspaceLayout>
  );
}
