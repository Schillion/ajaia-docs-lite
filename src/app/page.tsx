import { getCurrentUserId } from "@/lib/current-user";
import { listAccessibleDocuments } from "@/lib/documents";
import { listUsers } from "@/lib/database";
import { Dashboard } from "@/components/dashboard/Dashboard";
import type { DemoUser, DocumentWithMeta } from "@/types";

export default async function DashboardPage() {
  const userId = await getCurrentUserId();

  let users: DemoUser[] = [];
  let documents: DocumentWithMeta[] = [];
  let loadError: string | null = null;

  try {
    users = await listUsers();
    if (userId) {
      documents = await listAccessibleDocuments(userId);
    }
  } catch {
    loadError =
      "Could not reach the database. Confirm SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set correctly (see .env.example) and that migrations have been applied.";
  }

  const currentUser = users.find((user) => user.id === userId) ?? null;

  return (
    <Dashboard
      users={users}
      currentUser={currentUser}
      initialDocuments={documents}
      loadError={loadError}
    />
  );
}
