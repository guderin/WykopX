// ==UserScript==
// @name        Listy plusujących + MirkoCzat
// @name:pl     Listy plusujących + MirkoCzat
// @name:en     Listy plusujących + MirkoCzat
// @version     3.0.25


// @supportURL  		http://wykop.pl/tag/wykopwnowymstylu
// @contributionURL  	https://buycoffee.to/wykopx


// @author      Wykop X <wykopx@gmail.com>
// @namespace   Violentmonkey Scripts
// @match       https://wykop.pl/*


// @description Wykop X - Mikroczat.pl / Mirkoczat oraz dodanie usuniętej listy plusujących
// @description:en Wykop X - Mikroczat.pl / Mirkoczat and list of entry/comment voters


// @require https://unpkg.com/localforage@1.10.0/dist/localforage.min.js
// ///require https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js


// @compatible  chrome, firefox, opera, safari, edge
// @license     No License

// ==/UserScript==


const promoString = "- Wykop X";
const head = document.head;
const styleElement = document.createElement('style');
styleElement.id = "wykopxs_mikroczat";
let CSS = "";
let dev = false;



/*  --- ZMIANA USTAWIEŃ ---
jeśli chcesz zmienić domyślne ustawienia nie zmieniaj ich w tym kodzie.
Zmień je w przeglądarce w następujący sposób:

1. Wejdź na Wykop
2. Otwórz panel narzędzi deweloperskich klawiszem *F12* lub skrótem klawiaturowym *CTRL* + *SHIFT* + *C*
3. Przejdź na zakładkę "Aplikacja"
4. w panelu po lewej w sekcji "Pamięć" wybierz "Pamięć lokalna" i znajdź na liście https://wykop.pl
5. w głównym okienku pojawi się lista kilku wartości. Znajdź opcję "wykopx/settings/settings"
6. zmień wybraną opcję na true (aby ją włączyć) lub false (aby wyłączyć)


Domyślne wartości wyglądają tak:

{"votersFollow":true,"votersBlacklist":true,"votersBanned":true,"votersSuspended":true,"votersRemoved":true,"votersGenderF":false,"votersGenderM":false,"votersColorGreen":true,"votersColorOrange":false,"votersColorBurgundy":true}

*/





// DEFAULT SETTINGS - nie zmieniaj wartości poniżej. Zmień je w sposób opisany powyżej
const settings =
{
	showVotersList: true,			// włącza pokazywanie listy plusujących
	showAllVotersIfLessThan: 5,		// domyślnie Wykop pokazywał 5 osób, które zaplusowały. Możesz zmienić tę wartość na np. 10 albo 20. W sumie ile chcesz.
	votersFollow: true,				// pokazuje 🔔 przed użytkownikami, których obserwujesz
	votersBlacklist: true,			// pokazuje ⛔ przed użytkownikami, których blokujesz
	votersBanned: true,				// pokazuje użytkowników z aktywnym banem w kolorze i z ikonką 🍌
	votersSuspended: true,			// pokazuje ✖ przed kontami, które są w trakcie usuwania
	votersRemoved: true,			// pokazuje ✖ przed kontami, które są usunięte
	votersGenderF: false,			// pokazuje różową kropkę przed kobietami
	votersGenderM: false,			// pokazuje niebieską kropkę przed mężczyznami
	votersColorGreen: true,			// pokazuje zielonki w kolorze
	votersColorOrange: false,		// pokazuje pomarańczowych użytkowników w kolorze
	votersColorBurgundy: true,		// pokazuje użytkowników bordo w kolorze

	hideShareButton: true,			// ukrywa przycisk "Udostępnij"
	showFavouriteButton: true,		// pokazuje przycisk "Dodaj do ulubionych" (samą gwiazdkę)
	showFavouriteButtonLabel: true,	// pokazuje oprócz gwiazdki także tekst "Ulubione"

	addCommentPlus1WhenVotingOnEntry: false,		// gdy plusujesz wpis, dodaje komentarz "+1"
	addCommentPlus1WhenVotingOnComment: false,	// gdy plusujesz komentarz, dodaje komentarz "+1"
};



