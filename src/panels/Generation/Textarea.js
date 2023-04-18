import { Spinner, Textarea } from "@vkontakte/vkui";


const TextareaDropdown = ({isLoading, items, onClick, onClose, position}) => {
    return (
        <select style={{
            position: "absolute",
            top: position.top,
            left: position.left,
        }}>
            {
                isLoading ?
                <Spinner/>
                :
                items.map((item) => {
                    return (
                        <option onClick={() => {
                            onClick(value);
                            onClose();
                        }} value={item}>{item}</option>
                    )
                })
            }
        </select>
    )
}

const TextareaCustom = ({onSelect, onItemClick, ...props}) => {
    const textAreaRef = useRef();
    const [dropdownShown, setDropdownShow] = useState(false);
    const [dropdownLoading, setDropdownLoading] = useState(false);
    const [dropdownItems, setDropdownItems] = useState([]);
    let cursorPositionTop = null;
    let cursorPositionLeft = null;
    let selectionStart = null;
    let selectionEnd = null;
    useEffect(() => {
        const handleSelectionChange = () => {
            console.log("selection changed");
            selectionStart = textAreaRef.current.selectionStart;
            selectionEnd = textAreaRef.current.selectionEnd;
            cursorPositionTop = textAreaRef.current.offsetTop + textAreaRef.current.scrollTop;
            cursorPositionLeft = textAreaRef.current.offsetLeft + textAreaRef.current.scrollLeft;
            const textMasked = text.slice(undefined, selectionStart) + "[MASK]" + text.slice(selectionEnd, undefined);
            setDropdownShow(true);
            setDropdownLoading(true);
            onSelect(textMasked)
            .then((itemsData) => setDropdownItems(itemsData))
            .catch((_) => setDropdownShow(false))
            .finally(() => setDropdownLoading(false));
        };
        if (onSelect && onItemClick) {
            textAreaRef.current.addEventListener('click', () => console.log("check click"));
            textAreaRef.current.addEventListener('selectionchange', handleSelectionChange);
            return () => {
                textAreaRef.current.removeEventListener('selectionchange', handleSelectionChange);
            };
        }
      }, [onSelect, onItemClick]);
    return (
        <Textarea
            style={{
                position: "relative"
            }}
            getRootRef={textAreaRef}
            {...props}
        >
            {
                dropdownShown &&
                <TextareaDropdown
                    isLoading={dropdownLoading}
                    items={dropdownItems}
                    onClose={() => setDropdownShow(false)}
                    onClick={(value) => {onItemClick(value, selectionStart, selectionEnd)}}
                    position={{top: cursorPositionTop, left: cursorPositionLeft}}
                />
            }
        </Textarea>
    )
}

/*
onSelect={
    service === Service.BERT ?
    (text) => StrawberryBackend.generate(service, groupId, text).then((text) => {
            return text.split(',');
        })
    :
    null
}
onItemClick={
    service === Service.BERT ?
    (value, start, stop) => setText((prevText) => {
        return prevText.slice(undefined, start)+value+prevText.slice(stop, undefined)
    })
    :
    null
}
*/

export default TextareaCustom;
