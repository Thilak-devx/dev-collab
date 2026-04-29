import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import useAuth from "../hooks/useAuth";
import useToast from "../hooks/useToast";
import { getActivities } from "../services/activityService";
import {
  createInvite as createInviteRequest,
  joinInvite as joinInviteRequest,
} from "../services/inviteService";
import {
  getNotifications,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
  updateNotificationReadState as updateNotificationReadStateRequest,
} from "../services/notificationService";
import {
  createProject as createProjectRequest,
  deleteProject as deleteProjectRequest,
  getProject,
  getProjects,
  inviteProjectMember as inviteProjectMemberRequest,
} from "../services/projectService";
import {
  createTask as createTaskRequest,
  deleteTask as deleteTaskRequest,
  getTasks,
  updateTask as updateTaskRequest,
} from "../services/taskService";
import {
  connectSocket,
  disconnectSocket,
  joinProjectRoom,
} from "../services/socket";

export const WorkspaceContext = createContext(null);

const normalizeNotificationReadState = (notification, readState) => ({
  ...notification,
  isRead: readState,
  read: readState,
});

const replaceProjectInList = (projects, project) => {
  const nextProjects = projects.filter((entry) => entry._id !== project._id);
  return [project, ...nextProjects];
};

const replaceTaskInList = (tasks, task) => [task, ...tasks.filter((entry) => entry._id !== task._id)];

const mergeProjectTasks = (tasks, projectId, projectTasks) => [
  ...tasks.filter((task) => task.projectId?._id !== projectId && task.projectId !== projectId),
  ...projectTasks,
];

