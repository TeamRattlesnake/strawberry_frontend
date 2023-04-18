import { Cell, Group } from "@vkontakte/vkui"


const Hint = ({text, onClose}) => {
    return (
        <Group>
            <Cell
                mode="removable"
                onRemove={onClose}
            >
                {text}
            </Cell>
        </Group>
    )
}

export default Hint;
