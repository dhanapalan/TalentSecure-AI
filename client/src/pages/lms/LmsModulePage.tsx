import { useParams } from "react-router-dom";
import { BookOpen, CheckCircle2 } from "lucide-react";
import { usePortalFeatures } from "../../hooks/usePortalFeatures";
import { featureLabel } from "../../constants/platformFeatures";
import { moduleIcon } from "../../constants/lmsModules";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";

interface LmsModulePageProps {
  portal: "college" | "student";
}

/** Landing page for an enabled LMS module group (college or student portal). */
export default function LmsModulePage({ portal }: LmsModulePageProps) {
  const { moduleKey } = useParams<{ moduleKey: string }>();
  const { modules } = usePortalFeatures(portal);
  const mod = modules.find((m) => m.key === moduleKey);
  const Icon = moduleIcon(mod?.icon);

  if (!mod) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center text-gray-500">
        Module not found or not enabled for your campus.
      </div>
    );
  }

  const audience = portal === "college" ? "Campus staff" : "Students";

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-admin-accent/10 text-admin-accent">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{mod.name}</h1>
          <p className="mt-1 text-gray-500">
            {mod.description ?? "Learning module group assigned to your campus."}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-admin-accent" />
            Included capabilities
          </CardTitle>
          <CardDescription>
            {audience} can access the features below while this module is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-3 sm:grid-cols-2">
            {mod.features.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 rounded-lg border border-gray-100 bg-slate-50/80 px-3 py-2.5 text-sm"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span className="font-medium text-gray-800">{featureLabel(f)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="rounded-xl border border-dashed border-gray-200 bg-white p-6 text-center">
        <Badge variant="info" className="mb-2">
          Content coming soon
        </Badge>
        <p className="text-sm text-gray-500">
          Structured courses, assessments, and workflows for <strong>{mod.name}</strong> will appear
          here as content is published for your campus.
        </p>
      </div>
    </div>
  );
}
