const normalizeUserId = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  const normalizedValue = value.toString?.();

  if (!normalizedValue || normalizedValue === "[object Object]") {
    return null;
  }

  return normalizedValue;
};

const getProjectRole = (project, userId) => {
  const normalizedUserId = normalizeUserId(userId);

  if (!normalizedUserId || !project) {
    return null;
  }

  const ownerId = normalizeUserId(project.owner?._id || project.owner);
  const adminIds = (project.admins || []).map((admin) => normalizeUserId(admin?._id || admin));
  const memberIds = (project.members || []).map((member) => normalizeUserId(member?._id || member));

  if (ownerId === normalizedUserId) {
    return "owner";
  }

  if (adminIds.includes(normalizedUserId)) {
    return "admin";
  }

  if (memberIds.includes(normalizedUserId)) {
    return "member";
  }

  return null;
};

const hasProjectAccess = (project, userId) => Boolean(getProjectRole(project, userId));

const hasProjectManagerAccess = (project, userId) => {
  const role = getProjectRole(project, userId);
  return role === "owner" || role === "admin";
};

const serializeProject = (project, currentUserId = null) => {
  if (!project) {
    return null;
  }

  const plainProject = typeof project.toObject === "function" ? project.toObject() : { ...project };
  const ownerId = normalizeUserId(plainProject.owner?._id || plainProject.owner);
  const adminIds = (plainProject.admins || []).map((admin) => normalizeUserId(admin?._id || admin));

  const members = (plainProject.members || []).map((member) => {
    const memberId = normalizeUserId(member?._id || member);
    const role = ownerId === memberId ? "owner" : adminIds.includes(memberId) ? "admin" : "member";
    const memberObject = typeof member === "object" ? { ...member } : { _id: member };

    return {
      ...memberObject,
      role,
    };
  });

  return {
    ...plainProject,
    members,
    currentUserRole: currentUserId ? getProjectRole(plainProject, currentUserId) : null,
  };
};

module.exports = {
  normalizeUserId,
  getProjectRole,
  hasProjectAccess,
  hasProjectManagerAccess,
  serializeProject,
};
