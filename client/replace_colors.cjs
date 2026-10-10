const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

let modifiedCount = 0;

walkDir(directoryPath, function(filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let originalContent = content;

        // Replace purple with orange
        content = content.replace(/purple-50\b/g, 'orange-50');
        content = content.replace(/purple-100\b/g, 'orange-100');
        content = content.replace(/purple-200\b/g, 'orange-200');
        content = content.replace(/purple-300\b/g, 'orange-300');
        content = content.replace(/purple-400\b/g, 'orange-400');
        content = content.replace(/purple-500\b/g, 'orange-500');
        content = content.replace(/purple-600\b/g, 'orange-600');
        content = content.replace(/purple-700\b/g, 'orange-700');
        content = content.replace(/purple-800\b/g, 'orange-800');
        content = content.replace(/purple-900\b/g, 'orange-900');
        content = content.replace(/purple-950\b/g, 'orange-950');

        // Replace indigo with green (for gradients)
        content = content.replace(/indigo-400\b/g, 'emerald-600');
        content = content.replace(/indigo-500\b/g, 'emerald-700');
        content = content.replace(/indigo-600\b/g, 'emerald-800');

        // Specific overrides for main theme colors:
        // bg-slate-900 -> bg-[#0D2F24]
        // text-slate-900 -> text-[#0D2F24]
        // bg-slate-950 -> bg-[#05110d]
        content = content.replace(/bg-slate-900\b/g, 'bg-[#0D2F24]');
        content = content.replace(/text-slate-900\b/g, 'text-[#0D2F24]');
        content = content.replace(/bg-slate-950\b/g, 'bg-[#05110d]');
        
        // We will leave the slate backgrounds (50, 100) alone for cards inside the dashboard so we don't break structural contrast, 
        // but we'll change the root bg of AdminLayout to cream.

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            modifiedCount++;
        }
    }
});

console.log(`Modified ${modifiedCount} files.`);