(async function ()
{
	// MIKROCZAT XS -- START
	let wykopDomain = "https://wykop.pl";
	let wxDomain = "https://wykopx.pl";
	const mikroczatDomain = "https://mikroczat.pl";
	const mikroczatPath = "/chat";
	let mikroczatChannel = "/";
	let mikroczatWindow = null;



	// LOCALSTORAGE
	localStorageSettings = localforage.createInstance({
		driver: localforage.LOCALSTORAGE,
		name: "wykopx",
		storeName: "settings",
	});

	// Try to get the settings from local storage
	await localStorageSettings.getItem('settings').then(async (localSettings) =>
	{
		if (localSettings)
		{
			mergeSettings(localSettings, settings);
		} else
		{
			localStorageSettings.setItem('settings', settings);
		}
		await localStorageSettings.setItem('settings', settings);
	}).catch((err) =>
	{
		console.error('An error occurred: ', err);
	});


	document.addEventListener("mousedown", (event) =>
	{
		if (!event.target.closest(".wykopx_open_mikroczat")) return;
		event.preventDefault();
		let windowOptions = "";
		let mikroczatURL = `${mikroczatDomain}`;

		if (event.shiftKey || event.ctrlKey || event.altKey || event.button === 2)
		{
			windowOptions = "popup";
		}

		// WykopXS unique
		const pathnameArray = new URL(document.URL).pathname.split("/");
		if (pathnameArray[1] == "tag")
		{
			mikroczatChannel = "/" + pathnameArray[2]; // nazwatagu
			mikroczatURL += `${mikroczatPath}${mikroczatChannel}`;
		}


		mikroczatWindow = window.open(mikroczatURL, 'mikroczat', windowOptions);
	});


	document.addEventListener("click", (event) =>
	{
		if (!event.target.closest(".wykopx_open_mikroczat")) return;
		event.preventDefault();
	});



	// WIADOMOŚCI OD MIKROCZAT
	window.addEventListener('message', function (event)
	{
		if (event.origin !== mikroczatDomain) return;
		console.log('Wiadomość z mikroczat.pl', event.data);
		//if (event.data == "MikroCzatOpened") mikroczatWindow.postMessage({ type: "token", token: window.localStorage.getItem("token") }, mikroczatDomain);
		if (event.data == "MikroCzatOpened") mikroczatWindow.postMessage({ type: "TokensObject", token: window.localStorage.getItem("token"), userKeep: window.localStorage.getItem("userKeep") }, mikroczatDomain);


		if (event.data == "MikroCzatLoggedIn") bodySection.dataset.mikroczatLogged = true;
		if (event.data == "MikroCzatClosed")
		{
			bodySection.dataset.mikroczatLogged = false;
			mikroczatWindow = null;
		}
	}, false);

	CSS += `body > section[data-mikroczat-logged="true"] li.wykopx_open_mikroczat_li:after
	{
		content: "🗯";
		color: white;
		position: absolute;
		top: -2px;
		right: -2px;
	}
	body > section[data-mikroczat-logged="false"] li.wykopx_open_mikroczat_li:after
	{
		content: "⊗";
		color: rgb(255, 255, 255, 0.3);
		position: absolute;
		top: -2px;
		right: -2px;
	}`;


	createNewNavBarButton({
		position: "left",
		// text: "Mikro<strong>czat</strong>",
		text: "Czat",
		title: `Otwórz wykopowy MikroCzat`,
		class: "open_mikroczat", // wykopx_open_mikroczat_li
		hideWithoutXStyle: false,
		url: mikroczatDomain,
		target: "mikroczat",
		icon: "https://i.imgur.com/9PvHlaA.png",
		number: null,
	})






	const debounce = (fn, time) =>
	{
		let timeoutHandler;
		return (...args) =>
		{
			clearTimeout(timeoutHandler);
			timeoutHandler = setTimeout(() =>
			{
				fn(...args)
			}, time);
		}
	}
	let debounceAddVotersList = debounce((target) => addVotersList(target), 1000);

	let parentNode = document.body;
	let observer = new MutationObserver((mutations) =>
	{
		mutations.forEach((mutation) =>
		{
			if (mutation.target && mutation.target.tagName === "SECTION")
			{


				if (mutation.target.matches("section.entry"))
				{
					if (settings.showVotersList) addVotersList(mutation.target);
					if (settings.showFavouriteButton) addFavouriteButton(mutation.target);

					let sectionEntryArray = mutation.target.querySelectorAll('section.entry');
					if (sectionEntryArray)
					{

						sectionEntryArray.forEach((el) =>
						{
							if (settings.showVotersList) addVotersList(el);
							if (settings.showFavouriteButton) addFavouriteButton(el);
						})
					}
				}
				else if (mutation.target.matches("section.stream.microblog"))
				{
					let sectionEntryArray = mutation.target.querySelectorAll('section.entry');
					if (sectionEntryArray)
					{
						sectionEntryArray.forEach((el) =>
						{
							if (settings.showVotersList) addVotersList(el);
							if (settings.showFavouriteButton) addFavouriteButton(el);
						})
					}
				}

				else
				{
					// console.log(" ------------- ");
					// console.log(" mutation.addedNodes: " + mutation.addedNodes);
					// console.log(mutation.addedNodes);
					// console.log(" mutation.attributeName: " + mutation.attributeName);
					// console.log(mutation.attributeName);
					// console.log(" mutation.attributeNamespace: " + mutation.attributeNamespace);
					// console.log(mutation.attributeNamespace);
					// console.log(" mutation.nextSibling: " + mutation.nextSibling);
					// console.log(mutation.nextSibling);
					// console.log(" mutation.oldValue: " + mutation.oldValue);
					// console.log(mutation.oldValue);
					// console.log(" mutation.previousSibling: " + mutation.previousSibling);
					// console.log(mutation.previousSibling);
					// console.log(" mutation.removedNodes: " + mutation.removedNodes);
					// console.log(mutation.removedNodes);
					// console.log(" mutation.target: " + mutation.target);
					// console.log(mutation.target);
					// console.log(" mutation.type: " + mutation.type);
				}
			}
		});
	});

	let config = { childList: true, subtree: true };
	observer.observe(parentNode, config);









	CSS += `
	section.entry-voters
	{
		ul
		{
			display: block flex;
			column-gap: 0.5em;
			row-gap: 0px;
			
			align-items: baseline;
			flex-wrap: wrap;

			padding: 0 0 0 0;
			margin: 0;
			list-style-type: none;
			position: relative;
			font-size: 12px;
			color: var(--gullGray);

			
			&::before
			{
				content: "Plusujący: ";
			}

			li
			{
				a.username
				{
					
					span
					{
						font-weight: normal;
					}

					&.banned, &.suspended
					{
						color: 
					}
				}

				&.more
				{
					cursor: pointer;
					font-weight: 700;
					text-transform: uppercase;
				}
			}
		}
	}
	
	section.entry-voters ul li:not(:last-child):after 		{ content: " • "; margin-left: 0.3em; }
	
	section.entry-voters ul li a.username i 				{ display: none; font-size: 0.8em; font-style: normal; bottom: 0px; position: relative; }
	section.entry-voters ul li a.username i:has(+span) 		{ margin-right: 1px; }
	section.entry-voters ul li a.username i.follow-true,
	section.entry-voters ul li a.username i.blacklist-true,
	section.entry-voters ul li a.username i.banned ,
	section.entry-voters ul li a.username i.suspended,
	section.entry-voters ul li a.username i.removed,
	section.entry-voters ul li a.username i.f-gender,
	section.entry-voters ul li a.username i.m-gender
	{ display: inline flex;} 
	
	
	section.entry-voters ul li a.username i.follow-true::before { content: '🔔'; }
	section.entry-voters ul li a.username i.blacklist-true::before { content: '⛔'; }
	section.entry-voters ul li a.username i.banned::before { content: '🍌'; }
	section.entry-voters ul li a.username i.suspended::before { content: '✖'; }
	section.entry-voters ul li a.username i.removed::before { content: '✖'; }
	section.entry-voters ul li a.username i.f-gender::before { content: '🟣'; font-size: 0.7em; bottom: 3px; }
	
	section.entry-voters ul li:has(a.username.burgundy-profile) { order: 5; }
	section.entry-voters ul li:has(a.username.green-profile) { order: 6; }
	section.entry-voters ul li:has(a.username.orange-profile) { order: 6; }
	section.entry-voters ul li:has(a.username.follow-true) { order: 1; }
	section.entry-voters ul li:has(a.username.blacklist-true) { order: 9; }
	section.entry-voters ul li.more { order: 10; }
	`;


	if (!settings?.votersColorOrange) CSS += `section.entry-voters ul li a.username.orange-profile { color: var(--gullGray); }`;
	if (!settings?.votersColorGreen) CSS += `section.entry-voters ul li a.username.green-profile { color: var(--gullGray); }`;
	if (!settings?.votersColorBurgundy) CSS += `section.entry-voters ul li a.username.burgundy-profile { color: var(--gullGray); }`;

	if (settings.hideShareButton) CSS += `section.actions ul li.sharing { display: none!important; }`;


	/* ULUBIONE */
	CSS += `

	section.actions > ul > li.favourite 
	{
		cursor: pointer;
		user-select: none;
		color: var(--gullGray);
		font-size: 14px;
		padding-left: 26px;
		transition: color .2s ease, opacity .2s ease;
	}

	.actions li.favourite span::before
	{
		content: '';
		width: 18px;
		height: 18px;
		display: block;
		position: absolute;
		left: 0;
		mask-size: 18px 18px;
		background: var(--gullGray);
		transition: background .2s ease;
		mask-image: url(/static/img/svg/favourite.svg);
	}
	
	.actions li.favourite.active span::before 
	{
		mask-image: url(/static/img/svg/favourite-filled.svg);
		background: var(--orange);
	}

	`;


	/* Wykop X Style 3.0 */
	CSS += `
	:root { --kolorBananowy1: rgba(255, 185, 0, 1); }
	section.entry-voters ul li a.username:is(.banned, .suspended):not(.removed) span  { color: var(--kolorBananowy1); };
	section.entry-voters ul li a.username.removed { color: rgb(0, 0, 0); }
	[data-night-mode] section.entry-voters ul li a.username.removed { background-color: rgba(255, 255, 255, 0.3); padding-left: 5rem; padding-right: 5rem; }
		`;



	/* HIDE ADS ALWAYS */
	CSS += `
		.pub-slot-wrapper
		{
			display: none!important;
		}`;


	styleElement.textContent = CSS;
	document.head.appendChild(styleElement);




	async function addVotersList(sectionEntry)
	{
		if (sectionEntry && sectionEntry?.__vue__ && sectionEntry?.__vue__.item.votes.up > 0)
		{

			if (sectionEntry?.__vue__ && settings.showAllVotersIfLessThan > 5 && sectionEntry?.__vue__.item.votes.up <= settings.showAllVotersIfLessThan)
			{
				let entryId, commentId;

				if (sectionEntry?.__vue__?.item.resource == "entry") 
				{
					entryId = sectionEntry?.__vue__?.item.id;
				}
				else if (sectionEntry?.__vue__?.item.resource == "entry_comment") 
				{
					entryId = sectionEntry?.__vue__?.item.parent.id;
					commentId = sectionEntry?.__vue__?.item.id;
				}

				let voters = await fetchAllVotersFromAPI(entryId, commentId);
				appendVotersToEntry(sectionEntry, voters);

			}
			else
			{
				appendVotersToEntry(sectionEntry, sectionEntry?.__vue__?.item?.votes?.users);
			}
		}
	}

	function addFavouriteButton(sectionEntry)
	{
		if (sectionEntry && sectionEntry?.__vue__)
		{
			const sectionActionsUL = sectionEntry.querySelector("section.actions:not(:has(li.favourite)) > ul");
			if (!sectionActionsUL) return;

			let entryId, commentId;

			let isFavourite = sectionEntry?.__vue__?.item.favourite;

			if (sectionEntry?.__vue__?.item.resource == "entry") 
			{
				entryId = sectionEntry?.__vue__?.item.id;
			}
			else if (sectionEntry?.__vue__?.item.resource == "entry_comment") 
			{
				entryId = sectionEntry?.__vue__?.item.parent.id;
				commentId = sectionEntry?.__vue__?.item.id;
			}

			const favButtonLI = document.createElement("li");
			favButtonLI.classList.add("favourite", "icon", "icon-favourite");
			favButtonLI.setAttribute('data-v-3791abaf', '');

			if (isFavourite) { favButtonLI.classList.add("active"); }

			const favButtonSpan = document.createElement("span");
			favButtonSpan.classList.add("favouriteButton");
			favButtonSpan.setAttribute('data-v-3791abaf', '');
			favButtonSpan.dataset.isFavourite = isFavourite;
			favButtonSpan.dataset.entryId = entryId;
			if (commentId) favButtonSpan.dataset.commentId = commentId;
			if (settings.showFavouriteButtonLabel) favButtonSpan.innerText = `Ulubione`;
			favButtonLI.appendChild(favButtonSpan);

			const sharingElement = sectionActionsUL.querySelector(".sharing");
			if (sharingElement) sharingElement.insertAdjacentElement("afterend", favButtonLI);

		}

	}




	function appendVotersToEntry(sectionEntry, voters)
	{

		const fiveVoters = voters;

		if (!fiveVoters || fiveVoters.length < 1) return false;

		let sectionEntryVotersHTML = `<ul data-v-6e6ed6ee="">`;

		fiveVoters.forEach(voter =>
		{
			sectionEntryVotersHTML += getListItemForUser(voter);
		});

		if (sectionEntry?.__vue__?.item?.votes.up > settings.showAllVotersIfLessThan && voters.length <= settings.showAllVotersIfLessThan)
		{
			sectionEntryVotersHTML += `
				<li data-v-6e6ed6ee="" data-no-bubble="" class="more">
					<span data-v-6e6ed6ee="" data-votes-up="${sectionEntry?.__vue__?.item?.votes.up}"`;

			if (sectionEntry?.__vue__?.item.resource == "entry") 
			{
				sectionEntryVotersHTML += `data-entry-id="${sectionEntry?.__vue__?.item.id}"`;
			}
			else if (sectionEntry?.__vue__?.item.resource == "entry_comment") 
			{
				sectionEntryVotersHTML += `data-entry-id="${sectionEntry?.__vue__?.item.parent.id}"`;
				sectionEntryVotersHTML += `data-comment-id="${sectionEntry?.__vue__?.item.id}"`;
			}

			sectionEntryVotersHTML += `>+${sectionEntry?.__vue__?.item?.votes.up - 5} innych</span></li>`;
		}


		sectionEntryVotersHTML += `</ul>`;
		const sectionEntryVoters = document.createElement("section");
		sectionEntryVoters.classList.add("entry-voters");
		sectionEntryVoters.setAttribute('data-v-6e6ed6ee', '');
		sectionEntryVoters.setAttribute('data-v-2aacfeb5', '');
		sectionEntryVoters.innerHTML = sectionEntryVotersHTML;

		const sectionEntryVotersElement = sectionEntry.querySelector('section.entry-voters');
		if (sectionEntryVotersElement)
		{
			let parentElement = sectionEntryVotersElement.parentNode;
			parentElement.replaceChild(sectionEntryVoters, sectionEntryVotersElement);
		}
		else
		{
			const editWrapper = sectionEntry.querySelector(".edit-wrapper");
			if (editWrapper) editWrapper.appendChild(sectionEntryVoters);
		}
	}

	function getListItemForUser(voter)
	{
		let userHTML = `<li data-v-6e6ed6ee="">
				<a data-v-ed9f6c56="" data-v-6e6ed6ee="" href="/ludzie/${voter.username}" class="username`;

		userHTML += ` ${voter.color}-profile`; 		// orange-profile green-profile burgundy-profile
		userHTML += ` ${voter.status}`;				// active banned suspended removed
		userHTML += ` follow-${voter.follow}`;		// follow-true  follow-false
		userHTML += ` verified-${voter.verified}`;	// verified-false
		userHTML += ` blacklist-${voter.blacklist}`;// blacklist-true blacklist-false
		userHTML += ` online-${voter.online}`;		// online-true online-false

		userHTML += ` ${voter.gender}-gender`;		// m-gender, f-gender, null-gender
		if (voter.gender == "m") userHTML += ` male`;
		else if (voter.gender == "f") userHTML += ` female`;
		userHTML += `">`;


		if (settings?.votersFollow && voter.follow) userHTML += `<i class="follow-true" title="Obserwujesz tego użytkownika"></i>`;
		if (settings?.votersVerified && voter.verified) userHTML += `<i class="verified-true" title="Ten użytkownik jest zweryfikowany"></i>`;
		if (settings?.votersBlacklist && voter.blacklist) userHTML += `<i class="blacklist-true" title="Ten użytkownik jest na Twojej czarnej liście"></i>`;
		if (settings?.votersOffline && !voter.online) userHTML += `<i class="online-false" title="Ten uzytkownik jest teraz offline"></i>`;
		if (settings?.votersOnline && voter.online) userHTML += `<i class="online-true" title="Ten uzytkownik jest teraz online"></i>`;
		if (settings?.votersBanned && voter.status == "banned") userHTML += `<i class="banned" title="Użytkownik dostał bana. Z dodatkiem Wykop XS - Ban Info możesz szybko sprawdzić przyczynę i długość trwania bana."></i>`;
		if (settings?.votersSuspended && voter.status == "suspended") userHTML += `<i class="suspended" title="To konto jest w trakcie usuwania."></i>`;
		if (settings?.votersRemoved && voter.status == "removed") userHTML += `<i class="removed" title="Konto usunięte"></i>`;
		if (settings?.votersGenderM && voter.gender == "m") userHTML += `<i class="${voter.gender}-gender" title="Wpis od niebieskiego"></i>`;
		if (settings?.votersGenderF && voter.gender == "f") userHTML += `<i class="${voter.gender}-gender" title="Plus od różowej"></i>`;

		userHTML += `<span data-v-ed9f6c56="">${voter.username}</span>
				</a>
			</li>`;

		return userHTML;
	}


	/*
	<section data-v-6e6ed6ee="" data-v-2aacfeb5="" class="entry-voters">
		<ul data-v-6e6ed6ee="">
			<li data-v-6e6ed6ee="" class="">
				<a data-v-ed9f6c56="" data-v-6e6ed6ee="" href="/ludzie/NaczelnyAgnostyk" class="username orange-profile active">
					<span data-v-ed9f6c56="">
						NaczelnyAgnostyk<!---->
					</span>
				</a>
			</li>
			<li data-v-6e6ed6ee="" data-no-bubble="" class="more">
				<span data-v-6e6ed6ee="">+5 innych</span>
			</li>
		</ul>
	</section>
	*/

	function fetchAllVotersFromAPI(entryId, commentId)
	{
		let apiURL = `https://wykop.pl/api/v3/entries/${entryId}/votes?page=1`
		if (commentId) apiURL = `https://wykop.pl/api/v3/entries/${entryId}/comments/${commentId}/votes`;

		return new Promise(async (resolve, reject) =>
		{
			await fetch(apiURL, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
			})
				.then((response) =>
				{
					if (!response.ok)
					{
						if (dev) console.log("HTTP error! status: ${response.status}");
						// throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json();
				})
				.then(async (responseJSON) =>
				{
					resolve(responseJSON.data);

				}).catch((error) =>
				{
					if (error instanceof TypeError)
					{
						console.error('Network error:', error); // AWARIA SERWERA WYPOKU
					} else
					{
						console.error('Other error:', error);
					}
					reject(error);
				});
		});
	}

	function postFavouriteToAPI(favourite, resource, id)
	{
		let apiURL = `https://wykop.pl/api/v3/favourites`;
		const method = favourite ? "POST" : "DELETE";
		const body = {
			data: {
				type: resource,
				source_id: id
			}
		}

		return new Promise(async (resolve, reject) =>
		{
			await fetch(apiURL, {
				method: method,
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
				body: JSON.stringify(body)
			})
				.then((response) =>
				{
					if (!response.ok)
					{
						if (dev) console.log("HTTP error! status: ${response.status}");
						// throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json();
				})
				.then(async (responseJSON) =>
				{
					resolve(responseJSON.data);

				}).catch((error) =>
				{
					if (error instanceof TypeError)
					{
						console.error('Network error:', error); // AWARIA SERWERA WYPOKU
					} else
					{
						console.error('Other error:', error);
					}
					reject(error);
				});

		});
	}

	function postCommentPlus1ToAPI(sectionEntry)
	{
		if (!sectionEntry || !sectionEntry.__vue__) return;

		const resource = sectionEntry.__vue__.item.resource;
		let entryId;
		let authorUsername = sectionEntry.__vue__.item.author.username;
		if (resource === "entry")
			entryId = sectionEntry.__vue__.item.id;

		else if (resource === "entry_comment")
			entryId = sectionEntry.__vue__.item.parent.id;

		// TODO ZNALEZISKA

		let apiURL = `https://wykop.pl/api/v3/entries/${entryId}/comments`;
		const method = "POST";
		const body = {
			data: {
				"content": `@${authorUsername} [+](https://greasyfork.org/en/scripts/489949)1`,
				"adult": false
			}
		}
		/*
		"data": 
			{
				"content": "**foobar** __foobar__ [lorem](https://www.wykop.pl) impsum!!! #nsfw #wykop",
				"embed": "1fde707843ss3fbe9cb4eed0asdfsdfc64ab9a4df6084199b39d2",
				"photo": "e07843ss3fbe9cb4saeed0asdfsdfc64b9a4df6084199b39d2",
				"adult": false
				}
			}
		*/

		return new Promise(async (resolve, reject) =>
		{
			await fetch(apiURL, {
				method: method,
				headers: {
					"Content-Type": "application/json",
					Authorization: "Bearer " + window.localStorage.getItem("token"),
				},
				body: JSON.stringify(body)
			})
				.then((response) =>
				{
					if (!response.ok)
					{
						if (dev) console.log("HTTP error! status: ${response.status}");
						// throw new Error(`HTTP error! status: ${response.status}`);
					}
					return response.json();
				})
				.then(async (responseJSON) =>
				{
					resolve(responseJSON.data);

				}).catch((error) =>
				{
					if (error instanceof TypeError)
					{
						console.error('Network error:', error); // AWARIA SERWERA WYPOKU
					} else
					{
						console.error('Other error:', error);
					}
					reject(error);
				});

		});
	}






	function mergeSettings(localSettings, defaultSettings)
	{
		for (let key in defaultSettings)
		{
			if (localSettings[key])
			{
				settings[key] = localSettings[key];
			}

			else if (!localSettings[key])
			{
				settings[key] = defaultSettings[key];
			}

		}
	}

	// li.more click
	document.addEventListener("click", async function (event)
	{
		if (event.target.closest("div.buttons button.plus"))
		{
			const sectionEntry = event.target.closest("section.entry[id]");

			// alert(sectionEntry.__vue__?.item?.voted)

			if (settings.addCommentPlus1WhenVotingOnEntry && sectionEntry && sectionEntry.__vue__?.item?.resource == "entry") postCommentPlus1ToAPI(sectionEntry);
			else if (settings.addCommentPlus1WhenVotingOnComment && sectionEntry && sectionEntry.__vue__?.item?.resource == "entry_comment") postCommentPlus1ToAPI(sectionEntry);
		}





		if (event.target.matches("li.more span"))
		{
			event.preventDefault();
			console.log(`Wykop XS pobiera listę ${event.target.dataset.votesUp} plusujących`);
			let voters = await fetchAllVotersFromAPI(event.target.dataset.entryId, event.target.dataset.commentId);
			let entry = event.target.closest("section.entry");
			appendVotersToEntry(entry, voters);
			return;
		}

		if (event.target.matches("span.favouriteButton"))
		{
			event.preventDefault();
			if (event.target.dataset.isFavourite == "true")
			{
				if (event.target.dataset.commentId) postFavouriteToAPI(false, "entry_comment", event.target.dataset.commentId);
				else postFavouriteToAPI(false, "entry", event.target.dataset.entryId);
				event.target.parentElement.classList.remove("active");
				event.target.dataset.isFavourite = "false";

			}
			else if (event.target.dataset.isFavourite == "false")
			{
				if (event.target.dataset.commentId) postFavouriteToAPI(true, "entry_comment", event.target.dataset.commentId);
				else postFavouriteToAPI(true, "entry", event.target.dataset.entryId);
				event.target.parentElement.classList.add("active");
				event.target.dataset.isFavourite = "true";
			}
			return;
		}
	}, false);

	function createNewNavBarButton(options)
	{

		let nav_ul;

		if (options.position == "left") nav_ul = document.querySelector("body header div.left nav.main ul");
		else if (options.position == "center") nav_ul = document.querySelector("body header div.right nav aside"); // doodle
		else nav_ul = document.querySelector("body header div.right nav ul"); // brak na wersji mobilnej

		if (nav_ul) 
		{
			let nav_ul_li;  // ! = nav_ul.querySelector(`li.wykopx_${options.class}_li`);

			if (!nav_ul_li)
			{
				nav_ul_li = document.createElement("li");

				if (options.data) nav_ul_li.setAttribute(options.data, null);
				if (options.hideWithoutXStyle == true) nav_ul_li.classList.add("wykopxs");
				addWykopXSClassesToElement(nav_ul_li, options.class, "li") // class="wykopx_aaaaaa_li"

				let nav_ul_li_a = document.createElement("a");
				nav_ul_li.dataset["v-5182b5f6"] = "";
				nav_ul_li_a.dataset["v-5182b5f6"] = "";

				if (options.url) nav_ul_li_a.setAttribute("href", options.url);
				if (options.href) nav_ul_li_a.setAttribute("href", options.href);
				if (options.target) nav_ul_li_a.setAttribute("target", options.target);
				if (options.title) nav_ul_li_a.setAttribute("title", options.title);
				if (options.data) nav_ul_li_a.setAttribute(options.data, null);

				nav_ul_li_a.classList.add("hybrid");
				if (options.class) addWykopXSClassesToElement(nav_ul_li_a, options.class);

				let nav_ul_li_a_span = document.createElement("span");
				nav_ul_li_a_span.innerHTML = options.text;

				nav_ul_li_a.appendChild(nav_ul_li_a_span);
				nav_ul_li.appendChild(nav_ul_li_a);

				if (options.insertAfter != null)
				{
					let section = nav_ul.querySelector(options.insertAfter);
					section.insertAdjacentElement('afterend', nav_ul_li);
				}
				else
				{
					nav_ul.appendChild(nav_ul_li);
				}
			}
		}
	}


	function addWykopXSClassesToElement(element, inputClassOrArray, suffix = null)
	{
		if (inputClassOrArray)
		{
			if (typeof inputClassOrArray === 'string')
			{
				element.classList.add(`wykopx_${inputClassOrArray}${suffix != null ? "_" + suffix : ""}`);
			}
			else if (Array.isArray(inputClassOrArray) && inputClassOrArray.every(item => typeof item === 'string'))
			{
				inputClassOrArray.map(item =>
				{
					element.classList.add(`wykopx_${item}${suffix != null ? "_" + suffix : ""}`);
				});
			}
		}
	}


})();








