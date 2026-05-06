import sql from 'mssql';
import { getKpiDb, getSpoDb } from '../config/database';

// Mapping of KPI department codes to SPO_Dev department patterns
const DEPT_MAPPING = [
  { kpi_code: 'SE', name_pattern: 'SAFETY%', description: 'Safety Department' },
  { kpi_code: 'GA', name_pattern: '%GENERAL AFFAIRS%', description: 'General Affairs' },
  { kpi_code: 'QA', name_pattern: '%QUALITY ASSURANCE%', description: 'Quality Assurance' },
  { kpi_code: 'QC', name_pattern: '%QUALITY CONTROL%', description: 'Quality Control' },
  { kpi_code: 'PD', name_pattern: '%PRODUCTION%', description: 'Production' },
  {
    kpi_code: 'PE',
    name_pattern: '%PRODUCTION ENGINEERING%',
    description: 'Production Engineering',
  },
  { kpi_code: 'PC', name_pattern: '%PRODUCTION CONTROL%', description: 'Production Control' },
  { kpi_code: 'MT', name_pattern: '%MAINTENANCE%', description: 'Maintenance' },
  { kpi_code: 'WH', name_pattern: '%WAREHOUSE%', description: 'Warehouse' },
  { kpi_code: 'AR', name_pattern: '%ASSET%RISK%', description: 'Asset & Risk' },
  { kpi_code: 'PU', name_pattern: '%PURCHASING%', description: 'Purchasing' },
  { kpi_code: 'ACC', name_pattern: '%ACCOUNTING%', description: 'Accounting' },
  { kpi_code: 'HRD', name_pattern: '%HR%', description: 'Human Resources' },
  { kpi_code: 'AC', name_pattern: '%ATTRACTIVE%', description: 'Attractive Company' },
  { kpi_code: 'INN', name_pattern: '%INNOVATION%', description: 'Innovation' },
  { kpi_code: 'GA&CSR', name_pattern: '%CSR%', description: 'GA & CSR' },
  { kpi_code: 'AR&AS', name_pattern: '%ASSET%', description: 'Asset' },
  { kpi_code: 'PC/WH', name_pattern: '%PRODUCTION CONTROL%', description: 'PC/Warehouse' },
];

async function seedDepartmentMapping() {
  const kpiDb = await getKpiDb();
  const spoDb = await getSpoDb();

  console.log('Creating department mapping table...\n');

  // Create mapping table
  await kpiDb.request().query(`
    IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'kpi_department_mapping')
    CREATE TABLE kpi_department_mapping (
      id INT IDENTITY(1,1) PRIMARY KEY,
      kpi_code NVARCHAR(20) NOT NULL UNIQUE,
      spo_dept_id NVARCHAR(50) NOT NULL,
      description NVARCHAR(200),
      created_at DATETIME DEFAULT GETDATE(),
      updated_at DATETIME DEFAULT GETDATE()
    )
  `);

  console.log('Looking up departments in SPO_Dev...\n');

  // For each KPI code, find matching SPO_Dev department
  for (const mapping of DEPT_MAPPING) {
    const result = await spoDb.request().input('pattern', sql.NVarChar, mapping.name_pattern)
      .query(`
        SELECT TOP 1 ID as dept_id, Section_name as name_en 
        FROM dept_master 
        WHERE is_active = 'Active' 
          AND Section_name LIKE @pattern
        ORDER BY Section_name
      `);

    if (result.recordset.length > 0) {
      const dept = result.recordset[0];

      await kpiDb
        .request()
        .input('kpi_code', sql.NVarChar, mapping.kpi_code)
        .input('spo_dept_id', sql.NVarChar, dept.dept_id)
        .input('description', sql.NVarChar, mapping.description).query(`
          MERGE kpi_department_mapping AS target
          USING (SELECT @kpi_code as kpi_code) AS source
          ON target.kpi_code = source.kpi_code
          WHEN MATCHED THEN
            UPDATE SET spo_dept_id = @spo_dept_id, updated_at = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (kpi_code, spo_dept_id, description)
            VALUES (@kpi_code, @spo_dept_id, @description);
        `);

      console.log(`  ${mapping.kpi_code} -> ${dept.dept_id} (${dept.name_en?.trim()})`);
    } else {
      // Create entry without SPO mapping
      await kpiDb
        .request()
        .input('kpi_code', sql.NVarChar, mapping.kpi_code)
        .input('description', sql.NVarChar, mapping.description).query(`
          IF NOT EXISTS (SELECT 1 FROM kpi_department_mapping WHERE kpi_code = @kpi_code)
          INSERT INTO kpi_department_mapping (kpi_code, spo_dept_id, description)
          VALUES (@kpi_code, @kpi_code, @description)
        `);

      console.log(`  ${mapping.kpi_code} -> (no match, using code as ID)`);
    }
  }

  // Show final mapping
  console.log('\n=== Final Mapping ===');
  const finalResult = await kpiDb.request().query(`
    SELECT kpi_code, spo_dept_id, description 
    FROM kpi_department_mapping 
    ORDER BY kpi_code
  `);

  console.table(finalResult.recordset);

  console.log('\nDepartment mapping completed!');
}

seedDepartmentMapping()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
