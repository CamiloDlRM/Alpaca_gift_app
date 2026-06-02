import app from './app';
import { recoverStuckGifts } from './modules/alpaca/alpaca.service';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, async () => {
  console.log(`WealthGift backend running on port ${PORT}`);
  await recoverStuckGifts();
});
