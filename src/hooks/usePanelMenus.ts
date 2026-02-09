import { useState, useEffect } from 'react';
import { SidebarItem } from '@/components/dashboard/layout/types';
import { loadPanelMenusFromApi } from '@/components/dashboard/layout/sidebar/panelMenus';

export const usePanelMenus = () => {
  const [panelMenus, setPanelMenus] = useState<SidebarItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPanels = async () => {
      try {
        setIsLoading(true);
        console.log('🔄 [PANEL_HOOK] Carregando painéis para o menu...');
        
        const menus = await loadPanelMenusFromApi();
        setPanelMenus(menus);
        
        console.log('✅ [PANEL_HOOK] Painéis carregados para o menu:', menus.length);
      } catch (error) {
        console.error('❌ [PANEL_HOOK] Erro ao carregar painéis:', error);
        setPanelMenus([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPanels();
  }, []);

  return { panelMenus, isLoading };
};