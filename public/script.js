document.addEventListener('DOMContentLoaded', () => {

    const addButton = document.getElementById('add-button');
    const nameInput = document.getElementById('name-input');
    const nicknameInput = document.getElementById('nickname-input');
    const linkInput = document.getElementById('link-input');
    const authorsList = document.getElementById('authors-list'); // Находим блок для списка

    // --- НОВАЯ ФУНКЦИЯ: Загрузка и отображение авторов ---
    const fetchAuthors = async () => {
        try {
            const response = await fetch('/authors'); // Отправляем GET-запрос
            const authors = await response.json();   // Получаем массив авторов

            authorsList.innerHTML = ''; // Полностью очищаем текущий список на странице

            // Для каждого автора из массива создаем HTML-элемент и добавляем на страницу
            authors.forEach(author => {
                const authorCard = document.createElement('div');
                authorCard.className = 'author-card'; // Присваиваем класс для стилей
                authorCard.innerHTML = `
                    <p><strong>Имя:</strong> ${author.name}</p>
                    <p><strong>Никнейм:</strong> ${author.nickname}</p>
                    <a href="${author.link}" target="_blank">Ссылка на профиль</a>
                `;
                authorsList.appendChild(authorCard);
            });
        } catch (error) {
            console.error('Ошибка при загрузке авторов:', error);
            authorsList.innerHTML = 'Не удалось загрузить авторов.';
        }
    };

    // Вешаем обработчик на кнопку "Добавить" (как и раньше)
    addButton.addEventListener('click', async () => {
        const authorData = {
            name: nameInput.value,
            nickname: nicknameInput.value,
            link: linkInput.value,
        };

        try {
            const response = await fetch('/authors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(authorData)
            });

            if (response.ok) {
                nameInput.value = '';
                nicknameInput.value = '';
                linkInput.value = '';
                fetchAuthors(); // <-- САМОЕ ВАЖНОЕ: обновляем список после успешного добавления
            } else {
                alert('Ошибка при добавлении автора.');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Сетевая ошибка.');
        }
    });

    // --- Вызываем нашу новую функцию при первой загрузке страницы ---
    fetchAuthors();
});