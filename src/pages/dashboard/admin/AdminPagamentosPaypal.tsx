import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, Users, Calendar, Search, Filter, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApiDashboardAdmin } from '@/hooks/useApiDashboardAdmin';
import { formatBrazilianCurrency, formatDate } from '@/utils/historicoUtils';
import PageHeaderCard from '@/components/dashboard/PageHeaderCard';

const AdminPagamentosPaypal = () => {
  const { isSupport } = useAuth();
  const { stats, transactions, isLoading } = useApiDashboardAdmin();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Filtrar apenas transações PayPal
  const paypalTransactions = useMemo(() => {
    return transactions.filter(transaction => 
      transaction.payment_method?.toLowerCase().includes('paypal') ||
      transaction.type?.toLowerCase().includes('paypal') ||
      transaction.description?.toLowerCase().includes('paypal')
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return paypalTransactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.id?.toString().includes(searchTerm);

      const matchesDate = dateFilter === '' || 
        transaction.created_at?.includes(dateFilter);

      return matchesSearch && matchesDate;
    });
  }, [paypalTransactions, searchTerm, dateFilter]);

  // Calcular estatísticas PayPal
  const paypalStats = useMemo(() => {
    const totalValue = paypalTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
    const todayTransactions = paypalTransactions.filter(t => 
      t.created_at && new Date(t.created_at).toDateString() === new Date().toDateString()
    );
    const uniqueUsers = new Set(paypalTransactions.map(t => t.user_name)).size;

    return {
      total: paypalTransactions.length,
      totalValue,
      todayCount: todayTransactions.length,
      todayValue: todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      uniqueUsers
    };
  }, [paypalTransactions]);

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
    <div className="space-y-6">
      <PageHeaderCard
        title="Pagamentos PayPal"
        subtitle="Análise detalhada de todas as transações PayPal"
        extra={<DollarSign className="h-6 w-6" />}
      />

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total PayPal</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBrazilianCurrency(stats?.payment_paypal || 0)}</div>
            <p className="text-xs text-muted-foreground">Valor total processado</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transações</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paypalStats.total}</div>
            <p className="text-xs text-muted-foreground">Total de transações</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBrazilianCurrency(paypalStats.todayValue)}</div>
            <p className="text-xs text-muted-foreground">{paypalStats.todayCount} transações hoje</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paypalStats.uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">Usuários que usaram PayPal</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por usuário, descrição ou ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Input
              type="date"
              placeholder="Filtrar por data"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setDateFilter('');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Transações PayPal ({filteredTransactions.length})</CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Carregando transações...</div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma transação PayPal encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-mono text-sm">
                        #{transaction.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {transaction.user_name || 'N/A'}
                      </TableCell>
                      <TableCell>{transaction.description}</TableCell>
                      <TableCell className="font-mono">
                        <span className={transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatBrazilianCurrency(transaction.amount)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">PayPal</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(transaction.created_at)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPagamentosPaypal;