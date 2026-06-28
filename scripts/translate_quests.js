const translatte = require('translatte');
const fs = require('fs');

const inputFile = 'src/renderer/src/data/quests.json';
const outputFile = 'src/renderer/src/data/quests_translated.json';

async function translateText(text, targetLang) {
  try {
    const result = await translatte(text, { to: targetLang });
    return result.text;
  } catch (e) {
    console.error('Translation error:', e.message);
    return text;
  }
}

async function main() {
  console.log('Loading quests...');
  const data = fs.readFileSync(inputFile, 'utf8');
  const quests = JSON.parse(data);
  
  console.log(`Translating ${quests.length} quests to Russian...`);
  
  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i];
    const enTitle = quest.title.en;
    
    try {
      console.log(`[${i + 1}/${quests.length}] Translating: ${enTitle.substring(0, 30)}...`);
      
      quest.title.ru = await translateText(enTitle, 'ru');
      quest.description.ru = await translateText(quest.description.en, 'ru');
      
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.error(`Error translating quest ${quest.id}:`, e.message);
      quest.title.ru = enTitle;
      quest.description.ru = quest.description.en;
    }
  }
  
  console.log('Saving...');
  fs.writeFileSync(outputFile, JSON.stringify(quests, null, 2), 'utf8');
  console.log('Done!');
}

main();