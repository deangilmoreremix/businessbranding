import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { BrandAnalysis } from './brand-analyzer';

export async function exportToExcel(data: BrandAnalysis | any) {
  try {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Overview sheet
    const overviewData = [
      { Metric: 'Health Score', Value: `${data.healthScore}%` },
      { Metric: 'Market Fit', Value: `${Math.round(data.marketFit * 100)}%` },
      { Metric: 'Uniqueness Score', Value: `${Math.round(data.uniquenessScore * 100)}%` },
      { Metric: 'Generated On', Value: new Date().toLocaleDateString() }
    ];
    const overviewWs = XLSX.utils.json_to_sheet(overviewData);
    XLSX.utils.book_append_sheet(wb, overviewWs, 'Overview');

    // Brand Factors sheet
    if (data.brandFactors) {
      const brandFactorsData = data.brandFactors.map((factor: any) => ({
        'Brand Pillar': factor.name,
        'Score': `${Math.round(factor.score * 100)}%`,
        'Priority': factor.priority || 'medium',
        'Trend': factor.trend || 'stable',
        'Insights': factor.insights ? factor.insights.join('; ') : ''
      }));
      const brandFactorsWs = XLSX.utils.json_to_sheet(brandFactorsData);
      XLSX.utils.book_append_sheet(wb, brandFactorsWs, 'Brand Factors');
    }

    // Competitors sheet
    if (data.competitors) {
      const competitorsData = data.competitors.map((competitor: any) => ({
        'Name': competitor.name,
        'Market Share': `${competitor.marketShare}%`,
        'Strengths': competitor.strengths ? competitor.strengths.join('; ') : '',
        'Weaknesses': competitor.weaknesses ? competitor.weaknesses.join('; ') : ''
      }));
      const competitorsWs = XLSX.utils.json_to_sheet(competitorsData);
      XLSX.utils.book_append_sheet(wb, competitorsWs, 'Competitors');
    }

    // Recommendations sheet
    if (data.recommendations) {
      const recommendationsData = data.recommendations.map((rec: string, index: number) => ({
        'Priority': index + 1,
        'Recommendation': rec
      }));
      const recommendationsWs = XLSX.utils.json_to_sheet(recommendationsData);
      XLSX.utils.book_append_sheet(wb, recommendationsWs, 'Recommendations');
    }

    // Performance Metrics sheet
    if (data.performanceMetrics) {
      const performanceData = [
        { Metric: 'Engagement Rate', Value: `${Math.round(data.performanceMetrics.engagement?.rate * 100) || 0}%`, Trend: data.performanceMetrics.engagement?.trend || 'stable' },
        { Metric: 'Conversion Rate', Value: `${Math.round(data.performanceMetrics.conversion?.rate * 100) || 0}%`, Trend: data.performanceMetrics.conversion?.trend || 'stable' },
        { Metric: 'ROI Score', Value: `${Math.round(data.performanceMetrics.roi?.score * 100) || 0}%`, Trend: data.performanceMetrics.roi?.trend || 'stable' },
        { Metric: 'Customer Satisfaction', Value: `${Math.round(data.performanceMetrics.customerSatisfaction?.score * 100) || 0}%`, Trend: data.performanceMetrics.customerSatisfaction?.trend || 'stable' },
        { Metric: 'Brand Loyalty', Value: `${Math.round(data.performanceMetrics.brandLoyalty?.score * 100) || 0}%`, Trend: data.performanceMetrics.brandLoyalty?.trend || 'stable' }
      ];
      const performanceWs = XLSX.utils.json_to_sheet(performanceData);
      XLSX.utils.book_append_sheet(wb, performanceWs, 'Performance');
    }

    // Market Analysis sheet
    if (data.marketAnalysis) {
      const marketData = [
        { Category: 'Market Size', Value: `$${data.marketAnalysis.marketDynamics?.totalMarketSize?.toLocaleString() || 'N/A'}` },
        { Category: 'Growth Rate', Value: `${Math.round((data.marketAnalysis.marketDynamics?.growthRate || 0) * 100)}%` },
        { Category: 'Competition Level', Value: data.marketAnalysis.marketDynamics?.competitionLevel || 'N/A' },
        { Category: 'Entry Barriers', Value: data.marketAnalysis.marketDynamics?.entryBarriers || 'N/A' }
      ];
      const marketWs = XLSX.utils.json_to_sheet(marketData);
      XLSX.utils.book_append_sheet(wb, marketWs, 'Market Analysis');
    }

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

    // Save file
    saveAs(blob, 'brand-analysis-report.xlsx');
  } catch (error) {
    console.error('Failed to export to Excel:', error);
    throw error;
  }
}