export const getChatContainerHtml = () => `
	<div class="chat-container" id="chatContainer">
		<div class="messages" id="messages"></div>
	</div>
	<div id="conversationHistory" style="display: none;">
		<div class="history-content">
			<h3>Conversation History</h3>
			<div id="conversationList"></div>
		</div>
	</div>
`;