/**
 * Рассчитывает Коэффициент Виральности (КВ) и скорость набора просмотров.
 */
function calculateVirality(post) {
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

    const viralityScore = viewsPerHour + (likesPerHour * 10) + (commentsPerHour * 50);

    return {
        score: Math.round(viralityScore),
        viewsPerHour: Math.round(viewsPerHour)
    };
}

/**
 * Прогнозирует количество просмотров через 24 часа.
 */
function forecastViews(post, currentViews) {
    const { viewsPerHour } = calculateVirality(post);
    if (viewsPerHour <= 0) {
        return currentViews;
    }
    const predictedGrowth = viewsPerHour * 24;
    return currentViews + predictedGrowth;
}

module.exports = { calculateVirality, forecastViews };