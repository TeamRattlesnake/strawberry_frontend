import React from "react";

import { Icon24CheckBoxOn, Icon24Fullscreen, Icon24FullscreenExit, Icon24MagicWandOutline, Icon24Switch, Icon24WriteOutline } from '@vkontakte/icons';
import { Icon24ArrowRightCircleOutline } from '@vkontakte/icons';
import { Icon24Shuffle } from '@vkontakte/icons';

import StrawberryBackend, { GenerationMethod } from "./SBBackend";


function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

const executeWrapper = (execute) => {
    return async function() {
        const data = await execute.apply(this, arguments);
        if (data.status === 7) return {status: 2};
        const textId = data.text_id;
        while (textId) {
            const ok = await StrawberryBackend.getGenStatus(textId);
            if (ok === null) {
                return {status: 1};
            }
            if (ok) {
                const res = await StrawberryBackend.getGenResult(textId);
                return {status: 0, text: res, id: textId}
            }
            await delay(1000);
        }
    };
}

export const Category = {
    CREATE: "Создание",
    EDIT: "Редактирование",
    FIX: "Исправление",
}

const Service = {
    TEXTGEN_THEME: {
        id: "textgen_theme",
        alias: "Создать текст по заданной теме",
        textarea_top: "Тема (краткое описание) текста:",
        placeholder: "Ваша тема для текста (о чем он будет?)",
        button_name: "Создать текст",
        icon: <Icon24WriteOutline/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.GENERATE_TEXT, ...args)),
        hint: "В этом режиме можно на основе предоставленной тобой темы создать соответствующий текст!"
    },
    SCRATCH: {
        id: "scratch",
        alias: "Создать текст с нуля",
        textarea_top: "",
        placeholder: "",
        button_name: "Создать с нуля",
        icon: <Icon24MagicWandOutline/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.SCRATCH, ...args)),
        hint: "Данный режим позволяет создать текст, основываясь только на постах сообщества.",
        allow_generate: (text, _) => (!text),
        no_input: true,
    },
    TEXTGEN: {
        id: "text_gen",
        alias: "Продолжить текст",
        textarea_top: "Текст, который нужно продолжить:",
        placeholder: "Текст, который вы хотите продолжить",
        button_name: "Продолжить текст",
        icon: <Icon24ArrowRightCircleOutline/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.APPEND_TEXT, ...args)),
        hint: "В этом режиме ты можешь ввести начало текста, а мы его продолжим!"
    },
    SUMMARIZE: {
        id: "summarize",
        alias: "Резюмировать текст",
        textarea_top: "Текст, который нужно сократить:",
        placeholder: "Большой текст, который нужно резюмировать (сократить)",
        button_name: "Резюмировать текст",
        icon: <Icon24FullscreenExit/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.SUMMARIZE_TEXT, ...args)),
        hint: "В этом режиме можно сократить текст, оставив только самое главное, то есть сохранить основной смысл текста!\nВведи объемный текст, об остальном мы позаботимся сами."
    },
    EXTEND: {
        id: "extend",
        alias: "Добавить в текст воды",
        textarea_top: "Текст, в который нужно добавить воды:",
        placeholder: "Небольшой текст, объем которого нужно увеличить",
        button_name: "Добавить воды",
        icon: <Icon24Fullscreen/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.EXTEND_TEXT, ...args)),
        hint: "С помощью этого режима можно увеличить уже существующий текст, добавив в него воды.\nИсходный смысл при этом сохраняется.",
    },
    REPHRASE: {
        id: "rephrase",
        alias: "Перефразировать текст",
        textarea_top: "Текст, который нужно перефразировать:",
        placeholder: "Текст, который вы хотите перефразировать",
        button_name: "Перефразировать текст",
        icon: <Icon24Switch/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.REPHRASE_TEXT, ...args)),
        hint: "В этом режиме можно перефразировать текст.\nВведи текст, и мы его перепишем, сохранив при этом основной смысл!"
    },
    BERT: {
        id: "bert",
        alias: "Заменить часть текста",
        textarea_top: "Текст, в котором нужно заменить его часть:",
        placeholder: "Текст, в котором нужно заменить его часть/части (обязательно с маской <MASK> в местах замены)",
        button_name: "Заменить часть текста",
        icon: <Icon24Shuffle/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.UNMASK_TEXT, ...args)),
        hint: "В этом режиме можно заменить конкретные части текста на максимально подходящие по смыслу!\nПросто выдели часть текста, чтобы указать место, где нужно выполнить замену.",
        allow_generate: (text, selectedText) => (text && selectedText),
    },
    FIX_GRAMMAR: {
        id: "fix_grammar",
        alias: "Исправить грамматику текста",
        textarea_top: "Текст, грамматику которого нужно исправить:",
        placeholder: "Текст, в котором нужно исправить орфографические ошибки",
        button_name: "Исправить грамматику",
        icon: <Icon24CheckBoxOn/>,
        execute: executeWrapper((...args) => StrawberryBackend.generate(GenerationMethod.FIX_GRAMMAR, ...args)),
        hint: "В данном режиме ты можешь исправить грамматические ошибки в своём тексте с помощью нейросети.\nНе забывай проверять текст самостоятельно!",
    }
};

export const CategoryToService = {
    [Category.CREATE]: [
        Service.TEXTGEN_THEME,
        Service.SCRATCH,
        Service.TEXTGEN,
    ],
    [Category.EDIT]: [
        Service.SUMMARIZE,
        Service.EXTEND,
        Service.REPHRASE,
    ],
    [Category.FIX]: [
        Service.BERT,
        Service.FIX_GRAMMAR,
    ]
}

export default Service;
