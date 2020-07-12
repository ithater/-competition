// Меню
const leftMenu = document.querySelector('.left-menu');
const hamburger = document.querySelector('.hamburger');
const dropdowns = document.querySelectorAll('.dropdown');

// Ответ
const response = document.querySelector('#response');

// Heroes-holder
const heroesHolder = document.querySelector('.heroes');

// Класс для получения JSON
// eslint-disable-next-line no-unused-vars
class DBService {
	getReadyJson(callback) {
		const request = new XMLHttpRequest();
		request.open('GET', './dbHeroes-master/dbHeroes.json');
		request.setRequestHeader('Content-Type', 'aplication/json');
		request.send();

		request.addEventListener('readystatechange', () => {
			if (request.readyState === 4 && request.status === 200) {
				return callback(JSON.parse(request.responseText));
			}
		});
	}
}

const dbService = new DBService();


// Обработка элемента JSON
const renderCard = ({
	name,
	realName,
	species,
	citizenship,
	gender,
	birthDay,
	status,
	actors,
	photo,
	movies,
	deathDay
}) => {

	const card = document.createElement('li');
	card.className = 'item';
	// если сразу прописывать card.innerHTML += и то что я пишу,
	// то получится, что <div class="info unselectable"> сам по себе закроется и получится билеберда,
	// поэтому через переменную.
	let layout = `
		<img src="${`./dbHeroes-master/` + photo}" alt="${name}">
		<div class="name">${name}</div>
				<div class="info unselectable">
						<ul class="stats">
	`;

	if (realName) layout += `<li>Real Name: ${realName}</li>`;
	if (species) layout += `<li>Species: ${species[0].toLowerCase() + species.substring(1)}</li>`;
	if (citizenship) layout += `<li>Citizenship: ${citizenship[0].toLowerCase() + citizenship.substring(1)}</li>`;
	if (gender) layout += `<li>Gender: ${gender[0].toLowerCase() + gender.substring(1)}</li>`;
	if (birthDay) layout += `<li>Birthday: ${birthDay}</li>`;
	if (deathDay)layout += `<li>Deathday: ${deathDay}</li>`;
	// поскольку есть такие, где есть deathDay, но у персонажа стоит alive (например black widow), сделал проверку
	if (status && deathDay) layout += `<li>Status: deceased</li>`;
	else if (status) layout += `<li>Status: ${status[0].toLowerCase() + status.substring(1)}</li>`;
	if (actors)layout += `<li>Actor: ${actors}</li>`;

	if (movies && movies.length > 0) {
		layout += '<br>';
		layout += `	<li>${movies.length === 1 ? 'Film' : 'Films'}: <ul class="films">`;
		movies.forEach(film => layout += `<li>${film}</li>`);
		layout += `</ul></li></ul></div>`;
	} else layout += `</ul></div>`;


	card.innerHTML = layout;
	heroesHolder.append(card);
};

// Закрытие dropdown
const closeDropdowns = () => dropdowns.forEach(item => item.classList.remove('active'));

// добавление фильтров в меню
const addFilters = data => {
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

	// фильмы
	addFiltersByType('movies', '#films .dropdown-list');
	addFiltersByType('species', '#spicies .dropdown-list');
	addFiltersByType('citizenship', '#citizenship .dropdown-list');
	addFiltersByType('gender', '#gender .dropdown-list');
	addFiltersByType('status', '#status .dropdown-list');
};

