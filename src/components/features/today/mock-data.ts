export type JobStatus = "done" | "pending" | "planned";

export interface TodayJob {
  time: string;
  customer: string;
  work: string;
  status: JobStatus;
}

export const businessName = "Yıldız Elektrik";

export const cashKurus = 4_285_000;

export const weeklyChangeKurus = 124_000;

export const todaysJobs: TodayJob[] = [
  {
    time: "14:30",
    customer: "Ahmet Usta",
    work: "Kombi bakımı",
    status: "done",
  },
  {
    time: "16:00",
    customer: "Aylin Hanım",
    work: "Priz değişimi",
    status: "pending",
  },
  {
    time: "18:30",
    customer: "Mehmet Bey",
    work: "Avize montajı",
    status: "planned",
  },
];

export const monthIncomeKurus = 2_840_000;

export const monthExpenseKurus = 1_175_000;

export const receivablesKurus = 630_000;

export const receivableCustomerCount = 4;
