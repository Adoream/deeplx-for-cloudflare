/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */
import { Hono } from 'hono';
import { translate } from './deeplx';

const app = new Hono();

app.get('/', (c) => c.json({
	code: 200,
	message: 'DeepL Free API, Developed by sjlleo and missuo. Go to /translate with POST. http://github.com/OwO-Network/DeepLX'
}));

app.post('/translate', async (c) => {
	const { TOKEN } = c.env;

	if (TOKEN) {
		const providedToken = c.req.header('Authorization');
		if (providedToken !== `Bearer ${TOKEN}`) {
			c.status(401);
			return c.json({
				code: 401,
				message: 'Invalid access token'
			});
		}
	}

	const body = await c.req.json();

	if (!body.text) {
		c.status(400);
		return c.json({
			code: 400,
			message: 'No Translate Text Found'
		});

	};

	// Solve 525 error
	const urls = [
		'https://deepl-proxy-deno.deno.dev/jsonrpc',
		'https://deepl-proxy-theta.vercel.app/jsonrpc',
		'https://colorful-api-tj8s2e.ampt.app/jsonrpc',
	];
	const randomUrl = urls[Math.floor(Math.random() * urls.length)];

	const result = await translate(body.source_lang, body.target_lang, body.text, { proxy_endpoint: randomUrl });

	c.status(result.code)
	return c.json(result)
});

app.notFound((c) => c.json({
	code: 404,
	message: 'Path not found'
}));

export default app;
