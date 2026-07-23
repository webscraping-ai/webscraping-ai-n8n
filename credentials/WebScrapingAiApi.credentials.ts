import { IAuthenticateGeneric, ICredentialType, INodeProperties, ICredentialTestRequest, Icon } from 'n8n-workflow';

export class WebScrapingAiApi implements ICredentialType {
	// eslint-disable-next-line n8n-nodes-base/cred-class-field-name-uppercase-first-char
	name = 'webScrapingAiApi';
	displayName = 'WebScraping.AI API';

	icon: Icon = {
		light: 'file:../nodes/WebScrapingAi/webscrapingai.svg',
		dark: 'file:../nodes/WebScrapingAi/webscrapingai.svg',
	};

	documentationUrl = 'https://webscraping.ai/docs';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Your WebScraping.AI API key from https://webscraping.ai/dashboard',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			qs: {
				api_key: '={{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.webscraping.ai',
			url: '/account',
		},
	};
}
