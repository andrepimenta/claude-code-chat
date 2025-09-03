import getScript from '../script';
import styles from '../ui-styles';

export const getCoreTemplate = (isTelemetryEnabled: boolean, bodyContent: string) => `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Claude Code Chat</title>
	${styles}
</head>
<body>
	${bodyContent}

	${getScript(isTelemetryEnabled)}
	
	<!-- 
	Analytics FAQ:
	
	1. Is Umami GDPR compliant?
	Yes, Umami does not collect any personally identifiable information and anonymizes all data collected. Users cannot be identified and are never tracked across websites.
	
	2. Do I need to display a cookie notice to users?
	No, Umami does not use any cookies in the tracking code.
	-->
	${isTelemetryEnabled ? '<script defer src="https://cloud.umami.is/script.js" data-website-id="d050ac9b-2b6d-4c67-b4c6-766432f95644"></script>' : '<!-- Umami analytics disabled due to VS Code telemetry settings -->'}
</body>
</html>`;