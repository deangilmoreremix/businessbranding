'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Database, PlayCircle, RefreshCw, ArrowUpRight } from 'lucide-react';
import { checkRequiredTables } from '@/lib/supabase';

export function SupabaseSetup() {
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [tablesExist, setTablesExist] = useState<boolean | null>(null);

  // Check database status on mount
  useEffect(() => {
    checkDatabase();
  }, []);

  const checkDatabase = async () => {
    try {
      setIsChecking(true);
      setError(null);
      
      // First try with the client-side function
      const tableStatus = await checkRequiredTables();
      
      if (tableStatus.exists) {
        setTablesExist(true);
        setResult({ status: 'exists', message: 'Database tables already exist' });
        setIsChecking(false);
        return;
      }
      
      // If client check fails, try API endpoint
      try {
        const response = await fetch('/api/supabase/setup', {
          method: 'GET',
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (!response.ok) {
          throw new Error(`API endpoint failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'exists') {
          setTablesExist(true);
        } else if (data.status === 'success') {
          setTablesExist(true);
        } else {
          setTablesExist(false);
        }
        
        setResult(data);
      } catch (endpointError) {
        console.warn('API endpoint check failed:', endpointError);
        setTablesExist(false);
        setResult({ 
          status: 'failed', 
          message: 'Tables don\'t exist or failed to verify' 
        });
      }
    } catch (err) {
      console.error('Error checking database:', err);
      setError('Failed to check database status');
      setTablesExist(false);
    } finally {
      setIsChecking(false);
    }
  };

  const setupDatabase = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/supabase/setup', {
        method: 'POST', // Changed to POST to force creation
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error(`API endpoint failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setResult(data);
      
      if (data.status === 'success' || data.status === 'exists') {
        setTablesExist(true);
      } else {
        setTablesExist(false);
        setError('Failed to set up database: ' + (data.error || 'Unknown error'));
      }
      
      // Verify by checking again
      await checkDatabase();
    } catch (err) {
      console.error('Error setting up database:', err);
      setError('Failed to set up database: ' + (err instanceof Error ? err.message : String(err)));
      setTablesExist(false);
    } finally {
      setIsLoading(false);
    }
  };

  const openSupabaseDashboard = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.co', '.co/project/default');
    if (url) {
      window.open(url, '_blank');
    } else {
      window.open('https://app.supabase.com', '_blank');
    }
  };

  // Don't show if tables exist and verification is complete
  if (!isChecking && tablesExist === true) {
    return null;
  }

  return (
    <Card className="p-6 mb-4 border border-amber-500/30 bg-amber-500/10">
      <div className="flex items-start gap-3">
        {isChecking ? (
          <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mt-0.5 flex-shrink-0" />
        ) : tablesExist ? (
          <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
        )}
        
        <div className="flex-1">
          <h3 className="font-medium text-amber-400 mb-1">Database Setup Required</h3>
          
          {isChecking ? (
            <p className="text-sm text-muted-foreground">Checking database tables...</p>
          ) : tablesExist ? (
            <p className="text-sm text-green-500">Database tables are set up correctly.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                The required database tables don't exist in your Supabase database.
                You need to set them up to enable content storage functionality.
              </p>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  onClick={setupDatabase}
                  disabled={isLoading}
                  className="bg-amber-500 hover:bg-amber-600"
                >
                  {isLoading ? (
                    <>
                      <Database className="w-4 h-4 mr-2 animate-pulse" />
                      Setting up database...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Set Up Database Tables
                    </>
                  )}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={openSupabaseDashboard}
                >
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Supabase Dashboard
                </Button>
              </div>
              
              {isLoading && (
                <Progress value={50} className="mt-4" />
              )}
              
              {error && (
                <p className="text-sm text-red-500 mt-4">{error}</p>
              )}
              
              {result && !tablesExist && (
                <div className="mt-4 text-xs text-muted-foreground">
                  <p>Setup result: {result.message || 'Unknown'}</p>
                  {result.results?.map((r: any, i: number) => (
                    <div key={i} className="mt-1">
                      {r.name}: {r.success ? 'Success' : 'Failed'}
                      {r.error && <p className="text-red-400">{r.error}</p>}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}