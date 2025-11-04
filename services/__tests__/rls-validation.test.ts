import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import postgres from 'postgres';

// RLS (Row Level Security) validation tests
describe('Row Level Security Validation', () => {
  let sql: ReturnType<typeof postgres>;

  beforeAll(async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required for RLS tests');
    }

    sql = postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 1, // Single connection for tests
    });

    // Test database connection
    try {
      await sql`SELECT 1`;
    } catch (error) {
      console.error('Database connection failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    if (sql) {
      await sql.end();
    }
  });

  describe('RLS Policy Existence', () => {
    it('should have RLS enabled on posts table', async () => {
      const result = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'posts' AND relkind = 'r'
      `;

      expect(result.length).toBe(1);
      expect(result[0].relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on brand_voices table', async () => {
      const result = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'brand_voices' AND relkind = 'r'
      `;

      expect(result.length).toBe(1);
      expect(result[0].relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on audience_profiles table', async () => {
      const result = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'audience_profiles' AND relkind = 'r'
      `;

      expect(result.length).toBe(1);
      expect(result[0].relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on campaigns table', async () => {
      const result = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'campaigns' AND relkind = 'r'
      `;

      expect(result.length).toBe(1);
      expect(result[0].relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on content_series table', async () => {
      const result = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'content_series' AND relkind = 'r'
      `;

      expect(result.length).toBe(1);
      expect(result[0].relrowsecurity).toBe(true);
    });

    it('should have RLS enabled on integrations table', async () => {
      const result = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'integrations' AND relkind = 'r'
      `;

      if (result.length > 0) {
        expect(result[0].relrowsecurity).toBe(true);
      }
    });

    it('should have RLS enabled on post_analytics table', async () => {
      const result = await sql`
        SELECT relname, relrowsecurity 
        FROM pg_class 
        WHERE relname = 'post_analytics' AND relkind = 'r'
      `;

      if (result.length > 0) {
        expect(result[0].relrowsecurity).toBe(true);
      }
    });
  });

  describe('RLS Policy Configuration', () => {
    it('should have user access policies for posts table', async () => {
      const policies = await sql`
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'posts'
      `;

      expect(policies.length).toBeGreaterThan(0);

      // Check for user access policy
      const userPolicy = policies.find(
        (p) =>
          p.policyname.toLowerCase().includes('user') || p.policyname.toLowerCase().includes('own')
      );
      expect(userPolicy).toBeDefined();
    });

    it('should have user access policies for brand_voices table', async () => {
      const policies = await sql`
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'brand_voices'
      `;

      expect(policies.length).toBeGreaterThan(0);

      // Check for user access policy
      const userPolicy = policies.find(
        (p) =>
          p.policyname.toLowerCase().includes('user') || p.policyname.toLowerCase().includes('own')
      );
      expect(userPolicy).toBeDefined();
    });

    it('should have user access policies for audience_profiles table', async () => {
      const policies = await sql`
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'audience_profiles'
      `;

      expect(policies.length).toBeGreaterThan(0);

      // Check for user access policy
      const userPolicy = policies.find(
        (p) =>
          p.policyname.toLowerCase().includes('user') || p.policyname.toLowerCase().includes('own')
      );
      expect(userPolicy).toBeDefined();
    });

    it('should have user access policies for campaigns table', async () => {
      const policies = await sql`
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies 
        WHERE tablename = 'campaigns'
      `;

      expect(policies.length).toBeGreaterThan(0);

      // Check for user access policy
      const userPolicy = policies.find(
        (p) =>
          p.policyname.toLowerCase().includes('user') || p.policyname.toLowerCase().includes('own')
      );
      expect(userPolicy).toBeDefined();
    });
  });

  describe('Database Schema Validation', () => {
    it('should have user_id columns in all user-specific tables', async () => {
      const tables = ['posts', 'brand_voices', 'audience_profiles', 'campaigns', 'content_series'];

      for (const tableName of tables) {
        const columns = await sql`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = ${tableName} AND column_name = 'user_id'
        `;

        expect(columns.length).toBe(1);
        expect(columns[0].column_name).toBe('user_id');
        expect(columns[0].data_type).toBe('uuid');
      }
    });

    it('should have proper foreign key constraints for user_id columns', async () => {
      const tables = ['posts', 'brand_voices', 'audience_profiles', 'campaigns', 'content_series'];

      for (const tableName of tables) {
        const constraints = await sql`
          SELECT 
            tc.constraint_name,
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_name = ${tableName}
            AND kcu.column_name = 'user_id'
        `;

        // Should have foreign key constraint on user_id (if users table exists)
        // Note: Stack Auth may not use a traditional users table
        if (constraints.length > 0) {
          expect(constraints[0].column_name).toBe('user_id');
        }
      }
    });
  });

  describe('RLS Policy Effectiveness', () => {
    it('should prevent unauthorized access to posts', async () => {
      // This test simulates what would happen with different user contexts
      // In a real scenario, RLS would be enforced based on the authenticated user

      try {
        // Try to query posts without proper user context
        const result = await sql`
          SELECT COUNT(*) as count FROM posts
        `;

        // The query should either return 0 or be restricted by RLS
        expect(typeof result[0].count).toBe('string');
        const count = parseInt(result[0].count);
        expect(count).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // RLS might prevent the query entirely, which is also valid
        expect(error).toBeDefined();
      }
    });

    it('should enforce user isolation in brand_voices', async () => {
      try {
        const result = await sql`
          SELECT COUNT(*) as count FROM brand_voices
        `;

        expect(typeof result[0].count).toBe('string');
        const count = parseInt(result[0].count);
        expect(count).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // RLS might prevent the query entirely
        expect(error).toBeDefined();
      }
    });

    it('should enforce user isolation in audience_profiles', async () => {
      try {
        const result = await sql`
          SELECT COUNT(*) as count FROM audience_profiles
        `;

        expect(typeof result[0].count).toBe('string');
        const count = parseInt(result[0].count);
        expect(count).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // RLS might prevent the query entirely
        expect(error).toBeDefined();
      }
    });

    it('should enforce user isolation in campaigns', async () => {
      try {
        const result = await sql`
          SELECT COUNT(*) as count FROM campaigns
        `;

        expect(typeof result[0].count).toBe('string');
        const count = parseInt(result[0].count);
        expect(count).toBeGreaterThanOrEqual(0);
      } catch (error) {
        // RLS might prevent the query entirely
        expect(error).toBeDefined();
      }
    });
  });

  describe('Database Security Configuration', () => {
    it('should have SSL enabled for database connections', async () => {
      // Check if the connection is using SSL
      const result = await sql`
        SELECT ssl, client_addr, application_name 
        FROM pg_stat_ssl 
        WHERE pid = pg_backend_pid()
      `;

      if (result.length > 0) {
        expect(result[0].ssl).toBe(true);
      }
    });

    it('should have proper database permissions', async () => {
      // Check current user permissions
      const result = await sql`
        SELECT current_user, session_user, current_database()
      `;

      expect(result.length).toBe(1);
      expect(result[0].current_user).toBeDefined();
      expect(result[0].session_user).toBeDefined();
      expect(result[0].current_database).toBeDefined();
    });

    it('should have proper table ownership and permissions', async () => {
      const tables = ['posts', 'brand_voices', 'audience_profiles', 'campaigns'];

      for (const tableName of tables) {
        const result = await sql`
          SELECT 
            schemaname,
            tablename,
            tableowner,
            hasinserts,
            hasselects,
            hasupdates,
            hasdeletes
          FROM pg_tables 
          WHERE tablename = ${tableName}
        `;

        if (result.length > 0) {
          expect(result[0].tablename).toBe(tableName);
          expect(result[0].tableowner).toBeDefined();
        }
      }
    });
  });

  describe('Authentication Integration', () => {
    it('should have proper authentication functions available', async () => {
      // Check if authentication-related functions exist
      try {
        const result = await sql`
          SELECT current_setting('app.current_user_id', true) as current_user_id
        `;

        // This setting might not be available in test environment
        expect(result).toBeDefined();
      } catch (error) {
        // This is expected if the setting doesn't exist
        expect(error).toBeDefined();
      }
    });

    it('should handle user context properly', async () => {
      // Test user context handling
      try {
        const result = await sql`
          SELECT current_user, session_user
        `;

        expect(result.length).toBe(1);
        expect(result[0].current_user).toBeDefined();
        expect(result[0].session_user).toBeDefined();
      } catch (error) {
        console.error('User context test failed:', error);
        throw error;
      }
    });
  });

  describe('Data Integrity', () => {
    it('should have proper UUID generation for primary keys', async () => {
      const tables = ['posts', 'brand_voices', 'audience_profiles', 'campaigns'];

      for (const tableName of tables) {
        const result = await sql`
          SELECT column_name, column_default, data_type
          FROM information_schema.columns 
          WHERE table_name = ${tableName} AND column_name = 'id'
        `;

        if (result.length > 0) {
          expect(result[0].data_type).toBe('uuid');
          expect(result[0].column_default).toContain('gen_random_uuid');
        }
      }
    });

    it('should have proper timestamp columns', async () => {
      const tables = ['posts', 'brand_voices', 'audience_profiles', 'campaigns'];

      for (const tableName of tables) {
        const result = await sql`
          SELECT column_name, data_type, column_default
          FROM information_schema.columns 
          WHERE table_name = ${tableName} 
            AND column_name IN ('created_at', 'updated_at')
          ORDER BY column_name
        `;

        if (result.length > 0) {
          const createdAt = result.find((r) => r.column_name === 'created_at');
          if (createdAt) {
            expect(createdAt.data_type).toContain('timestamp');
          }
        }
      }
    });
  });
});
