const { createStore, flushAll } = require('../src/services/jsonStore');
const fs = require('fs').promises;
const path = require('path');

(async () => {
  const store = createStore('teststore.json');
  const guildKey = 'guild123';

  console.log('Setting key...');
  await store.set(guildKey, { hello: 'world' });
  const all = await store.getAll();
  if (!all[guildKey] || all[guildKey].hello !== 'world') {
    console.error('FAIL: set/get mismatch', all);
    process.exit(1);
  }

  console.log('Removing key...');
  await store.remove(guildKey);
  const all2 = await store.getAll();
  if (all2[guildKey]) {
    console.error('FAIL: remove failed', all2);
    process.exit(1);
  }

  console.log('Testing flushAll...');
  await store.set('temp', { a: 1 });
  await flushAll();

  const fp = path.join(process.cwd(), 'data', 'teststore.json');
  try {
    const raw = await fs.readFile(fp, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.temp || parsed.temp.a !== 1) {
      console.error('FAIL: flush content mismatch', parsed);
      process.exit(1);
    }
  } catch (err) {
    console.error('FAIL: could not read flushed file', err);
    process.exit(1);
  }

  console.log('All jsonStore tests passed');
  process.exit(0);
})();
