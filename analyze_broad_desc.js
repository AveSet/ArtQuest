const fs = require('fs');
const path = require('path');

const dir = 'D:/artquest/src/renderer/data';
const files = ['quests_anatomy.json', 'quests_animation.json', 'quests_drawing.json', 'quests_effects.json', 'quests_storytelling.json'];

console.log('=== ALL ENGLISH WORDS IN description.ru (broader: any 3+ Latin letters) ===');
let total = 0;
for (const fname of files) {
    const fp = path.join(dir, fname);
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const matched = [];
    for (const quest of data) {
        const ru = (quest.description && quest.description.ru) || '';
        const words = ru.match(/[A-Za-z]{3,}/g);
        if (words) {
            total++;
            if (matched.length < 20) {
                matched.push('  [' + quest.code + '] ru="' + ru + '" -> eng: ' + JSON.stringify(words));
            }
        }
    }
    const cnt = data.filter(q => /[A-Za-z]{3,}/.test((q.description && q.description.ru) || '')).length;
    console.log('\n--- ' + fname + ' (' + cnt + ' quests with English in desc.ru) ---');
    matched.forEach(m => console.log(m));
}
console.log('\nTOTAL description.ru with any English: ' + total);
