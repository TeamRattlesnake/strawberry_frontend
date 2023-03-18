import React from "react";
import ReactDOM from "react-dom";
import bridge from "@vkontakte/vk-bridge";
import App from "./App";

// Init VK  Mini App
setTimeout(() => bridge.send("VKWebAppInit"), 1000);

ReactDOM.render(<App />, document.getElementById("root"));
if (process.env.NODE_ENV === "development") {
  import("./eruda").then(({ default: eruda }) => {}); //runtime download
}
