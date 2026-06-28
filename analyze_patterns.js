const fs = require('fs');
const path = require('path');

const dir = 'D:/artquest/src/renderer/data';
const files = ['quests_anatomy.json', 'quests_animation.json', 'quests_drawing.json', 'quests_effects.json', 'quests_storytelling.json'];

// Pattern: "без " + English word (semi-translated patterns)
console.log('=== Pattern: "без [English]" in description.ru ===');
for (const fname of files) {
    const fp = path.join(dir, fname);
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    const matches = [];
    for (const quest of data) {
        const ru = (quest.description && quest.description.ru) || '';
        const m = ru.match(/без\s+[A-Za-z]/g);
        if (m) {
            matches.push('  [' + quest.code + '] "...' + ru.substring(Math.max(0, ru.length-40)) + '"');
        }
    }
    if (matches.length > 0) {
        console.log('\n--- ' + fname + ' (' + matches.length + ') ---');
        matches.slice(0, 20).forEach(e => console.log(e));
    }
}

// Pattern: English words that are technical terms not translated
console.log('\n=== Common untranslated technical terms (counts across all files) ===');
const termCounts = {};
const allData = [];
for (const fname of files) {
    const fp = path.join(dir, fname);
    const data = JSON.parse(fs.readFileSync(fp, 'utf-8'));
    allData.push(...data);
}

const techTerms = ['blending', 'opacity', 'overlay', 'blend', 'timing', 'spacing', 'shape', 'layer', 'storyboard', 'palette', 'readability', 'VFX', 'PSD', 'grayscale', 'Crossfade', 'curves/levels', 'digital tracing', 'streamline', 'foreshortening', 'rule of thirds', 'leading lines', 'scatter', 'adjustment layers', 'organic feel', 'onion skinning', 'visemes', 'follow-through', 'spacing', 'hold frames', 'heat map', 'pronation', 'supination', 'bio-mechanics', 'anime', 'realism', 'mapping', 'rule continuity', 'pro level', 'speed run', 'blind', 'ctrl'];

for (const quest of allData) {
    const ru = (quest.description && quest.description.ru) + ' ' + (quest.title && quest.title.ru);
    for (const term of techTerms) {
        const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(escaped, 'gi');
        if (re.test(ru)) {
            termCounts[term] = (termCounts[term] || 0) + 1;
        }
    }
}
Object.entries(termCounts).sort((a, b) => b[1] - a[1]).forEach(([term, count]) => {
    console.log('  ' + term + ': ' + count);
});
