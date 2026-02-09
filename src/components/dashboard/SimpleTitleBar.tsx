import React, { useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Package } from "lucide-react";
import * as Icons from "lucide-react";
import { useLocation } from "react-router-dom";
import { useApiModules } from "@/hooks/useApiModules";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const normalizedPath = useMemo(() => {
    const path = (location?.pathname || "").trim();
    // ignora query/hash (pathname já vem limpo, mas deixamos robusto)
    return path || "/";
  }, [location?.pathname]);

  const currentModule = useMemo(() => {
    const normalizeToPath = (raw: string): string => {
      if (!raw) return "";
      const trimmed = raw.trim();
      if (trimmed.startsWith("/dashboard/")) return trimmed;
      if (trimmed.startsWith("dashboard/")) return `/${trimmed}`;
      if (trimmed.startsWith("/")) return `/dashboard${trimmed}`;
      return `/dashboard/${trimmed}`;
    };

    console.log('🔍 [SimpleTitleBar] Buscando módulo para:', normalizedPath);
    console.log('🔍 [SimpleTitleBar] Total de módulos:', modules?.length);

    const match = (modules || []).find((m: any) => {
      const apiEndpoint = normalizeToPath(m?.api_endpoint || "");
      const modulePath = normalizeToPath(m?.path || "");
      
      const isMatch = (apiEndpoint && apiEndpoint === normalizedPath) || 
             (modulePath && modulePath === normalizedPath);
      
      if (isMatch) {
        console.log('✅ [SimpleTitleBar] Módulo encontrado:', m?.title, 'icon:', m?.icon);
      }
      
      return isMatch;
    });

    if (!match) {
      console.log('❌ [SimpleTitleBar] Nenhum módulo encontrado para:', normalizedPath);
      // Log dos primeiros 5 módulos para debug
      (modules || []).slice(0, 5).forEach((m: any) => {
        console.log('  📦 Módulo:', m?.title, '| api_endpoint:', m?.api_endpoint, '| path:', m?.path);
      });
    }

    return match || null;
  }, [modules, normalizedPath]);

  const moduleTitle = currentModule?.title?.toString().trim() || "";
  const moduleDescription = currentModule?.description?.toString().trim() || "";

  // Obter o componente do ícone dinamicamente
  const ModuleIcon = useMemo(() => {
    if (icon) return null; // Se já foi passado um ícone, não precisamos buscar

    const iconName = currentModule?.icon;
    if (!iconName) return Package;

    const IconComponent = Icons[iconName as keyof typeof Icons] as React.ComponentType<any>;
    return IconComponent || Package;
  }, [currentModule?.icon, icon]);

  const displayTitle = moduleTitle || title;
  const displaySubtitle = moduleDescription || subtitle;

  // Renderizar o ícone grande à esquerda
  const renderLargeIcon = () => {
    if (icon) {
      return (
        <div className="shrink-0 p-2 bg-primary/10 rounded-lg border border-primary/20">
          <span className="text-primary">{icon}</span>
        </div>
      );
    }
    
    // Só mostrar ícone dinâmico em desktop
    if (!isMobile && ModuleIcon) {
      return (
        <div className="shrink-0 p-2 bg-primary/10 rounded-lg border border-primary/20">
          <ModuleIcon className="h-8 w-8 text-primary" />
        </div>
      );
    }

    return null;
  };

  const iconElement = renderLargeIcon();

  return (
    <Card>
      <CardHeader className="px-4 md:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Ícone à esquerda ocupando espaço das duas linhas */}
            {iconElement}
            
            {/* Título e descrição */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base">
                <span className="truncate">{displayTitle}</span>
              </CardTitle>
              {displaySubtitle ? (
                <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2 md:line-clamp-none">
                  {displaySubtitle}
                </p>
              ) : null}
            </div>
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
