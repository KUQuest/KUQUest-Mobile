export interface FixtureMemberDirectoryEntry {
  id: string;
  workerId: string;
  displayName: string;
}

export const DEFAULT_MEMBER_DIRECTORY: readonly FixtureMemberDirectoryEntry[] =
  [
    {
      id: "demo-worker-2",
      workerId: "demo-worker-2",
      displayName: "Demo Worker 2",
    },
    {
      id: "demo-worker-3",
      workerId: "demo-worker-3",
      displayName: "Demo Worker 3",
    },
    {
      id: "demo-worker-4",
      workerId: "demo-worker-4",
      displayName: "Demo Worker 4",
    },
    {
      id: "team-worker-a",
      workerId: "team-worker-a",
      displayName: "Team Worker A",
    },
    {
      id: "team-worker-b",
      workerId: "team-worker-b",
      displayName: "Team Worker B",
    },
    {
      id: "team-worker-c",
      workerId: "team-worker-c",
      displayName: "Team Worker C",
    },
  ];
