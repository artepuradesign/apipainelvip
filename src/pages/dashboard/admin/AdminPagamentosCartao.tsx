import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreditCard, TrendingUp, Users, Calendar, Search, Filter, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { formatBrazilianCurrency, formatDate } from '@/utils/historicoUtils';
import DashboardTitleCard from '@/components/dashboard/DashboardTitleCard';

const AdminPagamentosCartao = () => {
  const { isSupport } = useAuth();
  const { stats, transactions, isLoading } = useApiDashboardAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const cardTransactions = useMemo(() => {
    return transactions.filter(transaction => 
      transaction.payment_method?.toLowerCase().includes('cartao') ||
      transaction.payment_method?.toLowerCase().includes('card') ||
      transaction.payment_method?.toLowerCase().includes('credito') ||
      transaction.type?.toLowerCase().includes('cartao') ||
      transaction.description?.toLowerCase().includes('cartão')
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return cardTransactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id?.toString().includes(searchTerm);

      const matchesDate = dateFilter === '' || 
        transaction.created_at?.includes(dateFilter);

      return matchesSearch && matchesDate;
    });
  }, [cardTransactions, searchTerm, dateFilter]);

  const cardStats = useMemo(() => {
    const totalValue = cardTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const todayTransactions = cardTransactions.filter(t => 
      t.created_at && new Date(t.created_at).toDateString() === new Date().toDateString()
    );
    const uniqueUsers = new Set(cardTransactions.map(t => t.user_name)).size;

    return {
      total: cardTransactions.length,
      totalValue,
      todayCount: todayTransactions.length,
      todayValue: todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      uniqueUsers
    };
  }, [cardTransactions]);

  if (!isSupport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Acesso Negado</h2>
          <p className="text-gray-600 dark:text-gray-400">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <DashboardTitleCard
        title="Pagamentos Cartão"
        subtitle="Análise detalhada das transações de cartão"
        icon={<CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />}
        backTo="/dashboard/admin"
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Total Cartão</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatBrazilianCurrency(stats?.payment_card || 0)}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Valor total processado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Transações</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{cardStats.total}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Total de transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{formatBrazilianCurrency(cardStats.todayValue)}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">{cardStats.todayCount} transações hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Usuários</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{cardStats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Usuários únicos</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center space-x-2 flex-1">
              <Search className="h-4 w-4 text-gray-400 hidden sm:block" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9"
              />
            </div>
            <Input
              type="date"
              placeholder="Filtrar por data"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="h-9 sm:w-40"
            />
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
              }}
              size="sm"
              className="h-9"
            >
              Limpar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Transações - Mobile First */}
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base sm:text-lg">Transações Cartão ({filteredTransactions.length})</CardTitle>
            <Button variant="outline" size="sm" className="h-8">
              <Download className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
          {isLoading ? (
            <div className="text-center py-8">Carregando transações...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação de cartão encontrada
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id}
                  className="border rounded-lg p-3 sm:p-4 space-y-2 bg-card border-l-4 border-l-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">
                        #{transaction.id}
                      </span>
                      <Badge className="text-xs">Cartão</Badge>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {formatDate(transaction.created_at)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">
                        {transaction.user_name || 'N/A'}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {transaction.description}
                      </p>
                    </div>
                    <div className="text-right ml-3">
                      <p className={`font-bold text-sm sm:text-base ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatBrazilianCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPagamentosCartao;
