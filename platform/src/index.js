
/*global TOKEN_SERVER_URL -- is set by environment variable*/
import { EducationPlatformApp } from "./EducationPlatformApp.js";
import { PlaygroundUtility } from "./PlaygroundUtility.js";

const TOKEN_HANDLER_URL = TOKEN_SERVER_URL;
const WS_URI = WEBSOCKETS_URI;
let urlParameters = new URLSearchParams(window.location.search);  

var platform = new EducationPlatformApp();
platform.initialize(urlParameters, TOKEN_HANDLER_URL, WS_URI);

// Some functions and variables are accessed  
// by onclick - or similer - events
// We need to use window.x = x for this to work
window.fit = platform.fit.bind(platform);
window.updateGutterVisibility = platform.updateGutterVisibility.bind(platform);
window.runAction = platform.runAction.bind(platform);
window.panels = platform.panels;
window.savePanelContents = platform.savePanelContents.bind(platform);
window.toggle = platform.toggle.bind(platform);
window.togglePanelById = platform.togglePanelById.bind(platform);
//window.renderDiagram = renderDiagram;
window.longNotification = PlaygroundUtility.longNotification;
window.getPanelTitle = platform.getPanelTitle.bind(platform);