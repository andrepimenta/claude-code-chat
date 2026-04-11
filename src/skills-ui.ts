const getSkillsHtml = () => `
	<!-- Skills modal -->
	<div id="skillsModal" class="tools-modal" style="display: none;">
		<div class="tools-modal-content">
			<div class="tools-modal-header">
				<span>Skills</span>
				<button class="tools-close-btn" onclick="hideSkillsModal()">✕</button>
			</div>
			<div class="tools-list">
				<div class="mcp-servers-list" id="skillsList">
					<!-- Installed skills will be loaded here -->
				</div>
				<div class="mcp-popular-servers" id="skillsMarketplace">
					<h4>Search Skills</h4>
					<div class="marketplace-search">
						<input type="text" id="skillsSearch" placeholder="Search skills..." oninput="searchSkills(this.value)" />
					</div>
					<div class="marketplace-grid" id="skillsGrid">
					</div>
				</div>
				<div class="mcp-add-form" id="skillAddForm" style="display: none;">
					<div class="form-group">
						<label for="skillName">Skill Name:</label>
						<input type="text" id="skillName" placeholder="my-skill" required>
					</div>
					<div class="form-group">
						<label for="skillDescription">Description:</label>
						<input type="text" id="skillDescription" placeholder="What this skill does">
					</div>
					<div class="form-group">
						<label for="skillScope">Scope:</label>
						<select id="skillScope">
							<option value="personal">Personal (~/.claude/skills/)</option>
							<option value="project">Project (.claude/skills/)</option>
						</select>
					</div>
					<div class="form-group">
						<label for="skillContent">Instructions (Markdown):</label>
						<textarea id="skillContent" placeholder="Instructions for Claude to follow when this skill is invoked..." rows="8"></textarea>
					</div>
					<div class="form-buttons">
						<button class="btn" onclick="saveSkill()">Create Skill</button>
						<button class="btn outlined" onclick="hideSkillAddForm()">Cancel</button>
					</div>
				</div>
			</div>
		</div>
	</div>
`;

export default getSkillsHtml;
