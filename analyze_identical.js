const fs = require('fs');
const path = require('path');

const dir = 'D:/artquest/src/renderer/data';
const files = ['quests_anatomy.json', 'quests_animation.json', 'quests_drawing.json', 'quests_effects.json', 'quests_storytelling.json'];

console.log('=== IDENTICAL title.ru === description.ru ===');
let totalSame = 0;
for (const fname of files) {
    const fp = path.join(dir, fname);
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const matchedQuests = [];
    for (const quest of data) {
        const t = (quest.title && quest.title.ru) || '';
        const d = (quest.description && quest.description.ru) || '';
        if (t && d && t === d) {
            totalSame++;
            if (matchedQuests.length < 20) {
                matchedQuests.push('  [' + quest.code + '] "' + t + '"');
            }
        }
    }
    const totalInFile = data.filter(q => {
        const t = (q.title && q.title.ru) || '';
        const d = (q.description && q.description.ru) || '';
        return t && d && t === d;
    }).length;
    console.log('\n--- ' + fname + ' (' + totalInFile + ' identical) ---');
    matchedQuests.forEach(m => console.log(m));
}
console.log('\nTOTAL identical title.ru === description.ru: ' + totalSame);
