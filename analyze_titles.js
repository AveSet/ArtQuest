const fs = require('fs');
const path = require('path');

const terms = ['scene', 'visual flow', 'fish', 'face', 'hand', 'shading', 'gesture', 'composition', 'lighting', 'edges', 'perspective', 'cylinder', 'sphere', 'cube', 'tree', 'house', 'shape', 'abstract', 'balance', 'rhythm', 'value', 'form', 'space', 'texture', 'color', 'pattern', 'contrast', 'proportion', 'unity', 'variety', 'emphasis', 'movement', 'gradient', 'brush', 'layer', 'render', 'shadows', 'highlights', 'reflections', 'blending', 'canvas', 'palette', 'hue', 'saturation', 'brightness', 'opacity', 'stroke', 'sketch', 'outline', 'silhouette', 'negative space', 'focal point', 'depth', 'atmosphere', 'flow', 'detail', 'animal', 'character', 'design', 'exterior', 'interior', 'still life', 'portrait', 'landscape'];

const dir = 'D:/artquest/src/renderer/data';
const files = ['quests_anatomy.json', 'quests_animation.json', 'quests_drawing.json', 'quests_effects.json', 'quests_storytelling.json'];

const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
const pattern = new RegExp('\\b(' + escaped.join('|') + ')\\b', 'gi');

console.log('=== TITLE.RU - English words found ===');
let totalTitle = 0;
for (const fname of files) {
    const fp = path.join(dir, fname);
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const matchedQuests = [];
    for (const quest of data) {
        const ru = (quest.title && quest.title.ru) || '';
        const found = ru.match(pattern);
        if (found) {
            totalTitle++;
            if (matchedQuests.length < 20) {
                matchedQuests.push('  [' + quest.code + '] title.ru="' + ru + '" | matched=' + JSON.stringify(found));
            }
        }
    }
    const totalInFile = data.filter(q => ((q.title && q.title.ru) || '').match(pattern)).length;
    console.log('\n--- ' + fname + ' (' + totalInFile + ' matches) ---');
    matchedQuests.forEach(m => console.log(m));
}
console.log('\nTOTAL title.ru matches: ' + totalTitle);
