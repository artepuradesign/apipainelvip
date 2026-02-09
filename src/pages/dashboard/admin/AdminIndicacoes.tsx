import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { formatDate } from '@/utils/historicoUtils';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';

const AdminIndicacoes = () => {
  const navigate = useNavigate();
  const { transactions, loadTransactions, isLoading, stats } = useApiDashboardAdmin();
  const [displayLimit, setDisplayLimit] = useState(50);

  useEffect(() => {
    loadTransactions(100);
  }, []);

  const indicacaoTransactions = transactions.filter(t => 
    (t.description?.toLowerCase().includes('indicação') || 
    t.description?.toLowerCase().includes('comissão') ||
    t.description?.toLowerCase().includes('referral') ||
    t.type === 'commission' ||
    t.type === 'indicacao') &&
    t.source === 'central_cash'
  );

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const extractIndicado = (transaction: any) => {
    const descricao = transaction.description || '';
    
    if (descricao.includes('usuário ')) {
      const match = descricao.match(/usuário (.+?)$/);
      if (match) return match[1];
    }
    
    if (descricao.includes('indicação por ')) {
      return transaction.user_name || 'N/A';
    }
    
    return 'N/A';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <DashboardTitleCard
        title="Total de Indicações"
        subtitle="Histórico completo de comissões pagas"
        icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5" />}
        backTo="/dashboard/admin"
        right={
          <Button
            onClick={() => loadTransactions(100)}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="h-8 sm:h-9"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-2">Atualizar</span>
          </Button>
        }
      />

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Pago</CardTitle>
            <Gift className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold text-orange-600">
              {formatCurrency(stats?.total_commissions || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total de Indicações</CardTitle>
            <Gift className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {stats?.total_referrals || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Comissão Média</CardTitle>
            <Gift className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-xl sm:text-2xl font-bold">
              {formatCurrency(stats?.total_referrals ? (stats?.total_commissions || 0) / stats?.total_referrals : 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Indicações - Mobile First */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base sm:text-lg">Histórico de Comissões</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {indicacaoTransactions.length} comissões
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Carregando comissões...</p>
            </div>
          ) : indicacaoTransactions.length > 0 ? (
            <div className="space-y-3">
              {indicacaoTransactions.slice(0, displayLimit).map((transaction, index) => (
                <div 
                  key={transaction.id || index}
                  className="border rounded-lg p-3 sm:p-4 space-y-2 bg-card border-l-4 border-l-orange-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{transaction.id}
                      </span>
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </span>
                    </div>
                    <Badge variant="default" className="text-xs">Pago</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        Indicador: {transaction.user_name || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        Indicado: {extractIndicado(transaction)}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="font-bold text-sm sm:text-base text-orange-600">
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {indicacaoTransactions.length > displayLimit && (
                <div className="text-center pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setDisplayLimit(prev => prev + 50)}
                    className="w-full sm:w-auto"
                  >
                    Carregar mais ({indicacaoTransactions.length - displayLimit} restantes)
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Gift className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma comissão registrada
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminIndicacoes;
