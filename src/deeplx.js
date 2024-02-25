import { detect, toISO2 } from 'tinyld';

const initData = (source_lang, target_lang) => {
	return {
		jsonrpc: '2.0',
		method: 'LMT_handle_texts',
		params: {
			splitting: 'newlines',
			lang: {
				source_lang_user_selected: source_lang,
				target_lang: target_lang
			},
			commonJobParams: {
				wasSpoken: false,
				transcribeAS: '',
				// regionalVariant: 'en-US',
			},
		},
	};
}

const getICount = (translate_text) => {
	return Array.from(translate_text).filter(char => char === 'i').length;
}

const getRandomNumber = () => {
	return Math.floor(Math.random() * 99999 + 8300000) * 1000;
}

const getTimeStamp = (iCount) => {
	const ts = Date.now(); // Gets the current time in milliseconds
	if (iCount !== 0) {
		iCount += 1;
		return ts - (ts % iCount) + iCount;
	} else {
		return ts;
	}
}

const default_url = 'https://www2.deepl.com/jsonrpc';
const headers = {
	'Content-Type': 'application/json; charset=utf-8',
	'Accept': '*/*',
	'x-app-os-name': 'iOS',
	'x-app-os-version': '16.3.0',
	'x-app-device': 'iPhone13,2',
	'User-Agent': 'DeepL-iOS/2.9.1 iOS 16.3.0 (iPhone13,2)',
	'x-app-build': '510265',
	'x-app-version': '2.9.1',
	'Connection': 'keep-alive',
};

export const translate = async (source_lang, target_lang, translate_text, config) => {
	if (translate_text === '') {
		return {
			code: 404,
			message: 'No Translate Text Found'
		}
	}

	if (source_lang === '') {
		const lang = detect(translate_text);
		const deepLLang = toISO2(lang).toLocaleUpperCase();
		source_lang = deepLLang;
	}

	if (target_lang === '') {
		target_lang = 'EN';
	}

	const id = getRandomNumber();
	const postData = initData(source_lang, target_lang);
	const text = [{
		text: translate_text,
		requestAlternatives: 3
	}];
	postData.id = id;
	postData.params.texts = text;
	postData.params.timestamp = getTimeStamp(getICount(translate_text));

	let postStr = JSON.stringify(postData);
	if ((id + 5) % 29 === 0 || (id + 3) % 13 === 0) {
		postStr = postStr.replace('"method":"', '"method" : "');
	} else {
		postStr = postStr.replace('"method":"', '"method": "');
	}
	const resp = await fetch(config?.proxy_endpoint ?? default_url, { method: 'POST', headers: headers, body: postStr });

	if (!resp.ok) {
		return {
			code: resp.status,
			message: resp.status === 429
				? 'Too many requests, your IP has been blocked by DeepL temporarily, please don\'t request it frequently in a short time.'
				: 'Unknown error.'
		}
	}

	const res = await resp.json();

	const alternatives = [];
	for (const alternative of res.result.texts[0].alternatives) {
		alternatives.push(alternative.text);
	}

	return {
		code: 200,
		id: id,
		data: res.result.texts[0].text,
		alternatives: alternatives,
		source_lang: source_lang,
		target_lang: target_lang,
		method: 'Free'
	};
}
