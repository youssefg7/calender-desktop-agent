export interface CalendarRequest {
  id: string;
  summary: string;
  status: "done" | "canceled" | "inProgress";
}

export interface Calendar {
  id: string;
  name: string;
  email: string;
  requests: CalendarRequest[];
}
