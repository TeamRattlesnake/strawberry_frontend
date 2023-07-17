import { View } from "@vkontakte/vkui";
import Home from "./Home";
import GenerationPage from "./Generation";
import { useLocation } from "@happysanta/router";
import { PanelAlias } from "../../const";


const GeneralView = ({id, go, dataset}) => {

    const location = useLocation();

    return (
        <View
            id={id}
            history={location.getViewHistory(id)}
			activePanel={location.getViewActivePanel(id)}
        >
            <Home
                id={PanelAlias.PANEL_HOME}
                go={go}
                dataset={dataset}
            />
            <GenerationPage
                id={PanelAlias.PANEL_GENERATION}
                go={go}
                dataset={dataset}
            />   
        </View>
    )
}

export default GeneralView;
