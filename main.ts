import { App, getFrontMatterInfo, Plugin, PluginSettingTab, Setting, setTooltip, TFile } from 'obsidian';
import { format } from 'date-fns';

// Remember to rename these classes and interfaces!

interface TooltipPluginSettings {
	propertyName: string;
}

const DEFAULT_SETTINGS: TooltipPluginSettings = {
	propertyName: 'Summary'
}

export default class TooltipPlugin extends Plugin {
	settings: TooltipPluginSettings;

	async onload() {
		await this.loadSettings();
		this.addSettingTab(new JustSettingTab(this.app, this));
		this.registerDomEvent(document, 'mouseover', this.LoadTooltip.bind(this));	
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
	
	async LoadTooltip(event:MouseEvent) {
		const target = event.target as HTMLElement;
        if (target && target.classList.contains('nav-file-title')) {
          const fileTitleElement = target;
          const filePath = fileTitleElement.dataset['path'];
    
          if (filePath) {
            const file = this.app.vault.getAbstractFileByPath(filePath) as TFile;
            if (file instanceof TFile && file.extension === 'md') {
    			this.updateTooltip(target, file);
            }
          }
        }
 	}

	async updateTooltip(target: HTMLElement, file: TFile) {
 		const content = await this.app.vault.read(file);
		const properties = getFrontMatterInfo(content);
		if (properties.exists){
			const pContent = properties.frontmatter.split('\n');
			pContent.forEach((p) => {
				const thisP = p.split(':');
				if (thisP[0] == this.settings.propertyName){
					const ctime = format(new Date(file.stat.ctime), "yyyy-mm-dd HH:MM");
					const mtime = format(new Date(file.stat.mtime), "yyyy-mm-dd HH:MM");
					setTooltip(target, thisP[1]+'\n\nLast modified at '+mtime+'\nCreated at '+ctime, {placement:'right'});
				}
			});
		}
	}

}

class JustSettingTab extends PluginSettingTab {
	plugin: TooltipPlugin;

	constructor(app: App, plugin: TooltipPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Property Name')
			.setDesc('Please keep it a single word and single line.')
			.addText(text => text
				.setPlaceholder('default: Summary')
				.setValue(this.plugin.settings.propertyName)
				.onChange(async (value) => {
					this.plugin.settings.propertyName = value;
					await this.plugin.saveSettings();
				}));
	}
}


