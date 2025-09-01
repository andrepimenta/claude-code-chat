import * as vscode from 'vscode';
import * as path from 'path';
import { WorkspaceFile } from '../types';

export class FileService {

	public async getWorkspaceFiles(searchTerm?: string): Promise<WorkspaceFile[]> {
		try {
			// Always get all files and filter on the backend for better search results
			const files = await vscode.workspace.findFiles(
				'**/*',
				'{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/.next/**,**/.nuxt/**,**/target/**,**/bin/**,**/obj/**}',
				500 // Reasonable limit for filtering
			);

			let fileList: WorkspaceFile[] = files.map(file => {
				const relativePath = vscode.workspace.asRelativePath(file);
				return {
					name: file.path.split('/').pop() || '',
					path: relativePath,
					fsPath: file.fsPath
				};
			});

			// Filter results based on search term
			if (searchTerm && searchTerm.trim()) {
				const term = searchTerm.toLowerCase();
				fileList = fileList.filter(file => {
					const fileName = file.name.toLowerCase();
					const filePath = file.path.toLowerCase();

					// Check if term matches filename or any part of the path
					return fileName.includes(term) ||
						filePath.includes(term) ||
						filePath.split('/').some(segment => segment.includes(term));
				});
			}

			// Sort and limit results
			fileList = fileList
				.sort((a, b) => a.name.localeCompare(b.name))
				.slice(0, 50);

			return fileList;
		} catch (error) {
			console.error('Error getting workspace files:', error);
			return [];
		}
	}

	public async selectImageFiles(): Promise<string[]> {
		try {
			// Show VS Code's native file picker for images
			const result = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectFolders: false,
				canSelectMany: true,
				title: 'Select image files',
				filters: {
					'Images': ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp']
				}
			});

			if (result && result.length > 0) {
				return result.map(uri => uri.fsPath);
			}

			return [];
		} catch (error) {
			console.error('Error selecting image files:', error);
			return [];
		}
	}

	public async openFileInEditor(filePath: string): Promise<void> {
		try {
			const uri = vscode.Uri.file(filePath);
			const document = await vscode.workspace.openTextDocument(uri);
			await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
		} catch (error) {
			vscode.window.showErrorMessage(`Failed to open file: ${filePath}`);
			console.error('Error opening file:', error);
		}
	}

	public async createImageFile(imageData: string, imageType: string): Promise<string | undefined> {
		try {
			const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
			if (!workspaceFolder) { return; }

			// Extract base64 data from data URL
			const base64Data = imageData.split(',')[1];
			const buffer = Buffer.from(base64Data, 'base64');

			// Get file extension from image type
			const extension = imageType.split('/')[1] || 'png';

			// Create unique filename with timestamp
			const timestamp = Date.now();
			const imageFileName = `image_${timestamp}.${extension}`;

			// Create images folder in workspace .claude directory
			const imagesDir = vscode.Uri.joinPath(workspaceFolder.uri, '.claude', 'claude-code-chat-images');
			await vscode.workspace.fs.createDirectory(imagesDir);

			// Create .gitignore to ignore all images
			const gitignorePath = vscode.Uri.joinPath(imagesDir, '.gitignore');
			try {
				await vscode.workspace.fs.stat(gitignorePath);
			} catch {
				// .gitignore doesn't exist, create it
				const gitignoreContent = new TextEncoder().encode('*\n');
				await vscode.workspace.fs.writeFile(gitignorePath, gitignoreContent);
			}

			// Create the image file
			const imagePath = vscode.Uri.joinPath(imagesDir, imageFileName);
			await vscode.workspace.fs.writeFile(imagePath, buffer);

			return imagePath.fsPath;
		} catch (error) {
			console.error('Error creating image file:', error);
			vscode.window.showErrorMessage('Failed to create image file');
			return undefined;
		}
	}

	public async getClipboardText(): Promise<string> {
		try {
			return await vscode.env.clipboard.readText();
		} catch (error) {
			console.error('Failed to read clipboard:', error);
			return '';
		}
	}
}