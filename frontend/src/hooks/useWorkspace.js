import { useContext } from "react";
import { WorkspaceContext } from "../context/WorkspaceContext";

export default function useWorkspace() {
  return useContext(WorkspaceContext);
}
