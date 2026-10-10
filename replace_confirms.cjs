const fs = require('fs');
const path = require('path');

const clientSrcDir = path.join(__dirname, 'client', 'src');

const replacements = [
  {
    file: 'pages/teacher/TeacherQuizDashboard.jsx',
    changes: [
      {
        find: 'if (window.confirm("Are you sure you want to delete this quiz?")) {',
        replace: 'const isConfirmed = await confirm({ title: "Delete Quiz", message: "Are you sure you want to delete this quiz?", isDanger: true, confirmText: "Delete" });\n    if (isConfirmed) {'
      },
      {
        find: 'if (window.confirm("Are you sure you want to publish this quiz? It cannot be un-published.")) {',
        replace: 'const isConfirmed = await confirm({ title: "Publish Quiz", message: "Are you sure you want to publish this quiz? It cannot be un-published.", confirmText: "Publish" });\n    if (isConfirmed) {'
      }
    ],
    addImport: true
  },
  {
    file: 'pages/teacher/QuizBuilder.jsx',
    changes: [
      {
        find: 'if (window.confirm("Delete this question?")) {',
        replace: 'const isConfirmed = await confirm({ title: "Delete Question", message: "Delete this question?", isDanger: true, confirmText: "Delete" });\n    if (isConfirmed) {'
      },
      {
        find: 'if (window.confirm("Are you sure you want to publish this quiz? It cannot be edited afterward.")) {',
        replace: 'const isConfirmed = await confirm({ title: "Publish Quiz", message: "Are you sure you want to publish this quiz? It cannot be edited afterward.", confirmText: "Publish" });\n    if (isConfirmed) {'
      }
    ],
    addImport: true
  },
  {
    file: 'pages/student/QuizPlayer.jsx',
    changes: [
      {
        find: 'if (window.confirm("Are you sure you want to submit your quiz? You cannot change your answers after this.")) {',
        replace: 'const isConfirmed = await confirm({ title: "Submit Quiz", message: "Are you sure you want to submit your quiz? You cannot change your answers after this.", confirmText: "Submit" });\n    if (isConfirmed) {'
      }
    ],
    addImport: true
  },
  {
    file: 'pages/administrator/TeacherManagement.jsx',
    changes: [
      {
        find: 'const confirmMsg = `Are you sure you want to change this faculty member status to ${newStatus}?`;\n    if (!window.confirm(confirmMsg)) return;',
        replace: 'const confirmMsg = `Are you sure you want to change this faculty member status to ${newStatus}?`;\n    const isConfirmed = await confirm({ title: "Change Status", message: confirmMsg, confirmText: "Yes, Change", isDanger: newStatus === "Inactive" });\n    if (!isConfirmed) return;'
      },
      {
        find: 'const confirmMsg = `Are you sure you want to permanently delete faculty member "${teacherName}" from the database?`;\n    if (!window.confirm(confirmMsg)) return;',
        replace: 'const confirmMsg = `Are you sure you want to permanently delete faculty member "${teacherName}" from the database?`;\n    const isConfirmed = await confirm({ title: "Delete Faculty", message: confirmMsg, confirmText: "Delete", isDanger: true });\n    if (!isConfirmed) return;'
      }
    ],
    addImport: true
  },
  {
    file: 'pages/administrator/StudentManagement.jsx',
    changes: [
      {
        find: 'if (!window.confirm("Are you sure you want to delete this student record?")) return;',
        replace: 'const isConfirmed = await confirm({ title: "Delete Student", message: "Are you sure you want to delete this student record?", confirmText: "Delete", isDanger: true });\n    if (!isConfirmed) return;'
      }
    ],
    addImport: true
  },
  {
    file: 'pages/administrator/FeeManagement.jsx',
    changes: [
      {
        find: 'if (!window.confirm("Are you sure you want to delete this fee structure? This will also remove the fee assignments from students.")) return;',
        replace: 'const isConfirmed = await confirm({ title: "Delete Fee Structure", message: "Are you sure you want to delete this fee structure? This will also remove the fee assignments from students.", confirmText: "Delete", isDanger: true });\n    if (!isConfirmed) return;'
      }
    ],
    addImport: true
  },
  {
    file: 'pages/administrator/AdministratorDashboard.jsx',
    changes: [
      {
        find: 'if (!window.confirm("Mark application as ELIGIBLE and dispatch fee payment email to applicant?")) {',
        replace: 'const isConfirmed = await confirm({ title: "Approve Application", message: "Mark application as ELIGIBLE and dispatch fee payment email to applicant?", confirmText: "Approve" });\n    if (!isConfirmed) {'
      },
      {
        find: 'if (!window.confirm("Are you sure you want to give final approval and generate student credentials?")) {',
        replace: 'const isConfirmed = await confirm({ title: "Final Approval", message: "Are you sure you want to give final approval and generate student credentials?", confirmText: "Approve" });\n    if (!isConfirmed) {'
      }
    ],
    addImport: true
  },
  {
    file: 'components/dashboard/TeacherNotesSection.jsx',
    changes: [
      {
        find: 'if (!window.confirm("Are you sure you want to delete this study material?")) return;',
        replace: 'const isConfirmed = await confirm({ title: "Delete Note", message: "Are you sure you want to delete this study material?", confirmText: "Delete", isDanger: true });\n    if (!isConfirmed) return;'
      }
    ],
    addImport: true
  }
];

for (const rep of replacements) {
  const fullPath = path.join(clientSrcDir, rep.file);
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    continue;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  
  // Apply text replacements
  for (const change of rep.changes) {
    if (!content.includes(change.find)) {
      console.warn(`Could not find target content in ${rep.file}:\n${change.find}`);
    } else {
      content = content.replace(change.find, change.replace);
    }
  }

  // Inject import and useConfirm hook if needed
  if (rep.addImport && !content.includes('useConfirm')) {
    // 1. Add import statement below React
    const importContextPath = fullPath.includes('components') ? '../../context/ConfirmContext' : '../../context/ConfirmContext';
    // wait, path resolution from pages/xxx/file.jsx is `../../context/ConfirmContext`
    // from components/dashboard/TeacherNotesSection.jsx is `../../context/ConfirmContext`
    
    let importString = `import { useConfirm } from "../../context/ConfirmContext";\n`;
    if (fullPath.includes('TeacherNotesSection.jsx')) {
        importString = `import { useConfirm } from "../../context/ConfirmContext";\n`;
    }

    content = content.replace('import React', `${importString}import React`);
    
    // 2. Add const confirm = useConfirm(); inside the component
    // Need to find component declaration
    const componentNameMatch = content.match(/function\s+([A-Za-z0-9_]+)\s*\(/);
    const arrowComponentMatch = content.match(/const\s+([A-Za-z0-9_]+)\s*=\s*\([^)]*\)\s*=>\s*\{/);
    
    if (componentNameMatch) {
      const functionDef = componentNameMatch[0];
      content = content.replace(functionDef, `${functionDef}\n  const confirm = useConfirm();\n`);
    } else if (arrowComponentMatch) {
      const functionDef = arrowComponentMatch[0];
      content = content.replace(functionDef, `${functionDef}\n  const confirm = useConfirm();\n`);
    }
  }

  fs.writeFileSync(fullPath, content);
  console.log(`Updated ${rep.file}`);
}
