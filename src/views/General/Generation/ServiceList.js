import { CustomSelectOption, FormItem, Select } from "@vkontakte/vkui"


const ServiceList = ({activeServiceKey, onServiceClick, options}) => {
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
                options={options}
                renderOption={renderItem}
            />
        </FormItem>
    )
}

export default ServiceList;
