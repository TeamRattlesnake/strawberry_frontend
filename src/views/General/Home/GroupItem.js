import { Icon24StarsOutline } from "@vkontakte/icons"
import { Avatar, CellButton, RichCell } from "@vkontakte/vkui"


const GroupItem = ({group, onGenerate}) => {
    return (
        <RichCell
            key={group.id}
            before={<Avatar src={group.photo_200}/>}
            after={
                <CellButton
                    after={<Icon24StarsOutline
                    aria-label='Сгенерировать'/>}
                    onClick={() => onGenerate(group)}
                >
                    Создать пост
                </CellButton>
            }
            disabled
        >
            {group.name}
        </RichCell>
    )
}

export default GroupItem;
