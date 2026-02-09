import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { FileText, QrCode, Loader2, AlertCircle, CheckCircle, User, Calendar, CreditCard, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useWalletBalance } from '@/hooks/useWalletBalance';
import { useUserSubscription } from '@/hooks/useUserSubscription';
import { useApiModules } from '@/hooks/useApiModules';
import { useIsMobile } from '@/hooks/use-mobile';
import { getModulePrice } from '@/utils/modulePrice';
import { consultationApiService } from '@/services/consultationApiService';
import SimpleTitleBar from '@/components/dashboard/SimpleTitleBar';
import LoadingScreen from '@/components/layout/LoadingScreen';
import ScrollToTop from '@/components/ui/scroll-to-top';

// URL base do backend PHP
const PHP_API_BASE = 'https://qr.atito.com.br/qrcode';

interface FormData {
  nome: string;
  dataNascimento: string;
  numeroDocumento: string;
  pai: string;
  mae: string;
  foto: File | null;
}

interface RegistroData {
  id: number;
  token: string;
  full_name: string;
  birth_date: string;
  document_number: string;
  parent1: string;
  parent2: string;
  photo_path: string;
  validation: 'pending' | 'verified';
  expiry_date: string;
  is_expired: boolean;
  qr_code_path: string;
  id_user: string | null;
  created_at: string;
}

