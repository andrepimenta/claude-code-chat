const getSkillsScript = () => `
		// ─── Skills ───
		var skillsSearchTimeout = null;
		var skillsCache = null;
		var topSkills = (window.__topSkills || []);

		function showSkillsModal() {
			sendStats('Skills modal opened');
			document.getElementById('skillsModal').style.display = 'flex';
			loadInstalledSkills();
			if (topSkills.length > 0) {
				renderFeaturedSkills(topSkills);
			}
		}

		function renderFeaturedSkills(skills) {
			var grid = document.getElementById('skillsGrid');
			if (!grid) return;
			var html = '';
			skills.forEach(function(skill) {
				var name = skill.name || 'Unknown';
				var installs = skill.installs || 0;
				var source = skill.source || '';
				var installsHtml = installs > 0 ? '<span class="marketplace-item-stars">' + (installs >= 1000 ? (Math.round(installs / 100) / 10) + 'k' : installs) + ' installs</span>' : '';
				var safeId = escapeHtml(skill.id || name).replace(/'/g, '&#39;');

				var rawUrl = skill.rawUrl || '';
				var installsText = installs >= 1000 ? (Math.round(installs / 100) / 10) + 'k installs' : (installs > 0 ? installs + ' installs' : '');
				html += '<div class="marketplace-item" data-skill-id="' + safeId + '" data-skill-source="' + escapeHtml(source) + '" data-skill-name="' + escapeHtml(name) + '" data-skill-rawurl="' + escapeHtml(rawUrl) + '" data-skill-installs="' + escapeHtml(installsText) + '" onclick="installSkillFromMarketplace(this)">' +
					'<div class="marketplace-item-header">' +
					'<div class="marketplace-item-icon-placeholder">' + escapeHtml(name.charAt(0).toUpperCase()) + '</div>' +
					'<div class="marketplace-item-info">' +
					'<div class="marketplace-item-name">' + escapeHtml(name) + '</div>' +
					'<div class="marketplace-item-meta">' + installsHtml + '</div>' +
					'</div>' +
					'</div>' +
					'<div class="marketplace-item-desc">' + escapeHtml(source) + '</div>' +
					'</div>';
			});
			grid.innerHTML = html;
		}

		function hideSkillsModal() {
			document.getElementById('skillsModal').style.display = 'none';
		}

		function loadInstalledSkills() {
			vscode.postMessage({ type: 'loadSkills' });
		}

		function displaySkills(skills) {
			var skillsList = document.getElementById('skillsList');
			skillsList.innerHTML = '';

			if (!skills || skills.length === 0) {
				skillsList.innerHTML = '<div class="no-servers">' +
					'<div class="no-servers-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>' +
					'<div class="no-servers-text">No skills installed</div>' +
					'<button class="btn outlined no-servers-btn" onclick="showSkillAddForm()">+ Create skill</button>' +
					'</div>';
				return;
			}

			skills.forEach(function(skill, idx) {
				var item = document.createElement('div');
				item.className = 'mcp-server-item';
				item.style.flexDirection = 'column';
				item.style.alignItems = 'stretch';
				var desc = skill.description || 'No description';
				var content = skill.content || '';
				var detailId = 'skill-detail-' + idx;
				item.innerHTML = '<div class="skill-item-row">' +
					'<div class="skill-item-info">' +
					'<div class="server-name">' + escapeHtml(skill.name) + ' <span class="server-type">' + escapeHtml(skill.scope) + '</span></div>' +
					'<div class="skill-item-desc">' + escapeHtml(desc) + '</div>' +
					'</div>' +
					'<div class="server-actions" style="flex-shrink:0;">' +
					'<button class="btn outlined" style="font-size:11px;padding:3px 8px;" onclick="toggleSkillDetail(\\'' + detailId + '\\')">Details</button>' +
					'<button class="btn outlined server-delete-btn" data-skill="' + escapeHtml(skill.name) + '" data-scope="' + escapeHtml(skill.scope) + '" onclick="deleteSkill(this.dataset.skill, this.dataset.scope)">Delete</button>' +
					'</div>' +
					'</div>' +
					'<div id="' + detailId + '" class="skill-detail-content" style="display:none;">' +
					'<pre style="white-space:pre-wrap;font-size:11px;color:var(--vscode-descriptionForeground);margin:8px 0 0;max-height:200px;overflow-y:auto;">' + escapeHtml(content) + '</pre>' +
					'</div>';
				skillsList.appendChild(item);
			});

			// Add create button at bottom
			var addDiv = document.createElement('div');
			addDiv.className = 'mcp-add-server';
			addDiv.innerHTML = '<button class="btn outlined" onclick="showSkillAddForm()">+ Create skill</button>';
			skillsList.appendChild(addDiv);
		}

		function showSkillAddForm() {
			document.getElementById('skillsList').style.display = 'none';
			document.getElementById('skillsMarketplace').style.display = 'none';
			document.getElementById('skillAddForm').style.display = 'block';
			// Clear form
			document.getElementById('skillName').value = '';
			document.getElementById('skillDescription').value = '';
			document.getElementById('skillContent').value = '';
			document.getElementById('skillName').disabled = false;
		}

		function hideSkillAddForm() {
			document.getElementById('skillsList').style.display = '';
			document.getElementById('skillsMarketplace').style.display = 'block';
			document.getElementById('skillAddForm').style.display = 'none';
			loadInstalledSkills();
		}

		function saveSkill() {
			var name = document.getElementById('skillName').value.trim();
			var description = document.getElementById('skillDescription').value.trim();
			var scope = document.getElementById('skillScope').value;
			var content = document.getElementById('skillContent').value;

			if (!name) return;

			// Build SKILL.md content
			var skillMd = '---\\n';
			skillMd += 'name: ' + name + '\\n';
			if (description) {
				skillMd += 'description: ' + description + '\\n';
			}
			skillMd += '---\\n\\n';
			skillMd += content || '';

			vscode.postMessage({
				type: 'saveSkill',
				name: name,
				scope: scope,
				content: skillMd
			});

			hideSkillAddForm();
		}

		function deleteSkill(name, scope) {
			vscode.postMessage({
				type: 'deleteSkill',
				name: name,
				scope: scope
			});
		}

		function searchSkills(query) {
			clearTimeout(skillsSearchTimeout);
			skillsSearchTimeout = setTimeout(function() {
				if (!query || query.length < 2) {
					renderFeaturedSkills(topSkills);
					return;
				}
				// Filter featured locally first
				var q = query.toLowerCase();
				var local = topSkills.filter(function(s) {
					return (s.name && s.name.toLowerCase().indexOf(q) >= 0) ||
						(s.source && s.source.toLowerCase().indexOf(q) >= 0);
				});
				if (local.length > 0) {
					renderFeaturedSkills(local);
				} else {
					var grid = document.getElementById('skillsGrid');
					grid.innerHTML = '<div class="marketplace-loading">Searching...</div>';
				}
				// Also search API
				vscode.postMessage({ type: 'searchSkills', query: query });
			}, 300);
		}

		function handleSkillsSearchResponse(data) {
			var grid = document.getElementById('skillsGrid');
			if (!grid) return;

			var skills = data.skills || [];
			if (skills.length === 0) {
				grid.innerHTML = '<div class="marketplace-loading">No skills found.</div>';
				return;
			}

			var html = '';
			skills.forEach(function(skill) {
				var name = skill.name || skill.skillId || 'Unknown';
				var installs = skill.installs || 0;
				var source = skill.source || '';
				var safeId = escapeHtml(skill.id || name).replace(/'/g, '&#39;');

				var installsHtml = installs > 0 ? '<span class="marketplace-item-stars">' + (installs >= 1000 ? (Math.round(installs / 100) / 10) + 'k' : installs) + ' installs</span>' : '';

				var rawUrl = skill.rawUrl || '';
				var installsText = installs >= 1000 ? (Math.round(installs / 100) / 10) + 'k installs' : (installs > 0 ? installs + ' installs' : '');
				html += '<div class="marketplace-item" data-skill-id="' + safeId + '" data-skill-source="' + escapeHtml(source) + '" data-skill-name="' + escapeHtml(name) + '" data-skill-rawurl="' + escapeHtml(rawUrl) + '" data-skill-installs="' + escapeHtml(installsText) + '" onclick="installSkillFromMarketplace(this)">' +
					'<div class="marketplace-item-header">' +
					'<div class="marketplace-item-icon-placeholder">' + escapeHtml(name.charAt(0).toUpperCase()) + '</div>' +
					'<div class="marketplace-item-info">' +
					'<div class="marketplace-item-name">' + escapeHtml(name) + '</div>' +
					'<div class="marketplace-item-meta">' + installsHtml + '</div>' +
					'</div>' +
					'</div>' +
					'<div class="marketplace-item-desc">' + escapeHtml(source) + '</div>' +
					'</div>';
			});
			grid.innerHTML = html;
		}

		var skillsDisplayedList = null;

		function installSkillFromMarketplace(el) {
			var source = el.dataset.skillSource;
			var name = el.dataset.skillName;
			var installs = el.dataset.skillInstalls || '';

			if (!source || !name) return;

			var repoUrl = 'https://github.com/' + source.replace(/^github\\//, '');
			var installsHtml = installs ? '<span class="marketplace-item-stars">' + installs + '</span>' : '';

			var grid = document.getElementById('skillsGrid');
			// Save current grid content to restore on back
			skillsDisplayedList = grid.innerHTML;

			grid.innerHTML = '<div class="marketplace-detail">' +
				'<button class="marketplace-back-btn" onclick="backToSkillsList()">&#8592; Back</button>' +
				'<div class="marketplace-detail-header">' +
				'<div class="marketplace-item-icon-placeholder" style="width:40px;height:40px;font-size:18px;">' + escapeHtml(name.charAt(0).toUpperCase()) + '</div>' +
				'<div class="marketplace-detail-header-info">' +
				'<div class="marketplace-detail-name">' + escapeHtml(name) + '</div>' +
				'<div class="marketplace-detail-header-meta">' +
				installsHtml +
				'<a href="' + escapeHtml(repoUrl) + '" target="_blank" class="marketplace-detail-link">GitHub</a>' +
				'</div>' +
				'</div>' +
				'</div>' +
				'<div class="marketplace-detail-desc">' + escapeHtml('Source: ' + source) + '</div>' +
				'<div class="marketplace-detail-config">' +
				'<div class="marketplace-detail-section-title">Install to</div>' +
				'<div class="form-group" style="margin:0;">' +
				'<select id="skillInstallScope">' +
				'<option value="project">Project (.claude/skills/)</option>' +
				'<option value="global">Global (~/.claude/skills/)</option>' +
				'</select>' +
				'</div>' +
				'</div>' +
				'<div class="marketplace-detail-actions" style="margin-top:12px;">' +
				'<button class="btn" data-source="' + escapeHtml(source) + '" data-name="' + escapeHtml(name) + '" onclick="confirmSkillInstall(this)">Install</button>' +
				'<div style="font-size:11px;color:var(--vscode-descriptionForeground);margin-top:6px;">Opens a terminal running <code style="font-size:10px;">npx skills add</code> via <a href="https://skills.sh" target="_blank" class="marketplace-detail-link">skills.sh</a></div>' +
				'</div>' +
				'</div>';
		}

		function backToSkillsList() {
			var grid = document.getElementById('skillsGrid');
			if (skillsDisplayedList) {
				grid.innerHTML = skillsDisplayedList;
			} else {
				renderFeaturedSkills(topSkills);
			}
		}

		function toggleSkillDetail(id) {
			var el = document.getElementById(id);
			if (!el) return;
			el.style.display = el.style.display === 'none' ? 'block' : 'none';
		}

		function confirmSkillInstall(btn) {
			var source = btn.dataset.source;
			var name = btn.dataset.name;
			sendStats('Skill installed', { name: name, source: source });
			var scope = document.getElementById('skillInstallScope').value;

			var repoUrl = 'https://github.com/' + source.replace(/^github\\//, '');
			var command = 'npx -y skills add ' + repoUrl + ' --skill ' + name + ' --agent claude-code -y';
			if (scope === 'global') {
				command += ' --global';
			}

			vscode.postMessage({
				type: 'runTerminalCommand',
				command: command
			});

			hideSkillsModal();
		}
`;

export default getSkillsScript;
