const fs = require('fs');
const path = require('path');

const clientSrcDir = path.join(__dirname, 'client', 'src');

const files = [
    'pages/teacher/TeacherQuizDashboard.jsx',
    'pages/teacher/QuizBuilder.jsx',
    'pages/student/QuizPlayer.jsx',
    'pages/administrator/TeacherManagement.jsx',
    'pages/administrator/StudentManagement.jsx',
    'pages/administrator/FeeManagement.jsx',
    'pages/administrator/AdministratorDashboard.jsx',
    'components/dashboard/TeacherNotesSection.jsx'
];

for (const file of files) {
    const fullPath = path.join(clientSrcDir, file);
    if (!fs.existsSync(fullPath)) continue;
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix function
    content = content.replace(
        /function\s+([A-Za-z0-9_]+)\s*\(\s*const\s+confirm\s*=\s*useConfirm\(\);\s*\)/g,
        'function $1() {\n  const confirm = useConfirm();'
    );
    
    // Fix arrow function if any
    content = content.replace(
        /const\s+([A-Za-z0-9_]+)\s*=\s*\(\s*const\s+confirm\s*=\s*useConfirm\(\);\s*\)/g,
        'const $1 = () => {\n  const confirm = useConfirm();'
    );

    // Let's do a more robust regex since there might be props inside the parens.
    // Wait, the original regex was just `function Name(`. The closing paren was NOT matched.
    // So it looks like:
    // function Name(
    //   const confirm = useConfirm();
    // ) {
    
    // So let's just replace:
    // (\n  const confirm = useConfirm();\n) {
    // wait, what about props? `function Name({ props }` matched as `function Name(`.
    // So `function Name(\n const confirm = useConfirm();\n{ props }) {`
    
    // Let's do a more robust string replacement for the exact mistake:
    content = content.replace(
        /(\s*\(\n\s*const confirm = useConfirm\(\);\n)/g,
        '('
    );
    // Remove the erroneously inserted line first
    
    // Then re-insert correctly!
    content = content.replace(
        /function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g,
        'function $1($2) {\n  const confirm = useConfirm();'
    );
    
    content = content.replace(
        /const\s+([A-Za-z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>\s*\{/g,
        'const $1 = ($2) => {\n  const confirm = useConfirm();'
    );
    
    // Deduplicate in case we insert twice
    content = content.replace(/(const confirm = useConfirm\(\);\s*){2,}/g, 'const confirm = useConfirm();\n');

    fs.writeFileSync(fullPath, content);
    console.log("Fixed", file);
}
