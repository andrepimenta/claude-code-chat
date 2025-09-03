export const getNotificationsHtml = () => `
		<!-- WSL Alert for Windows users -->
		<div id="wslAlert" class="wsl-alert" style="display: none;">
			<div class="wsl-alert-content">
				<div class="wsl-alert-icon">💻</div>
				<div class="wsl-alert-text">
					<strong>Looks like you are using Windows!</strong><br/>
					If you are using WSL to run Claude Code, you should enable WSL integration in the settings.
				</div>
				<div class="wsl-alert-actions">
					<button class="btn" onclick="openWSLSettings()">Enable WSL</button>
					<button class="btn outlined" onclick="dismissWSLAlert()">Dismiss</button>
				</div>
			</div>
		</div>

		<div id="yoloWarning" class="yolo-warning" style="display: none;">
			⚠️ Yolo Mode Active: Claude Code will auto-approve all tool requests.
		</div>
`;