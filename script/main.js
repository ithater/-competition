/* eslint-disable indent */
// Меню
const leftMenu = document.querySelector('.left-menu');
const hamburger = document.querySelector('.hamburger');
const dropdowns = document.querySelectorAll('.dropdown');

// search__form
const searchFormInput = document.querySelector('#searchText');

// Ответ в случае неудачного поиска
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

// Закрытие dropdowns
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

	// добавляем фильтры
	addFiltersByType('movies', '#films .dropdown-list');
	addFiltersByType('species', '#species .dropdown-list');
	addFiltersByType('citizenship', '#citizenship .dropdown-list');
	addFiltersByType('gender', '#gender .dropdown-list');
	addFiltersByType('status', '#status .dropdown-list');
};

// рендерит по фильтрам (настрокам), по умолчанию выводит все карточки.
const renderFilteredJSON = (settings = []) => dbService.getReadyJson(data => {
	response.textContent = '';
	heroesHolder.textContent = '';

	if (settings.length === 0) {
		data.forEach(item => renderCard(item));
		return;
	}

	let globalSet;

	const getSetIntersection = (global, local) => new Set([...global].filter(x => local.has(x)));

	settings.forEach(({ type, key }, index) => {
		let localSet;
		// в case нельзя создавать переменные
		switch (type) {
			case 'status':
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



	if (globalSet.size === 0) {
		response.textContent = 'There are no сharacters who can support these filters.';
		heroesHolder.textContent = '';
		return;
	}

	globalSet.forEach(item => renderCard(item));
});

const toggle = (data, value, defaultValue = '') => {
	if (data === value) return defaultValue;
	return value;
};

const toggleCheck = parent => {
	const type = parent.dataset.type;


	if (type === 'movies') {
		parent.dataset.checked = toggle(parent.dataset.checked, 'true', 'false');
		parent.style.backgroundColor = toggle(parent.style.backgroundColor, 'rgb(0, 0, 0)');
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
};

hamburger.addEventListener('click', () => {
	hamburger.classList.toggle('open');
	leftMenu.classList.toggle('openMenu');
});

// Закрытие меню вне меню
document.addEventListener('click', evt => {
	if (!evt.target.closest('.left-menu')) {
		hamburger.classList.remove('open');
		leftMenu.classList.remove('openMenu');
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
		response.textContent = '';

		renderFilteredJSON();

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

		toggleCheck(parentOfLink);

		const settings = [];
		const checked = document.querySelectorAll('.dropdown-list li[data-checked="true"]');

		// возможно ... лишнее. Без них возвращает DOMStringMap, поэтому просто сразу сделал обычным объектом,
		// чтобы если что потом не было мороки.
		checked.forEach(({ dataset }) => settings.push({ ...dataset }));

		renderFilteredJSON(settings);
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

// Заполнение сайта всеми карточками, по умолчаню просто выводит все карточки.
renderFilteredJSON();

// Добавление фильтров в меню.
dbService.getReadyJson(data => addFilters(data));


console.log('searchFormInput: ', searchFormInput);

// поиск, импровизация.)  | не зависит от фильтров, при таком поиске они сбрасываются,
// работает только по имени (реальному, псевдоним, актер)
searchFormInput.addEventListener('input', () => {
	const checked = document.querySelectorAll('.dropdown-list li[data-checked="true"]');
	const value = searchFormInput.value.toLowerCase().trim();
	checked.forEach(item => {
		item.dataset.checked = '';
		item.style.backgroundColor = '';
	});

	dbService.getReadyJson(data => {
		const arr = data.filter(({ name, realName, actors }) => {
			if (!name && !realName && !actors) return;
			name = name?.toLowerCase();
			realName = realName?.toLowerCase();
			actors = actors?.toLowerCase();
			return name?.startsWith(value) || realName?.startsWith(value) || actors?.startsWith(value);
		});

		console.log(arr);
		heroesHolder.textContent = '';

		if (arr.length === 0) {
			response.textContent = 'There are no characters with that name.';
			return;
		}
		response.textContent = '';
		arr.forEach(item => renderCard(item));
	});
});

