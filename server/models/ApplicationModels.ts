import sql from 'mssql';
import { getAppStoreDb } from '../config/database';

export interface Application {
  id: number;
  name: string;
  url: string;
  status: string;
  view_count: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  category_id: number | null;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
  // Admin-specific fields
  category_name?: string | null;
  category_icon?: string | null;
}

export interface Banner {
  id: number;
  title: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
}

export interface Trip {
  id: number;
  title: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  // New optimized image fields
  image_thumbnail: string | null;
  image_small: string | null;
  image_path: string | null;
  image_metadata: string | null;
}

export class ApplicationModel {
  // Get all applications with optional filtering
  static async getAll(
    db: sql.ConnectionPool,
    filters: {
      search?: string;
      status?: string;
      category_id?: number;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
      offset?: number;
    } = {}
  ) {
    let query = `
      SELECT 
        a.id,
        a.name,
        a.url,
        a.status,
        a.view_count,
        a.created_at,
        a.updated_at,
        a.is_active,
        a.category_id,
        a.image_thumbnail,
        a.image_small,
        a.image_path,
        a.image_metadata,
        c.name as category_name,
        c.icon as category_icon
      FROM applications a
      LEFT JOIN categories c ON a.category_id = c.id
    `;

    const conditions: string[] = [];
    const request = db.request();

    if (filters.search) {
      conditions.push('(a.name LIKE @search OR a.url LIKE @search)');
      request.input('search', `%${filters.search}%`);
    }

    if (filters.category_id) {
      conditions.push('a.category_id = @category_id');
      request.input('category_id', sql.Int, filters.category_id);
    }

    if (filters.status) {
      conditions.push('a.status = @status');
      request.input('status', filters.status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    // Sorting
    const allowedSortBy = ['created_at', 'name', 'view_count'];
    const sortBy =
      filters.sortBy && allowedSortBy.includes(filters.sortBy) ? filters.sortBy : 'created_at';
    const sortOrder = filters.sortOrder === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Pagination
    if (filters.limit) {
      const offset =
        filters.offset !== undefined
          ? filters.offset
          : ((filters.page! || 1) - 1) * (filters.limit! || 10);
      request.input('offset', sql.Int, offset);
      request.input('limit', sql.Int, filters.limit);
      query += ' OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY';
    }

    const result = await request.query(query);
    return result.recordset;
  }

  // Get application by ID
  static async getById(db: sql.ConnectionPool, id: number) {
    const result = await db.request().input('id', sql.Int, id).query(`
        SELECT 
          a.id,
          a.name,
          a.url,
          a.status,
          a.view_count,
          a.created_at,
          a.updated_at,
          a.is_active,
          a.category_id,
          a.image_thumbnail,
          a.image_small,
          a.image_path,
          a.image_metadata,
          c.name as category_name,
          c.icon as category_icon
        FROM applications a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.id = @id
      `);

    return result.recordset[0];
  }

  // Create new application
  static async create(
    db: sql.ConnectionPool,
    data: {
      name: string;
      url: string;
      status?: string;
      is_active?: boolean;
      category_id?: number;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
    }
  ): Promise<Application> {
    const result = await db
      .request()
      .input('name', sql.NVarChar(255), data.name)
      .input('url', sql.NVarChar(1000), data.url)
      .input('status', sql.NVarChar(50), data.status || 'pending')
      .input('is_active', sql.Bit, data.is_active !== false)
      .input('category_id', sql.Int, data.category_id || null)
      .input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail || null)
      .input('image_small', sql.NVarChar(sql.MAX), data.image_small || null)
      .input('image_path', sql.NVarChar(500), data.image_path || null)
      .input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata || null).query(`
        INSERT INTO applications (name, url, status, view_count, created_at, updated_at, is_active, category_id, 
                                  image_thumbnail, image_small, image_path, image_metadata)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.url, INSERTED.status, INSERTED.view_count, 
               INSERTED.created_at, INSERTED.updated_at, INSERTED.is_active, INSERTED.category_id,
               INSERTED.image_thumbnail, INSERTED.image_small, INSERTED.image_path, INSERTED.image_metadata
        VALUES (@name, @url, @status, 0, GETDATE(), GETDATE(), @is_active, @category_id, 
                @image_thumbnail, @image_small, @image_path, @image_metadata)
      `);

    return result.recordset[0];
  }

