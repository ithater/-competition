/* eslint-disable indent */
class Aplication {
	constructor() {
		// Меню
		this.leftMenu = document.querySelector('.left-menu');
		this.hamburger = document.querySelector('.hamburger');
		this.dropdowns = document.querySelectorAll('.dropdown');

		// search__form
		this.searchFormInput = document.querySelector('#searchText');
		this.searchForm = document.querySelector('.search__form');

		// Ответ в случае неудачного поиска
		this.response = document.querySelector('#response');

		// Heroes-holder
		this.heroesHolder = document.querySelector('.heroes');

		// title
		this.logoTitle = document.querySelector('.title-wrapper');
	}

	getReadyJson() {
		return fetch('./dbHeroes-master/dbHeroes.json')
			.then(response => {
				if (response.status !== 200) throw new Error('Network status is not 200.');
				return response.json();
			})
			.catch(err => console.error(err));
	}

	// Обработка элемента
	renderCard({ name,
		realName,
		species,
		citizenship,
		gender,
		birthDay,
		status,
		actors,
		photo,
		movies,
		deathDay }) {

		const card = document.createElement('li');
		card.className = 'item';
		// если сразу прописывать card.innerHTML += и то что я пишу (верстка),
		// то получится, что <div class="info unselectable"> сам по себе закроется и получится билиберда,
		// поэтому через переменную.
		let layout = `
			<img src="${`./dbHeroes-master/` + photo}" alt="${name}">
			<div class="name">${name}</div>
					<div class="info unselectable">
							<ul class="stats">
		`;

		if (realName) layout += `<li>Real Name: ${realName}</li>`;
		else layout += `<li>Real Name: unknown</li>`;

		if (species) layout += `<li>Species: ${species[0].toLowerCase() + species.substring(1)}</li>`;
		if (citizenship) layout += `<li>Citizenship: ${citizenship[0].toLowerCase() + citizenship.substring(1)}</li>`;
		if (gender) layout += `<li>Gender: ${gender[0].toLowerCase() + gender.substring(1)}</li>`;

		if (birthDay) layout += `<li>Birthday: ${birthDay}</li>`;
		else layout += `<li>Birthday: unknown</li>`;

		// поскольку есть такие, где есть deathDay, но у персонажа стоит alive (например black widow), сделал проверку
		if (status && deathDay) layout += `<li>Status: deceased</li>`;
		else if (status) layout += `<li>Status: ${status[0].toLowerCase() + status.substring(1)}</li>`;

		if (deathDay) layout += `<li>Deathday: ${deathDay}</li>`;
		else if (status !== 'alive' && !deathDay) layout += `<li>Deathday: unknown</li>`;

		if (actors)layout += `<li>Actor: ${actors}</li>`;

		layout += '<br>';

		if (movies?.length > 0) {
			layout += `	<li>${movies.length === 1 ? 'Film' : 'Films'}: <ul class="films">`;
			movies.forEach(film => layout += `<li>${film}</li>`);
			layout += `</ul></li></ul></div>`;
		} else layout += `<li>Films: unknown</li>
		</ul></div>`;

		card.innerHTML = layout;
		this.heroesHolder.append(card);
	}

	// добавление фильтров
	addFilters(data) {
		const addFiltersByType = (type, selector) => {
			const holder = document.querySelector(selector);

			const set = new Set(data.reduce((acc, item) => {
				if (item[type]) return acc.concat(item[type]);
				else return acc;
			}, []));

			set.forEach(item => {
				const elem = document.createElement('li');
				elem.dataset.type = type;
				elem.dataset.key = item;

				elem.innerHTML = `                	
					<a href="#" class="link">
						<span>${item[0].toUpperCase() + item.substring(1)}</span>
					</a>
				`;

				holder.append(elem);
			});
		};

		// добавляем фильтры
		addFiltersByType('movies', '#films .dropdown-list');
		addFiltersByType('species', '#species .dropdown-list');
		addFiltersByType('citizenship', '#citizenship .dropdown-list');
		addFiltersByType('gender', '#gender .dropdown-list');
		addFiltersByType('status', '#status .dropdown-list');
	}

	// функция рендера по фильтрам (по умолчанию выводит все карточки)
	renderFilteredJSON(settings = []) {
		this.getReadyJson().then(data => {
			this.response.textContent = '';
			this.heroesHolder.textContent = '';

			// если нет настроек рисуем все карточки
			if (settings.length === 0) {
				data.forEach(item => this.renderCard(item));
				return;
			}

			let globalSet;

			const getSetIntersection = (global, local) => new Set([...global].filter(x => local.has(x)));

			// формируем глобальное множество
			settings.forEach(({ type, key }, index) => {
				let localSet;
				switch (type) {
					case 'status':
						// eslint-disable-next-line max-len
						if (key === 'alive') localSet = new Set(data.filter(item => item[type] === key && !item.deathDay));
						// eslint-disable-next-line max-len
						else if (key === 'deceased') localSet = new Set(data.filter(item => item[type] === key || item.deathDay));
						else localSet = new Set(data.filter(item => item[type] === key));
						globalSet = index === 0 ? localSet : getSetIntersection(globalSet, localSet);
						break;
					case 'movies':
						localSet = new Set(data.filter(item => item['movies'] && item['movies'].indexOf(key) > -1));
						globalSet = index === 0 ? localSet : getSetIntersection(globalSet, localSet);
							break;
					default:
						localSet = new Set(data.filter(item => item[type] === key));
						globalSet = index === 0 ? localSet : getSetIntersection(globalSet, localSet);
				}
			});

			// если глобальное множество пустое - информируем
			if (globalSet.size === 0) {
				this.response.textContent = 'There are no сharacters who can support these filters.';
				this.heroesHolder.textContent = '';
				return;
			}

			// иначе рисуем
			globalSet.forEach(item => this.renderCard(item));
		});
	}

