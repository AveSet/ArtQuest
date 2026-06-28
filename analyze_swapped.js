const fs = require('fs');
const path = require('path');

const dir = 'D:/artquest/src/renderer/data';
const files = ['quests_anatomy.json', 'quests_animation.json', 'quests_drawing.json', 'quests_effects.json', 'quests_storytelling.json'];

console.log('=== Checking for Russian/Cyrillic in title.en (might be swapped) ===');
for (const fname of files) {
    const fp = path.join(dir, fname);
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    let cnt = 0;
    const examples = [];
    for (const quest of data) {
        const en = (quest.title && quest.title.en) || '';
        if (/[\u0400-\u04FF]/.test(en)) {
            cnt++;
            if (examples.length < 10) {
                examples.push('  [' + quest.code + '] title.en="' + en + '"');
            }
        }
    }
    if (cnt > 0) {
        console.log('\n--- ' + fname + ' (' + cnt + ' Cyrillic in title.en) ---');
        examples.forEach(e => console.log(e));
    } else {
        console.log('\n--- ' + fname + ' (0 Cyrillic in title.en) ---');
    }
}

console.log('\n=== Checking for Russian/Cyrillic in description.en (might be swapped) ===');
for (const fname of files) {
    const fp = path.join(dir, fname);
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    let cnt = 0;
    const examples = [];
    for (const quest of data) {
        const en = (quest.description && quest.description.en) || '';
        if (/[\u0400-\u04FF]/.test(en)) {
            cnt++;
            if (examples.length < 10) {
                examples.push('  [' + quest.code + '] desc.en="' + en + '"');
            }
        }
    }
    if (cnt > 0) {
        console.log('\n--- ' + fname + ' (' + cnt + ' Cyrillic in desc.en) ---');
        examples.forEach(e => console.log(e));
    } else {
        console.log('\n--- ' + fname + ' (0 Cyrillic in desc.en) ---');
    }
}