const QRCodeRg6m = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { modules } = useApiModules();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Form state
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    dataNascimento: '',
    numeroDocumento: '',
    pai: '',
    mae: '',
    foto: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Modal de confirmação
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Balance & pricing state
  const [walletBalance, setWalletBalance] = useState(0);
  const [planBalance, setPlanBalance] = useState(0);
  const [modulePrice, setModulePrice] = useState(0);
  const [modulePriceLoading, setModulePriceLoading] = useState(true);
  const [balanceCheckLoading, setBalanceCheckLoading] = useState(true);

  // Recent registrations & stats (do banco PHP)
  const [recentRegistrations, setRecentRegistrations] = useState<RegistroData[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    today: 0,
    this_month: 0,
    total_cost: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Hooks para saldo
  const { balance, loadBalance: reloadApiBalance } = useWalletBalance();
  const { 
    hasActiveSubscription, 
    subscription, 
    discountPercentage,
    calculateDiscountedPrice: calculateSubscriptionDiscount,
    isLoading: subscriptionLoading 
  } = useUserSubscription();

  const currentModule = useMemo(() => {
    const normalizeModuleRoute = (module: any): string => {
      const raw = (module?.api_endpoint || module?.path || '').toString().trim();
      if (!raw) return '';
      if (raw.startsWith('/')) return raw;
      if (raw.startsWith('dashboard/')) return `/${raw}`;
      if (!raw.includes('/')) return `/dashboard/${raw}`;
      return raw;
    };

    const pathname = (location?.pathname || '').trim();
    if (!pathname) return null;

    return (modules || []).find((m: any) => normalizeModuleRoute(m) === pathname) || null;
  }, [modules, location?.pathname]);

  const userPlan = hasActiveSubscription && subscription 
    ? subscription.plan_name 
    : (user ? localStorage.getItem(`user_plan_${user.id}`) || "Pré-Pago" : "Pré-Pago");

  const totalBalance = planBalance + walletBalance;
  const hasSufficientBalance = (price: number) => totalBalance >= price;

  // Carregar preço do módulo
  const loadModulePrice = useCallback(() => {
    setModulePriceLoading(true);

    const rawPrice = currentModule?.price;
    const price = Number(rawPrice ?? 0);

    if (price && price > 0) {
      setModulePrice(price);
      setModulePriceLoading(false);
      return;
    }

    const fallbackPrice = getModulePrice(location.pathname || '/dashboard/qrcode-rg-6m');
    setModulePrice(fallbackPrice);
    setModulePriceLoading(false);
  }, [currentModule, location.pathname]);

  // Carregar saldos
  const loadBalances = useCallback(() => {
    if (!user) return;
    
    const apiPlanBalance = balance.saldo_plano || 0;
    const apiWalletBalance = balance.saldo || 0;
    
    setPlanBalance(apiPlanBalance);
    setWalletBalance(apiWalletBalance);
  }, [user, balance]);

  // Carregar últimos cadastros do banco PHP
  const loadRecentRegistrations = useCallback(async () => {
    try {
      setRecentLoading(true);
      
      const response = await fetch(`${PHP_API_BASE}/list_users.php?limit=10&offset=0`);
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setRecentRegistrations(data.data);
        
        // Calcular estatísticas
        const todayStr = new Date().toDateString();
        const now = new Date();
        
        const computed = data.data.reduce((acc: any, item: RegistroData) => {
          acc.total += 1;
          if (item.validation === 'verified') acc.completed += 1;
          else acc.pending += 1;
          
          const d = new Date(item.created_at);
          if (d.toDateString() === todayStr) acc.today += 1;
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) acc.this_month += 1;
          
          return acc;
        }, { total: 0, completed: 0, pending: 0, today: 0, this_month: 0, total_cost: 0 });
        
        // Total real vem da paginação
        computed.total = data.pagination?.total || computed.total;
        
        setStats(computed);
      } else {
        setRecentRegistrations([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cadastros do PHP:', error);
      setRecentRegistrations([]);
    } finally {
      setRecentLoading(false);
      setStatsLoading(false);
    }
  }, []);

  // Atualizar saldos quando o saldo da API mudar
  useEffect(() => {
    if (balance.saldo !== undefined || balance.saldo_plano !== undefined) {
      loadBalances();
    }
  }, [balance, loadBalances]);

  useEffect(() => {
    if (user) {
      loadBalances();
      reloadApiBalance();
      loadRecentRegistrations();
    }
  }, [user, reloadApiBalance, loadBalances, loadRecentRegistrations]);

  useEffect(() => {
    if (!user) return;
    loadModulePrice();
  }, [user, loadModulePrice]);

  useEffect(() => {
    const checkPageAccess = async () => {
      if (!user) {
        setBalanceCheckLoading(false);
        return;
      }
      if (modulePriceLoading || !modulePrice) {
        return;
      }
      if (subscriptionLoading) {
        return;
      }
      setBalanceCheckLoading(false);
    };
    checkPageAccess();
  }, [user, modulePriceLoading, modulePrice, subscriptionLoading]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tamanho (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Foto muito grande (máximo 10MB)');
        return;
      }
      
      // Validar tipo
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Formato inválido. Use apenas JPG, PNG ou GIF');
        return;
      }
      
      setFormData(prev => ({ ...prev, foto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Abrir modal de confirmação
  const handleOpenConfirmModal = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nome.trim()) {
      toast.error('Nome Completo é obrigatório');
      return;
    }
    if (!formData.dataNascimento) {
      toast.error('Data de Nascimento é obrigatória');
      return;
    }
    if (!formData.numeroDocumento.trim()) {
      toast.error('Número de Documento é obrigatório');
      return;
    }
    if (!formData.mae.trim()) {
      toast.error('Nome da Mãe é obrigatório');
      return;
    }
    if (!formData.foto) {
      toast.error('Foto é obrigatória');
      return;
    }

    if (!hasSufficientBalance(finalPrice)) {
      toast.error('Saldo insuficiente para realizar o cadastro');
      return;
    }

    setShowConfirmModal(true);
  };

  // Confirmar e enviar cadastro
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true);

    try {
      // 1. Enviar para o backend PHP
      const formDataToSend = new FormData();
      formDataToSend.append('full_name', formData.nome.toUpperCase().trim());
      formDataToSend.append('birth_date', formData.dataNascimento);
      formDataToSend.append('document_number', formData.numeroDocumento.trim());
      formDataToSend.append('parent1', formData.pai.toUpperCase().trim());
      formDataToSend.append('parent2', formData.mae.toUpperCase().trim());
      
      if (formData.foto) {
        formDataToSend.append('photo', formData.foto);
      }

      const response = await fetch(`${PHP_API_BASE}/register.php`, {
        method: 'POST',
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao cadastrar');
      }

      // 2. Cobrar do saldo (registrar no histórico)
      try {
        await consultationApiService.recordConsultation({
          document: formData.numeroDocumento,
          status: 'completed',
          cost: finalPrice,
          result_data: result.data,
          metadata: {
            page_route: location.pathname,
            module_name: 'QR Code RG 6M',
            token: result.data.token
          }
        });

        // Atualizar saldo
        await reloadApiBalance();
      } catch (balanceError) {
        console.error('Erro ao registrar cobrança:', balanceError);
      }

      // 3. Limpar formulário e fechar modal
      setShowConfirmModal(false);
      handleReset();
      
      // 4. Recarregar lista
      await loadRecentRegistrations();

      toast.success('Cadastro realizado com sucesso!', {
        description: `QR Code gerado para ${formData.nome}`
      });

    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      toast.error(error.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nome: '',
      dataNascimento: '',
      numeroDocumento: '',
      pai: '',
      mae: '',
      foto: null
    });
    setPreviewUrl(null);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/dashboard');
  };

  // Calcular preço com desconto
  const originalPrice = modulePrice > 0 ? modulePrice : 0;
  const { discountedPrice: finalPrice, hasDiscount } = hasActiveSubscription && originalPrice > 0
    ? calculateSubscriptionDiscount(originalPrice)
    : { discountedPrice: originalPrice, hasDiscount: false };
  const discount = hasDiscount ? discountPercentage : 0;

  if (balanceCheckLoading || modulePriceLoading) {
    return (
      <LoadingScreen 
        message="Verificando acesso ao módulo..." 
        variant="dashboard" 
      />
    );
  }

  const formatFullDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-x-hidden">
      <div className="w-full">
        <SimpleTitleBar
          title="QR Code RG 6M"
          subtitle="Cadastre e gere QR Codes de documentos"
          onBack={handleBack}
        />

        <div className="mt-4 md:mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 md:gap-6 lg:gap-8">
          {/* Formulário de Cadastro */}
          <Card className="dark:bg-gray-800 dark:border-gray-700 w-full">
            <CardHeader className="pb-4">
              {/* Compact Price Display */}
              <div className="relative bg-gradient-to-br from-purple-50/50 via-white to-blue-50/30 dark:from-gray-800/50 dark:via-gray-800 dark:to-purple-900/20 rounded-lg border border-purple-100/50 dark:border-purple-800/30 shadow-sm transition-all duration-300">
                {hasDiscount && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 z-10 pointer-events-none">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0 px-2.5 py-1 text-xs font-bold shadow-lg">
                      {discount}% OFF
                    </Badge>
                  </div>
                )}
                
                <div className="relative p-3.5 md:p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-1 h-10 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">
                          Plano Ativo
                        </p>
                        <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white truncate">
                          {hasActiveSubscription ? subscription?.plan_name : userPlan}
                        </h3>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      {hasDiscount && (
                        <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 line-through">
                          R$ {originalPrice.toFixed(2)}
                        </span>
                      )}
                      <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 bg-clip-text text-transparent whitespace-nowrap">
                        R$ {finalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <form onSubmit={handleOpenConfirmModal} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    type="text"
                    placeholder="Digite o nome completo"
                    value={formData.nome}
                    onChange={(e) => handleInputChange('nome', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input
                    id="dataNascimento"
                    type="date"
                    value={formData.dataNascimento}
                    onChange={(e) => handleInputChange('dataNascimento', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroDocumento">Número de Documento (CPF) *</Label>
                  <Input
                    id="numeroDocumento"
                    type="text"
                    placeholder="Digite o CPF"
                    value={formData.numeroDocumento}
                    onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pai">Nome do Pai</Label>
                  <Input
                    id="pai"
                    type="text"
                    placeholder="Nome do pai (opcional)"
                    value={formData.pai}
                    onChange={(e) => handleInputChange('pai', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mae">Nome da Mãe *</Label>
                  <Input
                    id="mae"
                    type="text"
                    placeholder="Nome da mãe"
                    value={formData.mae}
                    onChange={(e) => handleInputChange('mae', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foto">Foto 3x4 *</Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                    required
                  />
                  {previewUrl && (
                    <div className="mt-2">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-24 h-24 object-cover rounded-lg border"
                      />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <Button
                    type="submit"
                    disabled={isLoading || !formData.nome || !formData.dataNascimento || !formData.numeroDocumento || !formData.mae || !formData.foto || !hasSufficientBalance(finalPrice) || modulePriceLoading}
                    className="w-full bg-brand-purple hover:bg-brand-darkPurple"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        {modulePriceLoading ? "Carregando preço..." : `Cadastrar (R$ ${finalPrice.toFixed(2)})`}
                      </>
                    )}
                  </Button>
                </div>
              </form>

              {/* Indicador de saldo insuficiente */}
              {!hasSufficientBalance(finalPrice) && formData.nome && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg space-y-3">
                  <div className="flex items-start text-red-700 dark:text-red-300">
                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm block break-words">
                        Saldo insuficiente. Necessário: R$ {finalPrice.toFixed(2)}
                      </span>
                      <span className="text-xs sm:text-sm block break-words">
                        Disponível: R$ {totalBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-red-600 dark:text-red-400 break-words">
                    Saldo do plano: R$ {planBalance.toFixed(2)} | Saldo da carteira: R$ {walletBalance.toFixed(2)}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modal de Confirmação */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Confirmar Cadastro
            </DialogTitle>
            <DialogDescription>
              Verifique os dados antes de confirmar. Será cobrado <strong>R$ {finalPrice.toFixed(2)}</strong> do seu saldo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Preview da foto */}
            {previewUrl && (
              <div className="flex justify-center">
                <img
                  src={previewUrl}
                  alt="Foto"
                  className="w-24 h-32 object-cover rounded-lg border-2 border-purple-200 shadow-md"
                />
              </div>
            )}
            
            {/* Dados do cadastro */}
            <div className="space-y-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Nome Completo</p>
                  <p className="font-medium text-sm">{formData.nome.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium text-sm">{formatDate(formData.dataNascimento)}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Documento (CPF)</p>
                  <p className="font-medium text-sm font-mono">{formData.numeroDocumento}</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Filiação</p>
                  <p className="font-medium text-sm">
                    {formData.pai ? formData.pai.toUpperCase() : '—'}
                  </p>
                  <p className="font-medium text-sm">{formData.mae.toUpperCase()}</p>
                </div>
              </div>
            </div>
            
            {/* Valor a ser cobrado */}
            <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <span className="text-sm font-medium">Valor do cadastro:</span>
              <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                R$ {finalPrice.toFixed(2)}
              </span>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmSubmit}
              disabled={isSubmitting}
              className="bg-brand-purple hover:bg-brand-darkPurple"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirmar Cadastro
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Últimos Cadastros */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className={`flex items-center ${isMobile ? 'text-base' : 'text-lg sm:text-xl lg:text-2xl'}`}>
              <FileText className={`mr-2 flex-shrink-0 ${isMobile ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'}`} />
              <span className="truncate">Últimos Cadastros</span>
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadRecentRegistrations}
              disabled={recentLoading}
            >
              {recentLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Atualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              <span className="ml-3 text-muted-foreground">Carregando cadastros...</span>
            </div>
          ) : recentRegistrations.length > 0 ? (
            <>
              {isMobile ? (
                <div className="space-y-2">
                  {recentRegistrations.map((registration) => (
                    <div
                      key={registration.id}
                      className="w-full text-left rounded-md border border-border bg-card px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {registration.full_name}
                          </div>
                          <div className="font-mono text-xs text-muted-foreground truncate">
                            {registration.document_number}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatFullDate(registration.created_at)}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge
                            variant={registration.validation === 'verified' ? 'secondary' : 'outline'}
                            className={
                              registration.validation === 'verified'
                                ? 'text-[10px] bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }
                          >
                            {registration.validation === 'verified' ? 'Verificado' : 'Pendente'}
                          </Badge>
                          {registration.is_expired && (
                            <span className="text-[10px] text-red-500 font-medium">Expirado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Foto</TableHead>
                      <TableHead className="min-w-[200px]">Nome</TableHead>
                      <TableHead className="w-40">Documento</TableHead>
                      <TableHead className="min-w-[150px]">Data</TableHead>
                      <TableHead className="w-28">Validade</TableHead>
                      <TableHead className="w-28 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRegistrations.map((registration) => (
                      <TableRow key={registration.id}>
                        <TableCell>
                          {registration.photo_path ? (
                            <img
                              src={`${PHP_API_BASE}/${registration.photo_path}`}
                              alt="Foto"
                              className="w-10 h-10 object-cover rounded"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {registration.full_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {registration.document_number}
                        </TableCell>
                        <TableCell className="text-xs">
                          {formatFullDate(registration.created_at)}
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className={registration.is_expired ? 'text-red-500 font-medium' : ''}>
                            {formatDate(registration.expiry_date)}
                            {registration.is_expired && ' (Exp.)'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={registration.validation === 'verified' ? 'secondary' : 'outline'}
                            className={
                              registration.validation === 'verified'
                                ? 'text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'text-xs bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            }
                          >
                            {registration.validation === 'verified' ? 'Verificado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Nenhum cadastro encontrado
              </h3>
              <p className="text-sm">
                Seus cadastros realizados aparecerão aqui
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
        <Card className="w-full">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-primary truncate">
                {statsLoading ? '...' : stats.today}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Cadastros Hoje</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-primary truncate">
                {statsLoading ? '...' : stats.total}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Total de Cadastros</p>
            </div>
          </CardContent>
        </Card>

        <Card className="w-full">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-green-500 truncate">
                {statsLoading ? '...' : stats.completed}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Verificados</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-orange-500 truncate">
                {statsLoading ? '...' : stats.pending}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Pendentes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />
    </div>
  );
};

export default QRCodeRg6m;
