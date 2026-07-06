export type TicketOwner = 'AI' | 'HUMAN';
export type TicketType = 'FEATURE' | 'BUG' | 'CHORE';
export type TicketStatus = 'DEFINITION' | 'TODO' | 'IN_PROGRESS' | 'ON_HOLD' | 'DONE';
export type TicketSolution = 'DONE' | 'WONT_DO';
export type TicketCommentAuthor = 'HUMAN' | 'AGENT';

export interface TicketComment {
  id: number;
  ticketId: number;
  author: TicketCommentAuthor;
  authorName: string | null;
  body: string;
  createdAt: string;
}

export interface Ticket {
  id: number;
  owner: TicketOwner;
  type: TicketType;
  title: string;
  body: string;
  status: TicketStatus;
  solution: TicketSolution | null;
  commentCount?: number;
  comments?: TicketComment[];
  pickedUpAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketBoard {
  DEFINITION: Ticket[];
  TODO: Ticket[];
  IN_PROGRESS: Ticket[];
  ON_HOLD: Ticket[];
  DONE: Ticket[];
}

export interface TicketSummary {
  byStatus: {
    DEFINITION: number;
    TODO: number;
    IN_PROGRESS: number;
    ON_HOLD: number;
    DONE: number;
  };
  byType: {
    FEATURE: number;
    BUG: number;
    CHORE: number;
  };
  byOwner: {
    AI: number;
    HUMAN: number;
  };
  bySolution: {
    DONE: number;
    WONT_DO: number;
  };
}

export interface TicketCreate {
  type: TicketType;
  title: string;
  body: string;
}

export interface TicketCommentCreate {
  body: string;
  handBackToAi?: boolean;
}
