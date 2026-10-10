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
    
    // Remove the extra opening curly brace
    content = content.replace(/\{\s*\{\s*/g, '{\n');
    content = content.replace(/const confirm = useConfirm\(\);\s*\{/g, 'const confirm = useConfirm();\n');

    fs.writeFileSync(fullPath, content);
    console.log("Fixed brace", file);
}
