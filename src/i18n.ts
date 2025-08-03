// Internationalization service for Claude Code Chat
import * as vscode from 'vscode';

// Import translation files
import enTranslations from './locales/en.json';
import zhTWTranslations from './locales/zh-TW.json';

type Translations = typeof enTranslations;
type TranslationKey = string;

interface LanguageInfo {
	code: string;
	name: string;
	nativeName: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
	{ code: 'en', name: 'English', nativeName: 'English' },
	{ code: 'zh-TW', name: 'Traditional Chinese', nativeName: '繁體中文' }
];

class I18nService {
	private currentLanguage: string = 'en';
	private translations: Record<string, Translations> = {
		'en': enTranslations,
		'zh-TW': zhTWTranslations
	};

	constructor(private context: vscode.ExtensionContext) {
		// Load saved language preference
		this.currentLanguage = this.context.globalState.get<string>('claudeCodeChat.language', 'en');
	}

	/**
	 * Get the current language code
	 */
	getCurrentLanguage(): string {
		return this.currentLanguage;
	}

	/**
	 * Set the current language and save preference
	 */
	async setLanguage(languageCode: string): Promise<void> {
		if (this.translations[languageCode]) {
			this.currentLanguage = languageCode;
			await this.context.globalState.update('claudeCodeChat.language', languageCode);
		} else {
			console.warn(`Unsupported language: ${languageCode}`);
		}
	}

	/**
	 * Get translation for a given key with optional interpolation
	 */
	t(key: TranslationKey, params?: Record<string, string | number>): string {
		const translation = this.getNestedValue(this.translations[this.currentLanguage], key);
		
		if (!translation) {
			console.warn(`Translation not found: ${key} for language: ${this.currentLanguage}`);
			// Fallback to English
			const fallback = this.getNestedValue(this.translations['en'], key);
			if (fallback) {
				return this.interpolate(fallback, params);
			}
			return key; // Return key as last resort
		}

		return this.interpolate(translation, params);
	}

	/**
	 * Get all translations for current language (useful for passing to webview)
	 */
	getAllTranslations(): Translations {
		return this.translations[this.currentLanguage];
	}

	/**
	 * Get supported languages list
	 */
	getSupportedLanguages(): LanguageInfo[] {
		return SUPPORTED_LANGUAGES;
	}

	/**
	 * Get nested value from object using dot notation
	 */
	private getNestedValue(obj: any, path: string): string | undefined {
		return path.split('.').reduce((current, key) => {
			return current && typeof current === 'object' ? current[key] : undefined;
		}, obj);
	}

	/**
	 * Interpolate variables in translation strings
	 */
	private interpolate(text: string, params?: Record<string, string | number>): string {
		if (!params) {
			return text;
		}

		return text.replace(/\{(\w+)\}/g, (match, key) => {
			return params[key] !== undefined ? String(params[key]) : match;
		});
	}
}

// Export singleton instance
let i18nInstance: I18nService | undefined;

export function initializeI18n(context: vscode.ExtensionContext): I18nService {
	if (!i18nInstance) {
		i18nInstance = new I18nService(context);
	}
	return i18nInstance;
}

export function getI18n(): I18nService {
	if (!i18nInstance) {
		throw new Error('I18n service not initialized. Call initializeI18n first.');
	}
	return i18nInstance;
}