export function WorkspaceProvider({ children }) {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const fetchNotificationsState = useCallback(async () => {
    if (!token) {
      setNotifications([]);
      return [];
    }

    const notificationData = await getNotifications({ limit: 20 });
    setNotifications(notificationData);
    return notificationData;
  }, [token]);

  const pushActivity = useCallback((activity) => {
    if (!activity) {
      return;
    }

    setActivities((current) => [activity, ...current.filter((entry) => entry._id !== activity._id)].slice(0, 20));
  }, []);

  const pushNotification = useCallback((notification) => {
    if (!notification) {
      return;
    }

    setNotifications((current) =>
      [
        normalizeNotificationReadState(
          notification,
          typeof notification.isRead === "boolean" ? notification.isRead : Boolean(notification.read)
        ),
        ...current.filter((entry) => entry._id !== notification._id),
      ].slice(0, 20)
    );
  }, []);

  const resetWorkspace = useCallback(() => {
    setProjects([]);
    setTasks([]);
    setActivities([]);
    setNotifications([]);
    setError("");
    setLoading(false);
    setSyncing(false);
  }, []);

  const refreshWorkspace = useCallback(async () => {
    if (!token) {
      resetWorkspace();
      return { projects: [], tasks: [] };
    }

    setSyncing(true);
    setError("");

    try {
      const [projectData, taskData, activityData, notificationData] = await Promise.all([
        getProjects(),
        getTasks(),
        getActivities({ limit: 12 }),
        fetchNotificationsState(),
      ]);
      setProjects(projectData);
      setTasks(taskData);
      setActivities(activityData);
      return {
        projects: projectData,
        tasks: taskData,
        activities: activityData,
        notifications: notificationData,
      };
    } catch (requestError) {
      const message = requestError.response?.data?.message || "Unable to sync workspace";
      setError(message);
      throw requestError;
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  }, [fetchNotificationsState, resetWorkspace, token]);

  useEffect(() => {
    if (!token) {
      resetWorkspace();
      return;
    }

    setLoading(true);
    refreshWorkspace().catch(() => {});
  }, [refreshWorkspace, resetWorkspace, token]);

  useEffect(() => {
    if (!token) {
      disconnectSocket();
      return undefined;
    }

    const socket = connectSocket();

    const handleTaskCreated = (payload) => {
      if (payload?.task) {
        setTasks((current) => replaceTaskInList(current, payload.task));
      }

      pushActivity(payload?.activity);
    };

    const handleTaskUpdated = (payload) => {
      if (payload?.task) {
        setTasks((current) => replaceTaskInList(current, payload.task));
      }

      pushActivity(payload?.activity);
    };

    const handleProjectJoined = (payload) => {
      if (payload?.project) {
        setProjects((current) => replaceProjectInList(current, payload.project));
      }

      pushActivity(payload?.activity);

      if (payload?.joinedUser?._id && payload.joinedUser._id !== user?.id) {
        showToast({
          title: "New teammate joined",
          description: `${payload.joinedUser.name} joined ${payload.project?.name || "the project"}.`,
          type: "success",
        });
      }
    };

    const handleNotification = (payload) => {
      if (payload?.notification) {
        pushNotification(payload.notification);
      }

      if (payload?.type === "taskAssigned") {
        showToast({
          title: "New task assigned",
          description: payload.notification?.message || "A task was assigned to you.",
          type: "success",
        });
      }

      if (payload?.type === "taskCompleted") {
        showToast({
          title: "Task completed",
          description: payload.notification?.message || "A task was completed.",
          type: "success",
        });
      }

      if (payload?.type === "newMessage") {
        showToast({
          title: "New message",
          description: payload.notification?.message || "A new message arrived in one of your channels.",
          type: "success",
        });
      }

      if (payload?.type === "projectJoined") {
        showToast({
          title: "Member joined project",
          description: payload.notification?.message || "A teammate joined your project.",
          type: "success",
        });
      }
    };

    const handleNotificationsRead = (payload) => {
      const notificationIds = new Set(payload?.notificationIds || []);

      setNotifications((current) =>
        current.map((notification) => {
          if (!notificationIds.size || notificationIds.has(notification._id) || notificationIds.has(notification.id)) {
            return normalizeNotificationReadState(notification, true);
          }

          return notification;
        })
      );
    };

    socket.on("taskCreated", handleTaskCreated);
    socket.on("taskUpdated", handleTaskUpdated);
    socket.on("projectJoined", handleProjectJoined);
    socket.on("notification", handleNotification);
    socket.on("notifications_read", handleNotificationsRead);

    return () => {
      socket.off("taskCreated", handleTaskCreated);
      socket.off("taskUpdated", handleTaskUpdated);
      socket.off("projectJoined", handleProjectJoined);
      socket.off("notification", handleNotification);
      socket.off("notifications_read", handleNotificationsRead);
    };
  }, [pushActivity, pushNotification, showToast, token, user?.id]);

  useEffect(() => {
    if (!token || !projects.length) {
      return;
    }

    projects.forEach((project) => {
      joinProjectRoom(project._id).catch(() => {});
    });
  }, [projects, token]);

  const createProject = useCallback(async (values) => {
    const project = await createProjectRequest(values);
    setProjects((current) => replaceProjectInList(current, project));
    return project;
  }, []);

  const removeProject = useCallback(async (projectId) => {
    await deleteProjectRequest(projectId);
    setProjects((current) => current.filter((project) => project._id !== projectId));
    setTasks((current) =>
      current.filter((task) => task.projectId?._id !== projectId && task.projectId !== projectId)
    );
    await refreshWorkspace().catch(() => {});
  }, [refreshWorkspace]);

  const loadProjectDetails = useCallback(async (projectId) => {
    const [project, projectTasks] = await Promise.all([
      getProject(projectId),
      getTasks({ projectId }),
    ]);

    setProjects((current) => replaceProjectInList(current, project));
    setTasks((current) => mergeProjectTasks(current, projectId, projectTasks));

    return { project, tasks: projectTasks };
  }, []);

  const createTask = useCallback(async (values) => {
    const task = await createTaskRequest(values);
    setTasks((current) => replaceTaskInList(current, task));
    await refreshWorkspace().catch(() => {});
    return task;
  }, [refreshWorkspace]);

  const updateTask = useCallback(async (taskId, values) => {
    const task = await updateTaskRequest(taskId, values);
    setTasks((current) => current.map((entry) => (entry._id === taskId ? task : entry)));
    await refreshWorkspace().catch(() => {});
    return task;
  }, [refreshWorkspace]);

  const removeTask = useCallback(async (taskId) => {
    await deleteTaskRequest(taskId);
    setTasks((current) => current.filter((task) => task._id !== taskId));
    await refreshWorkspace().catch(() => {});
  }, [refreshWorkspace]);

  const inviteProjectMember = useCallback(async (projectId, email) => {
    const project = await inviteProjectMemberRequest(projectId, email);
    setProjects((current) => replaceProjectInList(current, project));
    await refreshWorkspace().catch(() => {});
    return project;
  }, [refreshWorkspace]);

  const generateProjectInvite = useCallback(async (projectId, options = {}) => {
    return createInviteRequest({ projectId, ...options });
  }, []);

  const acceptProjectInvite = useCallback(async (inviteToken) => {
    const result = await joinInviteRequest(inviteToken);

    if (result.project) {
      setProjects((current) => replaceProjectInList(current, result.project));
      joinProjectRoom(result.project._id).catch(() => {});
    }

    await refreshWorkspace().catch(() => {});
    return result;
  }, [refreshWorkspace]);

  const markNotificationRead = useCallback(async (notificationId) => {
    setNotifications((current) =>
      current.map((entry) =>
        entry._id === notificationId
          ? normalizeNotificationReadState(entry, true)
          : entry
      )
    );

    await markNotificationReadRequest(notificationId);
    const notificationData = await fetchNotificationsState();
    return notificationData.find((entry) => entry._id === notificationId) || null;
  }, [fetchNotificationsState]);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((entry) => normalizeNotificationReadState(entry, true))
    );

    const result = await markAllNotificationsReadRequest();
    await fetchNotificationsState();
    return result;
  }, [fetchNotificationsState]);

  const updateNotificationReadState = useCallback(async (notificationId, read) => {
    setNotifications((current) =>
      current.map((entry) =>
        entry._id === notificationId
          ? normalizeNotificationReadState(entry, read)
          : entry
      )
    );

    await updateNotificationReadStateRequest(notificationId, read);
    const notificationData = await fetchNotificationsState();
    return notificationData.find((entry) => entry._id === notificationId) || null;
  }, [fetchNotificationsState]);

  const value = useMemo(
    () => ({
      projects,
      tasks,
      activities,
      notifications,
      loading,
      syncing,
      error,
      refreshWorkspace,
      createProject,
      deleteProject: removeProject,
      loadProjectDetails,
      createTask,
      updateTask,
      deleteTask: removeTask,
      inviteProjectMember,
      generateProjectInvite,
      acceptProjectInvite,
      markNotificationRead,
      updateNotificationReadState,
      markAllNotificationsRead,
    }),
    [
      projects,
      tasks,
      activities,
      notifications,
      loading,
      syncing,
      error,
      refreshWorkspace,
      createProject,
      removeProject,
      loadProjectDetails,
      createTask,
      updateTask,
      removeTask,
      inviteProjectMember,
      generateProjectInvite,
      acceptProjectInvite,
      markNotificationRead,
      updateNotificationReadState,
      markAllNotificationsRead,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}
