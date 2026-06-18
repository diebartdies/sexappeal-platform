require('dotenv').config();
const connectDB = require('./config/database');
const svc = require('./services/smsOutreachService');
const PP = require('./models/PotentialProfessional');

function log(...a) {
  console.log(new Date().toISOString(), ...a);
}

(async () => {
  await connectDB();
  let round = 0;
  while (round < 12) {
    const all = await PP.find({}).select('_id smsStatus');
    const ids = all
      .filter((l) => l.smsStatus !== 'sent' && l.smsStatus !== 'failed')
      .slice(0, 100)
      .map((l) => l._id);
    if (ids.length === 0) {
      log('ALL DONE - no pending leads left');
      break;
    }
    round += 1;
    log('ROUND', round, 'sending', ids.length, 'leads');
    await svc.startTargetedOutreach({ leadIds: ids });
    log('ROUND', round, 'result', JSON.stringify(svc.getStatus()));
  }
  log('FINISHED after', round, 'rounds');
  process.exit(0);
})().catch((e) => {
  log('FATAL', (e && e.message) || String(e));
  process.exit(1);
});
