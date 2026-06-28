const translatte = require('translatte');
const fs = require('fs');

const inputFile = 'src/renderer/src/data/quests.json';
const outputFile = 'src/renderer/src/data/quests.json';

async function translateText(text, targetLang) {
  try {
    const result = await translatte(text, { to: targetLang });
    return result.text;
  } catch (e) {
    console.error('Error:', e.message);
    return text;
  }
}

async function main() {
  console.log('Loading quests...');
  const data = fs.readFileSync(inputFile, 'utf8');
  const quests = JSON.parse(data);
  
  const count = Math.min(quests.length, 100);
  console.log(`Translating ${count} quests to Russian...`);
  
  for (let i = 0; i < count; i++) {
    const quest = quests[i];
    
    console.log(`[${i + 1}/${count}] ${quest.title.en}`);
    
    try {
      quest.title.ru = await translateText(quest.title.en, 'ru');
      quest.description.ru = await translateText(quest.description.en, 'ru');
      await new Promise(r => setTimeout(r, 300));
    } catch (e) {
      console.error(`Error: ${e.message}`);
      quest.title.ru = quest.title.en;
      quest.description.ru = quest.description.en;
    }
  }
  
  console.log('Saving...');
  fs.writeFileSync(outputFile, JSON.stringify(quests, null, 2), 'utf8');
  console.log('Done!');
}

main();