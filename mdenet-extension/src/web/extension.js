import * as vscode from 'vscode';
import { ActivityTreeDataProvider }  from './providers/ActivityTreeDataProvider';
import { TaskTreeDataProvider } from './providers/TaskTreeDataProvider';
import { PanelTreeDataProvider } from './providers/PanelTreeDataProvider';
import { ExtensionActivityManager } from './ExtensionActivityManager';
import { ExtensionToolsManager } from './ExtensionToolsManager';
import { LocalRepoManager } from './LocalRepoManager';
import { ExtensionEducationPlatformApp } from './ExtensionEducationPlatformApp';
import { ExtensionErrorHandler } from './ExtensionErorrHandler';

export function activate(context) {
	const activityProvider = new ActivityTreeDataProvider();
	const taskProvider = new TaskTreeDataProvider();
	const panelProvider = new PanelTreeDataProvider();
	const localRepoManager = new LocalRepoManager();
	let app = null;
	let toolManager = null;
	let activityManager = null;

	vscode.window.registerTreeDataProvider('activities', activityProvider);
	vscode.window.registerTreeDataProvider('tasks', taskProvider);
	vscode.window.registerTreeDataProvider('panels', panelProvider);
	context.subscriptions.push(
		vscode.commands.registerCommand('activities.play', async (file) => {
			try {
				activityProvider.setPlaying(file);
				toolManager = new ExtensionToolsManager();
				activityManager = new ExtensionActivityManager((toolManager.getPanelDefinition).bind(toolManager), localRepoManager, taskProvider, context, file.label)
				const errorHandler = new ExtensionErrorHandler();
				app = new ExtensionEducationPlatformApp(errorHandler,context);
				await app.initializeActivity(toolManager, activityManager);
				const displayPanels = app.getVisiblePanels();
				panelProvider.setPanels(displayPanels);
				
			} catch (error) {
				vscode.window.showErrorMessage(`Error playing ${file.label}: ${error.message}`);
			}
		}),
		vscode.commands.registerCommand('activities.stop', async (file) => {
			context.workspaceState.keys().forEach(key => {
				context.workspaceState.update(key,null);
			});
			activityProvider.setStopped();
			taskProvider.setTasks([]);
			panelProvider.setPanels([]);
			app = null;
			toolManager = null;
			activityManager = null;
			vscode.window.showInformationMessage(`Stopped ${file.label}`);
		}),
		vscode.commands.registerCommand('panels.displayPanel', async (panel) => {
			console.log('Displaying panel:', panel);
			panel.displayPanel();
		}),
		vscode.commands.registerCommand('panels.run', async () => {
			let options = [];
			const selectedEditor = vscode.window.activeTextEditor;
			if(!selectedEditor){
				vscode.window.showInformationMessage("Press the buttons inside the panel");
				return;
			}
			const selectedPanel = app.panels.find(panel => panel.doc === selectedEditor.document);
			console.log("Selected panel", selectedPanel);
			const buttonMap = new Map();

			if (selectedPanel){
				options = selectedPanel.getButtons().map(button => {buttonMap.set(button.hint,button); return button.hint});
			}
			// Show QuickPick menu
			const selectedOption = await vscode.window.showQuickPick(options, {
				placeHolder: "Select an option"
			});

			// Print the selected option
			if (selectedOption) {
				const selectedButton = buttonMap.get(selectedOption);
				eval(selectedButton.action);
			}
		}),
		vscode.commands.registerCommand('tasks.select', async (task) => {
			if(app && app.activity && app.activity.id == task){
				console.log("Task already selected");
				return;
			}
			if(app && toolManager && activityManager){
				await app.switchActivityTask(task);
				const displayPanels = app.getVisiblePanels();
				panelProvider.setPanels(displayPanels);
			}
			

		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
