import { Construction } from "lucide-react";
import { PageHeader, Card } from "../../components/ui/ui";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center justify-center gap-4 p-16 text-center">
        <Construction size={40} className="text-gray-300" />
        <div className="text-sm font-medium text-gray-700">{description}</div>
        <p className="max-w-md text-xs text-gray-400">
          This module is part of the development roadmap and will be implemented with its own
          database schema, REST API, RBAC, validation, and tests.
        </p>
      </Card>
    </div>
  );
}
