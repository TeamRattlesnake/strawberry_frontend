import bridge from '@vkontakte/vk-bridge';

import imgSlide1 from "!!url-loader!../media/slide_images/slide_1.png";
import imgSlide2 from "!!url-loader!../media/slide_images/slide_2.png";
import imgSlide3 from "!!url-loader!../media/slide_images/slide_3.png";

import slide_TEXTGEN_THEME from "!!url-loader!../media/slide_images/slide_textgen_theme.png";
import slide_SCRATCH from "!!url-loader!../media/slide_images/slide_scratch.png";
import slide_TEXTGEN from "!!url-loader!../media/slide_images/slide_textgen.png";
import slide_SUMMARIZE from "!!url-loader!../media/slide_images/slide_summarize.png";
import slide_EXTEND from "!!url-loader!../media/slide_images/slide_extend.png";
import slide_REPHRASE from "!!url-loader!../media/slide_images/slide_rephrase.png";
import slide_BERT from "!!url-loader!../media/slide_images/slide_bert.png";
import slide_FIX_GRAMMAR from "!!url-loader!../media/slide_images/slide_fix_grammar.png";
import slide_editor_startup from "!!url-loader!../media/slide_images/slide_editor_startup.jpg";

import Service from './Service';


export const startupData = [
    {
        media: {
            blob: imgSlide1,
            type: 'image'
        },
        title: 'Привет!',
        subtitle: 'Добро пожаловать в Strawberry - твой личный помощник в создании и редактировании постов!',
    },
    {
        media: {
            blob: imgSlide2,
            type: 'image'
        },
        title: 'Для чего это все?',
        subtitle: 'С помощью этого инструмента можно редактировать текст и создавать свой собственный практически с использованием современных нейросетевых технологий!',
    },
    {
        media: {
            blob: imgSlide3,
            type: 'image'
        },
        title: 'В чём фишка?',
        subtitle: 'Наше приложение способно извлекать тематику из существующих сообществ, включая ваши собственные, и учитывать её при генерации текста. Попробуйте сами!',
    },
    /*
    {
        media: {
            blob: imgSlide3,
            type: 'image'
        },
        title: 'Важно знать!',
        subtitle: 'Обратите внимание, что наше приложение не может быть использовано для генерации фактической/правдивой информации, весь полученный в ходе генерации текст - результат креативной работы.',
    }
    */
];

const editorImageData = [slide_TEXTGEN_THEME, slide_SCRATCH, slide_TEXTGEN, slide_SUMMARIZE, slide_EXTEND, slide_REPHRASE, slide_BERT, slide_FIX_GRAMMAR];

export const editorGuideData = [
    {
        media: {
            blob: slide_editor_startup,
            type: 'image',
        },
        title: 'Пора познакомиться с редактором!',
        subtitle: 'У нашего редактора достаточно широкий функционал! Пора тебе узнать, что есть что...'
    },
    ...Object.values(Service).map((service, idx) => ({
    media: {
        blob: editorImageData[idx],
        type: 'image',
    },
    title: service.alias,
    subtitle: service.hint,
}))];

export const showSlides = (slides, callback) => {
    bridge.send('VKWebAppShowSlidesSheet', {slides,})
    .then((data) => { 
        if (data.result) {
            // Слайды показаны
            callback && callback()
        }
    })
    .catch((error) => {
        // Ошибка
        console.log(error);
    });
};
