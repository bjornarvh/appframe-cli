
const { getItemIfExists, getSourceData, publishItemToDataObject } = require('./common.js');
const { putData } = require('../../appframe');

async function publishToArticleScript(config) {
	const { hostname, target, targetArticleId } = config;

	return await publishItemToDataObject({
		...config,
		createArticleId: 'appdesigner',
		createDataObjectId: 'dsScripts',
		fieldName: 'Script',
		filter: `[HostName] = '${hostname}' AND [ArticleID] = '${targetArticleId}' AND [ID] = '${target}'`,
		item: {
			ArticleID: targetArticleId,
			ID: target,
			HostName: hostname,
		},
		primKeyIndex: 4,
		updateArticleId: 'appdesigner-script',
		updateDataObjectId: 'dsScripts'
	});
}

async function publishToArticleStyle(config) {
	const { domain, hostname, source, sourceData, target } = config;

	try {
		const record = await getItemIfExists({
			articleId: 'appdesigner-css',
			domain,
			dataObjectId: 'dsArticle',
			filter: `[HostName] = '${hostname}' AND [ArticleID] = '${target}'`,
			hostname
		});

		if (record) {
			const startString = `/***** ---- START EXTERNAL STYLESHEET '${source}' ---- ****/`;
			const endString = `/***** ---- END EXTERNAL STYLESHEET '${source}' ---- ****/`;
			let [,,, css, primKey] = record;

			const startIdx = css.indexOf(startString);
			const endIdx = css.indexOf(endString) + endString.length;

			if (css.indexOf(startString) < 0) {
				console.log(`Inserting styles from '${source}' in article '${target}'...`);
				css += `\n\n${startString}\n${sourceData}\n${endString}\n\n`;
			} else {
				console.log(`Updating styles from '${source}' in article '${target}'...`);
				const before = css.substring(0, startIdx);
				const after = css.substring(endIdx);

				css = `${before}${startString}\n${sourceData}\n${endString}${after}`;
			}

			const status = await putData({
				articleId: 'appdesigner-css',
				dataObjectId: 'dsArticle',
				data: css,
				domain,
				fieldName: 'CSS',
				hostname,
				primKey,
			});

			return status ? true : false;
		} else {
			console.error(`Article '${target}' not found in host '${hostname}'. Can't publish style.`);

			return false;
		}
	} catch (ex) {
		console.error(ex.message);

		return false;
	}
}

module.exports = {
	publishToArticleScript,
	publishToArticleStyle
}
