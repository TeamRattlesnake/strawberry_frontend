import { CustomSelectOption, FormItem, Select } from "@vkontakte/vkui"
import { Service } from "."


const ServiceList = ({activeServiceKey, onServiceClick}) => {
    const renderItem = ({option, ...restProps}) => {
        return (
            <CustomSelectOption
                {...restProps}
                key={option.value}
                before={option.icon}
            />
        )
    }
    return (
        <FormItem top="Режим редактирования">
            <Select
                value={activeServiceKey}
                onChange={onServiceClick}
                options={Object.entries(Service).map(([key, item]) => ({
                    label: item.alias, value: key, ...item
                }))}
                renderOption={renderItem}
            />
        </FormItem>
    )
}

export default ServiceList;
