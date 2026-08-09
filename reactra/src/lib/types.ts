export type Role = "student" | "evaluator" | "admin";

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
  teamId?: string;
}

export interface TeamMember {
  enrollment: string;
  name: string;
  classDivision: string;
}

export type Round1Status = "pending" | "qualified" | "eliminated";

export interface Team {
  id: string;
  teamName: string;
  members: TeamMember[];
  createdBy: string; // uid of student who registered the team
  round1Status: Round1Status;
  pptUrl?: string;
  docUrl?: string;
  assignedEvaluatorIds?: string[]; // uids of evaluators the admin assigned to judge this team
  definitionId?: string; // id of the definitions/{id} doc assigned to this team
  definitionText?: string; // denormalized copy, so the team page can show it without an extra read
  createdAt: number;
}

export interface Definition {
  id: string;
  text: string;
  assignedTeamId?: string | null;
  assignedTeamName?: string | null;
  createdAt: number;
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  postedBy: string;
  createdAt: number;
}

export interface Score {
  id: string;
  teamId: string;
  evaluatorId: string;
  evaluatorName: string;
  round: 1 | 2;
  frontend: number; // out of 30
  presentation: number; // out of 10
  documentation: number; // out of 10
  comments?: string;
  total: number;
  createdAt: number;
}

export interface EventConfig {
  round2Visible: boolean;
  resultsVisible: boolean;
}

export interface SeatAssignment {
  id: string;
  teamId: string;
  teamName: string;
  room: string;
  tableNumber: string;
}