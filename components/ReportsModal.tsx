
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface ReportsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface Income {
  id: string;
  crop_name: string;
  sales_channel: string;
  amount: number;
  sale_date: string;
  quantity?: number;
  unit?: string;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
}

const REPORT_TYPES = [
  {
    id: 'profitability_by_crop',
    title: 'Profitability by Crop',
    description: 'See which crops are generating the most revenue',
    icon: '🌱',
  },
  {
    id: 'sales_channel_performance',
    title: 'Sales Channel Performance',
    description: 'Compare revenue across different sales channels',
    icon: '📊',
  },
  {
    id: 'expense_breakdown',
    title: 'Expense Breakdown by Category',
    description: 'Analyze where your money is being spent',
    icon: '💰',
  },
  {
    id: 'monthly_income_forecast',
    title: 'Monthly Income Forecast',
    description: 'View income trends and projections by month',
    icon: '📈',
  },
  {
    id: 'profit_margin_analysis',
    title: 'Profit Margin Analysis',
    description: 'Calculate overall profit margins and trends',
    icon: '💹',
  },
  {
    id: 'seasonal_performance',
    title: 'Seasonal Performance',
    description: 'Compare revenue across different seasons',
    icon: '🗓️',
  },
  {
    id: 'top_expenses',
    title: 'Top Expenses Report',
    description: 'Identify your largest expense items',
    icon: '🔝',
  },
  {
    id: 'cash_flow_summary',
    title: 'Cash Flow Summary',
    description: 'Track money in vs money out over time',
    icon: '💵',
  },
];

