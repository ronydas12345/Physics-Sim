import { labIconToolbar } from "./lab-kit.js";
import { mountChrome } from "./chrome.js";
import { applyTheme, currentTheme } from "./theme.js";

applyTheme(currentTheme());

mountChrome(document.getElementById("site-header"), document.getElementById("site-footer"));
const toolbarSlot = document.getElementById("lab-icon-toolbar");
if (toolbarSlot) toolbarSlot.innerHTML = labIconToolbar();

