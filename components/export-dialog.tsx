import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download,
  FileText,
  Image as ImageIcon,
  Calendar,
  Table,
  FileSpreadsheet,
  Check,
  Loader2
} from 'lucide-react';
import { generatePDF } from '@/lib/services/pdf-generator';
import { exportToExcel } from '@/lib/services/excel-generator';
import { downloadICalendar } from '@/lib/services/calendar-service';
import { exportChartAsPNG } from '@/lib/services/image-service';

interface ExportDialogProps {
  data: any;
  charts?: Array<{
    id: string;
    name: string;
    type: 'line' | 'bar' | 'pie' | 'radar';
  }>;
  reportId?: string;
}

export function ExportDialog({ data, charts, reportId }: ExportDialogProps) {
  const [exporting, setExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const handleExport = async (format: string) => {
    setExporting(true);
    setExportSuccess(null);

    try {
      switch (format) {
        case 'pdf':
          if (reportId) {
            await generatePDF(data, reportId);
          }
          break;
        case 'excel':
          await exportToExcel(data);
          break;
        case 'calendar':
          downloadICalendar(data.events || []);
          break;
        case 'png':
          if (charts) {
            await Promise.all(
              charts.map(chart => 
                exportChartAsPNG(chart.id, `${chart.name.toLowerCase().replace(/\s+/g, '-')}`)
              )
            );
          }
          break;
      }
      setExportSuccess(format);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExporting(false);
      setTimeout(() => setExportSuccess(null), 3000);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Options</DialogTitle>
          <DialogDescription>
            Choose your preferred export format
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="document">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="document">Documents</TabsTrigger>
            <TabsTrigger value="visuals">Visuals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="document" className="space-y-4 mt-4">
            <Button 
              className="w-full justify-start" 
              onClick={() => handleExport('pdf')}
              disabled={exporting}
            >
              {exporting && exportSuccess === 'pdf' ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-2 h-4 w-4" />
              )}
              Export as PDF
            </Button>
            
            <Button 
              className="w-full justify-start" 
              onClick={() => handleExport('excel')}
              disabled={exporting}
            >
              {exporting && exportSuccess === 'excel' ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="mr-2 h-4 w-4" />
              )}
              Export to Excel
            </Button>
            
            <Button 
              className="w-full justify-start"
              onClick={() => handleExport('calendar')}
              disabled={exporting}
            >
              {exporting && exportSuccess === 'calendar' ? (
                <Check className="mr-2 h-4 w-4 text-green-500" />
              ) : exporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Calendar className="mr-2 h-4 w-4" />
              )}
              Export to Calendar
            </Button>
          </TabsContent>
          
          <TabsContent value="visuals" className="space-y-4 mt-4">
            {charts && charts.length > 0 ? (
              <>
                <Button 
                  className="w-full justify-start"
                  onClick={() => handleExport('png')}
                  disabled={exporting}
                >
                  {exporting && exportSuccess === 'png' ? (
                    <Check className="mr-2 h-4 w-4 text-green-500" />
                  ) : exporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ImageIcon className="mr-2 h-4 w-4" />
                  )}
                  Export Charts as PNG
                </Button>
                
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {charts.map(chart => (
                      <div key={chart.id} className="flex items-center gap-2 text-sm">
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                        {chart.name}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No charts available for export
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}