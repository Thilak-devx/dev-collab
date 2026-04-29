const ProjectChannel = require("../models/ProjectChannel");

const DEFAULT_CHANNEL_NAME = "General";
const DEFAULT_CHANNEL_SLUG = "general";

const slugifyChannelName = (value) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

const ensureUniqueChannelSlug = async (projectId, rawName) => {
  const baseSlug = slugifyChannelName(rawName) || "channel";
  let slug = baseSlug;

  for (let index = 0; index < 50; index += 1) {
    const existingChannel = await ProjectChannel.findOne({
      projectId,
      slug,
    }).select("_id");

    if (!existingChannel) {
      return slug;
    }

    slug = `${baseSlug}-${index + 2}`;
  }

  throw new Error("Unable to generate a unique channel slug");
};

const ensureDefaultProjectChannel = async (projectId, createdBy) => {
  const existingChannel = await ProjectChannel.findOne({
    projectId,
    $or: [{ isDefault: true }, { slug: DEFAULT_CHANNEL_SLUG }],
  });

  if (existingChannel) {
    if (!existingChannel.isDefault) {
      existingChannel.isDefault = true;
      await existingChannel.save();
    }

    return existingChannel;
  }

  return ProjectChannel.create({
    projectId,
    name: DEFAULT_CHANNEL_NAME,
    slug: DEFAULT_CHANNEL_SLUG,
    createdBy,
    isDefault: true,
  });
};

module.exports = {
  DEFAULT_CHANNEL_NAME,
  DEFAULT_CHANNEL_SLUG,
  ensureDefaultProjectChannel,
  ensureUniqueChannelSlug,
  slugifyChannelName,
};
