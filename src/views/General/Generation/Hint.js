import { Banner, Image } from "@vkontakte/vkui"
import question from "../../../media/question.gif"


const Hint = ({text, onClose}) => {
    const [popout, setPopout] = React.useState(null);
    const onClick = () => setPopout(<CustomP onClose={() => setPopout(null)} />);
    return (
        <Banner
            before={
                <Image
                    size={96}
                    src={question}
                />
            }
            header={text}
            asideMode="dismiss"
            onDismiss={onClose}
        />
    )
}

export default Hint;