export default function ReportsModal({ visible, onClose }: ReportsModalProps) {
  const [loading, setLoading] = useState(false);

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

  const getMonthName = (monthIndex: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[monthIndex];
  };

  const getSeason = (date: Date) => {
    const month = date.getMonth();
    if (month >= 2 && month <= 4) return 'Spring';
    if (month >= 5 && month <= 7) return 'Summer';
    if (month >= 8 && month <= 10) return 'Fall';
    return 'Winter';
  };

  const generateReport = async (reportId: string) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

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

      const income: Income[] = incomeResult.data || [];
      const expenses: Expense[] = expensesResult.data || [];

      let reportContent = '';

      switch (reportId) {
        case 'profitability_by_crop':
          reportContent = generateProfitabilityByCropReport(income);
          break;
        case 'sales_channel_performance':
          reportContent = generateSalesChannelReport(income);
          break;
        case 'expense_breakdown':
          reportContent = generateExpenseBreakdownReport(expenses);
          break;
        case 'monthly_income_forecast':
          reportContent = generateMonthlyIncomeReport(income);
          break;
        case 'profit_margin_analysis':
          reportContent = generateProfitMarginReport(income, expenses);
          break;
        case 'seasonal_performance':
          reportContent = generateSeasonalReport(income);
          break;
        case 'top_expenses':
          reportContent = generateTopExpensesReport(expenses);
          break;
        case 'cash_flow_summary':
          reportContent = generateCashFlowReport(income, expenses);
          break;
        default:
          reportContent = 'Report type not found';
      }

      Alert.alert('Report Generated', reportContent, [{ text: 'OK' }], {
        cancelable: true,
      });
    } catch (error: any) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateProfitabilityByCropReport = (income: Income[]) => {
    if (income.length === 0) {
      return 'No income data available to generate this report.';
    }

    const cropData: { [key: string]: { total: number; count: number } } = {};
    
    income.forEach(item => {
      const crop = item.crop_name;
      if (!cropData[crop]) {
        cropData[crop] = { total: 0, count: 0 };
      }
      cropData[crop].total += parseFloat(item.amount.toString());
      cropData[crop].count += 1;
    });

    const sortedCrops = Object.entries(cropData)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10);

    let report = '🌱 PROFITABILITY BY CROP\n\n';
    report += `Total Crops: ${Object.keys(cropData).length}\n\n`;
    
    sortedCrops.forEach(([crop, data], index) => {
      const avg = data.total / data.count;
      report += `${index + 1}. ${crop}\n`;
      report += `   Revenue: ${formatCurrency(data.total)}\n`;
      report += `   Sales: ${data.count}\n`;
      report += `   Avg per sale: ${formatCurrency(avg)}\n\n`;
    });

    return report;
  };

  const generateSalesChannelReport = (income: Income[]) => {
    if (income.length === 0) {
      return 'No income data available to generate this report.';
    }

    const channelData: { [key: string]: { total: number; count: number } } = {};
    const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    
    income.forEach(item => {
      const channel = item.sales_channel;
      if (!channelData[channel]) {
        channelData[channel] = { total: 0, count: 0 };
      }
      channelData[channel].total += parseFloat(item.amount.toString());
      channelData[channel].count += 1;
    });

    const sortedChannels = Object.entries(channelData)
      .sort(([, a], [, b]) => b.total - a.total);

    let report = '📊 SALES CHANNEL PERFORMANCE\n\n';
    report += `Total Revenue: ${formatCurrency(totalIncome)}\n\n`;
    
    sortedChannels.forEach(([channel, data], index) => {
      const percentage = (data.total / totalIncome) * 100;
      const avg = data.total / data.count;
      report += `${index + 1}. ${formatChannelName(channel)}\n`;
      report += `   Revenue: ${formatCurrency(data.total)} (${percentage.toFixed(1)}%)\n`;
      report += `   Sales: ${data.count}\n`;
      report += `   Avg per sale: ${formatCurrency(avg)}\n\n`;
    });

    return report;
  };

  const generateExpenseBreakdownReport = (expenses: Expense[]) => {
    if (expenses.length === 0) {
      return 'No expense data available to generate this report.';
    }

    const categoryData: { [key: string]: { total: number; count: number } } = {};
    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    
    expenses.forEach(item => {
      const category = item.category;
      if (!categoryData[category]) {
        categoryData[category] = { total: 0, count: 0 };
      }
      categoryData[category].total += parseFloat(item.amount.toString());
      categoryData[category].count += 1;
    });

    const sortedCategories = Object.entries(categoryData)
      .sort(([, a], [, b]) => b.total - a.total);

    let report = '💰 EXPENSE BREAKDOWN BY CATEGORY\n\n';
    report += `Total Expenses: ${formatCurrency(totalExpenses)}\n\n`;
    
    sortedCategories.forEach(([category, data], index) => {
      const percentage = (data.total / totalExpenses) * 100;
      const avg = data.total / data.count;
      report += `${index + 1}. ${formatCategoryName(category)}\n`;
      report += `   Amount: ${formatCurrency(data.total)} (${percentage.toFixed(1)}%)\n`;
      report += `   Transactions: ${data.count}\n`;
      report += `   Avg per transaction: ${formatCurrency(avg)}\n\n`;
    });

    return report;
  };

  const generateMonthlyIncomeReport = (income: Income[]) => {
    if (income.length === 0) {
      return 'No income data available to generate this report.';
    }

    const monthlyData: { [key: string]: number } = {};
    
    income.forEach(item => {
      const date = new Date(item.sale_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += parseFloat(item.amount.toString());
    });

    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b));

    let report = '📈 MONTHLY INCOME FORECAST\n\n';
    
    sortedMonths.forEach(([monthKey, total]) => {
      const [year, month] = monthKey.split('-');
      report += `${getMonthName(parseInt(month))} ${year}: ${formatCurrency(total)}\n`;
    });

    if (sortedMonths.length >= 3) {
      const recentMonths = sortedMonths.slice(-3);
      const avgRecent = recentMonths.reduce((sum, [, total]) => sum + total, 0) / 3;
      report += `\n📊 3-Month Average: ${formatCurrency(avgRecent)}\n`;
      report += `📈 Projected Next Month: ${formatCurrency(avgRecent)}\n`;
    }

    return report;
  };

  const generateProfitMarginReport = (income: Income[], expenses: Expense[]) => {
    if (income.length === 0 && expenses.length === 0) {
      return 'No financial data available to generate this report.';
    }

    const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

    let report = '💹 PROFIT MARGIN ANALYSIS\n\n';
    report += `Total Income: ${formatCurrency(totalIncome)}\n`;
    report += `Total Expenses: ${formatCurrency(totalExpenses)}\n`;
    report += `Net Profit: ${formatCurrency(netProfit)}\n`;
    report += `Profit Margin: ${profitMargin.toFixed(2)}%\n\n`;

    if (profitMargin >= 20) {
      report += '✅ Excellent profit margin! Your farm is highly profitable.\n';
    } else if (profitMargin >= 10) {
      report += '✓ Good profit margin. Your farm is profitable.\n';
    } else if (profitMargin >= 0) {
      report += '⚠ Low profit margin. Consider reducing expenses or increasing prices.\n';
    } else {
      report += '❌ Negative profit margin. Your expenses exceed income.\n';
    }

    return report;
  };

  const generateSeasonalReport = (income: Income[]) => {
    if (income.length === 0) {
      return 'No income data available to generate this report.';
    }

    const seasonalData: { [key: string]: { total: number; count: number } } = {};
    
    income.forEach(item => {
      const date = new Date(item.sale_date);
      const season = getSeason(date);
      if (!seasonalData[season]) {
        seasonalData[season] = { total: 0, count: 0 };
      }
      seasonalData[season].total += parseFloat(item.amount.toString());
      seasonalData[season].count += 1;
    });

    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
    let report = '🗓️ SEASONAL PERFORMANCE\n\n';
    
    seasons.forEach(season => {
      const data = seasonalData[season];
      if (data) {
        const avg = data.total / data.count;
        report += `${season}:\n`;
        report += `  Revenue: ${formatCurrency(data.total)}\n`;
        report += `  Sales: ${data.count}\n`;
        report += `  Avg per sale: ${formatCurrency(avg)}\n\n`;
      } else {
        report += `${season}: No data\n\n`;
      }
    });

    return report;
  };

  const generateTopExpensesReport = (expenses: Expense[]) => {
    if (expenses.length === 0) {
      return 'No expense data available to generate this report.';
    }

    const sortedExpenses = [...expenses]
      .sort((a, b) => parseFloat(b.amount.toString()) - parseFloat(a.amount.toString()))
      .slice(0, 15);

    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);

    let report = '🔝 TOP EXPENSES REPORT\n\n';
    report += `Total Expenses: ${formatCurrency(totalExpenses)}\n\n`;
    
    sortedExpenses.forEach((expense, index) => {
      const percentage = (parseFloat(expense.amount.toString()) / totalExpenses) * 100;
      report += `${index + 1}. ${expense.description}\n`;
      report += `   Category: ${formatCategoryName(expense.category)}\n`;
      report += `   Amount: ${formatCurrency(parseFloat(expense.amount.toString()))} (${percentage.toFixed(1)}%)\n`;
      report += `   Date: ${new Date(expense.expense_date).toLocaleDateString()}\n\n`;
    });

    return report;
  };

  const generateCashFlowReport = (income: Income[], expenses: Expense[]) => {
    if (income.length === 0 && expenses.length === 0) {
      return 'No financial data available to generate this report.';
    }

    const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
    
    income.forEach(item => {
      const date = new Date(item.sale_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      monthlyData[monthKey].income += parseFloat(item.amount.toString());
    });

    expenses.forEach(item => {
      const date = new Date(item.expense_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }
      monthlyData[monthKey].expenses += parseFloat(item.amount.toString());
    });

    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 6);

    let report = '💵 CASH FLOW SUMMARY\n\n';
    
    sortedMonths.forEach(([monthKey, data]) => {
      const [year, month] = monthKey.split('-');
      const netFlow = data.income - data.expenses;
      report += `${getMonthName(parseInt(month) - 1)} ${year}:\n`;
      report += `  Income: ${formatCurrency(data.income)}\n`;
      report += `  Expenses: ${formatCurrency(data.expenses)}\n`;
      report += `  Net Flow: ${formatCurrency(netFlow)} ${netFlow >= 0 ? '✓' : '⚠'}\n\n`;
    });

    const totalIncome = income.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    const totalExpenses = expenses.reduce((sum, item) => sum + parseFloat(item.amount.toString()), 0);
    const overallNetFlow = totalIncome - totalExpenses;

    report += `Overall Net Cash Flow: ${formatCurrency(overallNetFlow)}\n`;

    return report;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>📊 Run Reports</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            <Text style={styles.subtitle}>
              Select a report to generate insights from your revenue data
            </Text>

            {REPORT_TYPES.map((report) => (
              <TouchableOpacity
                key={report.id}
                style={styles.reportCard}
                onPress={() => generateReport(report.id)}
                disabled={loading}
              >
                <View style={styles.reportIcon}>
                  <Text style={styles.reportIconText}>{report.icon}</Text>
                </View>
                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportDescription}>{report.description}</Text>
                </View>
                <Text style={styles.reportArrow}>›</Text>
              </TouchableOpacity>
            ))}

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>💡 Report Tips</Text>
              <Text style={styles.infoText}>
                - Reports are generated based on your current income and expense data{'\n'}
                - Add more transactions to get more detailed insights{'\n'}
                - Reports can help identify trends and opportunities{'\n'}
                - Use reports to make data-driven decisions for your farm
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D5016',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  reportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reportIconText: {
    fontSize: 24,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D5016',
    marginBottom: 4,
  },
  reportDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  reportArrow: {
    fontSize: 28,
    color: '#4A7C2C',
    marginLeft: 8,
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#1565C0',
    lineHeight: 20,
  },
});
