import type {
	INodeType,
	INodeTypeDescription,
	IExecuteFunctions,
} from 'n8n-workflow';

export class Random implements INodeType {

	description: INodeTypeDescription = {
		displayName: 'Random',
		name: 'random',
		icon: 'file:random.svg',
		group: ['transform'],
		version: 1,
		description: 'True Random Number Generator via Random.org',
		defaults: {
			name: 'Random',
		},
		inputs: ['main'],
		outputs: ['main'],
		codex: {
			categories: ['Utilities'],
			subcategories: { Utilities: ['Misc'] },
		},
		properties: [
			{
				displayName: 'True Random Number Generator',
				name: 'notice',
				type: 'notice',
				default: '',
				displayOptions: {},
				description: 'Generate a true random integer using Random.org within the inclusive range [Min, Max].',
			},
			{
				displayName: 'Min',
				name: 'min',
				type: 'number',
				typeOptions: {
					minValue: Number.MIN_SAFE_INTEGER,
				},
				default: 1,
				required: true,
				description: 'Lower bound (inclusive). Must be an integer.',
			},
			{
				displayName: 'Max',
				name: 'max',
				type: 'number',
				typeOptions: {
					minValue: Number.MIN_SAFE_INTEGER,
				},
				default: 100,
				required: true,
				description: 'Upper bound (inclusive). Must be an integer and >= Min.',
			},
		],
	};

	async execute(this: IExecuteFunctions) {
		const items = this.getInputData();
		// Node is non-batch; we read parameters from first item, but execute per item for consistency
		const returnData = [] as Array<{ json: any }>;

		for (let i = 0; i < items.length; i++) {
			const min = this.getNodeParameter('min', i) as number;
			const max = this.getNodeParameter('max', i) as number;

			if (!Number.isInteger(min) || !Number.isInteger(max)) {
				throw new Error('Parameters "Min" and "Max" must be integers.');
			}
			if (max < min) {
				throw new Error('Parameter "Max" must be greater than or equal to "Min".');
			}

			const url = `https://www.random.org/integers/?num=1&min=${min}&max=${max}&col=1&base=10&format=plain&rnd=new`;

			try {
				const response = await this.helpers.httpRequest({
					method: 'GET',
					url,
					headers: {
						'Accept': 'text/plain',
						'User-Agent': 'n8n-random-node/1.0',
					},
					timeout: 15000,
					returnFullResponse: false,
				}) as string;

				// Random.org returns plain text with a newline, e.g., "69\n"
				const trimmed = (response || '').toString().trim();
				const value = parseInt(trimmed, 10);
				if (!Number.isFinite(value)) {
					throw new Error('Unexpected response from Random.org');
				}

				returnData.push({ json: { value, min, max, source: 'random.org' } });
			} catch (err: any) {
				const status = err.statusCode || err.code || 'ERR';
				throw new Error(`Random.org request failed (${status}): ${err.message || err.toString()}`);
			}
		}

		return this.prepareOutputData(returnData);
	}
}
