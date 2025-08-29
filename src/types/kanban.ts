export interface Card {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  assignees: string[];
  columnId: string;
  order: number;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  color?: string;
  order: number;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  columns: Column[];
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  email: string;
}