	// обычная toggle функция, в зависимости от входной data возвращает противоположное значение
	toggle(data, value, defaultValue = '') {
		if (data === value) return defaultValue;
		return value;
	}

	// функция переключает фильтры
	toggleCheck(parent) {
		const type = parent.dataset.type;

		if (type === 'movies') {
			parent.dataset.checked = this.toggle(parent.dataset.checked, 'true', 'false');
			parent.style.backgroundColor = this.toggle(parent.style.backgroundColor, 'rgb(0, 0, 0)');
			return;
		}

		const checked = document.querySelector(`#${type} .dropdown-list li[data-checked="true"]`);

		parent.dataset.checked = "true";
		parent.style.backgroundColor = '#000';

		if (!checked) return;

		if (checked === parent) {

			checked.dataset.checked = "false";
			checked.style.backgroundColor = '';
			return;
		}

		switch (type) {
			case 'status':
			case 'citizenship':
			case 'species':
			case 'gender':
				checked.dataset.checked = 'false';
				checked.style.backgroundColor = '';
		}
	}

	// очищает выбранные фильтры
	clearChecked() {
		const checked = document.querySelectorAll('.dropdown-list li[data-checked="true"]');
		checked.forEach(item => {
			item.dataset.checked = '';
			item.style.backgroundColor = '';
		});
	}

	// Закрытие dropdowns
	closeDropdowns() {
		this.dropdowns.forEach(item => item.classList.remove('active'));
	}

	// закрытие меню
	closeMenu() {
		this.hamburger.classList.remove('open');
		this.leftMenu.classList.remove('openMenu');
	}

	// функция поиска (получает массив, ищет совпадения по имени)
	search(data, value) {
		const arr = data.filter(({ name, realName, actors }) => {
			if (!name && !realName && !actors) return;
			name = name?.toLowerCase();
			realName = realName?.toLowerCase();
			actors = actors?.toLowerCase();
			return name?.startsWith(value) || realName?.startsWith(value) || actors?.startsWith(value);
		});

		this.heroesHolder.textContent = '';

		if (arr.length === 0) {
			this.response.textContent = 'There are no characters with that name.';
			return;
		}
		this.response.textContent = '';
		arr.forEach(item => this.renderCard(item));
	}

	init() {
		// окрытие меню
		this.hamburger.addEventListener('click', () => {
			this.hamburger.classList.toggle('open');
			this.leftMenu.classList.toggle('openMenu');
		});

		// закрытие меню, при клике вне меню
		document.addEventListener('click', evt => {
			if (!evt.target.closest('.left-menu')) {
				this.closeMenu();
			}
		});

		// нажатие на лого возвращает приложение к начальному положению
		this.logoTitle.addEventListener('click', () => {
			this.heroesHolder.textContent = '';
			this.response.textContent = '';
			this.closeMenu();
			this.closeDropdowns();
			this.clearChecked();
			this.renderFilteredJSON();
		});

		// открытие/закрытие вкладок в меню и переход по фильтрам;
		this.leftMenu.addEventListener('click', evt => {
			evt.preventDefault();

			const target = evt.target;
			const dropdown = target.closest('.dropdown');
			const link = target.closest('.link');

			if (target.closest('#all')) {
				this.heroesHolder.textContent = '';
				this.response.textContent = '';

				this.renderFilteredJSON();

				this.closeMenu();
				this.closeDropdowns();

				// если выбрали другой пункт меню, то сбрасывем все выбранные фильмы
				this.clearChecked();
			}

			if (dropdown) {
				dropdown.classList.toggle('active');
				this.leftMenu.classList.add('openMenu');
				this.hamburger.classList.add('open');
				return;
			}

			if (link) {
				// переход по фильтру
				const parentOfLink = link.closest('li');

				this.toggleCheck(parentOfLink);

				const settings = [];
				const checked = document.querySelectorAll('.dropdown-list li[data-checked="true"]');

				// возможно ... лишнее. Без них возвращает DOMStringMap, поэтому просто сразу сделал обычным объектом,
				// чтобы если что потом не было мороки.
				checked.forEach(({ dataset }) => settings.push({ ...dataset }));

				this.renderFilteredJSON(settings);
			}
		});

		// показать/скрыть дополнительную информацию у карточек
		this.heroesHolder.addEventListener('click', evt => {
			const target = evt.target;

			if (target.closest('.item')) {
				const info = target.closest('.item').querySelector('.stats');
				info.style.opacity = this.toggle(+info.style.opacity, 1, 0);
			}

		});

		// Заполнение сайта всеми карточками, по умолчаню просто выводит все карточки.
		this.renderFilteredJSON();

		// Добавление фильтров в меню.
		this.getReadyJson().then(data => this.addFilters(data));

		// поиск, импровизация.)  | поиск не зависит от фильтров, при таком поиске они сбрасываются,
		// работает только по имени (реальному, псевдоним, актер)
		this.searchForm.addEventListener('submit', evt => evt.preventDefault());
		this.searchFormInput.addEventListener('input', () => {
			const value = this.searchFormInput.value.toLowerCase().trim();
			this.clearChecked();

			// запрашивает у сервера обьект и обрабатывает через функцию search.
			this.getReadyJson().then(data => this.search(data, value));
		});
	}
}


const aplication = new Aplication();
aplication.init();
