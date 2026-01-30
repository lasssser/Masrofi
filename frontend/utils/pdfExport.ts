import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { expenseStorage, incomeStorage, settingsStorage, CATEGORIES } from './storage';

// Generate HTML for PDF
const generatePDFHtml = async (month: string): Promise<string> => {
  const settings = await settingsStorage.get();
  const expenses = await expenseStorage.getAll();
  const incomes = await incomeStorage.getAll();
  
  // Filter by month
  const monthExpenses = expenses.filter(e => e.date.startsWith(month));
  const monthIncomes = incomes.filter(i => i.date.startsWith(month));
  
  // Calculate totals
  const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);
  const totalIncome = monthIncomes.reduce((sum, i) => sum + i.amount, 0);
  const balance = totalIncome - totalExpenses;
  
  // Group expenses by category
  const expensesByCategory: Record<string, number> = {};
  monthExpenses.forEach(e => {
    expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + e.amount;
  });
  
  // Get currency symbol
  const getCurrencySymbol = () => {
    switch (settings.currency) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'SYP': return 'ل.س';
      case 'SAR': return 'ر.س';
      case 'AED': return 'د.إ';
      default: return '₺';
    }
  };
  
  const currency = getCurrencySymbol();
  const monthName = new Date(month + '-01').toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });
  
  // Get category label
  const getCategoryLabel = (id: string) => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat?.label || id;
  };
  
  // Generate expenses table rows
  const expenseRows = monthExpenses
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(e => `
      <tr>
        <td>${new Date(e.date).toLocaleDateString('ar-SA')}</td>
        <td>${e.title}</td>
        <td>${getCategoryLabel(e.category)}</td>
        <td class="amount negative">${currency} ${e.amount.toLocaleString('ar-SA')}</td>
      </tr>
    `).join('');
  
  // Generate income table rows
  const incomeRows = monthIncomes
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(i => `
      <tr>
        <td>${new Date(i.date).toLocaleDateString('ar-SA')}</td>
        <td>${i.title}</td>
        <td>دخل</td>
        <td class="amount positive">${currency} ${i.amount.toLocaleString('ar-SA')}</td>
      </tr>
    `).join('');
  
  // Generate category breakdown
  const categoryBreakdown = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amount]) => `
      <div class="category-item">
        <span class="category-name">${getCategoryLabel(cat)}</span>
        <span class="category-amount">${currency} ${amount.toLocaleString('ar-SA')}</span>
        <span class="category-percent">${Math.round((amount / totalExpenses) * 100)}%</span>
      </div>
    `).join('');
  
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>تقرير مالي - ${monthName}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: #f8fafc;
          color: #1e293b;
          padding: 20px;
          direction: rtl;
        }
        .header {
          text-align: center;
          padding: 30px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          border-radius: 16px;
          margin-bottom: 30px;
        }
        .header h1 {
          font-size: 28px;
          margin-bottom: 8px;
        }
        .header p {
          opacity: 0.9;
          font-size: 16px;
        }
        .summary {
          display: flex;
          gap: 20px;
          margin-bottom: 30px;
        }
        .summary-card {
          flex: 1;
          padding: 20px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          text-align: center;
        }
        .summary-card.income {
          border-top: 4px solid #10b981;
        }
        .summary-card.expense {
          border-top: 4px solid #ef4444;
        }
        .summary-card.balance {
          border-top: 4px solid #6366f1;
        }
        .summary-label {
          font-size: 14px;
          color: #64748b;
          margin-bottom: 8px;
        }
        .summary-value {
          font-size: 24px;
          font-weight: bold;
        }
        .summary-value.positive { color: #10b981; }
        .summary-value.negative { color: #ef4444; }
        .section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 16px;
          color: #1e293b;
          padding-bottom: 12px;
          border-bottom: 2px solid #f1f5f9;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          padding: 12px;
          text-align: right;
          border-bottom: 1px solid #f1f5f9;
        }
        th {
          background: #f8fafc;
          font-weight: 600;
          color: #64748b;
        }
        .amount {
          font-weight: 600;
        }
        .amount.positive { color: #10b981; }
        .amount.negative { color: #ef4444; }
        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #f1f5f9;
        }
        .category-item:last-child {
          border-bottom: none;
        }
        .category-name {
          font-weight: 500;
        }
        .category-amount {
          font-weight: 600;
          color: #ef4444;
        }
        .category-percent {
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 12px;
          color: #64748b;
        }
        .footer {
          text-align: center;
          padding: 20px;
          color: #94a3b8;
          font-size: 12px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 8px;
        }
        @media print {
          body { padding: 0; }
          .header { break-inside: avoid; }
          .section { break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>التقرير المالي الشهري</h1>
        <p>${monthName}</p>
      </div>
      
      <div class="summary">
        <div class="summary-card income">
          <div class="summary-label">إجمالي الدخل</div>
          <div class="summary-value positive">${currency} ${totalIncome.toLocaleString('ar-SA')}</div>
        </div>
        <div class="summary-card expense">
          <div class="summary-label">إجمالي المصاريف</div>
          <div class="summary-value negative">${currency} ${totalExpenses.toLocaleString('ar-SA')}</div>
        </div>
        <div class="summary-card balance">
          <div class="summary-label">الرصيد</div>
          <div class="summary-value ${balance >= 0 ? 'positive' : 'negative'}">${currency} ${Math.abs(balance).toLocaleString('ar-SA')}</div>
        </div>
      </div>
      
      ${Object.keys(expensesByCategory).length > 0 ? `
        <div class="section">
          <div class="section-title">توزيع المصاريف حسب الفئة</div>
          ${categoryBreakdown}
        </div>
      ` : ''}
      
      ${monthExpenses.length > 0 ? `
        <div class="section">
          <div class="section-title">تفاصيل المصاريف (${monthExpenses.length})</div>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>الفئة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${expenseRows}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      ${monthIncomes.length > 0 ? `
        <div class="section">
          <div class="section-title">تفاصيل الدخل (${monthIncomes.length})</div>
          <table>
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الوصف</th>
                <th>النوع</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              ${incomeRows}
            </tbody>
          </table>
        </div>
      ` : ''}
      
      <div class="footer">
        <div class="logo">مصروفي by Wethaq</div>
        <p>تم إنشاء هذا التقرير تلقائياً بواسطة تطبيق مصروفي</p>
        <p>${new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>
    </body>
    </html>
  `;
};

// Export PDF
export const exportPDF = async (month?: string): Promise<boolean> => {
  try {
    const targetMonth = month || new Date().toISOString().slice(0, 7);
    const html = await generatePDFHtml(targetMonth);
    
    const { uri } = await Print.printToFileAsync({
      html,
      base64: false,
    });
    
    // Share the PDF
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'تصدير التقرير المالي',
        UTI: 'com.adobe.pdf',
      });
      return true;
    } else {
      console.log('Sharing is not available');
      return false;
    }
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return false;
  }
};

// Get available months for export
export const getAvailableMonths = async (): Promise<string[]> => {
  const expenses = await expenseStorage.getAll();
  const incomes = await incomeStorage.getAll();
  
  const months = new Set<string>();
  
  expenses.forEach(e => months.add(e.date.slice(0, 7)));
  incomes.forEach(i => months.add(i.date.slice(0, 7)));
  
  return Array.from(months).sort().reverse();
};
