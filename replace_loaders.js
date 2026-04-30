import fs from 'fs';
import path from 'path';

const pagesDir = path.join(process.cwd(), 'client/src/pages');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

const skeletonImport = `import { PageSkeleton } from '../components/Skeleton';\n`;

walk(pagesDir, (filePath) => {
  if (!filePath.endsWith('.jsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Case 1: Simple spinner
  const loadingRegex = /if\s*\(\s*loading\s*\)\s*return\s*\(\s*<div[^>]*>[\s\S]*?(?:Loading|spin|spinner)[\s\S]*?<\/div>\s*\);/ig;
  const loadingRegex2 = /if\s*\(\s*loading\s*\)\s*return\s*<div[^>]*>[\s\S]*?(?:Loading|spin|spinner)[\s\S]*?<\/div>\s*;/ig;
  const loadingRegex3 = /if\s*\(\s*loading\s*\)\s*\{\s*return\s*\(\s*<div[^>]*>[\s\S]*?(?:Loading|spin|spinner)[\s\S]*?<\/div>\s*\);\s*\}/ig;
  const loadingRegex4 = /if\s*\(\s*loading\s*\)\s*return\s*\(\s*<div[^>]*>\s*<div[^>]*spin[^>]*>.*?<\/div>\s*<\/div>\s*\);/ig;

  const replaceStr = `if (loading) return <PageSkeleton />;`;

  // General match for any loading block
  const generalLoading = /if\s*\(\s*loading\s*\)\s*(?:return\s*\([\s\S]*?\);|return\s*<div[\s\S]*?<\/div>;|\{\s*return[\s\S]*?\}\s*\})/ig;

  if (generalLoading.test(content)) {
    content = content.replace(generalLoading, replaceStr);
    
    // Add import if not exists
    if (!content.includes('PageSkeleton')) {
        // Find last import
        const lastImportMatch = [...content.matchAll(/^import.*from.*$/gm)].pop();
        if (lastImportMatch) {
            const index = lastImportMatch.index + lastImportMatch[0].length;
            content = content.slice(0, index) + '\n' + skeletonImport + content.slice(index);
        } else {
            content = skeletonImport + content;
        }
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + path.basename(filePath));
  }
});
