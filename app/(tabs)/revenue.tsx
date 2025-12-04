
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PageHeader from '../../components/PageHeader';
import AddIncomeModal from '../../components/AddIncomeModal';
import AddExpenseModal from '../../components/AddExpenseModal';
import { supabase } from '../../lib/supabase';

interface Income {
  id: string;
  crop_name: string;
  sales_channel: string;
  amount: number;
  sale_date: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
}

interface SalesChannelData {
  channel: string;
  total: number;
  count: number;
}

interface ExpenseCategoryData {
  category: string;
  total: number;
  count: number;
}

export default function RevenueScreen() {
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [income, setIncome] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [incomeResult, expensesResult] = await Promise.all([
        supabase
          .from('income')
          .select('*')
          .eq('user_id', user.id)
          .order('sale_date', { ascending: false }),
        supabase
          .from('expenses')
          .select('*')
          .eq('user_id', user.id)
          .order('expense_date', { ascending: false }),
      ]);

      if (incomeResult.error) throw incomeResult.error;
      if (expensesResult.error) throw expensesResult.error;

      setIncome(incomeResult.data || []);
      setExpenses(expensesResult.data || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load revenue data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, []);

  const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
  const netProfit = totalIncome - totalExpenses;

  const salesChannelData: SalesChannelData[] = income.reduce((acc: SalesChannelData[], item) => {
    const existing = acc.find(x => x.channel === item.sales_channel);
    if (existing) {
      existing.total += parseFloat(item.amount.toString());
      existing.count += 1;
    } else {
      acc.push({
        channel: item.sales_channel,
        total: parseFloat(item.amount.toString()),
        count: 1,
      });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total);

  const expenseCategoryData: ExpenseCategoryData[] = expenses.reduce((acc: ExpenseCategoryData[], item) => {
    const existing = acc.find(x => x.category === item.category);
    if (existing) {
      existing.total += parseFloat(item.amount.toString());
      existing.count += 1;
    } else {
      acc.push({
        category: item.category,
        total: parseFloat(item.amount.toString()),
        count: 1,
      });
    }
    return acc;
  }, []).sort((a, b) => b.total - a.total);

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatChannelName = (channel: string) => {
    return channel
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatCategoryName = (category: string) => {
    return category
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const deleteIncome = async (id: string) => {
    Alert.alert(
      'Delete Income',
      'Are you sure you want to delete this income entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('income').delete().eq('id', id);
              if (error) throw error;
              loadData();
            } catch (error: any) {
              console.error('Error deleting income:', error);
              Alert.alert('Error', 'Failed to delete income');
            }
          },
        },
      ]
    );
  };

  const deleteExpense = async (id: string) => {
    Alert.alert(
      'Delete Expense',
      'Are you sure you want to delete this expense entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('expenses').delete().eq('id', id);
              if (error) throw error;
              loadData();
            } catch (error: any) {
              console.error('Error deleting expense:', error);
              Alert.alert('Error', 'Failed to delete expense');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader title="💰 Revenue" />
      <LinearGradient colors={['#2D5016', '#4A7C2C', '#6BA542']} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
          }
        >
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={[styles.summaryCard, styles.incomeCard]}>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(totalIncome)}</Text>
              <Text style={styles.summaryCount}>{income.length} entries</Text>
            </View>
            <View style={[styles.summaryCard, styles.expenseCard]}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryAmount}>{formatCurrency(totalExpenses)}</Text>
              <Text style={styles.summaryCount}>{expenses.length} entries</Text>
            </View>
          </View>

          <View style={[styles.card, netProfit >= 0 ? styles.profitCard : styles.lossCard]}>
            <Text style={styles.netProfitLabel}>Net Profit/Loss</Text>
            <Text style={styles.netProfitAmount}>{formatCurrency(netProfit)}</Text>
            <Text style={styles.netProfitSubtext}>
              {netProfit >= 0 ? '✓ Profitable' : '⚠ Operating at a loss'}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.incomeButton]}
              onPress={() => setShowIncomeModal(true)}
            >
              <Text style={styles.actionButtonText}>+ Add Income</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.expenseButton]}
              onPress={() => setShowExpenseModal(true)}
            >
              <Text style={styles.actionButtonText}>+ Add Expense</Text>
            </TouchableOpacity>
          </View>

          {/* Sales Channel Comparison */}
          {salesChannelData.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sales Channel Performance</Text>
              <Text style={styles.cardSubtitle}>Where you&apos;re making the most money</Text>
              {salesChannelData.map((channel, index) => {
                const percentage = (channel.total / totalIncome) * 100;
                return (
                  <View key={index} style={styles.channelItem}>
                    <View style={styles.channelHeader}>
                      <Text style={styles.channelName}>{formatChannelName(channel.channel)}</Text>
                      <Text style={styles.channelAmount}>{formatCurrency(channel.total)}</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.channelStats}>
                      {channel.count} sales • {percentage.toFixed(1)}% of total income
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Expense Breakdown */}
          {expenseCategoryData.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Expense Breakdown</Text>
              <Text style={styles.cardSubtitle}>Where your money is going</Text>
              {expenseCategoryData.map((category, index) => {
                const percentage = (category.total / totalExpenses) * 100;
                return (
                  <View key={index} style={styles.categoryItem}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{formatCategoryName(category.category)}</Text>
                      <Text style={styles.categoryAmount}>{formatCurrency(category.total)}</Text>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarExpense, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.categoryStats}>
                      {category.count} expenses • {percentage.toFixed(1)}% of total expenses
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Recent Income */}
          {income.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Income</Text>
              {income.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listItem}
                  onLongPress={() => deleteIncome(item.id)}
                >
                  <View style={styles.listItemLeft}>
                    <Text style={styles.listItemTitle}>{item.crop_name}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {formatChannelName(item.sales_channel)} • {new Date(item.sale_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.listItemAmount}>{formatCurrency(parseFloat(item.amount.toString()))}</Text>
                </TouchableOpacity>
              ))}
              {income.length > 5 && (
                <Text style={styles.moreText}>+ {income.length - 5} more entries</Text>
              )}
            </View>
          )}

          {/* Recent Expenses */}
          {expenses.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recent Expenses</Text>
              {expenses.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.listItem}
                  onLongPress={() => deleteExpense(item.id)}
                >
                  <View style={styles.listItemLeft}>
                    <Text style={styles.listItemTitle}>{item.description}</Text>
                    <Text style={styles.listItemSubtitle}>
                      {formatCategoryName(item.category)} • {new Date(item.expense_date).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={[styles.listItemAmount, styles.expenseAmount]}>
                    -{formatCurrency(parseFloat(item.amount.toString()))}
                  </Text>
                </TouchableOpacity>
              ))}
              {expenses.length > 5 && (
                <Text style={styles.moreText}>+ {expenses.length - 5} more entries</Text>
              )}
            </View>
          )}

          {/* Empty State */}
          {income.length === 0 && expenses.length === 0 && !loading && (
            <View style={styles.card}>
              <Text style={styles.emptyTitle}>Start Tracking Your Revenue</Text>
              <Text style={styles.emptyText}>
                Add your income and expenses to get detailed insights into your farm&apos;s profitability.
              </Text>
            </View>
          )}
        </ScrollView>
      </LinearGradient>

      <AddIncomeModal
        visible={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        onSuccess={loadData}
      />
      <AddExpenseModal
        visible={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSuccess={loadData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2D5016',
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  summaryContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  incomeCard: {
    backgroundColor: '#4CAF50',
  },
  expenseCard: {
    backgroundColor: '#FF5252',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.8,
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  profitCard: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  lossCard: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#FF5252',
  },
  netProfitLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  netProfitAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  netProfitSubtext: {
    fontSize: 14,
    color: '#666',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  incomeButton: {
    backgroundColor: '#4CAF50',
  },
  expenseButton: {
    backgroundColor: '#FF5252',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  channelItem: {
    marginBottom: 20,
  },
  channelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  channelAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  channelStats: {
    fontSize: 12,
    color: '#666',
  },
  categoryItem: {
    marginBottom: 20,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF5252',
  },
  progressBarExpense: {
    height: '100%',
    backgroundColor: '#FF5252',
    borderRadius: 4,
  },
  categoryStats: {
    fontSize: 12,
    color: '#666',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listItemLeft: {
    flex: 1,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  listItemSubtitle: {
    fontSize: 13,
    color: '#666',
  },
  listItemAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 12,
  },
  expenseAmount: {
    color: '#FF5252',
  },
  moreText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2D5016',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
