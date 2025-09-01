import { getCoreTemplate } from './ui-core';
import { getHeaderHtml } from './ui-header';
import { getChatContainerHtml } from './ui-chat';
import { getInputControlsHtml } from './ui-input';
import { getNotificationsHtml } from './ui-notifications';
import { getModalsHtml } from './ui-modals';

export const getHtml = (isTelemetryEnabled: boolean) => {
	const bodyContent = `
		${getHeaderHtml()}
		${getChatContainerHtml()}
		${getNotificationsHtml()}
		${getInputControlsHtml()}
		${getModalsHtml()}
	`;
	
	return getCoreTemplate(isTelemetryEnabled, bodyContent);
};

export default getHtml;