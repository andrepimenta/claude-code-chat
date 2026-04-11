const getPluginsHtml = () => `
	<!-- Plugins modal -->
	<div id="pluginsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content">
			<div class="tools-modal-header">
				<span>Plugins</span>
				<button class="tools-close-btn" onclick="hidePluginsModal()">✕</button>
			</div>
			<div class="tools-list">
				<div class="mcp-servers-list" id="pluginsList">
					<!-- Installed plugins will be loaded here -->
				</div>
				<div class="mcp-popular-servers" id="pluginsMarketplace">
					<h4>Available Plugins</h4>
					<div class="marketplace-search">
						<input type="text" id="pluginsSearch" placeholder="Search plugins..." oninput="searchPlugins(this.value)" />
					</div>
					<div class="marketplace-grid" id="pluginsGrid">
					</div>
				</div>
			</div>
		</div>
	</div>
`;

export default getPluginsHtml;
