import bridge from '@vkontakte/vk-bridge';
import imgSlide1 from "!!url-loader!../media/slide_images/slide_1.png";
import imgSlide2 from "!!url-loader!../media/slide_images/slide_2.png";
import imgSlide3 from "!!url-loader!../media/slide_images/slide_3.png";


const slidesData = [
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
        subtitle: 'С помощью этого инструмента можно редактировать текст и создавать свой собственный практически с нуля с помощью современных нейросетевых технологий!',
    },
    {
        media: {
            blob: imgSlide3,
            type: 'image'
        },
        title: 'В чем фишка?',
        subtitle: 'Наше приложение способно извлекать тематику из существующих сообществ, включая ваши собственные, и учитывать ее при генерации текста. Попробуйте сами!',
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
]

export const showSlides = (callback) => {
    console.log('slidesData', slidesData);
    bridge.send('VKWebAppShowSlidesSheet', {
        slides: slidesData,
    })
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
}
