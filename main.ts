import { App, Notice, Plugin, PluginSettingTab, Setting, MarkdownPostProcessorContext, EditorView } from 'obsidian';
import { ViewPlugin, DecorationSet, Decoration, ViewUpdate, WidgetType } from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import { Range } from '@codemirror/state';
import mermaid from 'mermaid';

interface MermaidPreviewSettings {
	theme: string;
}

const DEFAULT_SETTINGS: MermaidPreviewSettings = {
	theme: 'default'
};

// Widget for rendering mermaid in editor
class MermaidWidget extends WidgetType {
	constructor(private code: string, private plugin: MermaidPreviewPlugin) {
		super();
	}

	toDOM(): HTMLElement {
		const container = document.createElement('div');
		container.className = 'mermaid-preview-container mermaid-editor-widget';
		container.style.display = 'block';
		container.style.width = '100%';
		container.style.margin = '1em 0';
		
		// Create a small header to show this is a preview
		const header = document.createElement('div');
		header.textContent = '📊 Mermaid Preview';
		header.style.fontSize = '12px';
		header.style.color = 'var(--text-muted)';
		header.style.padding = '4px 8px';
		header.style.borderBottom = '1px solid var(--background-modifier-border)';
		container.appendChild(header);
		
		// Render the mermaid diagram
		this.plugin.renderMermaidDiagram(container, this.code);
		
		return container;
	}

	eq(other: MermaidWidget): boolean {
		return other.code === this.code;
	}
}

// CodeMirror plugin for live preview of mermaid
const mermaidViewPlugin = (plugin: MermaidPreviewPlugin) => ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = this.buildDecorations(view);
		}

		update(update: ViewUpdate): void {
			if (update.docChanged || update.viewportChanged) {
				this.decorations = this.buildDecorations(update.view);
			}
		}

		buildDecorations(view: EditorView): DecorationSet {
			const builder: Range<Decoration>[] = [];
			const doc = view.state.doc;
			const text = doc.toString();
			const lines = text.split('\n');
			
			let inMermaidBlock = false;
			let mermaidContent: string[] = [];
			
			for (let i = 0; i < lines.length; i++) {
				const line = lines[i].trim();
				
				if (line === '```mermaid') {
					inMermaidBlock = true;
					mermaidContent = [];
				} else if (line === '```' && inMermaidBlock) {
					const codeContent = mermaidContent.join('\n').trim();
					if (codeContent) {
						// Calculate position at end of the code block
						let pos = 0;
						for (let j = 0; j <= i; j++) {
							if (j > 0) pos += 1;
							pos += lines[j].length;
						}
						
						const widget = new MermaidWidget(codeContent, plugin);
						const deco = Decoration.widget({
							widget,
							side: 1,
						});
						
						builder.push(deco.range(pos));
					}
					
					inMermaidBlock = false;
					mermaidContent = [];
				} else if (inMermaidBlock) {
					mermaidContent.push(lines[i]);
				}
			}

			return Decoration.set(builder);
		}
	},
	{
		decorations: (v) => v.decorations
	}
);

export default class MermaidPreviewPlugin extends Plugin {
	settings: MermaidPreviewSettings;

	async onload() {
		console.log('Mermaid Preview Plugin: Starting onload...');
		await this.loadSettings();
		
		// Initialize mermaid
		mermaid.initialize({
			startOnLoad: false,
			theme: this.settings.theme,
			securityLevel: 'loose',
		});
		console.log('Mermaid initialized with theme:', this.settings.theme);

		// Register CodeMirror extension for editing view
		this.registerEditorExtension(mermaidViewPlugin(this));
		console.log('Mermaid editor extension registered!');

		// Register post processor for reading view
		this.registerMarkdownPostProcessor((el: HTMLElement, ctx: MarkdownPostProcessorContext) => {
			console.log('🎯 Reading view post processor triggered!');
			console.log('Element:', el.tagName, el.className);
			
			// Look for existing mermaid SVGs or divs that were rendered by other plugins
			const mermaidSelectors = [
				'svg[id*="mermaid"]',
				'svg[class*="mermaid"]', 
				'.mermaid',
				'pre code.language-mermaid',
				'div[data-type="mermaid"]'
			];
			
			const mermaidElements = el.querySelectorAll(mermaidSelectors.join(', '));
			console.log('Found mermaid elements in reading view:', mermaidElements.length);
			
			mermaidElements.forEach(async (element) => {
				console.log('🎯 Processing mermaid element:', element.tagName, element.className);
				
				let diagramCode = '';
				let containerElement: HTMLElement | null = null;
				
				if (element.tagName === 'SVG') {
					// Already rendered SVG
					const title = element.querySelector('title');
					diagramCode = title?.textContent || element.getAttribute('data-original-code') || 'graph TD; A --> B';
					containerElement = element.parentElement as HTMLElement;
					
					// Try to extract code from nearby elements
					const prevElement = element.previousElementSibling;
					if (prevElement && prevElement.tagName === 'CODE') {
						diagramCode = prevElement.textContent || diagramCode;
					}
				} else if (element.classList.contains('language-mermaid')) {
					// Code block with mermaid
					diagramCode = element.textContent || '';
					containerElement = element.closest('pre') as HTMLElement;
				} else {
					// Other mermaid container
					diagramCode = element.textContent || element.getAttribute('data-original-code') || '';
					containerElement = element as HTMLElement;
				}
				
				if (diagramCode && containerElement) {
					console.log('🎨 Enhancing mermaid in reading view with toolbar');
					console.log('Code preview:', diagramCode.substring(0, 50) + '...');
					await this.renderMermaidDiagram(containerElement, diagramCode);
				}
			});
		}, 100); // High priority to run after other processors
		console.log('Reading view post processor registered!');

		// Add settings tab
		this.addSettingTab(new MermaidPreviewSettingTab(this.app, this));
		console.log('Mermaid Preview Plugin: Loaded successfully!');	
	}

