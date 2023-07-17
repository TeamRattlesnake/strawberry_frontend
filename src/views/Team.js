import { Avatar, Cell, Group } from "@vkontakte/vkui"

import srcRoman from "../media/team/roman.jpg";
import srcAndrey from "../media/team/andrey.jpg";
import srcVasiliy from "../media/team/vasiliy.jpg";


const teamInfo = [
    {name: 'Андрей Коленков', src: srcAndrey, about: 'Team Lead, Backend Python Dev', url: 'https://t.me/Adefe'},
    {name: 'Роман Медников', src: srcRoman, about: 'Frontend React Dev, ChatGPT/Perplexity Enthusiast', url: 'https://vk.com/id133207816'},
    {name: 'Василий Ермаков', src: srcVasiliy, about: 'Analytics', url: 'https://t.me/nokrolikno'},
];

export const Team = () => {
    return (
        <Group>
            {teamInfo.map((info) => (
                <Cell
                    before={<Avatar size={36} src={info.src}/>}
                    subtitle={info.about}
                    onClick={() => window.open(info.url, "_blank")}
                >
                    {info.name}
                </Cell>
            ))}
        </Group>
    )
};
