"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("./config/database");
async function check() {
    const db = await (0, database_1.getAppStoreDb)();
    const result = await db.request().query(`
    SELECT id, name, icon, 
           LEFT(CAST(image_thumbnail AS VARCHAR(MAX)), 100) as thumb_start, 
           DATALENGTH(image_thumbnail) as thumb_size 
    FROM categories 
    WHERE name LIKE '%Excel%' OR name LIKE '%PowerPoint%'
  `);
    console.log(JSON.stringify(result.recordset, null, 2));
}
check().then(() => process.exit(0));
