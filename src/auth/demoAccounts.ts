import type { AuthUser } from "../types/auth";

/** Demo logins — password for all: `demo` */
export const DEMO_PASSWORD = "demo";

type DemoRow = Omit<AuthUser, "id"> & { id: string; password: string };

export const DEMO_ACCOUNTS: DemoRow[] = [
  {
    id: "demo-client",
    email: "client@demo.com",
    password: DEMO_PASSWORD,
    name: "Alex Morgan",
    role: "client",
  },
  {
    id: "demo-john",
    email: "john@demo.com",
    password: DEMO_PASSWORD,
    name: "John Carter",
    role: "freelancer",
    managedFreelancerId: "1",
  },
  {
    id: "demo-sarah",
    email: "sarah@demo.com",
    password: DEMO_PASSWORD,
    name: "Sarah Lee",
    role: "freelancer",
    managedFreelancerId: "2",
  },
  {
    id: "demo-daniel",
    email: "daniel@demo.com",
    password: DEMO_PASSWORD,
    name: "Daniel Kim",
    role: "freelancer",
    managedFreelancerId: "3",
  },
  {
    id: "demo-admin",
    email: "admin@demo.com",
    password: DEMO_PASSWORD,
    name: "Platform Admin",
    role: "admin",
  },
];
