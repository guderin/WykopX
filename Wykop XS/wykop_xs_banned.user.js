// ==UserScript==
// @name							Wykop XS - Ban Info - Informacje o banach
// @name:pl							Wykop XS - Ban Info - Informacje o banach
// @name:en							Wykop XS - Ban Info

// @version							3.0.50

// @description 					Wykop XS - Informacje o banach na profilach zbanowanych użytkowników. Wykop X Style znajdziesz na: http://styl.wykopx.pl
// @description:en 					Wykop XS - Shows precise info about banned users on Wykop.pl. Check out Wykop X Style here: http://styl.wykopx.pl


// Chcesz wesprzeć projekt Wykop X? Postaw kawkę:
// @contributionURL					https://buycoffee.to/wykopx

// @author							Wykop X <wykopx@gmail.com>









// @match							https://wykop.pl/*
// @supportURL						http://wykop.pl/tag/wykopwnowymstylu
// @namespace						Violentmonkey Scripts
// @compatible						chrome, firefox, opera, safari, edge
// @license							No License


// @require							https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js







// ==/UserScript==

(async function ()
{
	'use strict';

	const currentVersion = "3.0.50";
	let dev = false;

	const promoString = " [Dodane przez Wykop X #wykopwnowymstylu]";

	const root = document.documentElement;
	const head = document.head;
	const body = document.body;
	const bodySection = body.querySelector("section");
	const wykopxSettings = getComputedStyle(head); // getComputedStyle(document.documentElement) -- nie działa, nie wczytuje właściwości z :root
	const settings = {};

	const styleElement = document.createElement('style');
	styleElement.id = "wykopxs";
	let CSS = "";

	function setSettingsValueFromCSSProperty(settingName, defaultValueForWykopXS = true, propertyValueInsteadOfBoolean = false)
	{
		if (propertyValueInsteadOfBoolean) settings[settingName] = wykopxSettings.getPropertyValue(`--${settingName}`) ? wykopxSettings.getPropertyValue(`--${settingName}`).trim() : defaultValueForWykopXS;
		else settings[settingName] = wykopxSettings.getPropertyValue(`--${settingName}`) ? wykopxSettings.getPropertyValue(`--${settingName}`).trim() === '1' : defaultValueForWykopXS;
	}

	setSettingsValueFromCSSProperty("WykopXSEnabled");
	if (settings.WykopXSEnabled == false) return;
	/* WYKOP XS HEADER */



	let loadTime = dayjs();

	// wykop_xs_banned.user.js - START - 1
	setSettingsValueFromCSSProperty("infoboxUserBannedInfoOnProfilePage");
	// wykop_xs_banned.user.js - END - 1

	// wykop_xs_banned.user.js - START - 2
	if (settings.infoboxUserBannedInfoOnProfilePage)
	{
		waitForKeyElements("aside.profile-top:has(aside.info-box.red)", bannedUserProfileAside, false);

		// DODAJEMY INFO NA STRONIE PROFILOWEJ O SZCZEGÓŁACH BANA
		function bannedUserProfileAside(element)
		{
			const bannedUserObject = element?.__vue__?.user;

			if (!bannedUserObject) return;

			if (bannedUserObject.status == "banned" || bannedUserObject.status == "suspended")
			{
				const bannedRedBox = element.querySelector("aside.info-box.red p");
				let bannedRedBoxInnerHTML = `To konto jest obecnie ${bannedUserObject.status == "suspended" ? "zawieszone do wyjaśnienia" : "zbanowane"}. <br/><br/><strong>Wykop X</strong>: <br/>`;

				bannedUserObject.banned.wxs_ban_end_date_string = bannedUserObject.banned.expired; 											// "2024-01-04 17:22:31"
				bannedUserObject.banned.wxs_ban_end_date_object = dayjs(bannedUserObject.banned.wxs_ban_end_date_string);
				bannedUserObject.banned.wxs_ban_end_in_years = bannedUserObject.banned.wxs_ban_end_date_object.diff(loadTime, 'year');		// 5 > koniec bana za "5" lat
				bannedUserObject.banned.wxs_ban_end_in_months = bannedUserObject.banned.wxs_ban_end_date_object.diff(loadTime, 'month');	// 3 > koniec bana za: "3" miesiące
				bannedUserObject.banned.wxs_ban_end_in_days = bannedUserObject.banned.wxs_ban_end_date_object.diff(loadTime, 'day');		// 31 > koniec bana za 31 dni
				bannedUserObject.banned.wxs_ban_end_in_days = bannedUserObject.banned.wxs_ban_end_date_object.diff(loadTime, 'day');		// 31 > koniec bana za 31 dni
				bannedUserObject.banned.wxs_reason_lowercase = bannedUserObject.banned.reason.toLowerCase();
				// banEndDateDuration = banEndDateObject.toNow()


				// "Użytkowniczka @NadiaFrance dsotała bana za naruszenie regulaminu"
				if (bannedUserObject.status == "suspended") bannedRedBoxInnerHTML += `${bannedUserObject.gender == "f" ? "Użytkowniczka @" + bannedUserObject.username + " została zawieszona za" : "Użytkownik @" + bannedUserObject.username + " został zawieszony za"} ${bannedUserObject.banned.wxs_reason_lowercase}`;
				else bannedRedBoxInnerHTML += `${bannedUserObject.gender == "f" ? "Użytkowniczka @" + bannedUserObject.username + " dostała" : "Użytkownik @" + bannedUserObject.username + " dostał"} bana za ${bannedUserObject.banned.wxs_reason_lowercase}`;

				if (bannedUserObject.banned.wxs_ban_end_in_years > 100)
				{
					// Ban permanentny na 999 lat
					bannedRedBoxInnerHTML += `<br/><small>Ban permanentny. Śpij słodko aniołku [*] </small>`;
				}
				else
				{
					// "Koniec bana za 14 dni"
					bannedRedBoxInnerHTML += `<br/><small title="Czas końca bana dotyczy czasu letniego. \nWykop posiada błąd i nie rozpoznaje czasu zimowego, \ndlatego zimą i jesienią ban trwa o godzinę dłużej niż podany">
						Koniec bana <strong>${bannedUserObject.banned.wxs_ban_end_in_years > 1 ? "za " + bannedUserObject.banned.wxs_ban_end_in_years + " lat(a)" : bannedUserObject.banned.wxs_ban_end_in_months > 1 ? "za " + bannedUserObject.banned.wxs_ban_end_in_months + " miesiące(ęcy)" : bannedUserObject.banned.wxs_ban_end_in_days > 1 ? "za " + bannedUserObject.banned.wxs_ban_end_in_days + " dni" : bannedUserObject.banned.wxs_ban_end_date_object.isSame(loadTime, 'day') == true ? " już dzisiaj!  " : " jutro"}</strong><br/>`;
					// "Ban trwa do 2024-12-12 23:59:59"
					bannedRedBoxInnerHTML += `Ban trwa do ${bannedUserObject.banned.wxs_ban_end_date_string}<span style="cursor: help; padding: 0px 5px">ℹ</span></small>`;
				}

				bannedRedBox.innerHTML = bannedRedBoxInnerHTML;
			}
		}
	}
	// wykop_xs_banned.user.js - END - 2

})();


