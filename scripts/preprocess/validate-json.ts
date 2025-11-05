import * as fs from 'fs';
import * as path from 'path';

/**
 * 生成されたJSONファイルのバリデーション
 */
function validateJsonFiles(): void {
  console.log('=== Validating JSON Files ===\n');

  const baseDir = path.join(__dirname, '../../src/data');
  let errorCount = 0;

  // マッピングファイルの検証
  const mappingsDir = path.join(baseDir, 'mappings');
  if (fs.existsSync(mappingsDir)) {
    console.log('Validating mapping files...');
    const files = fs.readdirSync(mappingsDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(mappingsDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        if (!data.messageType || !data.fields || !Array.isArray(data.fields)) {
          console.error(`Invalid structure in ${file}`);
          errorCount++;
        } else {
          console.log(`✓ ${file}: ${data.fields.length} fields`);
        }
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
        errorCount++;
      }
    }
  }

  // コード定義ファイルの検証
  const codeDefDir = path.join(baseDir, 'code-definitions');
  if (fs.existsSync(codeDefDir)) {
    console.log('\nValidating code definition files...');
    const files = fs.readdirSync(codeDefDir).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      const filePath = path.join(codeDefDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        
        if (!data.codeType || !data.codes || !Array.isArray(data.codes)) {
          console.error(`Invalid structure in ${file}`);
          errorCount++;
        } else {
          console.log(`✓ ${file}: ${data.codes.length} codes`);
        }
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
        errorCount++;
      }
    }
  }

  console.log(`\n=== Validation Complete: ${errorCount} errors ===`);
  
  if (errorCount > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  validateJsonFiles();
}

export { validateJsonFiles };

