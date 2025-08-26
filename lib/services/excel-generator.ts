import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export async function exportToExcel(data: any) {
  try {
    // Convert data to worksheet format
    const ws = XLSX.utils.json_to_sheet(
      Array.isArray(data) ? data : [data]
    );

    // Create workbook and add worksheet
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Generate Excel file
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    
    // Save file
    saveAs(blob, 'export.xlsx');
  } catch (error) {
    console.error('Failed to export to Excel:', error);
    throw error;
  }
}