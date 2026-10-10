const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? 
      walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir(path.join(__dirname, 'src'), function(filePath) {
  if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Only process files with 'alert('
    if (content.includes('alert(')) {
      let modified = false;
      
      // Ensure import toast from 'react-hot-toast'; exists
      if (!content.includes("import toast from 'react-hot-toast';") && !content.includes('import toast from "react-hot-toast";')) {
        // Insert at the top after the first import or at the very top
        content = 'import toast from "react-hot-toast";\n' + content;
        modified = true;
      }
      
      // Replace alert(...) with toast.success(...) or toast.error(...)
      // A simple heuristic for error: string contains 'error', 'fail', 'invalid', 'err.'
      // Otherwise success.
      content = content.replace(/alert\((.*?)\);?/g, (match, p1) => {
        let p1Lower = p1.toLowerCase();
        let isError = p1Lower.includes('err') || p1Lower.includes('fail') || p1Lower.includes('invalid') || p1Lower.includes('please provide');
        modified = true;
        
        if (isError) {
          return `toast.error(${p1});`;
        } else {
          return `toast.success(${p1});`;
        }
      });
      
      if (modified) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
});
