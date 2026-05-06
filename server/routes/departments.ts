import express from 'express';
import sql from 'mssql';
import { getSpoDb, getKpiDb } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * GET /api/departments
 * Get all departments from SPO_Dev.dept_master table with KPI mapping
 */
router.get('/', async (req, res) => {
  try {
    const kpiDb = await getKpiDb();

    // Get KPI department mapping first
    const mappingResult = await kpiDb.request().query(`
      SELECT kpi_code, spo_dept_id, description
      FROM kpi_department_mapping
      ORDER BY kpi_code
    `);

    const kpiMapping = mappingResult.recordset;

    // Try to get SPO_Dev departments for enrichment (optional)
    let spoDepts: any[] = [];
    try {
      const spoDb = await getSpoDb();
      const result = await spoDb.request().query(`
        SELECT TOP (1000) [dept_id]
              ,[company]
              ,[section_code]
              ,[section_name]
              ,[dept_group]
              ,[div_type]
              ,[div_group]
              ,[pa_id]
              ,[is_active]
              ,[updated_at]
        FROM [SPO_Dev].[dbo].[dept_master]
        WHERE is_active = 1
        ORDER BY section_name
      `);
      spoDepts = result.recordset;
    } catch (spoError: unknown) {
      logger.warn(
        'SPO_Dev database unavailable, returning departments without SPO enrichment',
        spoError as Record<string, unknown>
      );
    }

    // Create a combined list with KPI codes
    const combinedDepts: any[] = [];

    // Add KPI departments first (these are the main ones used in measurements)
    for (const mapping of kpiMapping) {
      // Find matching SPO department if exists
      const spoDept = spoDepts.find((d: any) => d.dept_id === mapping.spo_dept_id);

      combinedDepts.push({
        dept_id: mapping.kpi_code, // Use KPI code as the ID (matches main/main_relate in measurements)
        name_en: `${mapping.kpi_code}: ${mapping.description || mapping.kpi_code}`,
        name_th: mapping.description,
        kpi_code: mapping.kpi_code,
        spo_dept_id: mapping.spo_dept_id,
        company: spoDept?.company || null,
        section_code: spoDept?.section_code || null,
        dept_group: spoDept?.dept_group || null,
        div_type: spoDept?.div_type || null,
        div_group: spoDept?.div_group || null,
        pa_id: spoDept?.pa_id || null,
        is_active: spoDept?.is_active || 1,
        updated_at: spoDept?.updated_at || null,
        is_kpi_dept: true,
      });
    }

    // Note: Only return KPI departments, not all SPO departments
    // This keeps the dropdown focused on departments with KPI targets

    return res.json({
      success: true,
      data: combinedDepts,
      kpi_departments: kpiMapping,
      source: spoDepts.length > 0 ? 'kpi_only' : 'kpi_only_no_spo',
    });
  } catch (error) {
    logger.error('Error fetching departments', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch departments',
    });
  }
});

/**
 * GET /api/departments/with-measurements/:category
 * Get all departments that have measurements for a specific category, with their fill status
 */
router.get('/with-measurements/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const kpiDb = await getKpiDb();

    // Get KPI department mapping as primary source
    const mappingResult = await kpiDb.request().query(`
      SELECT kpi_code, spo_dept_id, description
      FROM kpi_department_mapping
      ORDER BY kpi_code
    `);

    // Try to get SPO_Dev departments for enrichment (optional)
    let spoDepts: any[] = [];
    try {
      const spoDb = await getSpoDb();
      const result = await spoDb.request().query(`
        SELECT dept_id, section_name as name_en, company, section_code, dept_group, div_type, div_group, pa_id, is_active, updated_at
        FROM dept_master
        WHERE is_active = 1
        ORDER BY section_name
      `);
      spoDepts = result.recordset;
    } catch (spoError: unknown) {
      logger.warn(
        'SPO_Dev database unavailable for with-measurements, using KPI mapping only',
        spoError as Record<string, unknown>
      );
    }

    // Get category ID
    const catResult = await kpiDb
      .request()
      .input('category', sql.NVarChar, category)
      .query(`SELECT id FROM kpi_categories WHERE [key] = @category`);

    if (catResult.recordset.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const categoryId = catResult.recordset[0].id;
    const currentYear = new Date().getFullYear();

    // For each KPI department, get measurement count
    const departmentsWithMeasurements = await Promise.all(
      mappingResult.recordset.map(async (mapping: any) => {
        const spoDept = spoDepts.find((d: any) => d.dept_id === mapping.spo_dept_id);
        const deptId = mapping.kpi_code;

        const measurementResult = await kpiDb
          .request()
          .input('dept_id', sql.NVarChar, deptId)
          .input('category_id', sql.Int, categoryId)
          .input('year', sql.Int, currentYear).query(`
            SELECT
              COUNT(DISTINCT yt.id) as measurement_count,
              COUNT(DISTINCT CASE WHEN me.id IS NOT NULL THEN yt.id END) as filled_count
            FROM kpi_yearly_targets yt
            LEFT JOIN kpi_monthly_targets me
              ON me.yearly_target_id = yt.id
              AND me.fiscal_year = @year
              AND me.month = MONTH(GETDATE())
            WHERE yt.category_id = @category_id
              AND (yt.main = @dept_id OR yt.main_relate LIKE '%' + @dept_id + '%')
          `);

        return {
          dept_id: deptId,
          name_en: `${mapping.kpi_code}: ${mapping.description || mapping.kpi_code}`,
          company: spoDept?.company || null,
          section_code: spoDept?.section_code || null,
          dept_group: spoDept?.dept_group || null,
          div_type: spoDept?.div_type || null,
          div_group: spoDept?.div_group || null,
          pa_id: spoDept?.pa_id || null,
          is_active: spoDept?.is_active || 1,
          updated_at: spoDept?.updated_at || null,
          has_measurements: true,
          measurement_count: measurementResult.recordset[0]?.measurement_count || 0,
          filled_count: measurementResult.recordset[0]?.filled_count || 0,
        };
      })
    );

    res.json({
      success: true,
      data: departmentsWithMeasurements.filter((d) => d.measurement_count > 0),
    });
  } catch (error) {
    logger.error('Error fetching departments with measurements', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch departments with measurements',
    });
  }
});

