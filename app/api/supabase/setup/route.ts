import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const migrations = [
  {
    name: 'Create content tables',
    sql: `
    -- Create content_items table
    CREATE TABLE IF NOT EXISTS content_items (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      type text NOT NULL CHECK (type IN ('podcast', 'audiobook', 'video', 'voice_over')),
      url text NOT NULL,
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      user_id uuid
    );
    
    -- Create voice_profiles table
    CREATE TABLE IF NOT EXISTS voice_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      voice_id text NOT NULL,
      settings jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      user_id uuid
    );
    
    -- Create image_assets table
    CREATE TABLE IF NOT EXISTS image_assets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      title text NOT NULL,
      url text NOT NULL,
      prompt text,
      style text,
      source text,
      tags text[],
      metadata jsonb DEFAULT '{}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now(),
      user_id uuid
    );
    
    -- Enable RLS
    ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
    ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE image_assets ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "Allow full access to content_items"
      ON content_items
      FOR ALL
      USING (true)
      WITH CHECK (true);
    
    CREATE POLICY "Allow full access to voice_profiles"
      ON voice_profiles
      FOR ALL
      USING (true)
      WITH CHECK (true);
    
    CREATE POLICY "Allow full access to image_assets"
      ON image_assets
      FOR ALL
      USING (true)
      WITH CHECK (true);
    
    -- Create updated_at trigger function
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
    
    -- Create triggers for updated_at
    DROP TRIGGER IF EXISTS update_content_items_updated_at ON content_items;
    CREATE TRIGGER update_content_items_updated_at
      BEFORE UPDATE ON content_items
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    
    DROP TRIGGER IF EXISTS update_image_assets_updated_at ON image_assets;
    CREATE TRIGGER update_image_assets_updated_at
      BEFORE UPDATE ON image_assets
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `
  }
];

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Supabase credentials not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Checking database setup with credentials:", { 
      url: supabaseUrl.substring(0, 10) + '...',  // Only log partial URL for security
      keyPresent: !!supabaseServiceKey
    });

    try {
      const { data: contentItems, error: contentError } = await supabase
        .from('content_items')
        .select('id')
        .limit(1);
      
      if (!contentError) {
        console.log("Database tables already exist - content_items check passed");
        return NextResponse.json({ 
          message: 'Database tables already exist',
          status: 'exists'
        });
      } else {
        console.log("Content items table doesn't exist:", contentError.message);
      }
    } catch (error) {
      console.log('Tables check failed, proceeding with setup check:', error);
    }

    return NextResponse.json({
      message: 'Database setup needed',
      status: 'setup_needed'
    });
  } catch (error) {
    console.error('Error checking database setup:', error);
    return NextResponse.json({ 
      error: 'Database setup check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ 
        error: 'Supabase credentials not configured' 
      }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log("Starting database setup with credentials:", { 
      url: supabaseUrl.substring(0, 10) + '...',  // Only log partial URL for security
      keyPresent: !!supabaseServiceKey
    });

    try {
      const { data: contentItems, error: contentError } = await supabase
        .from('content_items')
        .select('id')
        .limit(1);
      
      if (!contentError) {
        console.log("Database tables already exist - skipping setup");
        return NextResponse.json({ 
          message: 'Database tables already exist',
          status: 'exists'
        });
      } else {
        console.log("Content items table doesn't exist, will create tables:", contentError.message);
      }
    } catch (error) {
      console.log('Tables check failed, proceeding with creation:', error);
    }

    const results = [];
    
    for (const migration of migrations) {
      try {
        console.log(`Executing migration: ${migration.name}`);
        const statements = migration.sql
          .split(';')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt.length > 0);
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        for (const statement of statements) {
          try {
            console.log(`Executing statement: ${statement.substring(0, 50)}...`);
            const { data, error } = await supabase.rpc('exec', {
              query: statement
            });
            
            if (error) {
              console.warn(`SQL statement failed: ${error.message}`);
            } else {
              console.log("Statement executed successfully");
            }
          } catch (stmtError) {
            console.warn(`Error executing statement: ${statement.substring(0, 50)}...`, stmtError);
          }
        }
        
        results.push({
          name: migration.name,
          success: true
        });
        console.log(`Migration completed: ${migration.name}`);
      } catch (migrationError) {
        console.error(`Error in migration ${migration.name}:`, migrationError);
        results.push({
          name: migration.name,
          success: false,
          error: migrationError instanceof Error ? migrationError.message : String(migrationError)
        });
      }
    }

    let contentTableExists = false;
    let voiceTableExists = false;
    let imageTableExists = false;
    
    try {
      console.log("Verifying content_items table creation");
      const { data: contentCheck, error: contentError } = await supabase
        .from('content_items')
        .select('id')
        .limit(1);
      contentTableExists = !contentError;
      console.log("content_items table exists:", contentTableExists);
    } catch (e) {
      console.error('Content items check failed:', e);
    }
    
    try {
      console.log("Verifying voice_profiles table creation");
      const { data: voiceCheck, error: voiceError } = await supabase
        .from('voice_profiles')
        .select('id')
        .limit(1);
      voiceTableExists = !voiceError;
      console.log("voice_profiles table exists:", voiceTableExists);
    } catch (e) {
      console.error('Voice profiles check failed:', e);
    }
    
    try {
      console.log("Verifying image_assets table creation");
      const { data: imageCheck, error: imageError } = await supabase
        .from('image_assets')
        .select('id')
        .limit(1);
      imageTableExists = !imageError;
      console.log("image_assets table exists:", imageTableExists);
    } catch (e) {
      console.error('Image assets check failed:', e);
    }

    const allTablesExist = contentTableExists && voiceTableExists && imageTableExists;
    console.log("Database setup complete. All tables exist:", allTablesExist);

    return NextResponse.json({
      message: allTablesExist ? 'Database setup complete' : 'Database setup failed',
      status: allTablesExist ? 'success' : 'failed',
      results,
      tablesExist: allTablesExist,
      tables: {
        content_items: contentTableExists,
        voice_profiles: voiceTableExists,
        image_assets: imageTableExists
      }
    });
  } catch (error) {
    console.error('Error setting up database:', error);
    return NextResponse.json({ 
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}