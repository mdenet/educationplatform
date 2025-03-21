import * as vscode from 'vscode';
import { ActivityTreeDataProvider }  from './providers/ActivityTreeDataProvider';
import { TaskTreeDataProvider } from './providers/TaskTreeDataProvider';
import { PanelTreeDataProvider } from './providers/PanelTreeDataProvider';
import { ExtensionEducationPlatformApp } from './ExtensionEducationPlatformApp';

export function activate(context) {
	const activityProvider = new ActivityTreeDataProvider();
	const taskProvider = new TaskTreeDataProvider();
	const panelProvider = new PanelTreeDataProvider();
	let app = null;
	const actionHandlers = {
		openExternal: (data) => vscode.env.openExternal(vscode.Uri.parse(data.url)),
		runAppAction: (data) => app.runAction(data.parentPanel, data.buttonId),
	};
	
	vscode.window.registerTreeDataProvider('activities', activityProvider);
	vscode.window.registerTreeDataProvider('tasks', taskProvider);
	vscode.window.registerTreeDataProvider('panels', panelProvider);
	context.subscriptions.push(
		vscode.commands.registerCommand('activities.play', async (file) => {
			try {
				vscode.commands.executeCommand('workbench.action.closeAllEditors');
				// context.workspaceState.keys().forEach(key => {
				// 	context.workspaceState.update(key,null);
				// });
				activityProvider.setPlaying(file);
				app = new ExtensionEducationPlatformApp(context, taskProvider, file.label);
				await app.initializeActivity();
				const displayPanels = app.getVisiblePanels();
				panelProvider.setPanels(displayPanels);
				
			} catch (error) {
				vscode.window.showErrorMessage(`Error playing ${file.label}: ${error.message}`);
			}
		}),
		vscode.commands.registerCommand('activities.stop', async (file) => {
			activityProvider.setStopped();
			taskProvider.setTasks([]);
			panelProvider.setPanels([]);
			app = null;
			vscode.window.showInformationMessage(`Stopped ${file.label}`);
		}),
		vscode.commands.registerCommand('activities.refresh', () => {
			vscode.window.showInformationMessage('Refreshing activities');
			activityProvider.refresh();
		}),
		vscode.commands.registerCommand('panels.displayPanel', async (panel) => {
			console.log('Displaying panel:', panel);
			panel.displayPanel();
		}),
		vscode.commands.registerCommand('panels.run', async () => {
			let options = [];
			const selectedEditor = vscode.window.activeTextEditor;
			if(!selectedEditor){
				vscode.window.showInformationMessage("Press the buttons inside the panel"); // This means that it is a Webview panel
				return;
			}

			console.log("All panels", app.panels);
			const selectedPanel = app.panels.find(panel => panel.doc === selectedEditor.document);
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
				console.log("Running button", selectedButton.action);
				// eval(selectedButton.action);
				actionHandlers[selectedButton.actionData.type](selectedButton.actionData);
			}
		}),
		vscode.commands.registerCommand('button.run', (button) => {
			console.log("Running button", button.action);
			actionHandlers[button.actionData.type](button.actionData);
		}),
		vscode.commands.registerCommand('tasks.select', async (task) => {
			if(app?.activity?.id == task){
				console.log("Task already selected");
				return;
			}
			if(app){
				try{
					vscode.commands.executeCommand('workbench.action.closeAllEditors');
					await app.switchActivityTask(task);
					const displayPanels = app.getVisiblePanels();
					panelProvider.setPanels(displayPanels);
				}catch(error){
					vscode.window.showErrorMessage(`Error switching task: ${error.message}`);
				}
			}
		}),
		vscode.commands.registerCommand('extension.insertGuillemets', () => {
			console.log('Inserting guillemets');
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				editor.insertSnippet(new vscode.SnippetString('«$0»'));
			}
		}),
	);
}

export function deactivate() {}