/**
 * GET /api/departments/:dept_id/categories
 * Get KPI categories available for a specific department
 */
router.get('/:dept_id/categories', async (req, res) => {
  try {
    const { dept_id } = req.params;
    const kpiDb = await getKpiDb();

    // Get categories that have measurements for this department (using main field)
    const result = await kpiDb.request().input('dept_id', sql.NVarChar, dept_id).query(`
      SELECT DISTINCT
        kc.id, kc.name, kc.[key], kc.sort_order
      FROM kpi_categories kc
      WHERE kc.is_active = 1
      ORDER BY kc.sort_order
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Error fetching department categories', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch department categories',
    });
  }
});

/**
 * GET /api/departments/:dept_id/sub-categories/:category
 * Get sub-categories for a specific department and category
 */
router.get('/:dept_id/sub-categories/:category', async (req, res) => {
  try {
    const { dept_id, category } = req.params;
    const kpiDb = await getKpiDb();

    // Get sub-categories with measurements for this department (using main field)
    // Sub-categories are no longer used - return empty array
    const result = await kpiDb.request().query(`
      SELECT TOP 0 id, name_en, name_th, [key], sort_order
      FROM kpi_measurement_sub_categories
      WHERE 1 = 0
    `);

    res.json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    logger.error('Error fetching department sub-categories', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch department sub-categories',
    });
  }
});

/**
 * GET /api/departments/:dept_id/measurements/:category/:sub_category?
 * Get measurements for a specific department, category, and optionally sub-category
 */
router.get('/:dept_id/measurements/:category/:sub_category?', async (req, res) => {
  try {
    const { dept_id, category } = req.params;
    const sub_category = (req.params as any).sub_category;
    const kpiDb = await getKpiDb();

    // Try to get department name from SPO_Dev (optional), fallback to KPI mapping
    let deptName = dept_id;
    try {
      const spoDb = await getSpoDb();
      const deptResult = await spoDb
        .request()
        .input('dept_id', sql.NVarChar, dept_id)
        .query(`SELECT section_name as name_en FROM dept_master WHERE dept_id = @dept_id`);
      deptName = deptResult.recordset[0]?.name_en || dept_id;
    } catch (spoError: unknown) {
      logger.warn(
        'SPO_Dev database unavailable for measurements, using KPI mapping for dept name',
        spoError as Record<string, unknown>
      );
      // Fallback: get name from kpi_department_mapping
      const mappingResult = await kpiDb
        .request()
        .input('kpi_code', sql.NVarChar, dept_id)
        .query(`SELECT description FROM kpi_department_mapping WHERE kpi_code = @kpi_code`);
      if (mappingResult.recordset.length > 0) {
        deptName = mappingResult.recordset[0].description || dept_id;
      }
    }

    // Measurements are now in kpi_yearly_targets, not category-specific tables
    // Get category ID first
    const catResult = await kpiDb.request().input('category', sql.NVarChar, category).query(`
      SELECT id FROM kpi_categories WHERE [key] = @category
    `);

    if (catResult.recordset.length === 0) {
      return res.json({
        success: true,
        data: [],
        department_name: deptName,
      });
    }

    const categoryId = catResult.recordset[0].id;

    let query = `
      SELECT 
        yt.id, mm.measurement, mm.unit, yt.fy_target as fy25_target, 
        mm.main, mm.main_relate,
        mm.description_of_target,
        sc.id as sub_category_id,
        sc.name as sub_category_name,
        kc.[key] as sub_category_key
      FROM kpi_yearly_targets yt
      LEFT JOIN kpi_measurements mm ON yt.measurement_id = mm.id
      LEFT JOIN kpi_measurement_sub_categories sc ON mm.sub_category_id = sc.id
      LEFT JOIN kpi_categories kc ON mm.category_id = kc.id
      WHERE yt.category_id = @category_id
        AND (mm.main = @dept_id OR mm.main_relate LIKE '%' + @dept_id + '%')
    `;

    const request = kpiDb
      .request()
      .input('dept_id', sql.NVarChar, dept_id)
      .input('category_id', sql.Int, categoryId);

    if (sub_category) {
      // Sub-category filtering is no longer supported
      return res.json({
        success: true,
        data: [],
        department_name: deptName,
      });
    }

    query += ` ORDER BY mm.id`;

    const result = await request.query(query);

    // Add department name to results
    const dataWithDeptName = result.recordset.map((m: any) => ({
      ...m,
      department_name: deptName,
    }));

    res.json({
      success: true,
      data: dataWithDeptName,
    });
  } catch (error) {
    logger.error('Error fetching department measurements', error);
    res.status(500).json({
      success: false,
      error: 'DATABASE_ERROR',
      message: 'Failed to fetch department measurements',
    });
  }
});

export default router;
