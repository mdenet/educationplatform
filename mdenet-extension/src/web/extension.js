import * as vscode from 'vscode';
import { ActivityTreeDataProvider }  from './providers/ActivityTreeDataProvider';
import { TaskTreeDataProvider } from './providers/TaskTreeDataProvider';
import { ExtensionActivityManager } from './ExtensionActivityManager';
import { ExtensionToolsManager } from './ExtensionToolsManager';
import { LocalRepoManager } from './LocalRepoManager';
import { ActivityValidator } from '../../../platform/src/ActivityValidator';

export function activate(context) {
	const activityProvider = new ActivityTreeDataProvider();
	const taskProvider = new TaskTreeDataProvider();
	const localRepoManager = new LocalRepoManager();

	vscode.window.registerTreeDataProvider('activities', activityProvider);

	context.subscriptions.push(
		vscode.commands.registerCommand('activities.play', async (file) => {
			activityProvider.setPlaying(file);
			const toolManager = new ExtensionToolsManager();
			const activityManager = new ExtensionActivityManager((toolManager.getPanelDefinition).bind(toolManager), localRepoManager, taskProvider, context, file.label)
			await activityManager.initializeActivities();
			toolManager.setToolsUrls(activityManager.getToolUrls().add("https://ep.mde-network.org/common/utility.json"));
			activityManager.hideActivitiesNavEntries();
			const selectedActivity = activityManager.getSelectedActivity();
			console.log('Selected Activity:', selectedActivity);
			console.log("Errors", ActivityValidator.validate(selectedActivity, toolManager.tools))
			vscode.window.showInformationMessage(`Playing ${file.label}`);
		}),
		vscode.commands.registerCommand('activities.stop', async (file) => {
			activityProvider.setStopped();
			vscode.window.showInformationMessage(`Stopped ${file.label}`);
		}),
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