	onunload() {
		// Clean up
	}


	async renderMermaidDiagram(container: HTMLElement, diagramCode: string) {
		console.log('🎨 Starting to render mermaid diagram');
		console.log('📦 Container info:', {
			tagName: container.tagName,
			className: container.className,
			parent: container.parentElement?.tagName
		});
		console.log('📝 Diagram code snippet:', diagramCode.substring(0, 200) + (diagramCode.length > 200 ? '...' : ''));
		console.log('📐 Code length:', diagramCode.length, 'characters');
		
		// Clear the container and add our custom styling
		container.empty();
		container.addClass('mermaid-preview-container');
		
		const diagramContainer = container.createDiv({ cls: 'mermaid-diagram' });
		const toolbar = container.createDiv({ cls: 'mermaid-toolbar' });

		// Create toolbar buttons
		const copyBtn = toolbar.createEl('button', { text: 'Copy Code', cls: 'mermaid-btn' });
		const copyImageBtn = toolbar.createEl('button', { text: 'Copy Image (100%)', cls: 'mermaid-btn' });
		const exportImageBtn = toolbar.createEl('button', { text: 'Export PNG (100%)', cls: 'mermaid-btn' });
		const exportSvgBtn = toolbar.createEl('button', { text: 'Export SVG', cls: 'mermaid-btn' });

		try {
			// Generate unique ID for this diagram
			const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			
			console.log('🎯 Starting mermaid.render with ID:', diagramId);
			
			// Render mermaid diagram
			const { svg } = await mermaid.render(diagramId, diagramCode);
			diagramContainer.innerHTML = svg;
			
			console.log('✅ Mermaid rendered successfully');
			console.log('📊 SVG markup length:', svg.length, 'characters');
			
			// 缓存准确的尺寸供svgToBlob使用
			const tempDiv = document.createElement('div');
			tempDiv.style.visibility = 'hidden';
			tempDiv.style.position = 'absolute';
			tempDiv.innerHTML = svg;
			document.body.appendChild(tempDiv);
			
			const svgElement = tempDiv.querySelector('svg');
			let accurateWidth = 800;
			let accurateHeight = 600;
			
			if (svgElement) {
				// 获取最新渲染后的实际尺寸
				const bbox = svgElement.getBBox();
				accurateWidth = Math.max(1, Math.round(bbox.width));
				accurateHeight = Math.max(1, Math.round(bbox.height));
				
				// 确保最小尺寸
				accurateWidth = Math.max(accurateWidth, 150);
				accurateHeight = Math.max(accurateHeight, 100);
				
				console.log('🔍 Accurate dimensions calculated:');
				console.log('  ➤  Based on getBBox():', accurateWidth + '×' + accurateHeight);
				console.log('  ➤  Original viewBox/svg:', {
					width: svgElement.getAttribute('width'),
					height: svgElement.getAttribute('height'),
					viewBox: svgElement.getAttribute('viewBox'),
					bbox: `w:${Math.round(bbox.width)},h:${Math.round(bbox.height)}`
				});
			}
			
			document.body.removeChild(tempDiv);

			// 缓存准确尺寸到SVG元素属性中
			diagramContainer.querySelector('svg')?.setAttribute('data-accurate-width', accurateWidth.toString());
			diagramContainer.querySelector('svg')?.setAttribute('data-accurate-height', accurateHeight.toString());
			
			// Set up event listeners with accurate dimensions
			copyBtn.addEventListener('click', () => this.copyText(diagramCode));
			copyImageBtn.addEventListener('click', () => this.copyImage(svg, accurateWidth, accurateHeight));
			exportImageBtn.addEventListener('click', () => this.exportImage(svg, diagramId, accurateWidth, accurateHeight));
			exportSvgBtn.addEventListener('click', () => this.exportSvg(svg, diagramId));

		} catch (error) {
			console.error('Mermaid rendering error:', error);
			diagramContainer.createEl('div', {
				text: `Error rendering mermaid diagram: ${error.message}`,
				cls: 'mermaid-error'
			});
		}
	}

