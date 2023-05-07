import { Page, Router } from "@happysanta/router";
import { PanelAlias, ViewAlias } from "./const";


export const Route = {
    PAGE_HOME: "/",
    PAGE_GENERATION: "/generation"
}

const routes = {
    [Route.PAGE_HOME]: new Page(PanelAlias.PANEL_HOME, ViewAlias.VIEW_GENERAL),
    [Route.PAGE_GENERATION]: new Page(PanelAlias.PANEL_GENERATION, ViewAlias.VIEW_GENERAL),
  };
  
export const router = new Router(routes);

router.start();
