import { useEffect } from "react";
import useAuth from "./useAuth";
import { joinProjectRoom, leaveProjectRoom } from "../services/socket";

export default function useProjectRoom(projectId) {
  const { token } = useAuth();

  useEffect(() => {
    if (!token || !projectId) {
      return undefined;
    }

    joinProjectRoom(projectId).catch(() => {});

    return () => {
      leaveProjectRoom(projectId).catch(() => {});
    };
  }, [projectId, token]);
}
