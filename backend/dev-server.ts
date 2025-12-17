import { app } from './app.js';
import { logger } from './lib/logger.js';

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Local Dev Server running on http://localhost:${PORT}`);
});
