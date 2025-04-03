import * as vscode from 'vscode';


/**
 * Provides data for the tasks tree view in the VS Code extension.
 * This tree view displays all the subactivites for the current activity.
 */
class TaskTreeDataProvider {
  constructor() {
    this.tasks = [];
    this.hiddenTasks = new Set();
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  /**
   * Updates the tasks to display in the tree view.
   * @param {Array} tasks - The list of tasks (activities) from the activity.json file.
   */
  setTasks(tasks) {
    this.tasks = tasks;
    this.refresh();
  }

  hideAllTasks(){
    this.tasks.forEach((task) => this.hiddenTasks.add(task.id));
    this.refresh();
  }

  showAllTasks(){
    this.hiddenTasks.clear();
    this.refresh();
  }

  hideTask(taskId){
    this.hiddenTasks.add(taskId);
    this.refresh();
  }

  showTask(taskId){
    if (this.hiddenTasks.has(taskId)){
      this.hiddenTasks.delete(taskId);
      this.refresh();
    }
  }


  /**
   * Refreshes the tree view.
   */
  refresh() {
    this._onDidChangeTreeData.fire();
  }

  /**
   * Returns a TreeItem for the given element.
   * @param {Object} element - The task element.
   * @returns {vscode.TreeItem}
   */
  getTreeItem(element) {
    return {
      label: element.label,
      iconPath: new vscode.ThemeIcon('tasklist'),
      command: {
        command: 'tasks.select',
        title: 'Select Task',
        arguments: [element.id]
      }
    };
  }

  /**
   * Returns the children for the tree view.
   * @returns {Array} The children of the tree view.
   */
    getChildren() {
    return this.tasks
              .filter((task) => !this.hiddenTasks.has(task.id))      
              .map((task) => ({label: task.title, id: task.id}));
  }
}

export { TaskTreeDataProvider };