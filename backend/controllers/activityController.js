const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const Project = require("../models/Project");

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

const getActivities = async (req, res) => {
  try {
    const userId = normalizeUserId(req.user?.id || req.user?._id);
    const limit = Math.min(Number(req.query.limit) || 12, 50);
    const requestedProjectId = req.query.projectId;

    if (!userId) {
      return res.status(401).json({ message: "Authenticated user is invalid" });
    }

    const visibleProjects = await Project.find({
      $or: [{ owner: userId }, { members: userId }],
    }).select("_id");

    const projectIds = visibleProjects.map((project) => project._id);
    const hasProjectFilter = Boolean(requestedProjectId);

    if (hasProjectFilter && !mongoose.Types.ObjectId.isValid(requestedProjectId)) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    if (
      hasProjectFilter
      && !projectIds.some((projectId) => projectId.toString() === requestedProjectId.toString())
    ) {
      return res.status(403).json({ message: "You do not have access to this project's activity" });
    }

    const query = hasProjectFilter
      ? { projectId: requestedProjectId }
      : {
        $or: [
          { userId },
          ...(projectIds.length
            ? [{ projectId: mongoose.trusted({ $in: projectIds }) }]
            : []),
        ],
      };

    const activities = await Activity.find(query)
      .populate("userId", "name email")
      .populate("projectId", "name")
      .sort({ timestamp: -1 })
      .limit(limit);

    return res.status(200).json(activities);
  } catch (error) {
    console.error("Activity fetch error:", error.message);
    return res.status(500).json({ message: "Unable to fetch activity" });
  }
};

module.exports = {
  getActivities,
};
