import blessed, { Widgets } from "blessed";
import clearScreen from "../utils/clearScreen.js";

function initHelpScreen(screen: Widgets.Screen) {
  clearScreen(screen);
  const helpBox = blessed.box({
    top: "center",
    left: "center",
    width: "shrink",
    height: "shrink",
    valign: "middle",
    padding: {
      left: 1,
      right: 1,
    },
    content: `{bold}Wave2FA Help:{/bold}\nPress {bold}h{/bold} - Open this menu\nPress {bold}n{/bold} - Add new code\nPress {bold}e{/bold} - Add new code using downloaded QR code\nPress {bold}t{/bold} - Import codes from Google Authenticator\nPress {bold}m{/bold} - Go to home screen`,
    tags: true,
    border: "line",
    style: {
      border: { fg: "magenta" },
    },
  });

  screen.append(helpBox);
  screen.render();
}
export { initHelpScreen };
