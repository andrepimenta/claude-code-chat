const getPluginsScript = () => `
		// ─── Plugins ───
		var topPlugins = (window.__topPlugins || []);
		var pluginsDisplayedList = null;

		function formatPluginName(name) {
			return name.replace(/-/g, ' ').replace(/\\b\\w/g, function(c) { return c.toUpperCase(); });
		}

		function showPluginsModal() {
			document.getElementById('pluginsModal').style.display = 'flex';
			loadInstalledPlugins();
			renderAvailablePlugins(topPlugins);
		}

		function hidePluginsModal() {
			document.getElementById('pluginsModal').style.display = 'none';
		}

		function loadInstalledPlugins() {
			vscode.postMessage({ type: 'loadPlugins' });
		}

		function displayPlugins(data) {
			var pluginsList = document.getElementById('pluginsList');
			pluginsList.innerHTML = '';
			var enabled = data.enabled || {};

			var keys = Object.keys(enabled);
			if (keys.length === 0) {
				pluginsList.innerHTML = '<div class="no-servers">' +
					'<div class="no-servers-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg></div>' +
					'<div class="no-servers-text">No plugins enabled</div>' +
					'</div>';
				return;
			}

			keys.forEach(function(installId) {
				var isEnabled = enabled[installId];
				var name = installId.replace(/@.*$/, '');
				var displayName = formatPluginName(name);
				var plugin = topPlugins.find(function(p) { return p.installId === installId; });
				var desc = plugin ? plugin.description : '';
				var verified = plugin ? plugin.verified : false;

				var item = document.createElement('div');
				item.className = 'mcp-server-item';
				var verifiedHtml = verified ? '<span class="marketplace-item-verified" title="Anthropic verified">&#10003;</span>' : '';
				var statusHtml = isEnabled ? '<span class="server-type" style="background:rgba(0,122,204,0.2);color:var(--vscode-charts-blue);">enabled</span>' : '<span class="server-type">disabled</span>';
				item.innerHTML = '<div class="server-info" style="min-width:0;overflow:hidden;">' +
					'<div class="server-name">' + escapeHtml(displayName) + verifiedHtml + ' ' + statusHtml + '</div>' +
					(desc ? '<div class="server-config" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + escapeHtml(desc) + '</div>' : '') +
					'</div>' +
					'<div class="server-actions" style="flex-shrink:0;">' +
					'<button class="btn outlined server-delete-btn" data-plugin="' + escapeHtml(installId) + '" onclick="removePlugin(this.dataset.plugin)">Remove</button>' +
					'</div>';
				pluginsList.appendChild(item);
			});
		}

		function renderAvailablePlugins(plugins) {
			var grid = document.getElementById('pluginsGrid');
			if (!grid) return;
			if (!plugins || plugins.length === 0) {
				grid.innerHTML = '<div class="marketplace-loading">No plugins found.</div>';
				return;
			}
			var html = '';
			plugins.forEach(function(plugin) {
				var name = plugin.name || 'Unknown';
				var displayName = formatPluginName(name);
				var desc = escapeHtml(plugin.description || 'No description');
				var verified = plugin.verified;
				var safeId = escapeHtml(plugin.installId || name).replace(/'/g, '&#39;');

				html += '<div class="marketplace-item" data-plugin-id="' + safeId + '" onclick="showPluginDetail(this.dataset.pluginId)">' +
					'<div class="marketplace-item-header">' +
					'<div class="marketplace-item-icon-placeholder">' + escapeHtml(displayName.charAt(0).toUpperCase()) + '</div>' +
					'<div class="marketplace-item-info">' +
					'<div class="marketplace-item-name">' + escapeHtml(displayName) + '</div>' +
					'</div>' +
					'</div>' +
					'<div class="marketplace-item-desc">' + desc + '</div>' +
					'</div>';
			});
			grid.innerHTML = html;
		}

		function searchPlugins(query) {
			if (!query) {
				renderAvailablePlugins(topPlugins);
				return;
			}
			var q = query.toLowerCase();
			var filtered = topPlugins.filter(function(p) {
				return (p.name && p.name.toLowerCase().indexOf(q) >= 0) ||
					(p.description && p.description.toLowerCase().indexOf(q) >= 0);
			});
			renderAvailablePlugins(filtered);
		}

		function showPluginDetail(installId) {
			var plugin = topPlugins.find(function(p) { return p.installId === installId; });
			if (!plugin) return;

			var name = plugin.name || 'Unknown';
			var displayName = formatPluginName(name);
			var desc = plugin.description || 'No description available.';
			var verified = plugin.verified;
			var verifiedHtml = verified ? '<span class="marketplace-item-verified" title="Anthropic verified">&#10003; Anthropic verified</span>' : '';

			var grid = document.getElementById('pluginsGrid');
			pluginsDisplayedList = grid.innerHTML;

			grid.innerHTML = '<div class="marketplace-detail">' +
				'<button class="marketplace-back-btn" onclick="backToPluginsList()">&#8592; Back</button>' +
				'<div class="marketplace-detail-header">' +
				'<div class="marketplace-item-icon-placeholder" style="width:40px;height:40px;font-size:18px;">' + escapeHtml(displayName.charAt(0).toUpperCase()) + '</div>' +
				'<div class="marketplace-detail-header-info">' +
				'<div class="marketplace-detail-name">' + escapeHtml(displayName) + '</div>' +
				'<div class="marketplace-detail-header-meta">' + verifiedHtml + '</div>' +
				'</div>' +
				'<button class="btn marketplace-install-btn" data-plugin="' + escapeHtml(installId) + '" onclick="installPlugin(this.dataset.plugin)">Enable</button>' +
				'</div>' +
				'<div class="marketplace-detail-desc">' + escapeHtml(desc) + '</div>' +
				'<div class="marketplace-detail-row"><a href="https://github.com/anthropics/claude-plugins-official/tree/main/' + (plugin.type === 'official' ? 'plugins' : 'external_plugins') + '/' + escapeHtml(name) + '" target="_blank" class="marketplace-detail-link">View on GitHub</a></div>' +
				'<div style="font-size:11px;color:var(--vscode-descriptionForeground);margin-top:4px;">Adds <code style="font-size:10px;">' + escapeHtml(installId) + '</code> to .claude/settings.json</div>' +
				'</div>';
		}

		function backToPluginsList() {
			var grid = document.getElementById('pluginsGrid');
			if (pluginsDisplayedList) {
				grid.innerHTML = pluginsDisplayedList;
			} else {
				renderAvailablePlugins(topPlugins);
			}
		}

		function installPlugin(installId) {
			vscode.postMessage({ type: 'installPlugin', installId: installId });
			hidePluginsModal();
		}

		function removePlugin(installId) {
			vscode.postMessage({ type: 'removePlugin', installId: installId });
		}
`;

export default getPluginsScript;
