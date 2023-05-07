import { Panel, Spacing, usePlatform } from "@vkontakte/vkui"

const PanelWrapper = (props) => {
    return (
        <Panel {...props}>
            {
                (usePlatform() === "ios" || usePlatform() === "android") &&
                <Spacing size={32}/>
            }
            {props.children}
        </Panel>
    )
}

export default PanelWrapper;
