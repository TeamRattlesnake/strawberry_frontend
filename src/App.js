import React, { useState, useEffect } from 'react';
import bridge from '@vkontakte/vk-bridge';
import { View, ScreenSpinner, AdaptivityProvider, AppRoot, ConfigProvider, SplitLayout, SplitCol, Snackbar } from '@vkontakte/vkui';
import '@vkontakte/vkui/dist/vkui.css';

import Home from './panels/Home';
import { Generate, GenerationResult } from './panels/Generation';
import StrawberryBackend from './api/SBBackend';
import { Icon28CancelCircleOutline, Icon28CheckCircleOutline, Icon28InfoCircleOutline } from '@vkontakte/icons';


const parseQueryString = (string) => {
	return string.slice(1).split('&')
		.map((queryParam) => {
			let kvp = queryParam.split('=');
			return {key: kvp[0], value: kvp[1]}
		})
		.reduce((query, kvp) => {
			query[kvp.key] = kvp.value;
			return query
		}, {})
};

const queryParams = parseQueryString(window.location.search);

const getToken = (setToken, showShackBar) => {
	authToken = localStorage.getItem("vk_token")
	tokenExists = authToken != null
	if (tokenExists) {
		setToken(authToken);
	} else {
		bridge.send('VKWebAppGetAuthToken', {
			scope: 'groups,wall',
			app_id: 51575840
		}).then((data) => {
			if (!data.access_token) throw "Отсутствует токен";
			StrawberryBackend.verifyToken(queryParams, data.access_token).then((ok) => {
				if (!ok) throw "Ошибка при верификации токена";
				setToken(data.access_token);
				localStorage.setItem("vk_token", data.access_token);
				showShackBar({
					text: "Успешная авторизация!",
					type: "success",
				});
			}).catch((error) => {
				console.log(error);
				showShackBar({
					text: "Ошибка при верификации на сервере",
					type: "danger",
				});
			})
		}).catch((error) => {
			console.log(error)
			showShackBar({
				text: "Ошибка при авторизации в ВК",
				type: "danger",
			});
		})
	}
}

const App = () => {
	const [snackbar, setSnackbar] = useState(null);
	const [dataset, setDataset] = useState({
		to: "home",
		showSnackBar: ({text, type}) => {
			let icon, img_src;
			switch (type) {
				case "success":
					icon = <Icon28CheckCircleOutline fill="var(--vkui--color_icon_positive)" />
					img_src = "https://media.tenor.com/NGh3aVoXP2kAAAAj/strawberry.gif";
					break;
				case "danger":
					icon = <Icon28CancelCircleOutline fill="var(--vkui--color_icon_negative)" />
					img_src = "https://media.tenor.com/azaqzpGX2-kAAAAi/strawberry-fruit.gif";
					break;
				default:
					icon = <Icon28InfoCircleOutline/>
					img_src = "https://media.tenor.com/1fokKcxMy1EAAAAj/strawberry-fruit.gif";
					break;
			}
			setSnackbar(
				<Snackbar
					onClose={() => setSnackbar(null)}
					before={icon}
				>
					<div style={{
						display: "flex",
						flexDirection: "row",
						justifyContent: "space-between",
						alignItems: "center"
					}}>
						<span style={{
							display: "flex",
							justifyContent: "center",
							alignContent: "center",
						}}>{text}</span>
						{img_src && <img height="40px" width="auto" src={img_src}/>}
					</div>
				</Snackbar>
			);
		}
	});
	const [fetchedUser, setUser] = useState(null);
	const [accessToken, setAccessToken] = useState(null);
	const [popout, setPopout] = useState(<ScreenSpinner size='large' />);

	useEffect(() => {
		bridge.send('VKWebAppGetUserInfo')
		.then((data) => {
			setUser(data);
		}).catch((error) => {
			console.log(error);
		})
		getToken((token) => setAccessToken(token), dataset.showSnackBar);
	}, []);

	useEffect(() => {
		accessToken && setPopout(null);
	}, [accessToken]);

	const go = data => {setDataset((prev) => {
		return {...prev, ...data};
	})};

	return (
		<ConfigProvider>
			<AdaptivityProvider>
				<AppRoot>
					<SplitLayout popout={popout}>
						{accessToken && <SplitCol>
							<View activePanel={dataset.to}>
								<Home id='home' go={go} accessToken={accessToken} fetchedUser={fetchedUser} dataset={dataset}/>
								<Generate id="generate" go={go} accessToken={accessToken} dataset={dataset}/>
								<GenerationResult id="generation_result" go={go} accessToken={accessToken} dataset={dataset}/>
							</View>
						</SplitCol>}
						{snackbar}
					</SplitLayout>
				</AppRoot>
			</AdaptivityProvider>
		</ConfigProvider>
	);
}

export default App;
