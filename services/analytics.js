// Вспомогательная функция для расчета скорости роста подписчиков
function getSubscriberGrowthRate(author) {
    if (!author || !author.subscribersHistory || author.subscribersHistory.length < 2) {
        return 1; // Возвращаем 1 (без изменений), если данных для расчета нет
    }
    const latest = author.subscribersHistory[author.subscribersHistory.length - 1];
    const previous = author.subscribersHistory[author.subscribersHistory.length - 2];
    
    if (previous.count === 0 || latest.count <= previous.count) {
        return 1;
    }
    
    // Рассчитываем процентный рост и превращаем в множитель (например, +10% = 1.1)
    const growthMultiplier = 1 + ( (latest.count - previous.count) / previous.count );
    
    // Ограничиваем максимальный буст до +50% к КВ, чтобы избежать аномалий
    return Math.min(growthMultiplier, 1.5);
}

// Основная функция расчета КВ, теперь принимает и автора
function calculateVirality(post, author) {
    if (!post || !post.metricsHistory || post.metricsHistory.length < 2) {
        return { score: 0, viewsPerHour: 0 };
    }

    const latest = post.metricsHistory[post.metricsHistory.length - 1];
    const previous = post.metricsHistory[post.metricsHistory.length - 2];
    const hoursDiff = (latest.timestamp.getTime() - previous.timestamp.getTime()) / (1000 * 60 * 60);

    if (hoursDiff < 0.1) {
        return { score: 0, viewsPerHour: 0 };
    }

    const viewsGained = latest.views - previous.views;
    const likesGained = latest.likes - previous.likes;
    const commentsGained = latest.comments - previous.comments;

    const viewsPerHour = viewsGained / hoursDiff;
    const likesPerHour = likesGained / hoursDiff;
    const commentsPerHour = commentsGained / hoursDiff;

    // Сначала считаем базовый КВ
    const baseScore = viewsPerHour + (likesPerHour * 10) + (commentsPerHour * 50);
    
    // Получаем коэффициент роста подписчиков
    const growthRate = getSubscriberGrowthRate(author);
    
    // Умножаем базовый КВ на коэффициент роста
    const finalScore = baseScore * growthRate;

    return {
        score: Math.round(finalScore),
        viewsPerHour: Math.round(viewsPerHour)
    };
}

// Функция прогноза остается без изменений
function forecastViews(post, currentViews) {
    const { viewsPerHour } = calculateVirality(post, post.author); // Передаем и автора
    if (viewsPerHour <= 0) {
        return currentViews;
    }
    const predictedGrowth = viewsPerHour * 24;
    return currentViews + predictedGrowth;
}

module.exports = { calculateVirality, forecastViews };