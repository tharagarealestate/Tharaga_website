const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next')) {
        results = results.concat(walk(file));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for client-side Anthropic
      if ((content.includes('use client') || content.includes('"use client"') || content.includes("'use client'")) && content.includes('Anthropic')) {
        console.log('FOUND CLIENT ANTHROPIC:', file);
      }
      
      // Check for infinite useEffect
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('useEffect(') && !lines[i].includes('//')) {
          let j = i;
          let block = '';
          while (j < i + 10 && j < lines.length) {
            block += lines[j];
            if (block.includes('})') || block.includes('};')) break;
            j++;
          }
          if (block.includes('})') && !block.includes('}, [') && !block.includes('},[])') && !block.includes('}, [')) {
            console.log('POTENTIAL INFINITE EFFECT:', file, 'LINE:', i);
          }
        }
      }
    }
  });
  return results;
}
walk('e:/Tharaga_website/app');
