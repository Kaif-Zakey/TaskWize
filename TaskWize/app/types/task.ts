export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string; // e.g., "Supermarket", "Office"
}

export interface Task {
  id?: string; // ? - optional
  title: string;
  description: string;
  userId?: string;
  status: "pending" | "completed";
  category?: string; // e.g., "Work", "Personal", "Shopping", "Health"
  priority?: "low" | "medium" | "high";
  dueDate?: Date | string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  location?: Location; // Location-based feature
  notifyOnLocation?: boolean; // Whether to notify when near location
  tags?: string[];
}
