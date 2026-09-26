export interface TeamDirectoryMember {
  id: string;
  workerId?: string;
  displayName: string;
  email?: string;
  kuEmail?: string;
  handle?: string;
}

export interface ProposalFileItem {
  id: string;
  name: string;
  sizeBytes?: number;
}

export interface PartialGroupStartVoter {
  id: string;
  displayName: string;
  role: "HIRER" | "WORKER";
}
