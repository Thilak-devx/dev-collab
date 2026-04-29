const Activity = require("../models/Activity");

const createActivity = async ({ type, userId, projectId = null, message }) => {
  if (!type || !userId || !message) {
    return null;
  }

  return Activity.create({
    type,
    userId,
    projectId,
    message,
  });
};

module.exports = {
  createActivity,
};
