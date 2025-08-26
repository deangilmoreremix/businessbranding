import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { BrandAnalysis } from './brand-analyzer';

export async function generatePDF(analysis: BrandAnalysis, elementId: string) {
  try {
    // Capture the analysis component as an image
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Analysis element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: 'a4'
    });

    // Add title
    pdf.setFontSize(24);
    pdf.text('Brand Analysis Report', 40, 40);

    // Add timestamp
    pdf.setFontSize(12);
    pdf.text(`Generated on ${new Date().toLocaleDateString()}`, 40, 60);

    // Add overview section
    pdf.setFontSize(16);
    pdf.text('Brand Health Overview', 40, 90);
    
    pdf.setFontSize(12);
    pdf.text(`Health Score: ${analysis.healthScore}%`, 40, 110);
    pdf.text(`Market Fit: ${Math.round(analysis.marketFit * 100)}%`, 40, 130);
    pdf.text(`Uniqueness Score: ${Math.round(analysis.uniquenessScore * 100)}%`, 40, 150);

    // Add competitor analysis
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Competitive Analysis', 40, 40);

    let yPos = 70;
    analysis.competitors.forEach((competitor, index) => {
      if (yPos > 750) {
        pdf.addPage();
        yPos = 40;
      }

      pdf.setFontSize(14);
      pdf.text(competitor.name, 40, yPos);
      
      pdf.setFontSize(12);
      pdf.text(`Market Share: ${competitor.marketShare}%`, 40, yPos + 20);
      pdf.text(`Strengths: ${competitor.strengths.join(', ')}`, 40, yPos + 40);
      pdf.text(`Weaknesses: ${competitor.weaknesses.join(', ')}`, 40, yPos + 60);
      
      yPos += 90;
    });

    // Add brand pillars analysis
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Brand Pillars Analysis', 40, 40);

    yPos = 70;
    analysis.brandFactors.forEach((factor, index) => {
      if (yPos > 750) {
        pdf.addPage();
        yPos = 40;
      }

      pdf.setFontSize(14);
      pdf.text(`${factor.name} (${Math.round(factor.score * 100)}%)`, 40, yPos);
      
      pdf.setFontSize(12);
      pdf.text(`Strengths: ${factor.insights[0]}`, 40, yPos + 20);
      if (factor.insights[1]) {
        pdf.text(`Areas for Improvement: ${factor.insights[1]}`, 40, yPos + 40);
      }
      
      yPos += 70;
    });

    // Add recommendations
    pdf.addPage();
    pdf.setFontSize(16);
    pdf.text('Strategic Recommendations', 40, 40);

    yPos = 70;
    analysis.recommendations.forEach((recommendation, index) => {
      if (yPos > 750) {
        pdf.addPage();
        yPos = 40;
      }

      pdf.setFontSize(12);
      pdf.text(`${index + 1}. ${recommendation}`, 40, yPos);
      yPos += 30;
    });

    // Add the analysis visualization
    pdf.addPage();
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pdf.internal.pageSize.getWidth() - 80;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 40, 40, imgWidth, imgHeight);

    // Save the PDF
    pdf.save('brand-analysis-report.pdf');
    
    return true;
  } catch (error) {
    console.error('Failed to generate PDF:', error);
    throw error;
  }
}

export async function exportChartAsPNG(chartId: string, fileName: string) {
  try {
    const element = document.getElementById(chartId);
    if (!element) {
      throw new Error('Chart element not found');
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    });

    // Create download link
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    return true;
  } catch (error) {
    console.error('Failed to export chart:', error);
    throw error;
  }
}