  // Update application
  static async update(
    db: sql.ConnectionPool,
    id: number,
    data: {
      name?: string;
      url?: string;
      status?: string;
      is_active?: boolean;
      category_id?: number;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
    }
  ): Promise<Application | undefined> {
    const setClauses: string[] = [];
    const request = db.request().input('id', sql.Int, id);

    if (data.name !== undefined) {
      setClauses.push('name = @name');
      request.input('name', sql.NVarChar(255), data.name);
    }

    if (data.url !== undefined) {
      setClauses.push('url = @url');
      request.input('url', sql.NVarChar(1000), data.url);
    }

    if (data.category_id !== undefined) {
      setClauses.push('category_id = @category_id');
      request.input('category_id', sql.Int, data.category_id);
    }

    if (data.image_thumbnail !== undefined) {
      setClauses.push('image_thumbnail = @image_thumbnail');
      request.input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail);
    }

    if (data.image_small !== undefined) {
      setClauses.push('image_small = @image_small');
      request.input('image_small', sql.NVarChar(sql.MAX), data.image_small);
    }

    if (data.image_path !== undefined) {
      setClauses.push('image_path = @image_path');
      request.input('image_path', sql.NVarChar(500), data.image_path);
    }

    if (data.image_metadata !== undefined) {
      setClauses.push('image_metadata = @image_metadata');
      request.input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata);
    }

    if (data.status !== undefined) {
      setClauses.push('status = @status');
      request.input('status', sql.NVarChar(50), data.status);
    }

    if (data.is_active !== undefined) {
      setClauses.push('is_active = @is_active');
      request.input('is_active', sql.Bit, data.is_active);
    }

    setClauses.push('updated_at = GETDATE()');

    await request.query(`
      UPDATE applications 
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);

    return this.getById(db, id);
  }

  // Delete application
  static async delete(db: sql.ConnectionPool, id: number): Promise<boolean> {
    const result = await db
      .request()
      .input('id', sql.Int, id)
      .query('DELETE FROM applications WHERE id = @id');

    return result.rowsAffected[0] > 0;
  }

  // Increment view count
  static async incrementViewCount(db: sql.ConnectionPool, id: number) {
    await db
      .request()
      .input('id', sql.Int, id)
      .query('UPDATE applications SET view_count = view_count + 1 WHERE id = @id');
  }

  // Backwards-compatible alias used by routes
  static async updateViewCount(db: sql.ConnectionPool, id: number) {
    return this.incrementViewCount(db, id);
  }

  // Get applications by category
  static async getByCategory(categoryId: number) {
    const db = await getAppStoreDb();
    const result = await db.request().input('category_id', sql.Int, categoryId).query(`
        SELECT 
          a.id,
          a.name,
          a.url,
          a.status,
          a.icon_url,
          a.view_count,
          a.created_at,
          a.updated_at,
          a.is_active,
          a.category_id,
          a.icon_thumbnail,
          a.icon_thumbnail_size,
          c.name as category_name,
          c.icon as category_icon
        FROM applications a
        LEFT JOIN categories c ON a.category_id = c.id
        WHERE a.category_id = @category_id AND a.is_active = 1
        ORDER BY a.name
      `);

    return result.recordset;
  }

  // Get application statistics
  static async getStats() {
    const db = await getAppStoreDb();
    const result = await db.request().query(`
      SELECT 
        COUNT(*) as totalApps,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pendingApps,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approvedApps,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejectedApps,
        SUM(view_count) as totalViews
      FROM applications
    `);

    return result.recordset[0];
  }
}

export class BannerModel {
  static async getAll(pool: sql.ConnectionPool, activeOnly: boolean = true) {
    let query = `
      SELECT id, title, link_url, is_active, sort_order, created_at, updated_at, 
             image_thumbnail, image_small, image_path, image_metadata
      FROM banners
    `;

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const result = await pool.request().query(query);
    return result.recordset;
  }

  static async getById(pool: sql.ConnectionPool, id: number) {
    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT id, title, link_url, is_active, sort_order, created_at, updated_at, 
               image_thumbnail, image_small, image_path, image_metadata
        FROM banners
        WHERE id = @id
      `);

    return result.recordset[0];
  }

  static async create(
    pool: sql.ConnectionPool,
    data: {
      title: string;
      link_url?: string;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
      is_active?: boolean;
      sort_order?: number;
    }
  ) {
    const result = await pool
      .request()
      .input('title', sql.NVarChar(200), data.title)
      .input('link_url', sql.NVarChar(2000), data.link_url || null)
      .input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail || null)
      .input('image_small', sql.NVarChar(sql.MAX), data.image_small || null)
      .input('image_path', sql.NVarChar(500), data.image_path || null)
      .input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata || null)
      .input('is_active', sql.Bit, data.is_active !== false)
      .input('sort_order', sql.Int, data.sort_order || 0).query(`
        INSERT INTO banners (title, link_url, image_thumbnail, image_small, image_path, image_metadata, is_active, sort_order, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.link_url, INSERTED.image_thumbnail, 
               INSERTED.image_small, INSERTED.image_path, INSERTED.image_metadata,
               INSERTED.is_active, INSERTED.sort_order, INSERTED.created_at, INSERTED.updated_at
        VALUES (@title, @link_url, @image_thumbnail, @image_small, @image_path, @image_metadata, @is_active, @sort_order, GETDATE(), GETDATE())
      `);

    return result.recordset[0];
  }

  static async update(
    pool: sql.ConnectionPool,
    id: number,
    data: {
      title?: string;
      link_url?: string;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
      is_active?: boolean;
      sort_order?: number;
    }
  ) {
    const setClauses: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    if (data.title !== undefined) {
      setClauses.push('title = @title');
      request.input('title', sql.NVarChar(200), data.title);
    }

    if (data.link_url !== undefined) {
      setClauses.push('link_url = @link_url');
      request.input('link_url', sql.NVarChar(2000), data.link_url);
    }

    if (data.image_thumbnail !== undefined) {
      setClauses.push('image_thumbnail = @image_thumbnail');
      request.input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail);
    }

    if (data.image_small !== undefined) {
      setClauses.push('image_small = @image_small');
      request.input('image_small', sql.NVarChar(sql.MAX), data.image_small);
    }

    if (data.image_path !== undefined) {
      setClauses.push('image_path = @image_path');
      request.input('image_path', sql.NVarChar(500), data.image_path);
    }

    if (data.image_metadata !== undefined) {
      setClauses.push('image_metadata = @image_metadata');
      request.input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata);
    }

    if (data.is_active !== undefined) {
      setClauses.push('is_active = @is_active');
      request.input('is_active', sql.Bit, data.is_active);
    }

    if (data.sort_order !== undefined) {
      setClauses.push('sort_order = @sort_order');
      request.input('sort_order', sql.Int, data.sort_order);
    }

    setClauses.push('updated_at = GETDATE()');

    await request.query(`
      UPDATE banners
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);

    return this.getById(pool, id);
  }

  static async delete(pool: sql.ConnectionPool, id: number) {
    await pool.request().input('id', sql.Int, id).query('DELETE FROM banners WHERE id = @id');
  }
}

export class TripModel {
  static async getAll(pool: sql.ConnectionPool, activeOnly: boolean = true) {
    let query = `
      SELECT id, title, link_url, is_active, sort_order, created_at, updated_at, 
             image_thumbnail, image_small, image_path, image_metadata
      FROM trips
    `;

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY sort_order ASC, created_at DESC';

    const result = await pool.request().query(query);
    return result.recordset;
  }

  static async getById(pool: sql.ConnectionPool, id: number) {
    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT id, title, link_url, is_active, sort_order, created_at, updated_at, 
               image_thumbnail, image_small, image_path, image_metadata
        FROM trips
        WHERE id = @id
      `);

    return result.recordset[0];
  }

  static async create(
    pool: sql.ConnectionPool,
    data: {
      title: string;
      link_url?: string;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
      is_active?: boolean;
      sort_order?: number;
    }
  ) {
    const result = await pool
      .request()
      .input('title', sql.NVarChar(200), data.title)
      .input('link_url', sql.NVarChar(2000), data.link_url || null)
      .input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail || null)
      .input('image_small', sql.NVarChar(sql.MAX), data.image_small || null)
      .input('image_path', sql.NVarChar(500), data.image_path || null)
      .input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata || null)
      .input('is_active', sql.Bit, data.is_active !== false)
      .input('sort_order', sql.Int, data.sort_order || 0).query(`
        INSERT INTO trips (title, link_url, image_thumbnail, image_small, image_path, image_metadata, is_active, sort_order, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.title, INSERTED.link_url, INSERTED.image_thumbnail, 
               INSERTED.image_small, INSERTED.image_path, INSERTED.image_metadata,
               INSERTED.is_active, INSERTED.sort_order, INSERTED.created_at, INSERTED.updated_at
        VALUES (@title, @link_url, @image_thumbnail, @image_small, @image_path, @image_metadata, @is_active, @sort_order, GETDATE(), GETDATE())
      `);

    return result.recordset[0];
  }

  static async update(
    pool: sql.ConnectionPool,
    id: number,
    data: {
      title?: string;
      link_url?: string;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
      is_active?: boolean;
      sort_order?: number;
    }
  ) {
    const setClauses: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    if (data.title !== undefined) {
      setClauses.push('title = @title');
      request.input('title', sql.NVarChar(200), data.title);
    }

    if (data.link_url !== undefined) {
      setClauses.push('link_url = @link_url');
      request.input('link_url', sql.NVarChar(2000), data.link_url);
    }

    if (data.image_thumbnail !== undefined) {
      setClauses.push('image_thumbnail = @image_thumbnail');
      request.input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail);
    }

    if (data.image_small !== undefined) {
      setClauses.push('image_small = @image_small');
      request.input('image_small', sql.NVarChar(sql.MAX), data.image_small);
    }

    if (data.image_path !== undefined) {
      setClauses.push('image_path = @image_path');
      request.input('image_path', sql.NVarChar(500), data.image_path);
    }

    if (data.image_metadata !== undefined) {
      setClauses.push('image_metadata = @image_metadata');
      request.input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata);
    }

    if (data.is_active !== undefined) {
      setClauses.push('is_active = @is_active');
      request.input('is_active', sql.Bit, data.is_active);
    }

    if (data.sort_order !== undefined) {
      setClauses.push('sort_order = @sort_order');
      request.input('sort_order', sql.Int, data.sort_order);
    }

    setClauses.push('updated_at = GETDATE()');

    await request.query(`
      UPDATE trips
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `);

    return this.getById(pool, id);
  }

  static async delete(pool: sql.ConnectionPool, id: number) {
    await pool.request().input('id', sql.Int, id).query('DELETE FROM trips WHERE id = @id');
  }
}

