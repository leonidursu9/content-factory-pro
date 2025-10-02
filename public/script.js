document.addEventListener('DOMContentLoaded', () => {
    const addButton = document.getElementById('add-button');
    const nicknameInput = document.getElementById('nickname-input');
    const linkInput = document.getElementById('link-input');
    const authorsList = document.getElementById('authors-list');
    const postsList = document.getElementById('posts-list');
    const updateAllButton = document.getElementById('update-all-button'); // <-- Работаем с этой кнопкой

    const fetchAuthors = async () => {
        try {
            const response = await fetch('/authors');
            const authors = await response.json();
            authorsList.innerHTML = '';
            authors.forEach(author => {
                const authorCard = document.createElement('div');
                authorCard.className = 'author-card';
                const displayName = author.name || author.nickname;
                authorCard.innerHTML = `
                    <p><strong>Имя:</strong> ${displayName}</p>
                    <p><strong>Никнейм:</strong> ${author.nickname}</p>
                    <p><strong>Подписчики:</strong> ${author.subscribers || 0}</p>
                    <a href="${author.link}" target="_blank">Ссылка на профиль</a>
                `;
                authorsList.appendChild(authorCard);
            });
        } catch (error) {
            console.error('Ошибка при загрузке авторов:', error);
            authorsList.innerHTML = 'Не удалось загрузить авторов.';
        }
    };
    
    const fetchPosts = async () => {
        try {
            const response = await fetch('/posts');
            const posts = await response.json();
            postsList.innerHTML = '';
            posts.forEach(post => {
                const postCard = document.createElement('div');
                postCard.className = 'post-card';
                postCard.innerHTML = `
                    <p><strong>Крючок:</strong> ${post.caption ? post.caption.substring(0, 150) : 'Нет описания'}...</p>
                    <p>❤️ ${post.likesCount} | 💬 ${post.commentsCount} | ▶️ ${post.viewsCount || 0}</p>
                    <a href="${post.url}" target="_blank">Посмотреть</a>
                    <button class="rewrite-button" data-caption="${escape(post.caption || '')}">Переписать сценарий</button>
                    <div class="rewritten-script" style="display:none; margin-top:10px; background-color: #e7f3ff; padding: 10px; border-radius: 5px; white-space: pre-wrap;"></div>
                `;
                postsList.appendChild(postCard);
            });
        } catch (error) {
            console.error('Ошибка при загрузке постов:', error);
            postsList.innerHTML = 'Не удалось загрузить посты.';
        }
    };
    
    addButton.addEventListener('click', async () => {
        if (!nicknameInput.value || !linkInput.value) {
            alert('Пожалуйста, заполните все поля.');
            return;
        }
        const authorData = {
            name: nicknameInput.value,
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
                nicknameInput.value = '';
                linkInput.value = '';
                fetchAuthors();
            } else {
                alert('Ошибка при добавлении автора.');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Сетевая ошибка.');
        }
    });

    updateAllButton.addEventListener('click', async () => {
        updateAllButton.innerText = 'Обновление...';
        updateAllButton.disabled = true;
        try {
            const response = await fetch('/parse-all', { method: 'POST' });
            if (response.ok) {
                alert('Обновление данных запущено! Список постов обновится через минуту.');
                setTimeout(fetchPosts, 60000); 
            } else {
                alert('Произошла ошибка при запуске обновления.');
            }
        } catch (error) {
            alert('Сетевая ошибка.');
        } finally {
            updateAllButton.innerText = 'Обновить данные по всем постам';
            updateAllButton.disabled = false;
        }
    });

    postsList.addEventListener('click', async (event) => {
        if (event.target.classList.contains('rewrite-button')) {
            const button = event.target;
            const caption = unescape(button.getAttribute('data-caption'));
            const scriptContainer = button.nextElementSibling;
            
            button.innerText = 'Думаю...';
            button.disabled = true;

            try {
                const response = await fetch('/rewrite', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: caption })
                });
                const data = await response.json();

                if (response.ok) {
                    scriptContainer.innerText = data.rewrittenText;
                    scriptContainer.style.display = 'block';
                    button.style.display = 'none';
                } else {
                    scriptContainer.innerText = 'Ошибка: ' + data.message;
                    scriptContainer.style.display = 'block';
                    button.innerText = 'Переписать сценарий';
                    button.disabled = false;
                }
            } catch (error) {
                console.error('Ошибка при переписывании:', error);
                alert('Сетевая ошибка при переписывании.');
                button.innerText = 'Переписать сценарий';
                button.disabled = false;
            }
        }
    });
    
    fetchAuthors();
    fetchPosts();
});