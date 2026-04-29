import { useEffect } from "react";
import useAuth from "./useAuth";
import { joinChannelRoom, leaveChannelRoom } from "../services/socket";

export default function useChannelRoom(projectId, channelId) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token || !projectId || !channelId) {
      return undefined;
    }

    joinChannelRoom(projectId, channelId).catch(() => {});

    return () => {
      leaveChannelRoom(channelId).catch(() => {});
    };
  }, [channelId, projectId, token]);
}
