import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { FileText, QrCode, Loader2, AlertCircle } from 'lucide-react';
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
import QRCode from 'react-qr-code';

interface FormData {
  nome: string;
  dataNascimento: string;
  numeroDocumento: string;
  pai: string;
  mae: string;
  token: string;
  foto: File | null;
}

interface RegistroData {
  id: string;
  document: string;
  status: string;
  cost: number;
  created_at: string;
  result_data?: any;
  metadata?: any;
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
    token: '',
    foto: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Balance & pricing state
  const [walletBalance, setWalletBalance] = useState(0);
  const [planBalance, setPlanBalance] = useState(0);
  const [modulePrice, setModulePrice] = useState(0);
  const [modulePriceLoading, setModulePriceLoading] = useState(true);
  const [balanceCheckLoading, setBalanceCheckLoading] = useState(true);

  // Recent registrations & stats
  const [recentRegistrations, setRecentRegistrations] = useState<RegistroData[]>([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    processing: 0,
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

  // Carregar preço do módulo (Preço de Venda) com base na rota atual
  const loadModulePrice = () => {
    setModulePriceLoading(true);

    const rawPrice = currentModule?.price;
    const price = Number(rawPrice ?? 0);

    if (price && price > 0) {
      setModulePrice(price);
      console.log('✅ [QRCODE] Preço do módulo carregado da configuração:', {
        moduleId: currentModule?.id,
        moduleTitle: currentModule?.title,
        price
      });
      setModulePriceLoading(false);
      return;
    }

    console.warn('⚠️ [QRCODE] Não foi possível obter o preço do módulo pela configuração; usando fallback');
    const fallbackPrice = getModulePrice(location.pathname || '/dashboard/qrcode-rg-6m');
    setModulePrice(fallbackPrice);
    setModulePriceLoading(false);
  };

  // Carregar saldos usando o hook useWalletBalance
  const loadBalances = () => {
    if (!user) return;
    
    // Usar saldo da API externa (prioridade: saldo_plano primeiro, depois saldo principal)
    const apiPlanBalance = balance.saldo_plano || 0;
    const apiWalletBalance = balance.saldo || 0;
    
    setPlanBalance(apiPlanBalance);
    setWalletBalance(apiWalletBalance);
    
    console.log('[QRCODE] Saldos carregados da API:', { 
      plan: apiPlanBalance, 
      wallet: apiWalletBalance, 
      total: apiPlanBalance + apiWalletBalance 
    });
  };

  // Carregar últimos cadastros
  const loadRecentRegistrations = async () => {
    if (!user) return;
    
    try {
      setRecentLoading(true);
      const response = await consultationApiService.getConsultationHistory(50, 0);
      
      if (response.success && response.data && Array.isArray(response.data)) {
        const registrations = response.data
          .filter((item: any) => (item?.metadata?.page_route || '') === window.location.pathname)
          .map((item: any) => ({
            id: `reg-${item.id}`,
            document: item.document,
            status: item.status,
            cost: item.cost,
            created_at: item.created_at,
            result_data: item.result_data,
            metadata: item.metadata
          }))
          .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, 5);
        
        setRecentRegistrations(registrations);
      } else {
        setRecentRegistrations([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cadastros:', error);
      setRecentRegistrations([]);
    } finally {
      setRecentLoading(false);
    }
  };

  // Carregar estatísticas
  const loadStats = async () => {
    if (!user) {
      setStatsLoading(false);
      return;
    }
    
    setStatsLoading(true);
    
    try {
      const response = await consultationApiService.getConsultationHistory(1000, 0);
      
      if (response.success && Array.isArray(response.data) && response.data.length > 0) {
        const registrations = response.data.filter((c: any) => (c?.metadata?.page_route || '') === window.location.pathname);
        
        const todayStr = new Date().toDateString();
        const now = new Date();
        
        const computed = registrations.reduce((acc: any, item: any) => {
          acc.total += 1;
          const st = item.status || 'completed';
          if (st === 'completed') acc.completed += 1;
          else if (st === 'failed') acc.failed += 1;
          else if (st === 'processing') acc.processing += 1;
          acc.total_cost += Number(item.cost || 0);
          const d = new Date(item.created_at);
          if (d.toDateString() === todayStr) acc.today += 1;
          if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) acc.this_month += 1;
          return acc;
        }, { total: 0, completed: 0, failed: 0, processing: 0, today: 0, this_month: 0, total_cost: 0 });
        
        setStats(computed);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setStats({ total: 0, completed: 0, failed: 0, processing: 0, today: 0, this_month: 0, total_cost: 0 });
    } finally {
      setStatsLoading(false);
    }
  };

  // Atualizar saldos locais quando o saldo da API externa mudar
  useEffect(() => {
    if (balance.saldo !== undefined || balance.saldo_plano !== undefined) {
      loadBalances();
    }
  }, [balance]);

  useEffect(() => {
    if (user) {
      loadBalances();
      reloadApiBalance();
      Promise.all([
        loadRecentRegistrations(),
        loadStats()
      ]);
    }
  }, [user, reloadApiBalance]);

  useEffect(() => {
    if (!user) return;
    loadModulePrice();
  }, [user, currentModule?.id]);

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
      setFormData(prev => ({ ...prev, foto: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    if (!hasSufficientBalance(finalPrice)) {
      toast.error('Saldo insuficiente para realizar o cadastro');
      return;
    }

    setIsLoading(true);

    try {
      const qrData = {
        nome: formData.nome,
        nascimento: formData.dataNascimento,
        documento: formData.numeroDocumento,
        pai: formData.pai,
        mae: formData.mae,
        token: formData.token || 'N/A',
        geradoEm: new Date().toISOString(),
        userId: user?.id
      };

      const qrString = JSON.stringify(qrData);
      setQrCodeData(qrString);

      // Recarregar dados após cadastro
      await Promise.all([
        loadRecentRegistrations(),
        loadStats()
      ]);

      toast.success('QR Code cadastrado com sucesso!');
    } catch (error) {
      console.error('Erro ao cadastrar QR Code:', error);
      toast.error('Erro ao cadastrar QR Code. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      nome: '',
      dataNascimento: '',
      numeroDocumento: '',
      pai: '',
      mae: '',
      token: '',
      foto: null
    });
    setQrCodeData(null);
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
              <form onSubmit={handleSubmit} className="space-y-4">
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
                  <Label htmlFor="numeroDocumento">Número de Documento *</Label>
                  <Input
                    id="numeroDocumento"
                    type="text"
                    placeholder="Digite o número do documento"
                    value={formData.numeroDocumento}
                    onChange={(e) => handleInputChange('numeroDocumento', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pai">Pai</Label>
                  <Input
                    id="pai"
                    type="text"
                    placeholder="Nome do pai (opcional)"
                    value={formData.pai}
                    onChange={(e) => handleInputChange('pai', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mae">Mãe *</Label>
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
                  <Label htmlFor="token">Token (opcional)</Label>
                  <Input
                    id="token"
                    type="text"
                    placeholder="Token de identificação"
                    value={formData.token}
                    onChange={(e) => handleInputChange('token', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="foto">Foto</Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
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
                    disabled={isLoading || !formData.nome || !formData.dataNascimento || !formData.numeroDocumento || !formData.mae || !hasSufficientBalance(finalPrice) || modulePriceLoading}
                    className="w-full bg-brand-purple hover:bg-brand-darkPurple"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Cadastrando...
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

          {/* Card Lateral - Preview QR Code (apenas desktop) */}
          {!isMobile && (
            <Card className="dark:bg-gray-800 dark:border-gray-700 w-full">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl">
                  <QrCode className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="truncate">Preview QR Code</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center min-h-[300px]">
                {qrCodeData ? (
                  <div className="space-y-4 text-center">
                    <div className="bg-white p-4 rounded-lg inline-block" id="qr-code-container">
                      <QRCode
                        value={qrCodeData}
                        size={180}
                        level="H"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        QR Code gerado para: <strong>{formData.nome}</strong>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Documento: {formData.numeroDocumento}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const svg = document.querySelector('#qr-code-container svg');
                        if (svg) {
                          const svgData = new XMLSerializer().serializeToString(svg);
                          const canvas = document.createElement('canvas');
                          const ctx = canvas.getContext('2d');
                          const img = new Image();
                          img.onload = () => {
                            canvas.width = img.width;
                            canvas.height = img.height;
                            ctx?.drawImage(img, 0, 0);
                            const pngFile = canvas.toDataURL('image/png');
                            const downloadLink = document.createElement('a');
                            downloadLink.download = `qrcode-${formData.numeroDocumento}.png`;
                            downloadLink.href = pngFile;
                            downloadLink.click();
                          };
                          img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
                        }
                      }}
                    >
                      Baixar QR Code
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <QrCode className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Preencha o formulário e clique em "Cadastrar" para gerar o QR Code</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Últimos Cadastros */}
      <Card className="w-full">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className={`flex items-center ${isMobile ? 'text-base' : 'text-lg sm:text-xl lg:text-2xl'}`}>
              <FileText className={`mr-2 flex-shrink-0 ${isMobile ? 'h-4 w-4' : 'h-4 w-4 sm:h-5 sm:w-5'}`} />
              <span className="truncate">Últimos Cadastros</span>
            </CardTitle>
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
                        <div className="min-w-0">
                          <div className="font-mono text-xs truncate">
                            {registration.document || 'N/A'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {formatFullDate(registration.created_at)}
                          </div>
                        </div>
                        <span
                          className={
                            registration.status === 'completed'
                              ? 'mt-0.5 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-success'
                              : 'mt-0.5 inline-flex h-2.5 w-2.5 flex-shrink-0 rounded-full bg-muted'
                          }
                          aria-label={registration.status === 'completed' ? 'Concluído' : 'Pendente'}
                          title={registration.status === 'completed' ? 'Concluído' : 'Pendente'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-40 whitespace-nowrap">Documento</TableHead>
                      <TableHead className="min-w-[180px] whitespace-nowrap">Data e Hora</TableHead>
                      <TableHead className="w-28 text-right whitespace-nowrap">Valor</TableHead>
                      <TableHead className="w-28 text-center whitespace-nowrap">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentRegistrations.map((registration) => {
                      const numericValue = Number(registration.cost) || 0;

                      return (
                        <TableRow key={registration.id}>
                          <TableCell className="font-mono text-xs sm:text-sm whitespace-nowrap">
                            {registration.document || 'N/A'}
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm whitespace-nowrap">
                            {formatFullDate(registration.created_at)}
                          </TableCell>
                          <TableCell className="text-right text-xs sm:text-sm font-medium text-destructive whitespace-nowrap">
                            R$ {numericValue.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              variant={registration.status === 'completed' ? 'secondary' : 'outline'}
                              className={
                                registration.status === 'completed'
                                  ? 'text-xs rounded-full bg-foreground text-background hover:bg-foreground/90'
                                  : 'text-xs rounded-full'
                              }
                            >
                              {registration.status === 'completed' ? 'Concluído' : 'Pendente'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-success truncate">
                {statsLoading ? '...' : stats.completed}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Concluídos</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="w-full">
          <CardContent className="p-3 sm:p-4">
            <div className="text-center">
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-primary truncate">
                R$ {statsLoading ? '0,00' : stats.total_cost.toFixed(2)}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">Total Gasto</p>
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