	async copyText(text: string) {
		try {
			await navigator.clipboard.writeText(text);
			new Notice('Mermaid code copied to clipboard');
		} catch (error) {
			new Notice('Failed to copy text');
		}
	}

	async copyImage(svg: string, width?: number, height?: number) {
		try {
			const blob = await this.svgToBlob(svg, 1, width, height); // 100% scale, accurate dimensions
			await navigator.clipboard.write([
				new ClipboardItem({ 'image/png': blob })
			]);
			new Notice(`Image copied (${width?.toFixed(0)}×${height?.toFixed(0)})`);
		} catch (error) {
			console.error('Copy image error:', error);
			new Notice('Failed to copy image');
		}
	}

	async exportImage(svg: string, filename: string, width?: number, height?: number) {
		try {
			const blob = await this.svgToBlob(svg, 1, width, height); // 100% scale with accurate dimensions
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${filename}_${width}x${height}.png`;
			a.click();
			URL.revokeObjectURL(url);
			new Notice(`Image exported (${width?.toFixed(0)}×${height?.toFixed(0)})`);
		} catch (error) {
			console.error('Export image error:', error);
			new Notice('Failed to export image');
		}
	}

	async exportSvg(svg: string, filename: string) {
		try {
			const blob = new Blob([svg], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `${filename}.svg`;
			a.click();
			URL.revokeObjectURL(url);
			new Notice('SVG exported');
		} catch (error) {
			console.error('Export SVG error:', error);
			new Notice('Failed to export SVG');
		}
	}

	async svgToBlob(svg: string, scale: number = 1, providedWidth?: number, providedHeight?: number): Promise<Blob> {
		return new Promise(async (resolve, reject) => {
			console.log('🎯 Starting precise size calculation...');
			
			let finalWidth, finalHeight;
			
			// 如果有提供的准确尺寸，直接使用
			if (providedWidth && providedHeight) {
				finalWidth = Math.round(providedWidth * scale);
				finalHeight = Math.round(providedHeight * scale);
				console.log('✓ Using provided dimensions:', finalWidth, '×', finalHeight);
			} else {
				// 否则进行精确解析
				const tempDiv = document.createElement('div');
				tempDiv.style.visibility = 'hidden';
				tempDiv.style.position = 'absolute';
				tempDiv.innerHTML = svg;
				document.body.appendChild(tempDiv);
				
				const svgElement = tempDiv.querySelector('svg');
				let calculatedWidth = 800;
				let calculatedHeight = 600;
				
				if (svgElement) {
					try {
						calculatedWidth = Math.max(50, Math.round(svgElement.getBBox().width));
						calculatedHeight = Math.max(50, Math.round(svgElement.getBBox().height));
					} catch (e) {
						console.warn('getBBox() failed, using fallback calculation');
						// 从viewBox回退
						const viewBox = svgElement.getAttribute('viewBox');
						if (viewBox) {
							const [, , w, h] = viewBox.split(/\s+|,/g).map(Number);
							calculatedWidth = Math.round(w);
							calculatedHeight = Math.round(h);
						}
					}
				}
				
				finalWidth = Math.round(calculatedWidth * scale);
				finalHeight = Math.round(calculatedHeight * scale);
				document.body.removeChild(tempDiv);
				
				console.log('✓ Calculated from SVG:', finalWidth, '×', finalHeight);
			}

			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			const img = new Image();

			img.onload = () => {
				console.log('🎯 Creating canvas:', finalWidth, '×', finalHeight, 'px');
				
				canvas.width = finalWidth;
				canvas.height = finalHeight;
				ctx!.fillStyle = 'white';
				ctx!.fillRect(0, 0, canvas.width, canvas.height);
				
				ctx!.drawImage(img, 0, 0, finalWidth, finalHeight);
				
				canvas.toBlob((blob) => {
					if (blob) {
						const kb = Math.round(blob.size/102.4)/10;
						console.log(`🎯 Precise image created: ${finalWidth}×${finalHeight}px (${kb} KB)`);
						resolve(blob);
					} else {
						reject(new Error('Failed to convert canvas to blob'));
					}
				}, 'image/png');
			};

			img.onerror = reject;
			img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
		});
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class MermaidPreviewSettingTab extends PluginSettingTab {
	plugin: MermaidPreviewPlugin;

	constructor(app: App, plugin: MermaidPreviewPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl('h2', { text: 'Mermaid Preview Settings' });

		new Setting(containerEl)
			.setName('Theme')
			.setDesc('Choose the mermaid theme')
			.addDropdown(dropdown => dropdown
				.addOption('default', 'Default')
				.addOption('dark', 'Dark')
				.addOption('forest', 'Forest')
				.addOption('neutral', 'Neutral')
				.setValue(this.plugin.settings.theme)
				.onChange(async (value) => {
					this.plugin.settings.theme = value;
					await this.plugin.saveSettings();
					// Reinitialize mermaid with new theme
					mermaid.initialize({
						startOnLoad: false,
						theme: value,
						securityLevel: 'loose',
					});
				}));
	}
}
