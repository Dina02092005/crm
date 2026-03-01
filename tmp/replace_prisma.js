const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.resolve(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.match(/(node_modules|\.next|\.git|tmp|prisma)$/)) {
                results = results.concat(walk(file));
            }
        } else if (file.match(/\.(ts|tsx)$/)) {
            results.push(file);
        }
    });
    return results;
};

const files = walk('./');
files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    if (content.includes('@prisma/client')) {
        fs.writeFileSync(f, content.replace(/['"]@prisma\/client['"]/g, "'@/lib/prisma'"));
        console.log('Updated', f);
    }
});