export class CategoryModel {
  static async getAll(pool: sql.ConnectionPool, activeOnly: boolean = true) {
    let query = `
      SELECT id, name, icon, created_at, updated_at, is_active,
             image_thumbnail, image_small, image_path, image_metadata
      FROM categories
    `;

    if (activeOnly) {
      query += ' WHERE is_active = 1';
    }

    query += ' ORDER BY name ASC';

    const result = await pool.request().query(query);
    return result.recordset;
  }

  static async getById(pool: sql.ConnectionPool, id: number) {
    const result = await pool.request().input('id', sql.Int, id).query(`
        SELECT id, name, icon, created_at, updated_at, is_active,
               image_thumbnail, image_small, image_path, image_metadata
        FROM categories
        WHERE id = @id
      `);

    return result.recordset[0];
  }

  static async create(
    pool: sql.ConnectionPool,
    data: {
      name: string;
      icon?: string;
      is_active?: boolean;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
    }
  ) {
    const result = await pool
      .request()
      .input('name', sql.NVarChar(200), data.name)
      .input('icon', sql.NVarChar(sql.MAX), data.icon || null)
      .input('is_active', sql.Bit, data.is_active !== false)
      .input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail || null)
      .input('image_small', sql.NVarChar(sql.MAX), data.image_small || null)
      .input('image_path', sql.NVarChar(500), data.image_path || null)
      .input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata || null).query(`
        INSERT INTO categories (name, icon, is_active, image_thumbnail, image_small, image_path, image_metadata, created_at, updated_at)
        OUTPUT INSERTED.id, INSERTED.name, INSERTED.icon,
               INSERTED.is_active, INSERTED.image_thumbnail, INSERTED.image_small, 
               INSERTED.image_path, INSERTED.image_metadata,
               INSERTED.created_at, INSERTED.updated_at
        VALUES (@name, @icon, @is_active, @image_thumbnail, @image_small, @image_path, @image_metadata, GETDATE(), GETDATE())
      `);

    return result.recordset[0];
  }

  static async update(
    pool: sql.ConnectionPool,
    id: number,
    data: {
      name?: string;
      icon?: string;
      is_active?: boolean;
      image_thumbnail?: string;
      image_small?: string;
      image_path?: string;
      image_metadata?: string;
    }
  ) {
    const setClauses: string[] = [];
    const request = pool.request().input('id', sql.Int, id);

    if (data.name !== undefined) {
      setClauses.push('name = @name');
      request.input('name', sql.NVarChar(200), data.name);
    }

    if (data.icon !== undefined) {
      setClauses.push('icon = @icon');
      // Handle null or empty string as NULL in database
      const iconValue = data.icon && data.icon.trim() ? data.icon : null;
      request.input('icon', sql.NVarChar(sql.MAX), iconValue);
    }

    if (data.is_active !== undefined) {
      setClauses.push('is_active = @is_active');
      request.input('is_active', sql.Bit, data.is_active);
    }

    if (data.image_thumbnail !== undefined) {
      setClauses.push('image_thumbnail = @image_thumbnail');
      request.input('image_thumbnail', sql.NVarChar(sql.MAX), data.image_thumbnail);
    }

    if (data.image_small !== undefined) {
      setClauses.push('image_small = @image_small');
      request.input('image_small', sql.NVarChar(sql.MAX), data.image_small);
    }

    if (data.image_path !== undefined) {
      setClauses.push('image_path = @image_path');
      request.input('image_path', sql.NVarChar(500), data.image_path);
    }

    if (data.image_metadata !== undefined) {
      setClauses.push('image_metadata = @image_metadata');
      request.input('image_metadata', sql.NVarChar(sql.MAX), data.image_metadata);
    }

    setClauses.push('updated_at = GETDATE()');

    const query = `
      UPDATE categories
      SET ${setClauses.join(', ')}
      WHERE id = @id
    `;

    console.log('[CategoryModel.update] Executing query:', query.replace(/\s+/g, ' '));
    console.log('[CategoryModel.update] Parameters:', { id, ...data });

    await request.query(query);

    return this.getById(pool, id);
  }

  static async delete(pool: sql.ConnectionPool, id: number) {
    await pool.request().input('id', sql.Int, id).query('DELETE FROM categories WHERE id = @id');
  }
}
