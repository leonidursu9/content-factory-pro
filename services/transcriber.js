// ФАЙЛ: services/transcriber.js (С ПРИНУДИТЕЛЬНЫМ РУССКИМ ЯЗЫКОМ)

require('dotenv').config();
const { ApifyClient } = require('apify-client');

const APIFY_TOKEN = process.env.APIFY_API_KEY;
const TRANSCRIBER_ACTOR_ID = 'invideoiq/video-transcriber';

const client = new ApifyClient({ token: APIFY_TOKEN });

async function transcribeVideo(videoUrl) {
    if (!APIFY_TOKEN) {
        throw new Error("APIFY_API_KEY не найден в .env. Он нужен для транскрибатора.");
    }
    console.log(`[TRANSCRIBER] Начинаю транскрибацию для: ${videoUrl}`);

    try {
        const input = { 
            "video_url": videoUrl,
            // ДОБАВЛЕНО: Жестко указываем язык для распознавания
            "language": "ru" 
        };
        
        const run = await client.actor(TRANSCRIBER_ACTOR_ID).call(input);
        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        if (items && items.length > 0 && items[0].data && items[0].data.transcript) {
            const fullText = items[0].data.transcript.map(segment => segment.text).join(' ');
            console.log(`[TRANSCRIBER] Транскрибация успешна.`);
            return fullText;
        } else {
            console.log('[TRANSCRIBER] В ответе не найден текст транскрипции. Ответ:', JSON.stringify(items, null, 2));
            return null;
        }
    } catch (error) {
        console.error('[TRANSCRIBER] Критическая ошибка:', error);
        return null;
    }
}

module.exports = { transcribeVideo };