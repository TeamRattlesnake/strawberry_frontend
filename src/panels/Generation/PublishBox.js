import { useState } from "react";
import StrawberryBackend from "../../api/SBBackend";
import { Button, Checkbox, DateInput, Div, FormItem, Group } from "@vkontakte/vkui";


const PublishBox = ({groupId, text, showSnackBar}) => {
    const [fromGroup, setFromGroup] = useState(true);
    const [usePublishDate, setUsePublishDate] = useState(false);
    const [publishDate, setPublishDate] = useState(() => new Date());
    const handlePublish = () => {
        StrawberryBackend.publishPost(groupId, text, {
            from_group: fromGroup,
            publish_date: usePublishDate && Math.floor(publishDate.getTime() / 1000),
        })
        .then((status) => {
            switch (status) {
                case 0:
                    showSnackBar({
                        text: usePublishDate ?
                        "Ура, в скором времени запись будет опубликована!"
                        :
                        "Ура, запись успешно опубликована!",
                        type: "success"});
                    break;
                case 3:
                    showSnackBar({text: "Передумали?", type: "danger"});
                    break;
                default:
                    showSnackBar({text: "Ошибка при публикации записи", type: "danger"});
                    break;
            }
        })
    }
    return (
        <Group mode="plain">
            <Div>
                <Checkbox
                    defaultChecked={usePublishDate}
                    onChange={(e) => setUsePublishDate(e.target.checked)}
                >
                    Отложенная публикация
                </Checkbox>
                {
                    usePublishDate &&
                    <FormItem top="Дата публикации">
                        <DateInput
                            value={publishDate}
                            onChange={setPublishDate}
                            enableTime
                            disablePast
                            closeOnChange
                        />
                    </FormItem>
                }
                <Checkbox
                    defaultChecked={fromGroup}
                    onChange={(e) => setFromGroup(e.target.checked)}
                >
                    От имени сообщества
                </Checkbox>
            </Div>
            <Div>
                <Button
                    stretched
                    appearance="positive"
                    onClick={handlePublish}
                >
                    Опубликовать
                </Button>
            </Div>
        </Group>
    )
}

export default PublishBox;