import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useApiModules } from "@/hooks/useApiModules";

interface SimpleTitleBarProps {
  title: string;
  subtitle?: string;
  onBack: () => void;
  icon?: React.ReactNode;
  right?: React.ReactNode;
}

const SimpleTitleBar = ({
  title,
  subtitle,
  onBack,
  icon,
  right,
}: SimpleTitleBarProps) => {
  const location = useLocation();
  const { modules } = useApiModules();

  const normalizedPath = useMemo(() => {
    const path = (location?.pathname || "").trim();
    // ignora query/hash (pathname já vem limpo, mas deixamos robusto)
    return path || "/";
  }, [location?.pathname]);

  const moduleTitle = useMemo(() => {
    const normalizeModuleRoute = (module: any): string => {
      const raw = (module?.api_endpoint || module?.path || "").toString().trim();
      if (!raw) return "";
      if (raw.startsWith("/")) return raw;
      if (raw.startsWith("dashboard/")) return `/${raw}`;
      if (!raw.includes("/")) return `/dashboard/${raw}`;
      return raw;
    };

    const match = (modules || []).find((m: any) => {
      const route = normalizeModuleRoute(m);
      return route && route === normalizedPath;
    });

    return match?.title?.toString().trim() || "";
  }, [modules, normalizedPath]);

  const moduleDescription = useMemo(() => {
    const normalizeModuleRoute = (module: any): string => {
      const raw = (module?.api_endpoint || module?.path || "").toString().trim();
      if (!raw) return "";
      if (raw.startsWith("/")) return raw;
      if (raw.startsWith("dashboard/")) return `/${raw}`;
      if (!raw.includes("/")) return `/dashboard/${raw}`;
      return raw;
    };

    const match = (modules || []).find((m: any) => {
      const route = normalizeModuleRoute(m);
      return route && route === normalizedPath;
    });

    return match?.description?.toString().trim() || "";
  }, [modules, normalizedPath]);

  const displayTitle = moduleTitle || title;
  const displaySubtitle = moduleDescription || subtitle;

  return (
    <Card>
      <CardHeader className="px-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              {icon ? <span className="shrink-0 text-primary">{icon}</span> : null}
              <span className="truncate">{displayTitle}</span>
            </CardTitle>
            {displaySubtitle ? (
              <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2 md:line-clamp-none">
                {displaySubtitle}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {right ? right : null}
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
              className="rounded-full h-9 w-9"
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
};

export default SimpleTitleBar;