// https://cdn.jsdelivr.net/gh/CoeJoder/waitForKeyElements.js@latest/waitForKeyElements.js
/**
 * A utility function for userscripts that detects and handles AJAXed content.
 *
 * @example
 * waitForKeyElements("div.comments", (element) => {
 *   element.innerHTML = "This text inserted by waitForKeyElements().";
 * });
 *
 * waitForKeyElements(() => {
 *   const iframe = document.querySelector('iframe');
 *   if (iframe) {
 *     const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
 *     return iframeDoc.querySelectorAll("div.comments");
 *   }
 *   return null;
 * }, callbackFunc);
 *
 * @param {(string|function)} selectorOrFunction - The selector string or function.
 * @param {function}          callback           - The callback function; takes a single DOM element as parameter.
 *                                                 If returns true, element will be processed again on subsequent iterations.
 * @param {boolean}           [waitOnce=true]    - Whether to stop after the first elements are found.
 * @param {number}            [interval=300]     - The time (ms) to wait between iterations.
 * @param {number}            [maxIntervals=-1]  - The max number of intervals to run (negative number for unlimited).
 */
function waitForKeyElements(selectorOrFunction, callback, waitOnce, interval, maxIntervals)
{
	if (typeof waitOnce === "undefined")
	{
		waitOnce = true;
	}
	if (typeof interval === "undefined")
	{
		interval = 300;
	}
	if (typeof maxIntervals === "undefined")
	{
		maxIntervals = -1;
	}
	if (typeof waitForKeyElements.namespace === "undefined")
	{
		waitForKeyElements.namespace = Date.now().toString();
	}
	var targetNodes = (typeof selectorOrFunction === "function")
		? selectorOrFunction()
		: document.querySelectorAll(selectorOrFunction);

	var targetsFound = targetNodes && targetNodes.length > 0;
	if (targetsFound)
	{
		targetNodes.forEach(function (targetNode)
		{
			var attrAlreadyFound = `data-userscript-${waitForKeyElements.namespace}-alreadyFound`;
			var alreadyFound = targetNode.getAttribute(attrAlreadyFound) || false;
			if (!alreadyFound)
			{
				var cancelFound = callback(targetNode);
				if (cancelFound)
				{
					targetsFound = false;
				}
				else
				{
					targetNode.setAttribute(attrAlreadyFound, true);
				}
			}
		});
	}

	if (maxIntervals !== 0 && !(targetsFound && waitOnce))
	{
		maxIntervals -= 1;
		setTimeout(function ()
		{
			waitForKeyElements(selectorOrFunction, callback, waitOnce, interval, maxIntervals);
		}, interval);
	}
}