// cb - функция рендера, или любая другая, которая будет работать с новым итерируемый объектом (кусочком);
const filterJSON = (type, key, cb) => dbService.getReadyJson(data => {
	if (type !== 'movies' && type !== 'status') cb(data.filter(item => item[type] === key));
	else if (type === 'movies') {
		let globalSet;

		key.forEach((key, index) => {
			const localSet = new Set(data.filter(item => {
				if (item[type] && item[type].indexOf(key) > -1) return true;
			}));


			if (index > 0) globalSet = new Set([...globalSet].filter(x => localSet.has(x)));
			else globalSet = localSet;

		});

		if (globalSet.size === 0) response.textContent = 'There are no heroes who participate in these films.';
		else response.textContent = '';
		cb(globalSet);
	} else if (type === 'status') {
		// поскольку есть такие, где есть deathDay, но у персонажа стоит alive (например black widow), сделал проверку
		if (key === 'alive') cb(data.filter(item => item[type] === key && !item.deathDay));
		else if (key === 'deceased') cb(data.filter(item => item[type] === key || item.deathDay));
		else cb(data.filter(item => item[type] === key));
	}
});

const toggle = (data, value, defaultValue = '') => {
	if (data === value) return defaultValue;
	return value;
};

hamburger.addEventListener('click', () => {
	hamburger.classList.toggle('open');
	leftMenu.classList.toggle('openMenu');
	closeDropdowns();
});

// Закрытие меню вне меню
document.addEventListener('click', evt => {
	if (!evt.target.closest('.left-menu')) {
		hamburger.classList.remove('open');
		leftMenu.classList.remove('openMenu');
		closeDropdowns();
	}
});

// Открытие/закрытие вкладок в меню и переход по фильтрам;
leftMenu.addEventListener('click', evt => {
	evt.preventDefault();
	const target = evt.target;
	const dropdown = target.closest('.dropdown');
	const link = target.closest('.link');

	if (target.closest('#all')) {
		heroesHolder.textContent = '';
		dbService.getReadyJson(arr => arr.forEach(item => renderCard(item)));
		hamburger.classList.remove('open');
		leftMenu.classList.remove('openMenu');
		closeDropdowns();

		// если выбрали другой пункт меню, то сбрасывем все выбранные фильмы
		const checked = document.querySelectorAll('.dropdown-list li[data-checked="true"]');
		checked.forEach(item => {
			item.dataset.checked = '';
			item.style.backgroundColor = '';
		});
	}

	if (dropdown) {
		dropdown.classList.toggle('active');
		leftMenu.classList.add('openMenu');
		hamburger.classList.add('open');
		return;
	}

	if (link) {
		// переход по фильтру
		const parentOfLink = link.closest('li');
		const type = parentOfLink.dataset.type;
		const key = parentOfLink.dataset.key;

		if (type !== 'movies') {
			hamburger.classList.remove('open');
			leftMenu.classList.remove('openMenu');
			closeDropdowns();
			heroesHolder.textContent = '';
			filterJSON(type, key, data => data.forEach(item => renderCard(item)));

			// если выбрали другой пункт меню, то сбрасывем все выбранные фильмы
			const checked = document.querySelectorAll('.dropdown-list li[data-checked="true"]');
			checked.forEach(item => {
				item.dataset.checked = '';
				item.style.backgroundColor = '';
			});

		}	else if (type === 'movies') {
			parentOfLink.dataset.checked = toggle(parentOfLink.dataset.checked, 'true', 'false');
			parentOfLink.style.backgroundColor = toggle(parentOfLink.style.backgroundColor, 'rgb(0, 0, 0)');

			const checked = [...document.querySelectorAll('.dropdown-list li[data-checked="true"]')];
			const keys = checked.map(item => item.dataset.key);
			heroesHolder.textContent = '';
			if (keys.length === 0) dbService.getReadyJson(arr => arr.forEach(item => renderCard(item)));
			else filterJSON(type, keys, data => data.forEach(item => renderCard(item)));
		}




	}
});

// показать/скрыть дополнительную информацию у карточек
heroesHolder.addEventListener('click', evt => {
	const target = evt.target;

	if (target.closest('.item')) {
		const info = target.closest('.item').querySelector('.stats');
		info.style.opacity = toggle(+info.style.opacity, 1, 0);
	}

});

// Заполнение сайта всеми карточками.
dbService.getReadyJson(arr => arr.forEach(item => renderCard(item)));

// Добавление фильтров в меню
dbService.getReadyJson(data => addFilters(data));

