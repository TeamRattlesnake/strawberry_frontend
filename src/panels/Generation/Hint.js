import { Banner, Image } from "@vkontakte/vkui"


const Hint = ({text, onClose}) => {
    return (
        <Banner
            before={
                <Image
                    size={96}
                    src="https://media.tenor.com/VRzV-ieR0uwAAAAi/strawberry-fruit.gif"
                />
            }
            header={text}
            asideMode="dismiss"
            onDismiss={onClose}
        />
    )
}

export default Hint;
